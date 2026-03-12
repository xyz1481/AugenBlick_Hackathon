import React, { useState } from 'react';
import API_BASE_URL from '../../api/config';

const PostComposer = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsPosting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Post failed');
      }

      onPostCreated(data);
      setContent('');
    } catch (err) {
      console.error("Post Submission Error:", err);
      setError(err.message);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="post-composer">
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Share an insight... (e.g. @reality: news...)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isPosting}
        />
        <div className="composer-footer">
          <p className="hint">Try: "@reality: India and Pakistan trade talk updates"</p>
          <button type="submit" disabled={isPosting || !content.trim()}>
            {isPosting ? 'Moderating...' : 'Post Insight'}
          </button>
        </div>
      </form>
      {error && <div className="post-error">{error}</div>}
    </div>
  );
};

export default PostComposer;
