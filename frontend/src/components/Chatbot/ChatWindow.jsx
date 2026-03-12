import React from 'react';
import ResponseCard from './ResponseCard';

const ChatWindow = ({ messages, isThinking, chatEndRef, reasoningPanel }) => {
  return (
    <div className="chat-window">
      {messages.length === 0 && (
        <div className="chat-empty-state">
          <div className="strategic-orb"></div>
          <h2>Reality Intelligence Agent</h2>
          <p>System ready. Select analysis mode to begin processing geopolitical signals.</p>
        </div>
      )}

      {messages.map((msg, idx) => (
        <div key={idx} className={`message-wrapper ${msg.role}`}>
          <div className="message-icon">
            {msg.role === 'user' ? '👤' : '🛡️'}
          </div>
          <div className="message-content">
            {msg.isIntelReport ? (
              <ResponseCard report={msg.content} />
            ) : (
              <div className="message-text">{msg.content}</div>
            )}
            <span className="message-time">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      ))}

      {isThinking && (
        <div className="assistant-status-container">
          <div className="message-wrapper assistant thinking">
            <div className="message-icon pulse">🛡️</div>
            <div className="message-content">
              <div className="thinking-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
          {reasoningPanel}
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  );
};

export default ChatWindow;
