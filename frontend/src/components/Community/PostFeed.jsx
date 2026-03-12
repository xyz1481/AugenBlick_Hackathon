import React from 'react';
import PostCard from './PostCard';

const PostFeed = ({ posts }) => {
  if (posts.length === 0) {
    return <div className="empty-feed">No insights shared yet. Be the first to analyze.</div>;
  }

  return (
    <div className="post-feed">
      {posts.map(post => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
};

export default PostFeed;
