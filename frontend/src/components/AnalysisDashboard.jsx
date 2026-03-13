import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import API_BASE_URL from "../api/config";

const AnalysisDashboard = () => {
  const [searchParams] = useSearchParams();
  const [topic, setTopic] = useState(
    searchParams.get("topic") || "Oil Supply Crisis",
  );
  const [symbol, setSymbol] = useState(searchParams.get("symbol") || "CL=F");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Unified unifiedItems derived from the result
  const unifiedItems = useMemo(() => {
    if (!result || !result.narrative) return [];

    const {
      newsSources = [],
      redditSources = [],
      twitterSources = [],
      instagramSources = [],
    } = result.narrative;

    const now = new Date();
    const nowISO = now.toISOString();

    const items = [
      ...newsSources.map((i) => ({
        ...i,
        platform: "news",
        date: new Date(i.pubDate),
      })),
      ...redditSources.map((i) => ({
        ...i,
        platform: "reddit",
        date: new Date(i.timestamp || now),
      })),
      ...twitterSources.map((i) => ({
        ...i,
        platform: "x",
        date: new Date(i.timestamp || now),
      })),
      ...instagramSources.map((i) => ({
        ...i,
        platform: "instagram",
        date: new Date(i.timestamp || now),
        pubDate: i.timestamp || nowISO, // Ensure pubDate for fallback
      })),
    ];

    // Sort by date (descending)
    return items.sort((a, b) => b.date - a.date);
  }, [result]);

  const runAnalysis = async (searchTopic, searchSymbol) => {
    const finalTopic = searchTopic || topic || "Global Market Volatility";
    const finalSymbol = searchSymbol || symbol || "CL=F";

    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/analysis/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: finalTopic, symbol: finalSymbol }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "The analysis server encountered an issue.");
      } else {
        setResult(data);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(
        "Could not connect to the Backend server. Ensure it is running.",
      );
    }
    setLoading(false);
  };

  return (
    <div
      className="status-card"
      style={{ width: "100%", maxWidth: "1800px", margin: "2rem auto" }}
    >
      <h2
        style={{
          marginBottom: "2rem",
          textAlign: "center",
          letterSpacing: "2px",
          textTransform: "uppercase",
          fontStyle: "italic",
        }}
      >
        Narrative vs Reality Intelligence Engine
      </h2>

      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          marginBottom: "2rem",
          background: "rgba(0,0,0,0.3)",
          padding: "1.5rem",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: 2 }}>
          <label
            style={{
              fontSize: "0.7rem",
              color: "var(--text-dim)",
              textTransform: "uppercase",
              fontWeight: "800",
              marginBottom: "8px",
              display: "block",
            }}
          >
            Narrative Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Oil Supply Crisis"
            style={{
              width: "100%",
              padding: "1rem",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              background: "#0f172a",
              color: "white",
              fontSize: "1rem",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label
            style={{
              fontSize: "0.7rem",
              color: "var(--text-dim)",
              textTransform: "uppercase",
              fontWeight: "800",
              marginBottom: "8px",
              display: "block",
            }}
          >
            Market Asset
          </label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="e.g. CL=F"
            style={{
              width: "100%",
              padding: "1rem",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              background: "#0f172a",
              color: "white",
              fontSize: "1rem",
            }}
          />
        </div>
        <button
          className="refresh-btn"
          onClick={runAnalysis}
          disabled={loading}
          style={{
            height: "52px",
            marginTop: "0",
            flex: 0.5,
            minWidth: "200px",
          }}
        >
          {loading ? "📡 ANALYZING..." : "⚡ RUN ENGINE"}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            color: "#ef4444",
            textAlign: "center",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {result && result.verdict && (
        <div style={{ marginTop: "2rem", animation: "fadeIn 0.5s ease" }}>
          {/* Minimal Reality Strip */}
          <div
            className="reality-strip"
            style={{
              padding: "0.6rem 2rem",
              borderRadius: "12px",
              fontSize: "0.8rem",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div className="reality-item">
              <span className="reality-label">Asset:</span>
              <span className="reality-value" style={{ color: "white" }}>
                {result.reality.indicatorName}
              </span>
            </div>
            <div className="reality-item">
              <span className="reality-label">Price:</span>
              <span className="reality-value" style={{ color: "white" }}>
                ${result.reality.currentValue.toLocaleString()}
              </span>
            </div>
            <div
              className="reality-item"
              style={{
                borderLeft: "1px solid var(--border-color)",
                paddingLeft: "1.5rem",
              }}
            >
              <span className="reality-label">Confidence:</span>
              <span
                className="reality-value"
                style={{ color: "var(--accent)" }}
              >
                {Math.round(result.verdict.confidence * 100)}%
              </span>
            </div>
            <div className="reality-item">
              <span className="reality-label">Panic:</span>
              <span
                className={`reality-value ${result.verdict.panicIndex > 50 ? "offline" : "online"}`}
              >
                {result.verdict.panicIndex}%
              </span>
            </div>
          </div>

          {/* Unified Intelligence Summary Strip */}
          <div
            style={{
              background: "rgba(59, 130, 246, 0.05)",
              padding: "10px 20px",
              display: "flex",
              justifyContent: "center",
              gap: "40px",
              fontSize: "11px",
              fontWeight: "900",
              letterSpacing: "1px",
              borderBottom: "1px solid rgba(255,255,255,0.03)",
            }}
          >
            <div style={{ color: "#60a5fa" }}>
              <span style={{ color: "#475569", marginRight: "5px" }}>
                TOPIC:
              </span>{" "}
              {result.topic}
            </div>
            <div
              style={{
                color: result.verdict.panicIndex > 50 ? "#f43f5e" : "#10b981",
              }}
            >
              <span style={{ color: "#475569", marginRight: "5px" }}>
                PANIC INDEX:
              </span>{" "}
              {result.verdict.panicIndex}%
            </div>
            <div style={{ color: "#fff" }}>
              <span style={{ color: "#475569", marginRight: "5px" }}>
                ASSET:
              </span>{" "}
              {result.reality.indicatorName} ($
              {result.reality.currentValue.toLocaleString()})
            </div>
            <div style={{ color: "#8b5cf6" }}>
              <span style={{ color: "#475569", marginRight: "5px" }}>
                VECTORS:
              </span>{" "}
              {unifiedItems.length} SOURCES
            </div>
          </div>

          <div
            style={{
              padding: "1.5rem",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              marginBottom: "3rem",
              marginTop: "20px",
            }}
          >
            <h4 style={{ color: "var(--accent)", marginBottom: "0.5rem" }}>
              🤖 Intelligence Verdict
            </h4>
            <p style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>
              {result.verdict.conclusion}
            </p>
          </div>

          {/* MASONRY GRID FOR UNIFIED INTEL */}
          <div
            style={{
              flex: 1,
              padding: "0 10px 40px 10px",
              columnCount: "auto",
              columnWidth: "340px",
              columnGap: "12px",
            }}
          >
            {!loading &&
              unifiedItems.map((item, idx) => (
                <IntelligenceTile key={idx} item={item} idx={idx} />
              ))}
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes pulse {
          0% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0.4; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .intel-card {
          animation: slideUp 0.4s ease-out backwards;
          animation-delay: calc(var(--idx) * 0.05s);
        }
      `,
        }}
      />
    </div>
  );
};

/**
 * IntelligenceTile: A polymorphic card that adapts to its source platform.
 */
const IntelligenceTile = ({ item, idx }) => {
  const getPlatformStyles = () => {
    switch (item.platform) {
      case "x":
        return {
          icon: (
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="white"
              aria-label="X"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
            </svg>
          ),
          color: "#fff",
          bg: "#000",
          border: "#2f3336",
        };
      case "reddit":
        return {
          icon: (
            <img
              src="/Reddit-Logo-emblem-of-the-online-platform-transparent-png-image-jpg.png"
              alt="Reddit"
              style={{ width: "20px", height: "20px" }}
            />
          ),
          color: "#ff4500",
          bg: "#1a1a1b",
          border: "#343536",
        };
      case "instagram":
        return {
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient
                  id="ig-grad"
                  x1="0%"
                  y1="100%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#f09433" />
                  <stop offset="25%" stopColor="#e6683c" />
                  <stop offset="50%" stopColor="#dc2743" />
                  <stop offset="75%" stopColor="#cc2366" />
                  <stop offset="100%" stopColor="#bc1888" />
                </linearGradient>
              </defs>
              <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
              <circle
                cx="12"
                cy="12"
                r="4.5"
                stroke="white"
                strokeWidth="1.8"
                fill="none"
              />
              <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
            </svg>
          ),
          color: "#e1306c",
          bg: "#1a0a14",
          border: "#3d1a2e",
        };
      case "news": {
        const domain =
          item.sourceDomain ||
          (item.link && item.link.startsWith("http")
            ? new URL(item.link).hostname
            : "");
        return {
          icon: domain ? (
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
              alt=""
              style={{ width: "16px", height: "16px", borderRadius: "2px" }}
              onError={(e) => (e.target.style.display = "none")}
            />
          ) : (
            <div
              style={{
                width: "12px",
                height: "12px",
                border: "2px solid #10b981",
                borderRadius: "2px",
              }}
            />
          ),
          color: "#10b981",
          bg: "#0f172a",
          border: "#1e293b",
        };
      }
      default:
        return {
          icon: <span style={{ fontSize: "12px" }}>◈</span>,
          color: "#fff",
          bg: "#1e293b",
          border: "#334155",
        };
    }
  };

  const p = getPlatformStyles();

  return (
    <div
      onClick={() => window.open(item.url || item.link, "_blank")}
      style={{
        breakInside: "avoid",
        marginBottom: "12px",
        background: p.bg,
        border: `1px solid ${p.border}`,
        borderRadius: "12px",
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.2s ease, border-color 0.2s ease",
        position: "relative",
        "--idx": idx,
      }}
      className="intel-card"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.borderColor = p.color + "44";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = p.border;
      }}
    >
      {/* Media Overlay */}
      {item.videoUrl && (
        <div style={{ position: "relative" }}>
          <video
            src={item.videoUrl}
            muted
            autoPlay
            loop
            playsInline
            style={{ width: "100%", display: "block" }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "10px",
              left: "10px",
              background: "rgba(0,0,0,0.7)",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "9px",
              fontWeight: "900",
            }}
          >
            LIVE_CAPTURE
          </div>
        </div>
      )}
      {!item.videoUrl && item.thumbnail && (
        <img
          src={item.thumbnail}
          alt=""
          style={{
            width: "100%",
            display: "block",
            maxHeight: "400px",
            objectFit: "cover",
          }}
          onError={(e) => (e.target.style.display = "none")}
        />
      )}

      {/* Content Area */}
      <div style={{ padding: "15px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {p.icon}
            <span
              style={{
                fontSize: "11px",
                fontWeight: "900",
                color: p.color,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {item.platform}
            </span>
          </div>
          <span
            style={{ fontSize: "9px", fontWeight: "700", color: "#475569" }}
          >
            {item.date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div
          style={{
            fontSize: item.platform === "news" ? "14px" : "13px",
            fontWeight: item.platform === "news" ? "800" : "500",
            lineHeight: "1.5",
            color: "#e2e8f0",
            marginBottom: "10px",
          }}
        >
          {item.title || item.content}
        </div>

        {(item.author || item.source) && (
          <div
            style={{
              fontSize: "11px",
              color: "#64748b",
              fontWeight: "700",
              marginBottom: "12px",
            }}
          >
            {item.author
              ? `@${item.author.replace(/^r\//, "").replace(/^@/, "")}`
              : item.source?.title || item.source}
          </div>
        )}

        {/* Engagement Strip */}
        <div
          style={{
            display: "flex",
            gap: "15px",
            paddingTop: "12px",
            borderTop: "1px solid rgba(255,255,255,0.03)",
            fontSize: "10px",
            fontWeight: "900",
            color: "#475569",
            letterSpacing: "0.5px",
          }}
        >
          {item.likes !== undefined && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>LIKES: {item.likes.toLocaleString()}</span>
            </div>
          )}
          {item.upvotes !== undefined && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>UPVOTES: {item.upvotes.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;
