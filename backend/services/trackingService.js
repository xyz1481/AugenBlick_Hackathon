const WebSocket = require('ws');
const axios = require('axios');

const MAJOR_AIR_CORRIDORS = [
    { name: 'Transatlantic North', start: [40.7, -74.0], end: [51.5, -0.1] },
    { name: 'Transatlantic South', start: [25.7, -80.1], end: [38.7, -9.1] },
    { name: 'Transpacific East', start: [34.0, -118.2], end: [35.6, 139.6] },
    { name: 'Eurasian Link', start: [48.8, 2.3], end: [1.3, 103.8] },
    { name: 'Middle East Hub', start: [25.2, 55.2], end: [52.3, 13.4] },
    { name: 'Ukrainian Border Patrol', start: [52.2, 21.0], end: [49.8, 24.0] }, // NATO Border
    { name: 'South China Sea Recon', start: [14.5, 109.6], end: [19.0, 114.1] }
];

const SHIPPING_CHOKEPOINTS = [
    { name: 'Suez Canal', lat: 29.9, lng: 32.5 },
    { name: 'Strait of Hormuz', lat: 26.5, lng: 56.2 },
    { name: 'Malacca Strait', lat: 1.3, lng: 103.4 },
    { name: 'Bab el-Mandeb', lat: 12.6, lng: 43.3 },
    { name: 'Panama Canal', lat: 8.9, lng: -79.6 }
];

let activeFlights = [];
let activeShips = [];
let cachedLiveFlights = [];
let lastFlightFetch = 0;
let aisVessels = new Map(); // Store live AIS vessels by MMSI

const initializeTracks = () => {
    // Simulated Aircraft (Fallback/Military)
    for (let i = 0; i < 40; i++) {
        const corridor = MAJOR_AIR_CORRIDORS[Math.floor(Math.random() * MAJOR_AIR_CORRIDORS.length)];
        const progress = Math.random();
        const isMilitary = i % 8 === 0 || corridor.name.includes('Border') || corridor.name.includes('Recon');
        
        activeFlights.push({
            id: `SIM-FL-${1000 + i}`,
            type: 'aircraft',
            callsign: isMilitary ? `FORTE${i % 10}` : `GTI${100 + i}`,
            lat: corridor.start[0] + (corridor.end[0] - corridor.start[0]) * progress,
            lng: corridor.start[1] + (corridor.end[1] - corridor.start[1]) * progress,
            alt: isMilitary ? 60000 : 32000 + Math.random() * 4000,
            speed: isMilitary ? 180 : 450 + Math.random() * 50,
            corridor: corridor.name,
            progress: progress,
            direction: Math.random() > 0.5 ? 1 : -1,
            isMilitary: isMilitary
        });
    }

    // Ships
    for (let i = 0; i < 60; i++) {
        const chokepoint = SHIPPING_CHOKEPOINTS[Math.floor(Math.random() * SHIPPING_CHOKEPOINTS.length)];
        const latOffset = (Math.random() - 0.5) * 8;
        const lngOffset = (Math.random() - 0.5) * 8;
        
        const isDelayed = (chokepoint.name === 'Bab el-Mandeb' || chokepoint.name === 'Suez Canal') && Math.random() > 0.6;

        activeShips.push({
            id: `SH-${2000 + i}`,
            type: 'vessel',
            name: `MV ${['Everest', 'Cosco', 'Maersk', 'Hapag', 'Stark', 'Eagle'][i % 6]} ${i}`,
            lat: chokepoint.lat + latOffset,
            lng: chokepoint.lng + lngOffset,
            speed: isDelayed ? 0.5 : 12 + Math.random() * 8,
            status: isDelayed ? 'Delayed' : 'En Route',
            chokepoint: chokepoint.name
        });
    }
};

const startAISStream = () => {
    const API_KEY = process.env.AISSTREAM_API_KEY;
    if (!API_KEY) {
        console.warn('[TrackingService] ⚓ AISSTREAM_API_KEY missing. AIS real-time maritime tracking disabled.');
        return;
    }

    console.log('[TrackingService] ⚓ Initializing AISStream WebSocket connection...');
    const socket = new WebSocket('wss://stream.aisstream.io/v0/stream');

    socket.on('open', () => {
        const subMsg = {
            APIKey: API_KEY,
            BoundingBoxes: [[[-90, -180], [90, 180]]] // Global tracking
        };
        socket.send(JSON.stringify(subMsg));
        console.log('[TrackingService] 🚢 AISStream Subscribed to Global Maritime Vectors.');
    });

    socket.on('message', (data) => {
        try {
            const aisMsg = JSON.parse(data);
            if (!aisMsg || !aisMsg.MetaData) return;

            const mmsi = aisMsg.MetaData.MMSI;
            const shipName = aisMsg.MetaData.ShipName ? aisMsg.MetaData.ShipName.trim() : `MMSI:${mmsi}`;
            
            // Focus on Position Reports (MessageTypes 1, 2, 3)
            let lat, lon, speed;
            if (aisMsg.MessageType === 'PositionReport') {
                lat = aisMsg.Message.PositionReport.Latitude;
                lon = aisMsg.Message.PositionReport.Longitude;
                speed = aisMsg.Message.PositionReport.Sog;
            } else {
                return; // Only track position for now to keep it efficient
            }

            if (lat && lon) {
                // Update or add vessel
                aisVessels.set(mmsi, {
                    id: `AIS-${mmsi}`,
                    type: 'vessel',
                    name: shipName,
                    lat: lat,
                    lng: lon,
                    speed: speed || 0,
                    status: 'Live AIS',
                    chokepoint: 'Global Waters',
                    isAPI: true,
                    lastSeen: Date.now()
                });

                // Periodic cleanup of stale vessels (older than 15 mins)
                if (aisVessels.size > 500) {
                   const now = Date.now();
                   for (let [id, v] of aisVessels) {
                       if (now - v.lastSeen > 900000) aisVessels.delete(id);
                       if (aisVessels.size <= 400) break;
                   }
                }
            }
        } catch (err) {
            // Silently handle parse errors to keep stream alive
        }
    });

    socket.on('error', (err) => {
        console.error('[TrackingService] 🚢 AISStream WebSocket Error:', err.message);
    });

    socket.on('close', () => {
        console.warn('[TrackingService] 🚢 AISStream connection closed. Reconnecting in 30s...');
        setTimeout(startAISStream, 30000);
    });
};

