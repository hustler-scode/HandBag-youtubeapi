import { useEffect, useState, useMemo } from "react";
import axios from "axios";

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

const FILTER_KEYWORDS: Record<string, string[]> = {
  "All Guides": [],
  "Reviews": ["review", "unboxing", "worth it", "test"],
  "Styling": ["style", "styling", "outfit", "wear", "fashion", "trend"],
  "Care Guides": ["clean", "care", "maintain", "condition", "storage"],
};

const LatestVideosSection = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All Guides");

  useEffect(() => {
    const fetchLatestVideos = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/youtube/latest");
        setVideos(response.data);
      } catch (error) {
        console.error("Error fetching latest videos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLatestVideos();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const filteredVideos = useMemo(() => {
    const keywords = FILTER_KEYWORDS[activeFilter];
    if (!keywords || keywords.length === 0) return videos;
    return videos.filter((v) => {
      const text = `${v.title} ${v.description}`.toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    });
  }, [videos, activeFilter]);

  if (loading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-5 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="space-y-4">
              <div className="aspect-video bg-amber-800/10 rounded-2xl" />
              <div className="h-4 bg-amber-800/10 rounded w-3/4" />
              <div className="h-3 bg-amber-800/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) return null;

  return (
    <div className="max-w-screen-2xl mx-auto px-5 mt-24 mb-24">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <h2 className="text-black text-5xl font-normal tracking-[1.56px] max-sm:text-4xl">
          Latest Bag &amp; Style Guides
        </h2>

        {/* Filter buttons */}
        <div className="flex gap-2 flex-wrap">
          {Object.keys(FILTER_KEYWORDS).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 whitespace-nowrap ${
                activeFilter === filter
                  ? "bg-amber-800 border-amber-800 text-white shadow-md shadow-amber-800/20"
                  : "bg-white border-gray-200 text-gray-600 hover:border-amber-700/40 hover:text-amber-800"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Video Grid — up to 6 cards */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.847v6.306a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p>No videos found for this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.slice(0, 6).map((video, idx) => (
            <div
              key={video.id}
              onClick={() => setActiveVideoId(video.id)}
              className="group flex flex-col cursor-pointer rounded-2xl overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1"
              style={{
                boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(146,64,14,0.08), inset 0 0 0 1px rgba(255,255,255,0.8)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)";
              }}
            >
              {/* Thumbnail */}
              <div className="relative overflow-hidden aspect-video bg-gray-100">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Dark overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors duration-300" />

                {/* YouTube red hover badge — top left */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 shadow-lg">
                  <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Play</span>
                </div>

                {/* Video index badge */}
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/50 text-white text-[10px] font-bold flex items-center justify-center backdrop-blur-sm">
                  {String(idx + 1).padStart(2, "0")}
                </div>

                {/* Center play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/95 text-amber-800 flex items-center justify-center shadow-xl transform scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                    <svg className="w-6 h-6 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Info card */}
              <div className="p-4 flex flex-col gap-2 flex-grow border-t border-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-800/80">
                    {video.channelTitle}
                  </span>
                  <span className="text-[11px] text-gray-400">{formatDate(video.publishedAt)}</span>
                </div>
                <h3 className="text-base font-serif text-gray-900 leading-snug group-hover:text-amber-900 transition-colors duration-300 line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                  {video.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Player */}
      {activeVideoId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setActiveVideoId(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVideoId(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors outline-none"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="aspect-video w-full">
              <iframe
                title="Latest Video Player"
                src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LatestVideosSection;
