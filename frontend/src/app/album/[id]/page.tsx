"use client";

import { useEffect, useState, useRef } from "react";
import { fetchAlbum, API_BASE } from "../../../lib/api";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import {
  HeartIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

import { Playfair_Display, Inter, Lato } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});
const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
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
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // ❤️ liked photos
  const [likedPhotos, setLikedPhotos] = useState<string[]>([]);
  const [sortByLiked, setSortByLiked] = useState(false);

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

  // Sort photos by liked status
  const sortedAssets = album && album.assets ? (sortByLiked 
    ? [...album.assets].sort((a, b) => {
        const aLiked = likedPhotos.includes(a.id);
        const bLiked = likedPhotos.includes(b.id);
        if (aLiked && !bLiked) return -1;
        if (!aLiked && bLiked) return 1;
        return 0;
      })
    : album.assets) : [];

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
        a.download = `${album.title.replace(/\s+/g, "_")}_full_album.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
        setShowDownloadModal(false);
        return;
      }
      // fallback: first photo
      handleDownloadOne(album.assets[0].file_path);
    } catch (err) {
      console.error("Download failed", err);
      alert("Download not available right now.");
    }
  };

  // 📥 Download liked images only
  const handleDownloadLiked = async () => {
    if (!album || !album.assets.length || likedPhotos.length === 0) {
      alert("No liked images to download.");
      return;
    }
    
    try {
      // Create a temporary form to send liked image IDs
      const formData = new FormData();
      formData.append('liked_ids', JSON.stringify(likedPhotos));
      
      const res = await fetch(`${API_BASE}/api/albums/${album.id}/download-liked`, {
        method: 'POST',
        body: formData,
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${album.title.replace(/\s+/g, "_")}_liked_images.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
        setShowDownloadModal(false);
        return;
      }
      
      // Fallback: download liked images individually
      alert("Zip download not available. Downloading images individually...");
      likedPhotos.forEach(assetId => {
        const asset = album.assets.find((a: any) => a.id === assetId);
        if (asset) {
          handleDownloadOne(asset.file_path);
        }
      });
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
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className={`${playfair.className} text-3xl font-normal tracking-wide text-gray-900 mb-3`}>
              {album.title}
            </h1>
            <p className="text-gray-500 text-sm uppercase tracking-widest">
              Protected Gallery
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-8">
            <p className="text-gray-600 mb-6 text-center text-sm">
              This gallery is password protected. Please enter the password to continue.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="flex-1 px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:outline-none text-sm"
                />
                <label className="flex items-center text-xs text-gray-500 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={() => setShowPassword(!showPassword)}
                    className="mr-2 accent-gray-600"
                  />
                  Show
                </label>
              </div>

              <button
                onClick={handleUnlock}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 font-medium transition-colors rounded-lg text-sm"
              >
                Access Gallery
              </button>

              {error && (
                <p className="text-red-600 text-center text-sm mt-3">{error}</p>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 🖼️ Normal gallery
  const featuredPhoto =
    album && album.assets && album.assets.length > 0
      ? `${API_BASE}/${album.assets[0].file_path}`
      : "/placeholder.jpg";

  return (
    <main
      className={`${inter.className} min-h-screen bg-white text-gray-900`}
    >
      {/* Professional Gallery Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            {/* Left: Album Info */}
            <div>
              <h1 className={`${playfair.className} text-2xl font-normal tracking-wide text-gray-900`}>
                {album.title.toUpperCase()}
              </h1>
              <p className={`${lato.className} text-sm font-light text-gray-600`}>
                PHOTO GALLERY
              </p>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setSortByLiked(!sortByLiked)}
                className={`${lato.className} text-sm font-light transition-colors ${
                  sortByLiked ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {sortByLiked ? 'SHOW ALL' : 'SORT BY LIKED'}
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowDownloadModal(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  title="Download Options"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setShowShareModal(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  title="Share Gallery"
                >
                  <ShareIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Cover Image */}
      {album.assets.length > 0 && (
        <div className="relative w-full h-screen overflow-hidden">
          <img
            src={featuredPhoto}
            alt="Featured"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <h1 className={`${playfair.className} text-5xl sm:text-6xl font-normal tracking-wide text-white mb-6`}>
              {album.title.toUpperCase()}
            </h1>
            <p className={`${lato.className} text-lg font-light text-white/90 uppercase tracking-widest mb-8`}>
              PHOTO GALLERY
            </p>
            <button
              onClick={scrollToGallery}
              className={`${lato.className} px-8 py-3 border border-white text-white uppercase tracking-wide hover:bg-white hover:text-gray-900 transition-all duration-300 font-light`}
            >
              View Gallery
            </button>
          </div>
        </div>
      )}

      {/* Professional Gallery Grid */}
      <div ref={galleryRef} className="pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {!album || !album.assets || album.assets.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className={`${playfair.className} text-xl font-normal text-gray-900 mb-2`}>No images yet</h3>
              <p className={`${lato.className} text-gray-500 text-sm`}>Images will appear here once they're added to this gallery.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedAssets.map((asset: any, idx: number) => {
                const originalIndex = album.assets.findIndex((a: any) => a.id === asset.id);
                return (
                  <div key={asset.id} className="group relative">
                    <div 
                      className="relative cursor-pointer overflow-hidden bg-gray-50"
                      onClick={() => setLightboxIndex(originalIndex)}
                    >
                      <img
                        src={`${API_BASE}/${asset.file_path}`}
                        alt=""
                        className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                      
                      {/* Professional overlay with action buttons */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-4 right-4 flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(asset.id);
                            }}
                            className={`p-2 rounded-full shadow-lg transition-colors ${
                              likedPhotos.includes(asset.id) 
                                ? 'bg-red-500 text-white' 
                                : 'bg-white/90 backdrop-blur-sm text-gray-800 hover:bg-white'
                            }`}
                          >
                            <HeartIcon className={`w-4 h-4 ${likedPhotos.includes(asset.id) ? 'fill-current' : ''}`} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadOne(asset.file_path);
                            }}
                            className="p-2 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full shadow-lg hover:bg-white transition-colors"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowShareModal(true);
                            }}
                            className="p-2 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full shadow-lg hover:bg-white transition-colors"
                          >
                            <ShareIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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

      {/* Clean Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
            <h3 className={`${playfair.className} text-2xl font-normal text-gray-900 mb-6 text-center`}>
              Share Gallery
            </h3>
            <p className="text-gray-600 mb-6 text-center text-sm">
              Share this gallery with others using the link below
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <code className="text-xs text-gray-700 break-all">
                {typeof window !== 'undefined' ? window.location.href : ''}
              </code>
            </div>
            <div className="flex gap-3">
              <button
                onClick={copyShareLink}
                className="flex-1 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                Copy Link
              </button>
              <button
                onClick={handleShare}
                className="flex-1 bg-gray-100 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Share
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Download Options Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
            <h3 className={`${playfair.className} text-2xl font-normal text-gray-900 mb-6 text-center`}>
              Download Options
            </h3>
            <p className="text-gray-600 mb-6 text-center text-sm">
              Choose what you'd like to download
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleDownloadAll}
                className="w-full bg-gray-900 text-white px-6 py-4 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium flex items-center justify-center gap-3"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Download Full Album ({album?.assets?.length || 0} images)
              </button>
              
              <button
                onClick={handleDownloadLiked}
                disabled={likedPhotos.length === 0}
                className={`w-full px-6 py-4 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-3 ${
                  likedPhotos.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                <HeartIcon className="w-5 h-5" />
                Download Liked Images ({likedPhotos.length} images)
              </button>
            </div>
            
            <button
              onClick={() => setShowDownloadModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
