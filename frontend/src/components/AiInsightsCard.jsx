import React, { useState, useEffect } from "react";
import API_BASE_URL from "../api/config";

export function AiInsightsCard({ sidebar = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/live/insights`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const containerStyle = sidebar
    ? { display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }
    : { display: 'flex', flexDirection: 'column', gap: '12px' };

  if (loading) {
    return (
      <div style={{ fontSize: "11px", color: "#5a7a9a", textAlign: "center", padding: "40px 20px" }}>
        Synthesizing daily intelligence...
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Executive Summary */}
      <div style={{
        padding: "12px",
        background: "rgba(255,255,255,0.03)",
        borderLeft: "2px solid var(--primary)",
        borderRadius: "4px"
      }}>
        <span style={{ fontSize: "11px", fontWeight: 900, color: "var(--primary)", display: "block", marginBottom: "6px", letterSpacing: "1px" }}>
          EXECUTIVE SUMMARY
        </span>
        <p style={{ fontSize: "13px", color: "#ccc", margin: 0, lineHeight: "1.6" }}>
          {data?.summary}
        </p>
      </div>

      {/* Major Events & Impacts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span style={{ fontSize: "10px", fontWeight: 900, color: "#5a7a9a", letterSpacing: "1.5px" }}>
          MAJOR EVENTS & IMPACTS
        </span>
        {data?.majorEvents?.map((ev, i) => (
          <div key={i} style={{
            padding: "12px",
            background: "rgba(0,0,0,0.2)",
            border: "1px solid #1e2d4a",
            borderRadius: "6px"
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e74c3c', marginTop: 7, flexShrink: 0 }} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff", lineHeight: "1.4" }}>{ev.event}</span>
            </div>
            <div style={{
              marginLeft: "16px",
              padding: "10px 14px",
              background: "rgba(46, 204, 113, 0.05)",
              borderLeft: "2px solid #2ecc71",
              fontSize: "12px",
              color: "#8aa",
              lineHeight: "1.5"
            }}>
              <span style={{ fontWeight: 900, color: "#2ecc71", fontSize: "10px", marginRight: "8px" }}>IMPACT:</span>
              {ev.impact}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
