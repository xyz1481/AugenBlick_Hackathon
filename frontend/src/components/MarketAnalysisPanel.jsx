import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, AlertTriangle, ShieldCheck, Zap, BarChart3, Globe } from "lucide-react";
import API_BASE_URL from "../api/config";

const MarketAnalysisPanel = ({ marketData, existingAnalysis = null, isOverallLoading = false }) => {
  const [analysis, setAnalysis] = useState(existingAnalysis);
  const [loading, setLoading] = useState(isOverallLoading);

  useEffect(() => {
    if (existingAnalysis) {
      setAnalysis(existingAnalysis);
      setLoading(isOverallLoading);
      return;
    }
    if (!marketData) return;

    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/market/analysis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ marketData }),
        });
        if (response.ok) {
          const data = await response.json();
          setAnalysis(data);
        }
      } catch (err) {
        console.error("Market Analysis fetch failed:", err);
      }
      setLoading(false);
    };

    fetchAnalysis();
  }, [marketData]);

  const getPanicIndex = (index, level) => {
    if (index !== undefined && index !== null && index > 0) return index;
    const map = { 'Extreme': 92, 'High': 74, 'Elevated': 48, 'Low': 12 };
    return map[level] || 0;
  };

  if (loading && !analysis) {
    return (
      <div style={{ padding: "20px", color: "#5a7a9a", fontSize: "12px", textAlign: "center" }}>
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
           style={{ marginBottom: "10px" }}
        >
          <Zap size={20} color="#f1c40f" />
        </motion.div>
        SWEEPING MARKET SIGNALS...
      </div>
    );
  }

  if (!analysis) return null;

  const currentPanicIndex = getPanicIndex(analysis.panicIndex, analysis.panicLevel);

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top AI Indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "-10px", padding: "0 4px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6366f1", boxShadow: "0 0 10px #6366f1" }} />
        <span style={{ fontSize: "9px", fontWeight: 900, color: "#6366f1", letterSpacing: "1px" }}>AI ANALYTICAL LAYER</span>
      </div>

      {/* Sentiment Gauge */}
      <div style={{ 
        background: "rgba(10,15,30,0.6)", 
        borderRadius: "12px", 
        border: "1px solid #1e2d4a", 
        padding: "16px" 
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "10px", fontWeight: "900", color: "#7a9ab8", letterSpacing: "1px" }}>MARKET SENTIMENT</span>
          <BarChart3 size={14} color="#2ecc71" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ 
            width: "56px", 
            height: "56px", 
            borderRadius: "50%", 
            border: `3px solid ${currentPanicIndex > 80 ? '#e74c3c' : currentPanicIndex > 30 ? '#f1c40f' : '#2ecc71'}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.03)"
          }}>
            <span style={{ fontSize: "16px", fontWeight: "900", color: "#fff" }}>{currentPanicIndex}</span>
            <span style={{ fontSize: "8px", fontWeight: "900", color: "#7a9ab8", marginTop: "-2px" }}>/100</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "10px", fontWeight: "900", color: analysis.panicIndex > 80 ? '#e74c3c' : '#f1c40f', marginBottom: "4px" }}>
              {(analysis.panicLevel || "N/A").toUpperCase()}
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#e2e8f0", lineHeight: "1.5" }}>
              {analysis.sentiment}
            </p>
          </div>
        </div>
      </div>

      {/* Conflict Projection */}
      <div style={{ 
        background: "rgba(231,76,60,0.05)", 
        borderRadius: "12px", 
        border: "1px solid rgba(231,76,60,0.2)", 
        padding: "16px" 
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "10px", fontWeight: "900", color: "#e74c3c", letterSpacing: "1px" }}>WAR SCENARIO PROJECTION</span>
          <AlertTriangle size={14} color="#e74c3c" />
        </div>
        <p style={{ margin: 0, fontSize: "12px", color: "#fff", lineHeight: "1.6", fontStyle: "italic" }}>
          "{analysis.conflictProjection}"
        </p>
      </div>

      {/* Risks & Hedges Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "10px", border: "1px solid #1e2d4a" }}>
          <div style={{ fontSize: "9px", fontWeight: "900", color: "#5a7a9a", marginBottom: "8px" }}>CRITICAL RISKS</div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
            {(analysis.risks || []).map((risk, i) => (

              <li key={i} style={{ fontSize: "10px", color: "#cbd5e1", display: "flex", gap: "6px" }}>
                <span style={{ color: "#e74c3c" }}>•</span> {risk}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ background: "rgba(46,204,113,0.05)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(46,204,113,0.2)" }}>
          <div style={{ fontSize: "9px", fontWeight: "900", color: "#2ecc71", marginBottom: "8px" }}>STABILITY HEDGES</div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
            {(analysis.hedges || []).map((hedge, i) => (

              <li key={i} style={{ fontSize: "10px", color: "#cbd5e1", display: "flex", gap: "6px" }}>
                <span style={{ color: "#2ecc71" }}>•</span> {hedge}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ padding: "0 4px", fontSize: "9px", color: "#475569", textAlign: "center", fontStyle: "italic" }}>
        Reality Intelligence Engine v2.4 (Grok-Optimized)
      </div>
    </div>
  );
};

export default MarketAnalysisPanel;
