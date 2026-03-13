const axios = require('axios');

// Simple in-memory cache for events
let cachedEvents = [];
let lastEventsFetch = 0;
const EVENTS_TTL_MS = 5 * 60 * 1000; // 5 minutes

// GDELT 2.0 GeoJSON endpoint with generic conflict query
const GDELT_GEOJSON_URL =
  'https://api.gdeltproject.org/api/v2/events/geojson?query=conflict+OR+war+OR+sanctions+OR+blockade&mode=PointData&maxrecords=150&format=geojson';

// Minimal static chokepoint universe for impact graph linking
const CHOKEPOINTS = [
  { id: 'choke-hormuz', name: 'Strait of Hormuz', lat: 26.5, lng: 56.2, tradeShare: 0.20 },
  { id: 'choke-suez', name: 'Suez Canal', lat: 29.9, lng: 32.5, tradeShare: 0.12 },
  { id: 'choke-malacca', name: 'Malacca Strait', lat: 1.3, lng: 103.4, tradeShare: 0.15 },
  { id: 'choke-panama', name: 'Panama Canal', lat: 8.9, lng: -79.6, tradeShare: 0.05 },
  { id: 'choke-bab', name: 'Bab el-Mandeb', lat: 12.6, lng: 43.3, tradeShare: 0.04 },
];

const COMMODITY_NODES = [
  { id: 'cmd-oil', label: 'Global Crude Oil Supply' },
  { id: 'cmd-gas', label: 'Liquefied Natural Gas Flows' },
  { id: 'cmd-grain', label: 'Black Sea Grain Exports' },
  { id: 'cmd-metals', label: 'Strategic Metals & Minerals' },
];

const LOGISTICS_NODES = [
  { id: 'log-port', label: 'Port Congestion & Throughput' },
  { id: 'log-freight', label: 'Global Freight & Container Rates' },
  { id: 'log-air', label: 'Aviation & Air Cargo Routings' },
];

const MACRO_NODES = [
  { id: 'eco-inflation', label: 'Imported Inflation Pressure' },
  { id: 'eco-growth', label: 'Global Growth & GDP Risk' },
];

function scoreDistance(lat1, lng1, lat2, lng2) {
  const dlat = lat1 - lat2;
  const dlng = lng1 - lng2;
  return Math.sqrt(dlat * dlat + dlng * dlng);
}

async function fetchLiveEvents() {
  const now = Date.now();
  if (cachedEvents.length && now - lastEventsFetch < EVENTS_TTL_MS) {
    return cachedEvents;
  }

  try {
    const res = await axios.get(GDELT_GEOJSON_URL, { timeout: 8000 });
    const features = res.data && res.data.features ? res.data.features : [];

    const events = features.map((f, idx) => {
      const props = f.properties || {};
      const [lng, lat] = f.geometry && f.geometry.coordinates ? f.geometry.coordinates : [0, 0];

      return {
        id: props.GLOBALEVENTID ? String(props.GLOBALEVENTID) : `GDELT-${idx}`,
        source: 'GDELT',
        title: props.EVENTROOTCODE ? `Event Code ${props.EVENTROOTCODE}` : 'Geopolitical Event',
        summary: props.SOURCEURL || 'Geocoded geopolitical event from GDELT feed.',
        lat,
        lng,
        date: props.SQLDATE ? String(props.SQLDATE) : null,
        actors: [props.Actor1Name, props.Actor2Name].filter(Boolean),
        country: props.ActionGeo_CountryCode || null,
        raw: props,
      };
    });

    cachedEvents = events;
    lastEventsFetch = now;
    return events;
  } catch (err) {
    console.error('[EventService] Failed to fetch GDELT events:', err.message);
    // If we have something cached, return it; otherwise fallback to empty list
    return cachedEvents;
  }
}

async function getEventById(eventId) {
  const events = await fetchLiveEvents();
  return events.find((e) => e.id === eventId) || null;
}

/**
 * Build a 6–7 hop impact chain graph for a given event.
 * This is a heuristic, data-driven graph that links:
 * Event -> 1-2 chokepoints -> 1-2 commodity nodes -> 1-2 logistics nodes -> 1-2 macro nodes
 */
async function buildImpactChain(event) {
  if (!event) return null;

  const nodes = [];
  const edges = [];

  // 1) Event node
  nodes.push({
    id: `event-${event.id}`,
    type: 'event',
    label: event.title || 'Geopolitical Event',
    meta: {
      source: event.source,
      date: event.date,
      country: event.country,
      actors: event.actors,
    },
    lat: event.lat,
    lng: event.lng,
  });

  const eventNodeId = `event-${event.id}`;

  // 2) Closest 1–2 chokepoints
  const sortedChokepoints = [...CHOKEPOINTS].sort((a, b) => {
    const da = scoreDistance(event.lat, event.lng, a.lat, a.lng);
    const db = scoreDistance(event.lat, event.lng, b.lat, b.lng);
    return da - db;
  });

  const primaryChokes = sortedChokepoints.slice(0, 2);
  primaryChokes.forEach((c) => {
    nodes.push({
      id: c.id,
      type: 'chokepoint',
      label: c.name,
      meta: {
        tradeShare: c.tradeShare,
      },
      lat: c.lat,
      lng: c.lng,
    });
    edges.push({
      from: eventNodeId,
      to: c.id,
      relation: 'routes_affected',
    });
  });

  // 3) Commodity nodes (pick 2 based on rough heuristics)
  const commodities = [];
  if (primaryChokes.some((c) => c.name.includes('Strait of Hormuz') || c.name.includes('Bab el-Mandeb'))) {
    commodities.push(COMMODITY_NODES[0], COMMODITY_NODES[1]); // Oil + Gas
  } else if (primaryChokes.some((c) => c.name.includes('Suez') || c.name.includes('Malacca'))) {
    commodities.push(COMMODITY_NODES[0], COMMODITY_NODES[2]); // Oil + Grain
  } else {
    commodities.push(COMMODITY_NODES[0], COMMODITY_NODES[3]); // Oil + Metals
  }

  commodities.forEach((cmd, idx) => {
    if (!nodes.find((n) => n.id === cmd.id)) {
      nodes.push({
        id: cmd.id,
        type: 'commodity',
        label: cmd.label,
      });
    }
    const fromChoke = primaryChokes[idx % primaryChokes.length];
    edges.push({
      from: fromChoke.id,
      to: cmd.id,
      relation: 'supply_disruption',
    });
  });

  // 4) Logistics nodes
  const chosenLogistics = LOGISTICS_NODES.slice(0, 2);
  chosenLogistics.forEach((log, idx) => {
    if (!nodes.find((n) => n.id === log.id)) {
      nodes.push({
        id: log.id,
        type: 'logistics',
        label: log.label,
      });
    }
    const fromCmd = commodities[idx % commodities.length];
    edges.push({
      from: fromCmd.id,
      to: log.id,
      relation: 'cost_and_delay',
    });
  });

  // 5) Macro nodes
  const chosenMacro = MACRO_NODES;
  chosenMacro.forEach((macro, idx) => {
    if (!nodes.find((n) => n.id === macro.id)) {
      nodes.push({
        id: macro.id,
        type: 'macro',
        label: macro.label,
      });
    }
    const fromLog = chosenLogistics[idx % chosenLogistics.length];
    edges.push({
      from: fromLog.id,
      to: macro.id,
      relation: 'macro_impact',
    });
  });

  return {
    rootEventId: eventNodeId,
    nodes,
    edges,
  };
}

module.exports = {
  fetchLiveEvents,
  getEventById,
  buildImpactChain,
};

