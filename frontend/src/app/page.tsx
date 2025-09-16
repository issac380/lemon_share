"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAlbums, API_BASE } from "../lib/api";
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

export default function Home() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlbums()
      .then((data) => setAlbums(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={`${inter.className} min-h-screen flex items-center justify-center bg-white`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className={`${lato.className} text-gray-500 text-sm font-light`}>Loading galleries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${inter.className} min-h-screen bg-white`}>
      {/* Professional Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className={`${playfair.className} text-5xl md:text-6xl font-normal tracking-wide text-gray-900 mb-4`}>
              PORTRAITS BY KT MERRY
            </h1>
            <p className={`${lato.className} text-gray-600 text-sm font-light uppercase tracking-widest`}>
              PHOTO GALLERIES
            </p>
          </div>
        </div>
      </header>

      {/* Clean Albums Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {albums.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className={`${playfair.className} text-xl font-normal text-gray-900 mb-2`}>No galleries yet</h3>
            <p className={`${lato.className} text-gray-500 text-sm font-light`}>Galleries will appear here once they're created.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {albums.map((album) => (
              <Link key={album.id} href={`/album/${album.id}`} className="group">
                <div className="relative overflow-hidden bg-gray-50">
                  <img
                    src={
                      album.cover_image
                        ? `${API_BASE}/${album.cover_image}`
                        : "/placeholder.jpg"
                    }
                    alt={album.title}
                    className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                  
                  {/* Protected indicator */}
                  {album.is_protected && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-full text-xs font-medium">
                      Protected
                    </div>
                  )}
                </div>
                
                <div className="mt-6 text-center">
                  <h3 className={`${playfair.className} text-lg font-normal text-gray-900 mb-2 group-hover:text-gray-600 transition-colors`}>
                    {album.title.toUpperCase()}
                  </h3>
                  <p className={`${lato.className} text-gray-500 text-xs font-light uppercase tracking-widest`}>View Gallery</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
