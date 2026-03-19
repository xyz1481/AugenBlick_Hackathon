import React from "react";
import { motion } from "framer-motion";
import { Zap, AlertCircle, TrendingUp, Shield, BarChart2 } from "lucide-react";

/**
 * MarketSummaryBanner - A high-level executive briefing for the Market Terminal.
 * Summarizes AI insights into a glanceable hero section.
 */
const MarketSummaryBanner = ({ analysis }) => {
  if (!analysis) return null;

  const { 
    sentiment = "No sentiment data available.", 
    conflictProjection = "No projections available.", 
    panicLevel = "Unknown",
    panicIndex = 0
  } = analysis || {};

  const getPanicIndex = (index, level) => {
    if (index !== undefined && index !== null && index > 0) return index;
    const map = { 'Extreme': 92, 'High': 74, 'Elevated': 48, 'Low': 12 };
    return map[level] || 0;
  };

  const currentPanicIndex = getPanicIndex(panicIndex, panicLevel);

  const getPanicColor = (val) => {
    if (val > 80) return '#e74c3c';
    if (val > 60) return '#e67e22';
    if (val > 30) return '#f1c40f';
    return '#2ecc71';
  };

  const panicColor = getPanicColor(currentPanicIndex);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "linear-gradient(90deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 10, 20, 0.4) 100%)",
        borderBottom: "1px solid rgba(99, 102, 241, 0.2)",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        gap: "24px",
        flexShrink: 0
      }}
    >
      {/* Panic Pillar */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", borderRight: "1px solid rgba(255,255,255,0.1)", paddingRight: "20px" }}>
        <div style={{ 
          width: "44px", 
          height: "44px", 
          borderRadius: "12px", 
          background: `${panicColor}22`,
          border: `1px solid ${panicColor}44`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{ fontSize: "16px", fontWeight: 900, color: panicColor }}>{currentPanicIndex}</div>
          <div style={{ fontSize: "7px", fontWeight: 900, color: panicColor, opacity: 0.8 }}>/100</div>
        </div>
        <div>
          <div style={{ fontSize: "9px", fontWeight: 900, color: "#5a7a9a", letterSpacing: "1px" }}>PANIC INDEX</div>
          <div style={{ fontSize: "11px", fontWeight: 900, color: panicColor, opacity: 0.9 }}>{(panicLevel || "N/A").toUpperCase()}</div>
        </div>
      </div>

      {/* Sentiment Summary */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          <Zap size={12} color="#6366f1" />
          <span style={{ fontSize: "10px", fontWeight: 900, color: "#6366f1", letterSpacing: "1px" }}>EXECUTIVE SENTIMENT</span>
        </div>
        <p style={{ margin: 0, fontSize: "12px", color: "#e2e8f0", lineHeight: "1.4", fontWeight: "500" }}>
          {sentiment}
        </p>
      </div>

      {/* Conflict Projection (War Pulse) */}
      <div style={{ 
        flex: 1, 
        background: "rgba(231,76,60,0.05)", 
        padding: "8px 12px", 
        borderRadius: "8px", 
        border: "1px solid rgba(231,76,60,0.15)",
        maxWidth: "400px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
          <Shield size={12} color="#e74c3c" />
          <span style={{ fontSize: "9px", fontWeight: 900, color: "#e74c3c", letterSpacing: "1px" }}>WAR SCENARIO IMPACT</span>
        </div>
        <div style={{ fontSize: "11px", color: "#fca5a5", fontStyle: "italic", lineHeight: "1.3" }}>
          "{conflictProjection?.slice(0, 100)}..."
        </div>
      </div>

      {/* Quick Indicators */}
      <div style={{ display: "flex", gap: "12px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "8px", fontWeight: 900, color: "#5a7a9a" }}>RISK</div>
          <div style={{ fontSize: "12px", fontWeight: 900, color: "#fff" }}>{analysis.risks?.length || 0}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "8px", fontWeight: 900, color: "#5a7a9a" }}>HEDGES</div>
          <div style={{ fontSize: "12px", fontWeight: 900, color: "#2ecc71" }}>{analysis.hedges?.length || 0}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketSummaryBanner;
