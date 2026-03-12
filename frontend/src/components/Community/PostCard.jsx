import React from 'react';
import AIResponseCard from './AIResponseCard';

const PostCard = ({ post }) => {
  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-meta-left">
          <span className="anonymous-badge">ANONYMOUS ANALYST</span>
          <span className="location-badge">{post.country || 'India'}</span>
        </div>
        <span className="timestamp">{post.createdAt ? new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'} • {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Today'}</span>
      </div>
      <div className="post-content">
        {post.content}
      </div>
      <div className="post-status">
        <span className={`status-badge ${(post.moderationStatus || 'SAFE').toLowerCase()}`}>
          AI-MODERATED: {post.moderationStatus || 'SAFE'}
        </span>
      </div>

      {post.isVerified && post.aiResponse && (
        <AIResponseCard
          aiResponse={post.aiResponse}
          aiSources={post.aiSources}
        />
      )}
    </div>
  );
};

export default PostCard;
