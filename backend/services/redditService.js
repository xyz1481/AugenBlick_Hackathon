const axios = require('axios');

/**
 * Reddit Service — public JSON API for rich post data (images + videos)
 */
const getNarrativeFromReddit = async (query) => {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=all&limit=12`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      timeout: 10000
    });

    const items = response.data?.data?.children;
    if (!items || items.length === 0) {
      console.warn('[Reddit] No posts found in JSON response.');
      return { source: 'Reddit', posts: [] };
    }

    const posts = items.map(({ data: post }) => {
      // ── Image Extraction (4-tier priority) ──────────────────────────────
      let thumbnail = null;

      // 1. Best quality: source preview from Reddit CDN
      if (post.preview?.images?.[0]?.source?.url) {
        thumbnail = post.preview.images[0].source.url.replace(/&amp;/g, '&');
      }

      // 2. Largest resized resolution 
      if (!thumbnail && post.preview?.images?.[0]?.resolutions?.length > 0) {
        const resolutions = post.preview.images[0].resolutions;
        thumbnail = resolutions[resolutions.length - 1].url.replace(/&amp;/g, '&');
      }

      // 3. Post thumbnail field (filter out Reddit's placeholder strings)
      if (!thumbnail && post.thumbnail &&
          !['self', 'default', 'nsfw', 'spoiler', 'image', ''].includes(post.thumbnail) &&
          post.thumbnail.startsWith('http')) {
        thumbnail = post.thumbnail;
      }

      // 4. Gallery posts: grab first image from media_metadata
      if (!thumbnail && post.media_metadata) {
        const firstKey = Object.keys(post.media_metadata)[0];
        const meta = post.media_metadata[firstKey];
        if (meta?.s?.u) thumbnail = meta.s.u.replace(/&amp;/g, '&');
      }

      // ── Video Extraction ─────────────────────────────────────────────────
      let videoUrl = null;

      // Reddit-hosted video (v.redd.it)
      if (post.is_video && post.media?.reddit_video?.fallback_url) {
        videoUrl = post.media.reddit_video.fallback_url.replace(/&amp;/g, '&');
      }

      // Embedded/YouTube/etc via secure_media_embed
      if (!videoUrl && post.secure_media?.oembed?.thumbnail_url) {
        // It's an embed (YouTube etc.) — use thumbnail and link out
        if (!thumbnail) {
          thumbnail = post.secure_media.oembed.thumbnail_url;
        }
      }

      const subreddit = post.subreddit || 'reddit';
      const postId = post.id || '';
      const embedUrl = postId
        ? `https://www.reddit.com/r/${subreddit}/comments/${postId}/?embed=true&theme=dark`
        : null;

      return {
        title: post.title,
        content: post.selftext || '',
        url: `https://reddit.com${post.permalink}`,
        embedUrl,
        thumbnail,
        videoUrl,
        author: `r/${subreddit}`,
        upvotes: post.ups || 0,
        num_comments: post.num_comments || 0,
        ups: String(post.ups || 0),
        isVideo: post.is_video || false,
      };
    });

    const withImages = posts.filter(p => p.thumbnail).length;
    const withVideos = posts.filter(p => p.videoUrl).length;
    console.log(`[Reddit] Fetched ${posts.length} posts | ${withImages} with images | ${withVideos} with videos`);

    return { source: 'Reddit', query, posts, timestamp: new Date() };

  } catch (error) {
    console.error('Reddit Service Error:', error.message);
    return { source: 'Reddit', posts: [] };
  }
};

module.exports = { getNarrativeFromReddit };
