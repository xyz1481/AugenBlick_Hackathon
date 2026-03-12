/**
 * Tracking Service - Live Geopolitical Intelligence
 * Generates and manages live flight and shipping data across global corridors.
 */

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

const initializeTracks = () => {
    // Aircraft
    for (let i = 0; i < 60; i++) {
        const corridor = MAJOR_AIR_CORRIDORS[Math.floor(Math.random() * MAJOR_AIR_CORRIDORS.length)];
        const progress = Math.random();
        const isMilitary = i % 10 === 0 || corridor.name.includes('Border') || corridor.name.includes('Recon');
        
        activeFlights.push({
            id: `FL-${1000 + i}`,
            type: 'aircraft',
            callsign: isMilitary ? `FORTE${i % 10}` : `UA${100 + i}`,
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
    for (let i = 0; i < 80; i++) {
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
setInterval(updatePositions, 3000); // Faster updates for smoother feel

const getLiveTrackingData = async () => {
    return {
        timestamp: new Date().toISOString(),
        flights: activeFlights,
        vessels: activeShips
    };
};

module.exports = { getLiveTrackingData };
