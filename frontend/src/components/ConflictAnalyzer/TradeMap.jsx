import React, { useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker,
  Annotation
} from "react-simple-maps";
import { motion } from "framer-motion";

const geoUrl = "https://raw.githubusercontent.com/lotusms/world-map-data/main/world.json";

const chokepoints = [
  { name: "Suez Canal", coordinates: [32.5, 29.9], id: "Suez", tradeShare: 12 },
  { name: "Strait of Hormuz", coordinates: [56.2, 26.5], id: "Hormuz", tradeShare: 20 },
  { name: "Malacca Strait", coordinates: [103.4, 1.3], id: "Malacca", tradeShare: 15 },
  { name: "Bab el-Mandeb", coordinates: [43.3, 12.6], id: "Bab", tradeShare: 4 },
  { name: "Panama Canal", coordinates: [-79.6, 8.9], id: "Panama", tradeShare: 5 },
  { name: "Strait of Gibraltar", coordinates: [-5.6, 35.9], id: "Gibraltar", tradeShare: 3 },
  { name: "Bosphorus", coordinates: [29.0, 41.0], id: "Bosphorus", tradeShare: 2 }
];

// major shipping lanes (approximated)
const shippingLanes = [
  { from: [103.4, 1.3], to: [121.5, 31.2], name: "SE Asia - China" },
  { from: [121.5, 31.2], to: [-118.2, 33.7], name: "Trans-Pacific" },
  { from: [32.5, 29.9], to: [4.4, 51.9], name: "Suez - Rotterdam" },
  { from: [32.5, 29.9], to: [72.8, 18.9], name: "Suez - Mumbai" },
  { from: [-79.6, 8.9], to: [139.7, 35.6], name: "Panama - Tokyo" },
  { from: [56.2, 26.5], to: [103.4, 1.3], name: "Hormuz - Malacca" },
  { from: [-5.6, 35.9], to: [-74.0, 40.7], name: "Gibraltar - NY" }
];

const TradeMap = ({ simulationResults, isSimulating }) => {
  // Identify disrupted chokepoints from simulation results
  const disruptedChokepoints = useMemo(() => {
    if (!simulationResults?.analysis?.chokepoints) return [];
    return simulationResults.analysis.chokepoints.map(cp => cp.toLowerCase());
  }, [simulationResults]);

  return (
    <div style={{ width: "100%", height: "100%", background: "#050910", borderRadius: "32px", overflow: "hidden", position: "relative" }}>
      <ComposableMap
        projectionConfig={{
          scale: 160,
          center: [20, 10]
        }}
        width={800}
        height={500}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#0f172a"
                stroke="#1e293b"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { fill: "#1e293b", outline: "none" },
                  pressed: { outline: "none" }
                }}
              />
            ))
          }
        </Geographies>

        {/* Shipping Lanes */}
        {shippingLanes.map((lane, i) => (
          <Line
            key={`lane-${i}`}
            from={lane.from}
            to={lane.to}
            stroke="rgba(0, 255, 255, 0.4)"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        ))}

        {/* Chokepoints */}
        {chokepoints.map((cp) => {
          const isDisrupted = disruptedChokepoints.some(d => cp.name.toLowerCase().includes(d));
          const color = isDisrupted ? "#e74c3c" : "#3498db";
          
          return (
            <Marker key={cp.id} coordinates={cp.coordinates}>
              <g>
                <motion.circle
                  r={isDisrupted ? 6 : 4}
                  fill={color}
                  initial={{ scale: 1 }}
                  animate={isDisrupted ? {
                    scale: [1, 1.5, 1],
                    opacity: [0.8, 0.4, 0.8]
                  } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <circle
                  r={isDisrupted ? 12 : 8}
                  fill="transparent"
                  stroke={color}
                  strokeWidth={1}
                  strokeDasharray="2,2"
                />
              </g>
              <text
                textAnchor="middle"
                y={-15}
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "8px",
                  fontWeight: 800,
                  fill: color,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  pointerEvents: "none",
                  textShadow: "0 0 5px rgba(0,0,0,0.8)"
                }}
              >
                {cp.name}
              </text>
              {isDisrupted && (
                <text
                  textAnchor="middle"
                  y={25}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "7px",
                    fontWeight: 900,
                    fill: "#e74c3c",
                    textTransform: "uppercase",
                    pointerEvents: "none"
                  }}
                >
                  DISRUPTED
                </text>
              )}
            </Marker>
          );
        })}
      </ComposableMap>

      {/* Map Overlay for Tactical feel */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", border: "1px solid rgba(52, 152, 219, 0.1)", borderRadius: "32px", boxSizing: "border-box" }}>
        <div style={{ position: "absolute", top: 20, right: 20, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
           <div style={{ padding: "4px 10px", background: "rgba(6,10,20,0.8)", border: "1px solid rgba(52,152,219,0.3)", borderRadius: "8px", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3498db" }} />
              <span style={{ fontSize: 9, fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: 1 }}>TRADING NOMINAL</span>
           </div>
           {disruptedChokepoints.length > 0 && (
             <div style={{ padding: "4px 10px", background: "rgba(231,76,60,0.1)", border: "1px solid #e74c3c", borderRadius: "8px", display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#e74c3c", animation: "pulse 1s infinite" }} />
                <span style={{ fontSize: 9, fontWeight: 900, color: "#e74c3c", textTransform: "uppercase", letterSpacing: 1 }}>SYSTEMIC FAILURE</span>
             </div>
           )}
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TradeMap;
