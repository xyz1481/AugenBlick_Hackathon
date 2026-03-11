import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const AnalysisDashboard = () => {
  const [searchParams] = useSearchParams();
  const [topic, setTopic] = useState(searchParams.get('topic') || 'Oil Supply Crisis');
  const [symbol, setSymbol] = useState(searchParams.get('symbol') || 'CL=F');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);


  const runAnalysis = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const baseUrl = 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/analysis/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, symbol })
      });
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'The analysis server encountered an issue.');
      } else {
        setResult(data);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Could not connect to the Backend server. Ensure it is running.');
    }
    setLoading(false);
  };

  return (
    <div className="status-card" style={{ width: '100%', maxWidth: '1800px', margin: '2rem auto' }}>
      <h2 style={{ marginBottom: '2rem', textAlign: 'center', letterSpacing: '2px', textTransform: 'uppercase', fontStyle: 'italic' }}>Narrative vs Reality Intelligence Engine</h2>
      
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', alignItems: 'flex-end' }}>
        <div style={{ flex: 2 }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px', display: 'block' }}>Narrative Topic</label>
          <input 
            type="text" 
            value={topic} 
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Oil Supply Crisis"
            style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#0f172a', color: 'white', fontSize: '1rem' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px', display: 'block' }}>Market Asset</label>
          <input 
            type="text" 
            value={symbol} 
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="e.g. CL=F"
            style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#0f172a', color: 'white', fontSize: '1rem' }}
          />
        </div>
        <button 
          className="refresh-btn" 
          onClick={runAnalysis} 
          disabled={loading}
          style={{ height: '52px', marginTop: '0', flex: 0.5, minWidth: '200px' }}
        >
          {loading ? '📡 ANALYZING...' : '⚡ RUN ENGINE'}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', textAlign: 'center' }}>
          ⚠️ {error}
        </div>
      )}

      {result && result.verdict && (
        <div style={{ marginTop: '2rem', animation: 'fadeIn 0.5s ease' }}>
          {/* Minimal Reality Strip */}
          <div className="reality-strip" style={{ padding: '0.6rem 2rem', borderRadius: '12px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)' }}>
            <div className="reality-item">
              <span className="reality-label">Asset:</span>
              <span className="reality-value" style={{ color: 'white' }}>{result.reality.indicatorName}</span>
            </div>
            <div className="reality-item">
              <span className="reality-label">Price:</span>
              <span className="reality-value" style={{ color: 'white' }}>${result.reality.currentValue.toLocaleString()}</span>
            </div>
            <div className="reality-item" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
              <span className="reality-label">Confidence:</span>
              <span className="reality-value" style={{ color: 'var(--accent)' }}>{Math.round(result.verdict.confidence * 100)}%</span>
            </div>
            <div className="reality-item">
              <span className="reality-label">Panic:</span>
              <span className={`reality-value ${result.verdict.panicIndex > 50 ? 'offline' : 'online'}`}>
                {result.verdict.panicIndex}%
              </span>
            </div>
          </div>

          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '3rem' }}>
            <h4 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>🤖 Intelligence Verdict</h4>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>{result.verdict.conclusion}</p>
          </div>

          <div style={{ marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px', borderLeft: '4px solid var(--primary)', paddingLeft: '1rem' }}>Global Narrative Feed</h3>
            
            {result.narrative.redditSources?.length > 0 ? (
              <div className="reddit-feed">
                {result.narrative.redditSources.map((post, i) => (
                  <div key={i} className="reddit-post" onClick={() => window.open(post.url, '_blank')}>
                    {/* Video takes priority over image */}
                    {post.videoUrl ? (
                      <div className="post-media-modern" style={{ position: 'relative' }}>
                        <video
                          src={post.videoUrl}
                          controls
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          style={{ width: '100%', display: 'block', maxHeight: '400px', objectFit: 'cover', background: '#000' }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span style={{
                          position: 'absolute', top: '8px', left: '8px',
                          background: 'rgba(0,0,0,0.7)', color: 'white',
                          fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px',
                          borderRadius: '999px', backdropFilter: 'blur(4px)'
                        }}>🎬 VIDEO</span>
                      </div>
                    ) : post.thumbnail ? (
                      <div className="post-media-modern">
                        <img 
                          src={post.thumbnail} 
                          alt="" 
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : null}

                    <div className="post-content-area">
                      {/* Header Info */}
                      <div className="post-header-modern">
                        <div className="post-user-info">
                          <div className="user-avatar">{post.author.charAt(2).toUpperCase()}</div>
                          <span style={{ fontWeight: '700', color: '#d7dadc' }}>{post.author}</span>
                          <span>• {Math.floor(Math.random() * 12) + i}h ago</span>
                        </div>
                        <div className="post-more">•••</div>
                      </div>

                      {/* Title */}
                      <div className="post-title-modern">{post.title}</div>

                      {/* Footer Actions — real data from JSON API */}
                      <div className="post-footer-modern">
                        <div className="footer-pill">
                          <span className="vote-btn-modern up">⬆</span>
                          <span>{post.upvotes?.toLocaleString() ?? post.ups}</span>
                          <span className="vote-btn-modern down">⬇</span>
                        </div>
                        
                        <div className="footer-pill">
                          <span>💬</span> {post.num_comments?.toLocaleString() ?? '—'}
                        </div>
                        
                        <div className="footer-pill">
                          <span>⤴</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                Collecting signals... no narrative pulse detected yet.
              </div>
            )}
          </div>

          {/* X Intelligence Feed */}
          {result.narrative.twitterSources?.length > 0 && (
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', borderLeft: '4px solid #fff', paddingLeft: '1rem' }}>
                <img src="/x-logo.svg" alt="X" width="20" height="20" />
                <h3 style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>X Intelligence</h3>
              </div>
              <div className="reddit-feed">
                {result.narrative.twitterSources.map((tweet, i) => (
                  <div key={i} className="reddit-post" onClick={() => window.open(tweet.url, '_blank')} style={{ background: '#000', border: '1px solid #2f3336', borderRadius: '16px' }}>
                    <div className="post-content-area" style={{ padding: '16px' }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: tweet.avatarColor || '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px', color: '#fff', flexShrink: 0 }}>
                            {(tweet.author || 'X').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '700', color: '#fff', fontSize: '15px', lineHeight: 1.2 }}>{tweet.author}</span>
                            {tweet.authorHandle && (
                              <span style={{ fontSize: '14px', color: '#71767b' }}>{tweet.authorHandle}</span>
                            )}
                          </div>
                        </div>
                        <div style={{ color: '#71767b', flexShrink: 0 }}>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><g><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"></path></g></svg>
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{ fontSize: '15px', fontWeight: '400', color: '#e7e9ea', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                        {tweet.content}
                      </div>

                      {/* Metadata */}
                      <div style={{ fontSize: '13px', color: '#71767b', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #2f3336' }}>
                        <span>{new Date(tweet.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span> · </span>
                        <span>{new Date(tweet.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span> · </span>
                        <span style={{ fontWeight: '700', color: '#fff' }}>{tweet.views}</span> Views
                      </div>

                      {/* Action Bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#71767b', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><g><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.244c4.421 0 8.005 3.58 8.005 8 0 4.417-3.584 8-8.005 8H11.8l-4.507 4.105c-.83.755-2.152.167-2.152-.964V18.17C3.173 17.6 1.751 16 1.751 10zM10 6c-3.3 0-6 2.7-6 6 0 1.2.3 2.3 1 3.2l.3.5v3.4l2.7-2.4.6-.5h1.2c3.3 0 6-2.7 6-6s-2.7-6-6-6z"></path></g></svg>
                          <span>{Math.floor(tweet.retweets * 0.4)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><g><path d="M4.5 3.88l4.432 4.43-1.77 1.77L4.5 7.42 1.838 10.08l-1.77-1.77L4.5 3.88zM16.5 6H3v2h13.5v5H18V8c0-1.1-.9-2-2-2zM23.232 15.69l-4.43-4.43 1.77-1.77 2.66 2.66 2.662-2.66 1.77 1.77-4.432 4.43zM7.5 18H21v-2H7.5v-5H6v5c0 1.1.9 2 2 2z"></path></g></svg>
                          <span>{tweet.retweets}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><g><path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.884 8.81-4.883-3.69-7.533-6.33-8.884-8.81-1.515-2.79-1.341-6.14.864-8.34 2.213-2.19 5.824-2.19 8.02 0l1.011 1.01 1.011-1.01c2.203-2.19 5.814-2.19 8.016 0 2.213 2.19 2.379 5.55.864 8.34z"></path></g></svg>
                          <span>{tweet.likes}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><g><path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z"></path></g></svg>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><g><path d="M12 2.59l4.5 4.5-1.41 1.41L13 6.41V16h-2V6.41l-2.09 2.09L7.5 7.09 12 2.59zM19 15v2c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-2H3v2c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3v-2h-2z"></path></g></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* News Articles — same masonry layout as Reddit */}
          {result.narrative.newsSources?.length > 0 && (
            <div style={{ marginTop: '3rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px', borderLeft: '4px solid var(--accent)', paddingLeft: '1rem' }}>
                News Echoes
              </h3>
              <div className="reddit-feed">
                {result.narrative.newsSources.map((news, i) => (
                  <div key={i} className="reddit-post" onClick={() => window.open(news.link, '_blank')}>
                    {/* OG Image */}
                    {news.thumbnail && (
                      <div className="post-media-modern">
                        <img
                          src={news.thumbnail}
                          alt=""
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="post-content-area">
                      {/* Source header */}
                      <div className="post-header-modern">
                        <div className="post-user-info">
                          {news.sourceDomain && (
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${news.sourceDomain}&sz=32`}
                              alt=""
                              width="16" height="16"
                              style={{ borderRadius: '4px' }}
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          )}
                          <span style={{ fontWeight: '700', color: '#d7dadc' }}>
                            {news.source || news.sourceDomain || 'News'}
                          </span>
                          <span>•</span>
                          <span>{new Date(news.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="post-more">•••</div>
                      </div>

                      {/* Title */}
                      <div className="post-title-modern">{news.title.replace(/ - [^-]+$/, '')}</div>

                      {/* Description */}
                      {news.description && (
                        <p style={{ fontSize: '0.8rem', color: '#818384', lineHeight: '1.4', marginBottom: '10px' }}>
                          {news.description.slice(0, 120)}{news.description.length > 120 ? '…' : ''}
                        </p>
                      )}


                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisDashboard;
