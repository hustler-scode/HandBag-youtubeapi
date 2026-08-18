import { useEffect, useState } from "react";
import axios from "axios";

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
}

const HomepageVideoSection = () => {
  const [video, setVideo] = useState<Video | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedVideo = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/youtube/featured");
        setVideo(response.data);
      } catch (error) {
        console.error("Error fetching featured video:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedVideo();
  }, []);

  if (loading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-5 mt-20">
        <div className="animate-pulse rounded-3xl bg-gradient-to-r from-amber-900/10 to-stone-200/40 border border-amber-800/10 h-80 w-full" />
      </div>
    );
  }

  if (!video) return null;

  return (
    <div className="max-w-screen-2xl mx-auto px-5 mt-24">
      <h2 className="text-black text-5xl font-normal tracking-[1.56px] max-sm:text-4xl mb-10">
        Featured Showcase
      </h2>

      {/* Premium container with mesh glow */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-700/30 shadow-2xl">
        {/* Ambient radial glow background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 20% 50%, rgba(146,64,14,0.07) 0%, transparent 70%), radial-gradient(ellipse 60% 60% at 85% 20%, rgba(214,163,84,0.05) 0%, transparent 60%), linear-gradient(135deg, #fdf8f2 0%, #faf5ed 50%, #f5ede0 100%)",
          }}
        />

        <div className="relative flex flex-col lg:flex-row items-center gap-8 p-8 lg:p-12">
          {/* Left: Text content */}
          <div className="w-full lg:w-1/2 flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-700" />
              <span className="text-xs font-bold uppercase tracking-[3px] text-amber-800/80">
                Featured Video
              </span>
            </div>
            <h3 className="text-3xl lg:text-4xl font-serif text-gray-900 leading-tight">
              {video.title}
            </h3>
            <p className="text-gray-600 text-base leading-relaxed font-sans line-clamp-3">
              {video.description}
            </p>

            {/* Channel badge */}
            <div className="flex items-center gap-3 mt-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-800 to-amber-950 flex items-center justify-center text-white text-xs font-bold shadow-md flex-shrink-0">
                {video.channelTitle.charAt(0)}
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Channel</p>
                <p className="text-sm font-semibold text-gray-800">{video.channelTitle}</p>
              </div>
            </div>

            {/* Watch button */}
            <button
              onClick={() => setIsOpen(true)}
              className="mt-2 self-start flex items-center gap-3 bg-amber-800 hover:bg-amber-700 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-amber-800/25 hover:-translate-y-0.5 group"
            >
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              Watch Now
            </button>
          </div>

          {/* Right: Thumbnail with double-border premium frame */}
          <div className="w-full lg:w-1/2 relative">
            {/* Outer frame glow */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-amber-700/20 via-transparent to-amber-900/10 blur-sm" />
            {/* Double border wrapper */}
            <div
              onClick={() => setIsOpen(true)}
              className="relative group cursor-pointer rounded-2xl overflow-hidden aspect-video border-2 border-amber-700/25 shadow-xl"
              style={{ boxShadow: "0 0 0 1px rgba(146,64,14,0.08), 0 20px 60px rgba(0,0,0,0.15)" }}
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent group-hover:from-black/60 transition-all duration-300" />

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/95 text-amber-800 flex items-center justify-center shadow-2xl transition-all duration-300 transform group-hover:scale-110 group-hover:bg-white backdrop-blur-sm">
                  <svg className="w-8 h-8 fill-current ml-1" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              {/* Bottom caption bar */}
              <div className="absolute bottom-0 left-0 right-0 px-5 py-4 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
                <span className="text-white text-xs font-medium truncate drop-shadow">{video.title}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Player */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors outline-none"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="aspect-video w-full">
              <iframe
                title={video.title}
                src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
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

export default HomepageVideoSection;
