"use client";

import { useEffect, useState, useRef } from "react";
import { fetchAlbum, API_BASE } from "../../../lib/api";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import {
  HeartIcon,
  ArrowDownTrayIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";

import { Playfair_Display, Inter } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

type AlbumPageProps = {
  params: Promise<{ id: string }>;
};

export default function AlbumPage({ params }: AlbumPageProps) {
  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // ❤️ liked photos
  const [likedPhotos, setLikedPhotos] = useState<string[]>([]);

  // gallery ref for "View Gallery" scroll
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const scrollToGallery = () => {
    if (galleryRef.current) {
      galleryRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    params.then(({ id }) => {
      fetchAlbum(id).then((data) => {
        setAlbum(data);
        setLoading(false);
        if (!data.is_protected) {
          setUnlocked(true);
        }
      });
    });
  }, [params]);

  async function handleUnlock() {
    if (!album) return;
    try {
      const res = await fetch(`${API_BASE}/api/albums/${album.id}/unlock`, {
        method: "POST",
        body: new URLSearchParams({ password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.unlocked) {
          setUnlocked(true);
          setAlbum(data);
          setError("");
          setPassword("");
        } else {
          setError("Invalid password");
          setPassword("");
        }
      } else {
        setError("Invalid password");
        setPassword("");
      }
    } catch (err) {
      setError("Something went wrong");
      setPassword("");
    }
  }

  // ❤️ Toggle like
  function toggleLike(id: string) {
    setLikedPhotos((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  }

  // 📥 Download single photo
  function handleDownloadOne(filePath: string) {
    const a = document.createElement("a");
    a.href = `${API_BASE}/${filePath}`;
    a.download = filePath.split("/").pop() || "photo.jpg";
    a.click();
  }

  // 📥 Download whole album
  const handleDownloadAll = async () => {
    if (!album || !album.assets.length) return;
    try {
      const zipUrl = `${API_BASE}/api/albums/${album.id}/download`;
      const res = await fetch(zipUrl);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${album.title.replace(/\s+/g, "_")}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
        return;
      }
      // fallback: first photo
      handleDownloadOne(album.assets[0].file_path);
    } catch (err) {
      console.error("Download failed", err);
      alert("Download not available right now.");
    }
  };

  // 🔗 Share album
  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: album.title,
        text: `Check out this photo album: ${album.title}`,
        url: shareUrl,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert("Link copied to clipboard!");
      });
    }
  };

  // 📋 Copy shareable link
  const copyShareLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert("Shareable link copied to clipboard!");
      setShowShareModal(false);
    });
  };

  if (loading) return <p className="p-8 text-gray-600">Loading album...</p>;
  if (!album) return <p className="p-8 text-gray-600">Album not found</p>;

  // 🔒 Password gate
  if (album.is_protected && !unlocked) {
    return (
      <main
        className={`${inter.className} flex items-center justify-center min-h-screen bg-white text-gray-900 p-6`}
      >
        <div className="w-full max-w-md p-8 border border-gray-200 shadow-sm">
          <h1
            className={`${playfair.className} text-2xl font-semibold mb-3 text-center`}
          >
            {album.title}
          </h1>
          <p className="mb-6 text-gray-600 text-center">
            This album is password protected.
          </p>

          <div className="flex items-center gap-2 mb-4">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="flex-1 px-4 py-2 text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            <label className="flex items-center text-sm text-gray-500">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                className="mr-1 accent-blue-500"
              />
              Show
            </label>
          </div>

          <button
            onClick={handleUnlock}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 font-medium transition"
          >
            Unlock
          </button>

          {error && <p className="text-red-600 mt-3 text-center">{error}</p>}
        </div>
      </main>
    );
  }

  // 🖼️ Normal gallery
  const featuredPhoto =
    album.assets.length > 0
      ? `${API_BASE}/${album.assets[0].file_path}`
      : "/placeholder.jpg";

  return (
    <main
      className={`${inter.className} min-h-screen bg-white text-gray-900 scroll-smooth`}
    >
      {/* Fixed Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-3 flex justify-between items-center">
        <div className={`${playfair.className} text-lg font-medium`}>
          {album.title}
        </div>
        <div className="flex gap-4 text-gray-600 text-sm">
          <button className="flex items-center gap-1 hover:text-black">
            <HeartIcon className="w-5 h-5" /> Favorites
          </button>
          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-1 hover:text-black"
          >
            <ArrowDownTrayIcon className="w-5 h-5" /> Download All
          </button>
          <button 
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1 hover:text-black"
          >
            <ShareIcon className="w-5 h-5" /> Share
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative w-full h-screen overflow-hidden">
        <img
          src={featuredPhoto}
          alt="Featured"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 border border-white" />
        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center">
          <h1
            className={`${playfair.className} text-5xl sm:text-6xl font-light tracking-wide text-white mb-4`}
          >
            {album.title}
          </h1>
          <p
            className={`${inter.className} text-lg tracking-widest text-gray-200 uppercase mb-6`}
          >
            {new Date().toLocaleDateString()}
          </p>
          <button
            onClick={scrollToGallery}
            className={`${inter.className} px-6 py-2 border border-white text-white uppercase tracking-wide hover:bg-white hover:text-black transition`}
          >
            View Gallery
          </button>
        </div>
      </div>

      {/* Masonry Gallery */}
      <div ref={galleryRef} className="w-full px-2 sm:px-4 py-20">
        {album.assets.length === 0 ? (
          <p className="text-center text-gray-500 italic py-12 border border-dashed border-gray-300">
            No photos yet. 📷
          </p>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {album.assets.map((asset: any, idx: number) => (
              <div key={asset.id} className="relative group">
                {/* Image */}
                <img
                  src={`${API_BASE}/${asset.file_path}`}
                  alt=""
                  className="w-full h-auto cursor-pointer hover:opacity-90 transition"
                  onClick={() => setLightboxIndex(idx)}
                />
                {/* Hover overlay with Like + Download */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex justify-end items-start p-2 gap-2">
                  {/* Like */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(asset.id);
                    }}
                    className="bg-white/80 hover:bg-white text-gray-800 rounded p-1 shadow"
                  >
                    {likedPhotos.includes(asset.id) ? (
                      <HeartIcon className="w-5 h-5 text-red-500 fill-red-500" />
                    ) : (
                      <HeartIcon className="w-5 h-5" />
                    )}
                  </button>
                  {/* Download */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadOne(asset.file_path);
                    }}
                    className="bg-white/80 hover:bg-white text-gray-800 rounded p-1 shadow"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          open={lightboxIndex !== null}
          index={lightboxIndex}
          close={() => setLightboxIndex(null)}
          slides={album.assets.map((asset: any) => ({
            src: `${API_BASE}/${asset.file_path}`,
          }))}
        />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Share Album</h3>
            <p className="text-gray-600 mb-4">
              Share this album with others using the link below:
            </p>
            <div className="bg-gray-100 p-3 rounded-lg mb-4">
              <code className="text-sm text-gray-700 break-all">
                {typeof window !== 'undefined' ? window.location.href : ''}
              </code>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={copyShareLink}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Copy Link
              </button>
              <button
                onClick={handleShare}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Share
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
