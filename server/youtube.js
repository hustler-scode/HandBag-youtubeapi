import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour cache duration

// Simple in-memory cache
const videoCache = new Map();

// Premium mock handbag videos for fallback
const mockFeaturedVideo = {
  id: "LgdJ1x0u74Q", // Real high-quality handbag review video ID
  title: "The Ultimate Luxury Handbag Guide - Timeless Investment Bags",
  description: "Diving deep into the world of premium leather handbags, classic designer pieces, and functional totes. Find the perfect investment bag that fits your daily style and stands the test of time.",
  thumbnail: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800",
  channelTitle: "Luxe Fashion Guide",
  publishedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
};

const mockLatestVideos = [
  {
    id: "2k9G3lH11xU",
    title: "Top 7 Handbag Trends to Watch This Season",
    description: "From canvas beach totes to mini evening clutches, here are the trending handbag styles taking over the fashion world right now.",
    thumbnail: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=800",
    channelTitle: "Vogue Trends",
    publishedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "m0Qv3hW5hN8",
    title: "What's In My Bag? Everyday Leather Tote Essentials",
    description: "An honest walkthrough of what actually fits in a premium structured leather tote bag. Reviewing wear and tear, pocket utility, and overall storage.",
    thumbnail: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800",
    channelTitle: "Daily Chic",
    publishedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "qgBq1oEw73U",
    title: "How to Clean and Care for Your Luxury Leather Bags",
    description: "Extend the life of your premium handbag with these simple maintenance, storage, and leather conditioning tips.",
    thumbnail: "https://images.unsplash.com/photo-1598532187856-39597ff4a30e?auto=format&fit=crop&q=80&w=800",
    channelTitle: "The Bag Care Specialist",
    publishedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
  },
];

const mockProductSpecificVideos = {
  "Aurelia Leather Tote": [
    {
      id: "9U5S_iVn0mY",
      title: "Seeding Review: Aurelia Classic Italian Leather Tote",
      description: "Unboxing, leather quality check, and style guide for the Aurelia Leather Tote. Let's see if this structured tote lives up to the premium hype.",
      thumbnail: "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&q=80&w=800",
      channelTitle: "The Handbag Reviewer",
    }
  ],
  "Ophelia Crossbody Bag": [
    {
      id: "5J2Z4u-LzFw",
      title: "Ophelia Quilted Crossbody Bag Review - What Fits?",
      description: "A close-up look at the quilted gold-chain crossbody bag. Testing the size with phone, cards, lipstick and everyday carry items.",
      thumbnail: "https://images.unsplash.com/photo-1566150905458-1bf1fc15aee9?auto=format&fit=crop&q=80&w=800",
      channelTitle: "Elegant Carry",
    }
  ],
  "Seraphina Shoulder Bag": [
    {
      id: "Q2kG3lHx2yU",
      title: "Minimalist Style: Seraphina Leather Shoulder Bag Wear Test",
      description: "Is the Seraphina Shoulder Bag comfortable for daily wear? Under-arm fit check, leather flexibility, and outfit ideas.",
      thumbnail: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800",
      channelTitle: "Styled By Sarah",
    }
  ],
  "Solaria Straw Clutch": [
    {
      id: "LgdJ1x0u74Q",
      title: "Summer Essentials: Woven Straw Clutches & Bags",
      description: "How to style a straw clutch for beach vacations and summer sundown events. The ultimate review of the Solaria clutch.",
      thumbnail: "https://images.unsplash.com/photo-1524498250077-3a9f0c578520?auto=format&fit=crop&q=80&w=800",
      channelTitle: "Summer Edit",
    }
  ],
};

// Generic product video mock creator
function generateMockProductVideos(productName) {
  if (mockProductSpecificVideos[productName]) {
    return mockProductSpecificVideos[productName];
  }
  return [
    {
      id: "LgdJ1x0u74Q",
      title: `Chic Style Guide: Styling the ${productName}`,
      description: `Discover how to pair the ${productName} with different outfits. A comprehensive review and styling guide.`,
      thumbnail: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800",
      channelTitle: "Style & Bags TV",
    }
  ];
}

// Fetch YouTube Data Helper
async function searchYouTube(query, maxResults = 3) {
  if (!YOUTUBE_API_KEY) {
    console.log(`No YouTube API key provided. Using mock data for query: "${query}"`);
    return null;
  }

  const cacheKey = `${query}:${maxResults}`;
  const cached = videoCache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION_MS)) {
    console.log(`Returning cached YouTube results for query: "${query}"`);
    return cached.data;
  }

  try {
    console.log(`Requesting YouTube API for: "${query}"...`);
    const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        part: "snippet",
        q: query,
        type: "video",
        maxResults: maxResults,
        key: YOUTUBE_API_KEY,
      },
    });

    const videos = response.data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }));

    videoCache.set(cacheKey, {
      timestamp: Date.now(),
      data: videos,
    });

    return videos;
  } catch (error) {
    console.error(`YouTube API request failed for "${query}":`, error.message);
    // Fall back to mock
    return null;
  }
}

export async function getFeaturedVideo() {
  const videos = await searchYouTube("designer handbag collection luxury investment bags review", 1);
  if (videos && videos.length > 0) {
    return videos[0];
  }
  return mockFeaturedVideo;
}

export async function getLatestVideos() {
  const videos = await searchYouTube("latest handbag collection style trends review", 3);
  if (videos && videos.length >= 3) {
    return videos;
  }
  return mockLatestVideos;
}

export async function getProductVideos(productName) {
  const videos = await searchYouTube(`${productName} handbag unboxing review show`, 1);
  if (videos && videos.length > 0) {
    return videos;
  }
  return generateMockProductVideos(productName);
}
