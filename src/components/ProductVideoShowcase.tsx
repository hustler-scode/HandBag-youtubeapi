import { useEffect, useState } from "react";
import axios from "axios";

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
}

interface Props {
  productId: string;
  productName: string;
}

const ProductVideoShowcase = ({ productId, productName }: Props) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const fetchProductVideos = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:3000/api/youtube/product?id=${encodeURIComponent(productId)}&name=${encodeURIComponent(productName)}`
        );
        setVideos(response.data);
        setActiveIdx(0);
      } catch (error) {
        console.error("Error fetching product videos:", error);
      } finally {
        setLoading(false);
      }
    };
    if (productId || productName) {
      fetchProductVideos();
    }
  }, [productId, productName]);

  if (loading) {
    return (
      <div className="mt-20 border-t border-gray-100 pt-16 animate-pulse">
        <div className="h-8 bg-amber-800/10 rounded w-1/4 mb-8 mx-auto" />
        <div className="aspect-video max-w-4xl mx-auto bg-amber-800/5 rounded-3xl" />
      </div>
    );
  }

  if (videos.length === 0) return null;

  const activeVideo = videos[activeIdx];

  return (
    <div className="mt-24 border-t border-gray-100 pt-16">
      <h2 className="text-black text-4xl font-normal text-center mb-3 max-lg:text-3xl">
        Product Video Showcase &amp; Reviews
      </h2>
      <p className="text-amber-800/70 text-center text-xs font-sans tracking-[3px] mb-10 uppercase">
        Watch unboxings, reviews and styling guides
      </p>

      <div className="max-w-4xl mx-auto flex flex-col gap-0">
        {/* Premium bordered video frame */}
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            boxShadow: "0 0 0 1px rgba(146,64,14,0.15), 0 25px 60px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
            background: "#fff",
          }}
        >
          {/* Gold top accent stripe */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-700/50 to-transparent" />

          {/* Main video player */}
          <div
            className="aspect-video w-full overflow-hidden"
            style={{ borderBottom: "1px solid rgba(146,64,14,0.08)" }}
          >
            <iframe
              key={activeVideo.id}
              title={`Showcase video for ${productName}`}
              src={`https://www.youtube.com/embed/${activeVideo.id}`}
              className="w-full h-full border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Video metadata */}
          <div className="px-6 py-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-800 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full">
                {activeVideo.channelTitle}
              </span>
              {videos.length > 1 && (
                <span className="text-[11px] text-gray-400">
                  {activeIdx + 1} of {videos.length} videos
                </span>
              )}
            </div>
            <h3 className="text-xl font-serif text-black leading-snug">{activeVideo.title}</h3>
            {activeVideo.description && (
              <p className="text-gray-500 text-sm font-sans leading-relaxed line-clamp-2">
                {activeVideo.description}
              </p>
            )}
          </div>

          {/* Bottom accent */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-700/30 to-transparent" />
        </div>

        {/* Thumbnail playlist — shows only when multiple videos exist */}
        {videos.length > 1 && (
          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-[2.5px] text-gray-400 mb-3 px-1">
              More Videos
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {videos.map((v, idx) => (
                <button
                  key={v.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`relative group rounded-xl overflow-hidden aspect-video border-2 transition-all duration-200 text-left focus:outline-none ${
                    idx === activeIdx
                      ? "border-amber-700 shadow-md shadow-amber-800/15 scale-[0.99]"
                      : "border-transparent hover:border-amber-700/30 hover:shadow-sm"
                  }`}
                >
                  <img
                    src={v.thumbnail || `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`}
                    alt={v.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Active overlay */}
                  {idx === activeIdx ? (
                    <div className="absolute inset-0 bg-amber-900/20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 fill-white ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-center justify-center transition-colors duration-200">
                      <div className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <svg className="w-3.5 h-3.5 fill-amber-800 ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                  )}
                  {/* Title tooltip */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-[10px] text-white font-medium line-clamp-2 leading-tight">
                      {v.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductVideoShowcase;
