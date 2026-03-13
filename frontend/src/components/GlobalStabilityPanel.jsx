import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Globe2,
  Network,
  Zap,
  Ship,
  Thermometer,
} from "lucide-react";
import API_BASE_URL from "../api/config";

function radialGradient(score) {
  if (score >= 75) return "linear-gradient(135deg, #2ecc71, #27ae60)";
  if (score >= 50) return "linear-gradient(135deg, #f1c40f, #e67e22)";
  return "linear-gradient(135deg, #e74c3c, #c0392b)";
}

// ─── SUB-WIDGET COMPONENTS ───────────────────────────────────────────────────

export function StabilityGaugeWidget({ stability }) {
  const stabilityScore = stability?.score ?? 0;
  return (
    <div
      style={{
        background: "#050910",
        borderRadius: 12,
        border: "1px solid #1e2d4a",
        padding: 14,
        display: "flex",
        alignItems: "center",
        gap: 14,

      }}
    >
      <div
        style={{
          width: 84,
          height: 84,
          borderRadius: "50%",
          background: radialGradient(stabilityScore),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 24px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#050910",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 10, color: "#5a7a9a", fontWeight: 800 }}>
            GLOBAL
          </span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#fff",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {stabilityScore}
          </span>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: "#7a9ab8",
              letterSpacing: "0.08em",
            }}
          >
            GLOBAL STABILITY SCORE
          </span>
          <Globe2 size={14} color="#5a7a9a" />
        </div>
        <p
          style={{
            fontSize: 11,
            color: "#9bb1cc",
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {stability?.reason ||
            "Awaiting live signals from markets, events, and logistics."}
        </p>
      </div>
    </div>
  );
}

export function SystemsImpactWidget({ systems }) {
  return (
    <AnimatePresence>
      {systems && (
        <div
          style={{
            background: "#050910",
            borderRadius: 12,
            border: "1px solid #1e2d4a",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,

          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                color: "#f1c40f",
                letterSpacing: "0.08em",
              }}
            >
              SYSTEMS IMPACT PANEL
            </span>
            <Activity size={14} color="#5a7a9a" />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.9fr",
              gap: 8,
            }}
          >
            <div
              style={{
                background: "rgba(15,23,42,0.85)",
                borderRadius: 10,
                padding: 8,
                border: "1px solid rgba(255,255,255,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: "#7a9ab8",
                    fontWeight: 800,
                  }}
                >
                  COMMODITIES
                </span>
                <Thermometer size={12} color="#f1c40f" />
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                }}
              >
                {systems.commodities.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: "4px 6px",
                      borderRadius: 6,
                      background: "rgba(15,23,42,0.9)",
                      border: "1px solid rgba(148,163,184,0.35)",
                      minWidth: 90,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        color: "#e5e7eb",
                      }}
                    >
                      {c.symbol}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: "#cbd5f5",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {c.price != null ? c.price.toFixed(2) : "—"}
                      </span>
                      {c.changePct != null && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            color: c.changePct >= 0 ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {c.changePct.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: "rgba(15,23,42,0.85)",
                borderRadius: 10,
                padding: 8,
                border: "1px solid rgba(255,255,255,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: "#7a9ab8",
                    fontWeight: 800,
                  }}
                >
                  LOGISTICS STRESS
                </span>
                <Ship size={12} color="#38bdf8" />
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>
                {systems.logistics.indices.portCongestion}% port congestion ·{" "}
                {systems.logistics.indices.shippingDelay}% delay at choke points
              </div>
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: "#0f172a",
                  overflow: "hidden",
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    width: `${systems.logistics.indices.portCongestion}%`,
                    height: "100%",
                    background:
                      systems.logistics.indices.portCongestion > 70
                        ? "#ef4444"
                        : systems.logistics.indices.portCongestion > 40
                        ? "#f97316"
                        : "#22c55e",
                  }}
                />
              </div>
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: "#0f172a",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${systems.logistics.indices.shippingDelay}%`,
                    height: "100%",
                    background:
                      systems.logistics.indices.shippingDelay > 70
                        ? "#ef4444"
                        : systems.logistics.indices.shippingDelay > 40
                        ? "#f97316"
                        : "#22c55e",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function EventImpactChainWidget({ events, selectedEventId, setSelectedEventId, impactGraph }) {
  return (
    <div
      style={{
        background: "#050910",
        borderRadius: 12,
        border: "1px solid #1e2d4a",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        height: "100%",

      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 900,
            color: "#38bdf8",
            letterSpacing: "0.08em",
          }}
        >
          EVENT → IMPACT CHAIN
        </span>
        <Network size={14} color="#5a7a9a" />
      </div>
      <div style={{ display: "flex", gap: 8, height: 170 }}>
        <div
          style={{
            flex: 1.1,
            overflowY: "auto",
            borderRight: "1px solid #1e293b",
            paddingRight: 4,
          }}
        >
          {events.slice(0, 8).map((e) => (
            <button
              key={e.id}
              onClick={() => setSelectedEventId(e.id)}
              style={{
                width: "100%",
                textAlign: "left",
                marginBottom: 5,
                padding: "4px 6px",
                borderRadius: 6,
                border:
                  selectedEventId === e.id
                    ? "1px solid #38bdf8"
                    : "1px solid #1f2937",
                background:
                  selectedEventId === e.id ? "#0f172a" : "rgba(15,23,42,0.7)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#e5e7eb",
                  fontWeight: 800,
                  marginBottom: 2,
                }}
              >
                {e.country || "MULTI-REGION"}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#9ca3af",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={e.summary}
              >
                {e.summary}
              </div>
            </button>
          ))}
          {events.length === 0 && (
            <div style={{ fontSize: 10, color: "#6b7280" }}>
              Loading live conflict events from GDELT…
            </div>
          )}
        </div>
        <div style={{ flex: 1.1, overflowY: "auto", paddingLeft: 2 }}>
          {impactGraph ? (
            <div style={{ fontSize: 10, color: "#e5e7eb" }}>
              {impactGraph.nodes
                .filter((n) => n.id === impactGraph.rootEventId)
                .map((root) => (
                  <div
                    key={root.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <AlertTriangle size={12} color="#f97316" />
                    <span
                      style={{
                        marginLeft: 4,
                        fontWeight: 800,
                        fontSize: 10,
                      }}
                    >
                      {root.label}
                    </span>
                  </div>
                ))}
              {impactGraph.edges.map((edge, idx) => {
                const from = impactGraph.nodes.find((n) => n.id === edge.from);
                const to = impactGraph.nodes.find((n) => n.id === edge.to);
                if (!from || !to) return null;
                return (
                  <div
                    key={`${edge.from}-${edge.to}-${idx}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 3,
                    }}
                  >
                    <ArrowRight size={10} color="#64748b" />
                    <span
                      style={{
                        marginLeft: 4,
                        color: "#cbd5f5",
                        fontWeight: 700,
                      }}
                    >
                      {from.label}
                    </span>
                    <span
                      style={{
                        margin: "0 4px",
                        color: "#64748b",
                        fontSize: 9,
                      }}
                    >
                      →
                    </span>
                    <span style={{ color: "#e5e7eb", fontWeight: 700 }}>
                      {to.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: 10, color: "#6b7280" }}>
              Select an event to generate its live impact chain.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DominoEffectWidget({ domino, dominoStep, scenarios, selectedScenarioId, setSelectedScenarioId, currentDominoActiveIds }) {
  return (
    <div
      style={{
        background: "#050910",
        borderRadius: 12,
        border: "1px solid #1e2d4a",
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 6,

      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 900,
            color: "#f97316",
            letterSpacing: "0.08em",
          }}
        >
          DOMINO EFFECT SIMULATOR
        </span>
        <Zap size={14} color="#fbbf24" />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <select
            value={selectedScenarioId || ""}
            onChange={(e) =>
              setSelectedScenarioId(e.target.value || null)
            }
            style={{
              width: "100%",
              background: "#020617",
              color: "#e5e7eb",
              borderRadius: 8,
              border: "1px solid #1e293b",
              padding: "4px 6px",
              fontSize: 10,
              fontWeight: 700,
              outline: "none",
            }}
          >
            <option value="">Select disruption scenario…</option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          marginTop: 4,
          minHeight: 70,
        }}
      >
        {domino ? (
          <div style={{ flex: 1.4, display: "flex", gap: 2 }}>
            {domino.nodes.map((n, idx) => {
              const isActive = currentDominoActiveIds.has(n.id);
              return (
                <div
                  key={n.id}
                  style={{
                    flex: 1,
                    minWidth: 40,
                    background: isActive ? "#f97316" : "#0f172a",
                    borderRadius: 6,
                    padding: "4px 4px",
                    transformOrigin: "bottom center",
                    transform: isActive
                      ? `rotate(${Math.min(15 + idx * 3, 45)}deg)`
                      : "rotate(0deg)",
                    transition: "transform 0.4s ease, background 0.25s ease",
                    border: isActive
                      ? "1px solid rgba(248,250,252,0.9)"
                      : "1px solid #1f2937",
                  }}
                >
                  <div
                    style={{
                      fontSize: 8,
                      fontWeight: 800,
                      color: isActive ? "#020617" : "#e5e7eb",
                      marginBottom: 2,
                    }}
                  >
                    {n.label}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 900,
                      color: isActive ? "#020617" : "#9ca3af",
                    }}
                  >
                    {n.impactPct}%
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: 10, color: "#6b7280", flex: 1 }}>
            Choose a disruption scenario to animate cascading system impacts.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PROVIDER ────────────────────────────────────────────────────────────

export default function GlobalStabilityPanel() {
  const [stability, setStability] = useState(null);
  const [systems, setSystems] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [impactGraph, setImpactGraph] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [domino, setDomino] = useState(null);
  const [dominoStep, setDominoStep] = useState(0);

  // Fetch stability + systems overview
  useEffect(() => {
    const load = async () => {
      try {
        const [stabRes, sysRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/stability/global`),
          fetch(`${API_BASE_URL}/api/systems/overview`),
        ]);
        if (stabRes.ok) {
          const j = await stabRes.json();
          setStability(j.data);
        }
        if (sysRes.ok) {
          const j = await sysRes.json();
          setSystems(j.data);
        }
      } catch (e) {
        console.warn("[GlobalStabilityPanel] Core load failed:", e.message);
      }
    };
    load();
    const t = setInterval(load, 10 * 60_000);
    return () => clearInterval(t);
  }, []);

  // Fetch events + scenarios once
  useEffect(() => {
    const load = async () => {
      try {
        const [evRes, scRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/events/live`),
          fetch(`${API_BASE_URL}/api/domino/scenarios`),
        ]);
        if (evRes.ok) {
          const j = await evRes.json();
          setEvents(j.events || []);
        }
        if (scRes.ok) {
          const j = await scRes.json();
          setScenarios(j.scenarios || []);
        }
      } catch (e) {
        console.warn("[GlobalStabilityPanel] Events/scenarios load failed:", e.message);
      }
    };
    load();
  }, []);

  // Fetch impact chain when event selected
  useEffect(() => {
    if (!selectedEventId) return;
    const load = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/events/${encodeURIComponent(selectedEventId)}/impact-chain`,
        );
        if (!res.ok) return;
        const j = await res.json();
        setImpactGraph(j.graph);
      } catch (e) {
        console.warn("[GlobalStabilityPanel] Impact chain fetch failed:", e.message);
      }
    };
    load();
  }, [selectedEventId]);

  // Run domino simulation when scenario chosen
  useEffect(() => {
    if (!selectedScenarioId) return;
    const run = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/domino/simulate/${encodeURIComponent(selectedScenarioId)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ intensity: 0.85 }),
          },
        );
        if (!res.ok) return;
        const j = await res.json();
        setDomino(j.simulation);
        setDominoStep(0);
      } catch (e) {
        console.warn("[GlobalStabilityPanel] Domino simulate failed:", e.message);
      }
    };
    run();
  }, [selectedScenarioId]);

  // Animate domino timeline
  useEffect(() => {
    if (!domino || !domino.timeline) return;
    setDominoStep(0);
    let idx = 0;
    const interval = setInterval(() => {
      idx += 1;
      if (idx >= domino.timeline.length) {
        clearInterval(interval);
      } else {
        setDominoStep(idx);
      }
    }, 900);
    return () => clearInterval(interval);
  }, [domino]);

  const currentDominoActiveIds = useMemo(() => {
    if (!domino || !domino.timeline) return new Set();
    const active = new Set();
    for (let i = 0; i <= dominoStep && i < domino.timeline.length; i += 1) {
      active.add(domino.timeline[i].nodeId);
    }
    return active;
  }, [domino, dominoStep]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: "20px 0 20px 4px",
        width: "100%",
        height: "100%",
        overflowY: "auto",
        scrollbarWidth: "none",
      }}
    >

      <StabilityGaugeWidget stability={stability} />
      <SystemsImpactWidget systems={systems} />
      <EventImpactChainWidget
        events={events}
        selectedEventId={selectedEventId}
        setSelectedEventId={setSelectedEventId}
        impactGraph={impactGraph}
      />
      <DominoEffectWidget
        domino={domino}
        dominoStep={dominoStep}
        scenarios={scenarios}
        selectedScenarioId={selectedScenarioId}
        setSelectedScenarioId={setSelectedScenarioId}
        currentDominoActiveIds={currentDominoActiveIds}
      />
    </div>

  );
}