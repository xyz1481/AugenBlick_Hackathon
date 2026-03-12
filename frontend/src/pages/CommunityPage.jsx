import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import PostComposer from '../components/Community/PostComposer';
import PostFeed from '../components/Community/PostFeed';
import API_BASE_URL from '../api/config';

const CommunityPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch Posts Error:", err);
      setError("Failed to load global feed.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  return (
    <div className="community-page">
      <div className="community-container">
        <header className="community-header">
          <h1>Global Intelligence Community</h1>
          <p>Share strategic insights and verify claims via Reality AI</p>
        </header>

        <div className="community-content">
          <PostComposer onPostCreated={handlePostCreated} />

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading-state">Syncing with global nodes...</div>
          ) : (
            <PostFeed posts={posts} />
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
