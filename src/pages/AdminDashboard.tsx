import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface ManagedVideo {
  id: number;
  video_id: string;
  title: string;
  description: string;
  channel_title: string;
  thumbnail: string;
  section: "featured" | "latest" | "product";
  product_id: string | null;
  created_at?: string;
}

interface Product {
  id: string;
  title: string;
  image: string;
}

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalVideos: number;
}

const API = "http://localhost:3000";

const SECTION_LABELS: Record<string, string> = {
  featured: "Featured Hero",
  latest: "Latest Trends",
  product: "Product Page",
};

const SECTION_COLORS: Record<string, string> = {
  featured: "bg-amber-700/20 text-amber-800 border-amber-700/30",
  latest: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  product: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
};

const emptyForm = {
  video_id: "",
  title: "",
  description: "",
  channel_title: "",
  thumbnail: "",
  section: "latest" as "featured" | "latest" | "product",
  product_id: "",
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "videos">("overview");
  const [videos, setVideos] = useState<ManagedVideo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({ totalProducts: 0, totalOrders: 0, totalVideos: 0 });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterSection, setFilterSection] = useState<string>("all");

  // Auth guard
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) { navigate("/login"); return; }
      const user = JSON.parse(stored);
      if (user?.role !== "admin") { navigate("/"); return; }
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [videosRes, productsRes, ordersRes] = await Promise.all([
        axios.get(`${API}/api/youtube/manage`),
        axios.get(`${API}/products`),
        axios.get(`${API}/orders`),
      ]);
      setVideos(videosRes.data);
      setProducts(productsRes.data);
      setStats({
        totalVideos: videosRes.data.length,
        totalProducts: productsRes.data.length,
        totalOrders: ordersRes.data.length,
      });
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Extract YouTube video ID from URL or plain ID
  const extractVideoId = (input: string): string => {
    const urlMatch = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (urlMatch) return urlMatch[1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
    return input.trim();
  };

  const handleFetchDetails = async () => {
    const videoId = extractVideoId(urlInput || form.video_id);
    if (!videoId) return;
    setFetchingDetails(true);
    try {
      const res = await axios.get(`${API}/api/youtube/details?videoId=${videoId}`);
      setForm((prev) => ({
        ...prev,
        video_id: res.data.video_id || videoId,
        title: res.data.title || prev.title,
        description: res.data.description || prev.description,
        channel_title: res.data.channel_title || prev.channel_title,
        thumbnail: res.data.thumbnail || prev.thumbnail,
      }));
      setUrlInput(videoId);
    } catch (err) {
      console.error("Failed to fetch video details:", err);
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleSave = async () => {
    if (!form.video_id || !form.title || !form.section) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        product_id: form.section === "product" && form.product_id ? form.product_id : null,
      };
      if (editingId !== null) {
        await axios.put(`${API}/api/youtube/manage/${editingId}`, payload);
      } else {
        await axios.post(`${API}/api/youtube/manage`, payload);
      }
      await loadAll();
      setForm(emptyForm);
      setUrlInput("");
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (v: ManagedVideo) => {
    setForm({
      video_id: v.video_id,
      title: v.title,
      description: v.description,
      channel_title: v.channel_title,
      thumbnail: v.thumbnail,
      section: v.section,
      product_id: v.product_id || "",
    });
    setUrlInput(v.video_id);
    setEditingId(v.id);
    setShowForm(true);
    setActiveTab("videos");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`${API}/api/youtube/manage/${id}`);
      await loadAll();
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const filteredVideos = filterSection === "all"
    ? videos
    : videos.filter((v) => v.section === filterSection);

  const getProductTitle = (productId: string | null) => {
    if (!productId) return null;
    return products.find((p) => p.id === productId)?.title || `Product #${productId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-800/30 border-t-amber-800 rounded-full animate-spin" />
          <p className="text-amber-900/70 font-medium">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-stone-900 text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-300/70 text-sm font-medium mb-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Administrator Panel
              </div>
              <h1 className="text-3xl font-light tracking-wide">Admin Dashboard</h1>
              <p className="text-amber-200/60 text-sm mt-1">Manage your store's videos, products, and content</p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-amber-200/80 hover:text-white text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Store
            </button>
          </div>

          {/* Tab Nav */}
          <div className="flex gap-1 mt-6 border-b border-white/10">
            {(["overview", "videos"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-sm font-medium capitalize transition-all duration-200 border-b-2 -mb-[1px] ${
                  activeTab === tab
                    ? "border-amber-400 text-amber-300"
                    : "border-transparent text-white/50 hover:text-white/80"
                }`}
              >
                {tab === "overview" ? "Overview" : "Manage Videos"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { label: "Total Products", value: stats.totalProducts, icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: "amber" },
                { label: "Total Orders", value: stats.totalOrders, icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z", color: "stone" },
                { label: "Custom Videos", value: stats.totalVideos, icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "rose" },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className={`bg-white rounded-2xl border border-${color}-100 shadow-sm p-6 flex items-center gap-5`}>
                  <div className={`w-12 h-12 rounded-xl bg-${color}-50 flex items-center justify-center flex-shrink-0`}>
                    <svg className={`w-6 h-6 text-${color}-700`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">{label}</p>
                    <p className="text-3xl font-light text-gray-900 mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Video Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Video Assignment Summary</h2>
              <div className="grid grid-cols-3 gap-4">
                {["featured", "latest", "product"].map((s) => {
                  const count = videos.filter((v) => v.section === s).length;
                  return (
                    <div key={s} className={`rounded-xl border px-4 py-3 ${SECTION_COLORS[s]}`}>
                      <p className="text-xs font-bold uppercase tracking-widest mb-1">{SECTION_LABELS[s]}</p>
                      <p className="text-2xl font-light">{count} video{count !== 1 ? "s" : ""}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => { setActiveTab("videos"); setShowForm(true); }}
                className="flex items-center gap-2 bg-amber-800 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Video
              </button>
            </div>
          </div>
        )}

        {/* VIDEOS TAB */}
        {activeTab === "videos" && (
          <div className="space-y-6">
            {/* Add / Edit Video Form */}
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
              <button
                onClick={() => {
                  if (showForm && editingId !== null) {
                    setForm(emptyForm); setUrlInput(""); setEditingId(null);
                  }
                  setShowForm((prev) => !prev);
                }}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-amber-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-800 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-900">
                    {editingId !== null ? "Edit Video" : "Add New Video"}
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showForm ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showForm && (
                <div className="border-t border-amber-100 px-6 py-6 space-y-5">
                  {/* URL / Video ID Fetch Row */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                      YouTube URL or Video ID
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=... or video ID"
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10 transition-all"
                      />
                      <button
                        onClick={handleFetchDetails}
                        disabled={fetchingDetails || !urlInput}
                        className="flex items-center gap-2 bg-amber-800 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
                      >
                        {fetchingDetails ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        )}
                        Fetch Details
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Title *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Video title"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10 transition-all"
                    />
                  </div>

                  {/* Channel + Thumbnail Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Channel Name</label>
                      <input
                        type="text"
                        value={form.channel_title}
                        onChange={(e) => setForm((p) => ({ ...p, channel_title: e.target.value }))}
                        placeholder="Channel title"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Thumbnail URL</label>
                      <input
                        type="text"
                        value={form.thumbnail}
                        onChange={(e) => setForm((p) => ({ ...p, thumbnail: e.target.value }))}
                        placeholder="https://..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10 transition-all"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      rows={3}
                      placeholder="Video description"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10 transition-all resize-none"
                    />
                  </div>

                  {/* Section + Product Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Section *</label>
                      <select
                        value={form.section}
                        onChange={(e) => setForm((p) => ({ ...p, section: e.target.value as "featured" | "latest" | "product", product_id: "" }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10 transition-all bg-white"
                      >
                        <option value="featured">Featured Hero</option>
                        <option value="latest">Latest Trends</option>
                        <option value="product">Product Page</option>
                      </select>
                    </div>
                    {form.section === "product" && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Link to Product</label>
                        <select
                          value={form.product_id}
                          onChange={(e) => setForm((p) => ({ ...p, product_id: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10 transition-all bg-white"
                        >
                          <option value="">— Select Product —</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Preview */}
                  {form.thumbnail && (
                    <div className="flex items-center gap-4">
                      <img
                        src={form.thumbnail}
                        alt="Thumbnail preview"
                        className="w-32 aspect-video rounded-lg object-cover border border-gray-200"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <div className="text-xs text-gray-500">Thumbnail preview</div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={saving || !form.video_id || !form.title}
                      className="flex items-center gap-2 bg-amber-800 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {editingId !== null ? "Save Changes" : "Add Video"}
                    </button>
                    <button
                      onClick={() => { setForm(emptyForm); setUrlInput(""); setEditingId(null); setShowForm(false); }}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Video List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-medium text-gray-900">All Managed Videos ({videos.length})</h2>
                {/* Filter Tabs */}
                <div className="flex gap-1">
                  {[{ key: "all", label: "All" }, { key: "featured", label: "Featured" }, { key: "latest", label: "Latest" }, { key: "product", label: "Product" }].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFilterSection(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filterSection === key
                          ? "bg-amber-800 text-white"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredVideos.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-400">
                  <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.847v6.306a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p>No videos in this section</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filteredVideos.map((v) => (
                    <div key={v.id} className="flex items-start gap-4 px-6 py-5 hover:bg-gray-50/50 transition-colors group">
                      {/* Thumbnail */}
                      <div className="relative flex-shrink-0 w-28 aspect-video rounded-lg overflow-hidden bg-gray-100">
                        {v.thumbnail ? (
                          <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                        ) : (
                          <img
                            src={`https://img.youtube.com/vi/${v.video_id}/mqdefault.jpg`}
                            alt={v.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {/* YouTube play overlay */}
                        <a
                          href={`https://www.youtube.com/watch?v=${v.video_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors duration-200"
                        >
                          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                            <svg className="w-4 h-4 fill-white ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          </div>
                        </a>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${SECTION_COLORS[v.section]}`}>
                                {SECTION_LABELS[v.section]}
                              </span>
                              {v.section === "product" && v.product_id && (
                                <span className="text-[10px] text-gray-400 font-medium">
                                  → {getProductTitle(v.product_id)}
                                </span>
                              )}
                            </div>
                            <h3 className="font-medium text-gray-900 text-sm leading-snug line-clamp-2">{v.title}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{v.channel_title} · ID: {v.video_id}</p>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleEdit(v)}
                              className="text-xs font-medium text-amber-800 hover:text-amber-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-amber-50"
                            >
                              Edit
                            </button>
                            {deleteConfirmId === v.id ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleDelete(v.id)}
                                  className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(v.id)}
                                className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                        {v.description && (
                          <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">{v.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
