import React, { useState, useEffect } from "react";
import API_BASE_URL from "../api/config";

export function CurrencyCard() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/live/currency`)
      .then((r) => r.json())
      .then((d) => {
        if (d.rates) setRates(d.rates);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ fontSize: "11px", color: "#5a7a9a", textAlign: "center", padding: "20px" }}>
        Fetching live exchange rates...
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
      {rates.map((r, i) => (
        <div
          key={i}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid #1e2d4a",
            borderRadius: "6px",
            padding: "8px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "10px", fontWeight: 900, color: "#5a7a9a" }}>{r.sym}</span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                color: r.up ? "#2ecc71" : "#e74c3c",
              }}
            >
              {r.chg}
            </span>
          </div>
          <div style={{ fontSize: "14px", fontWeight: 900, color: "#fff" }}>
            {r.val}
          </div>
        </div>
      ))}
    </div>
  );
}
