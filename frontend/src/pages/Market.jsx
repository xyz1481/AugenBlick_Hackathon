import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Activity, Shield, Zap, ShoppingCart, Globe, 
  Search, RefreshCw, Maximize2, BarChart3, Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { createChart, ColorType, SeriesType } from 'lightweight-charts';

const CATEGORIES = [
  { id: 'macro', label: 'Macro & Risk', icon: <Globe size={18} /> },
  { id: 'energy', label: 'Energy & Power', icon: <Zap size={18} /> },
  { id: 'defense', label: 'Defense Sector', icon: <Shield size={18} /> },
  { id: 'food', label: 'Food Security', icon: <ShoppingCart size={18} /> },
  { id: 'tech', label: 'Combat Tech', icon: <Activity size={18} /> }
];

const MarketChart = ({ symbol, data }) => {
  const chartContainerRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const container = chartContainerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = 400;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      width,
      height,
    });

    const candleSeries = chart.addSeries(SeriesType.Candlestick, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    if (!candleSeries) {
      console.warn('[Chart] Failed to create candle series');
      return;
    }

    const chartData = data.map(item => ({
      time: new Date(item.date).getTime() / 1000,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    })).sort((a, b) => a.time - b.time);

    candleSeries.setData(chartData);
    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      console.log(`[Chart] Cleaning up chart for ${symbol}`);
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, symbol]);

  return <div ref={chartContainerRef} style={{ width: '100%', height: '400px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }} />;
};

const Market = () => {
  const [activeCategory, setActiveCategory] = useState('macro');
  const [marketData, setMarketData] = useState({});
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      const baseUrl = 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/market/war-watch`);
      if (!res.ok) throw new Error(`Market fetch failed: ${res.status}`);
      const data = await res.json();
      setMarketData(data);
      
      if (!selectedTicker && data.macro?.length > 0) {
        handleTickerSelect(data.macro[0]);
      }
    } catch (err) {
      console.error('Market fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (symbol) => {
    try {
      setHistoryLoading(true);
      const baseUrl = 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/market/history/${encodeURIComponent(symbol)}?period=1y`);
      if (!res.ok) throw new Error(`History fetch failed: ${res.status}`);
      const data = await res.json();
      setHistoricalData(data);
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleTickerSelect = (ticker) => {
    setSelectedTicker(ticker);
    fetchHistory(ticker.raw.symbol);
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredAssets = useMemo(() => {
    const assets = marketData[activeCategory] || [];
    if (!searchQuery) return assets;
    return assets.filter(a => 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.raw.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [marketData, activeCategory, searchQuery]);

  if (loading && Object.keys(marketData).length === 0) {
    return (
      <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0f1e' }}>
        <div className="sync-pulse" style={{ fontSize: '0.8rem', fontWeight: '800', letterSpacing: '4px', color: 'var(--primary)', marginBottom: '1rem' }}>CONNECTING TO TERMINAL</div>
        <div style={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '10px', color: 'var(--text-dim)' }}>Syncing Reality Engine...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#060a14', color: '#fff', overflow: 'hidden' }}>
      
      {/* ── Top Trading Menu ──────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', height: '56px', background: '#0d111d', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 1.5rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: '1.5rem', marginRight: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} color="var(--primary)" />
            <span style={{ fontWeight: '800', letterSpacing: '1px', fontSize: '14px' }}>AUGENBLICK TERMINAL</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
          {CATEGORIES.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => setActiveCategory(cat.id)}
              style={{
                background: activeCategory === cat.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                color: activeCategory === cat.id ? 'var(--primary)' : '#5a7a9a',
                border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '800',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
              }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '0 10px', height: '32px' }}>
            <Search size={14} color="#5a7a9a" />
            <input 
              placeholder="Quick Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '11px', paddingLeft: '8px', width: '140px' }}
            />
          </div>
          <button onClick={fetchMarketData} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#5a7a9a', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            <RefreshCw size={12} /> SYNC
          </button>
        </div>
      </div>

      {/* ── Main Workspace ────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left: Watchlist Pane */}
        <div style={{ width: '320px', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', background: '#0a0e17' }}>
          <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#5a7a9a', letterSpacing: '1px' }}>WATCHLIST</span>
            <span style={{ fontSize: '10px', color: 'var(--primary)' }}>{filteredAssets.length} ASSETS</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {filteredAssets.map((ticker, i) => (
              <div 
                key={`${ticker.raw.symbol || ticker.name}-${i}`}
                onClick={() => handleTickerSelect(ticker)}
                style={{
                  padding: '12px 16px', borderRadius: '8px', marginBottom: '4px', cursor: 'pointer',
                  background: selectedTicker?.raw.symbol === ticker.raw.symbol ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                  border: `1px solid ${selectedTicker?.raw.symbol === ticker.raw.symbol ? 'rgba(99, 102, 241, 0.2)' : 'transparent'}`,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => !selectedTicker || selectedTicker.raw.symbol !== ticker.raw.symbol && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => !selectedTicker || selectedTicker.raw.symbol !== ticker.raw.symbol && (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticker.name}</div>
                    <div style={{ fontSize: '10px', color: '#5a7a9a', fontWeight: '700' }}>{ticker.raw.symbol}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'monospace' }}>{ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: ticker.change >= 0 ? '#10b981' : '#ef4444' }}>
                      {ticker.change >= 0 ? '+' : ''}{ticker.change.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Main Chart Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#060a14' }}>
          
          {/* Chart Header / Selected Asset Info */}
          {selectedTicker && (
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0e17' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div>
                    <span style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>{selectedTicker.raw.symbol}</span>
                    <span style={{ fontSize: '12px', color: '#5a7a9a', marginLeft: '12px', fontWeight: '600' }}>{selectedTicker.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
                     <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#5a7a9a', fontWeight: '800' }}>LAST</div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: selectedTicker.change >= 0 ? '#10b981' : '#ef4444' }}>{selectedTicker.price.toFixed(2)}</div>
                     </div>
                     <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '9px', color: '#5a7a9a', fontWeight: '800' }}>CHANGE</div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: selectedTicker.change >= 0 ? '#10b981' : '#ef4444' }}>{selectedTicker.change.toFixed(2)}%</div>
                     </div>
                  </div>
               </div>
               <div style={{ display: 'flex', gap: '4px' }}>
                  {['1D', '1W', '1M', '1Y', 'ALL'].map(time => (
                    <button key={time} style={{ background: time === '1Y' ? 'rgba(99, 102, 241, 0.2)' : 'transparent', border: 'none', color: time === '1Y' ? 'var(--primary)' : '#5a7a9a', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>{time}</button>
                  ))}
                  <button style={{ background: 'none', border: 'none', color: '#5a7a9a', padding: '4px 8px', cursor: 'pointer' }}><Maximize2 size={14} /></button>
               </div>
            </div>
          )}

          {/* Real Chart */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {selectedTicker && !historyLoading && (
              <MarketChart symbol={selectedTicker.raw.symbol} data={historicalData} />
            )}
            {historyLoading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,10,20,0.5)', zIndex: 10 }}>
                <div style={{ textAlign: 'center' }}>
                   <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '4px' }}>DATA STREAMING</div>
                   <div style={{ fontSize: '9px', color: '#5a7a9a', marginTop: '4px' }}>Compiling Historical Vectors...</div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Panel: Signals / News */}
          <div style={{ height: '240px', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0a0e17', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#5a7a9a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowUpRight size={14} color="#10b981" /> REAL-TIME SIGNALS
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { time: '14:22', text: 'Volatility spike detected in Energy corridors.', level: 'HIGH' },
                    { time: '14:15', text: 'Defense sector ETF shows increased institutional inflow.', level: 'MEDIUM' },
                    { time: '14:02', text: 'USD strength impacts Emerging Market bonds.', level: 'LOW' }
                  ].map((s, i) => (
                    <div key={`${s.time}-${i}`} style={{ display: 'flex', gap: '15px', fontSize: '12px', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                       <span style={{ color: '#5a7a9a', fontWeight: '700' }}>{s.time}</span>
                       <span style={{ flex: 1, color: '#b0c8d8' }}>{s.text}</span>
                       <span style={{ color: s.level === 'HIGH' ? '#ef4444' : s.level === 'MEDIUM' ? '#f1c40f' : '#10b981', fontWeight: '900', fontSize: '10px' }}>{s.level}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* Right: Technicals & Risk Pane */}
        <div style={{ width: '340px', borderLeft: '1px solid rgba(255,255,255,0.06)', background: '#0d111d', display: 'flex', flexDirection: 'column' }}>
           <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '900', color: '#fff', letterSpacing: '1px', marginBottom: '20px' }}>REALITY SUMMARY</h3>
              {selectedTicker && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                   <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '9px', color: '#5a7a9a', fontWeight: '800' }}>PRICE</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>${selectedTicker.price.toFixed(2)}</div>
                   </div>
                   <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '9px', color: '#5a7a9a', fontWeight: '800' }}>VOLUME</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{(selectedTicker.raw.regularMarketVolume / 1000000).toFixed(1)}M</div>
                   </div>
                   <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '9px', color: '#5a7a9a', fontWeight: '800' }}>52W HIGH</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>${selectedTicker.raw.fiftyTwoWeekHigh?.toFixed(2)}</div>
                   </div>
                   <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '9px', color: '#5a7a9a', fontWeight: '800' }}>52W LOW</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>${selectedTicker.raw.fiftyTwoWeekLow?.toFixed(2)}</div>
                   </div>
                </div>
              )}
           </div>

           <div style={{ padding: '20px', flex: 1 }}>
              <h3 style={{ fontSize: '12px', fontWeight: '900', color: '#ef4444', letterSpacing: '1px', marginBottom: '20px' }}>CONFLICT RISK ANALYSIS</h3>
              
              <div style={{ background: 'rgba(231,76,60,0.05)', borderLeft: '3px solid #ef4444', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
                 <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>Correlation: Geopolitical Strains</div>
                 <div style={{ fontSize: '11px', color: '#b0c8d8', lineHeight: '1.5' }}>
                    Current price action for {selectedTicker?.raw.symbol} suggests high sensitivity to supply lane turbulence. Intelligence models indicate a 74% risk of volatility escalation in the next 72 hours.
                 </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                   <span style={{ fontSize: '10px', fontWeight: '800', color: '#5a7a9a' }}>PANIC COEFFICIENT</span>
                   <span style={{ fontSize: '11px', fontWeight: '900', color: '#ef4444' }}>CRITICAL (8.2)</span>
                </div>
                <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                   <div style={{ width: '82%', height: '100%', background: '#ef4444', borderRadius: '2px', boxShadow: '0 0 8px #ef4444' }} />
                </div>
              </div>

              <div>
                <button 
                  onClick={() => navigate(`/narrative?topic=${encodeURIComponent(selectedTicker?.name || '')}&symbol=${selectedTicker?.raw.symbol}`)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: '900', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.5px' }}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                >
                  DEEP NARRATIVE SCAN
                </button>
              </div>
           </div>

           <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                 <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                 <span style={{ fontSize: '10px', fontWeight: '800', color: '#10b981', letterSpacing: '1px' }}>DATA SOURCE: LIVE YAHOO INTELLIGENCE</span>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Market;