const fetchAviationStackData = async () => {
    const API_KEY = process.env.AVIATIONSTACK_API_KEY;
    
    if (!API_KEY) {
        console.warn('[TrackingService] ⚠️  AVIATIONSTACK_API_KEY is missing in .env. Falling back to simulation only.');
        return null;
    }

    // Cache for 30 minutes (1,800,000 ms) to stay within free tier limits (100 requests)
    if (Date.now() - lastFlightFetch < 1800000 && cachedLiveFlights.length > 0) {
        const remainingMinutes = Math.ceil((1800000 - (Date.now() - lastFlightFetch)) / 60000);
        console.log(`[TrackingService] 🛡️ Serving cached flight data. Next refresh in ${remainingMinutes} minutes.`);
        return cachedLiveFlights;
    }

    try {
        console.log('[TrackingService] 📡 Initializing atmospheric data fetch from Aviationstack...');
        const response = await axios.get(`http://api.aviationstack.com/v1/flights`, {
            params: {
                access_key: API_KEY,
                flight_status: 'active',
                limit: 100
            }
        });

        if (response.data && response.data.data) {
            const flightCount = response.data.data.length;
            console.log(`[TrackingService] ✅ Successfully ingested ${flightCount} raw flight records.`);
            
            const liveData = response.data.data
                .filter(f => f.live && f.live.latitude && f.live.longitude)
                .map(f => ({
                    id: f.flight.iata || f.flight.icao || `AV-${Math.random()}`,
                    type: 'aircraft',
                    callsign: f.flight.iata || f.flight.icao || 'TRACKER',
                    lat: f.live.latitude,
                    lng: f.live.longitude,
                    alt: f.live.altitude || 35000,
                    speed: f.live.speed_horizontal || 480,
                    direction: f.live.direction || 0,
                    status: f.flight_status,
                    airline: f.airline ? f.airline.name : 'Commercial',
                    isAPI: true
                }));
            
            console.log(`[TrackingService] 🛰️  Fuzed ${liveData.length} active global vectors for tactile monitor.`);
            cachedLiveFlights = liveData;
            lastFlightFetch = Date.now();
            return liveData;
        } else if (response.data && response.data.error) {
            console.error('[TrackingService] ❌ Aviationstack API Error:', response.data.error.info || response.data.error.code);
            return null;
        }
    } catch (err) {
        console.error('[TrackingService] ❌ Critical Transport Error:', err.message);
        return null;
    }
    return null;
};

const updatePositions = () => {
    activeFlights = activeFlights.map(f => {
        const step = f.isMilitary ? 0.0002 : 0.001; 
        let newProgress = f.progress + step * f.direction;
        let newDirection = f.direction;
        
        if (newProgress > 1) { newProgress = 1; newDirection = -1; }
        if (newProgress < 0) { newProgress = 0; newDirection = 1; }

        const corridor = MAJOR_AIR_CORRIDORS.find(c => c.name === f.corridor);
        return {
            ...f,
            progress: newProgress,
            direction: newDirection,
            lat: corridor.start[0] + (corridor.end[0] - corridor.start[0]) * newProgress + (Math.random() - 0.5) * 0.02,
            lng: corridor.start[1] + (corridor.end[1] - corridor.start[1]) * newProgress + (Math.random() - 0.5) * 0.02
        };
    });

    activeShips = activeShips.map(s => {
        const drift = s.status === 'Delayed' ? 0.0001 : 0.0015;
        return {
            ...s,
            lat: s.lat + (Math.random() - 0.5) * drift,
            lng: s.lng + (Math.random() - 0.5) * drift
        };
    });
};

initializeTracks();
startAISStream();
setInterval(updatePositions, 3000);

const getLiveTrackingData = async () => {
    const liveFlights = await fetchAviationStackData();
    const liveAIS = Array.from(aisVessels.values());
    
    return {
        timestamp: new Date().toISOString(),
        flights: liveFlights ? [...liveFlights, ...activeFlights] : activeFlights.slice(0, 80),
        vessels: [...liveAIS, ...activeShips]
    };
};

module.exports = { getLiveTrackingData };
