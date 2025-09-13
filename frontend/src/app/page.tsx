"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAlbums, API_BASE } from "../lib/api";

export default function Home() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlbums()
      .then((data) => setAlbums(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-8">Loading albums...</p>;

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-900">
        My Photo Gallery
      </h1>

      {albums.length === 0 ? (
        <p className="text-center text-gray-500">No albums created yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {albums.map((album) => (
            <Link key={album.id} href={`/album/${album.id}`}>
              <div className="bg-white shadow-lg rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition">
                <img
                  src={
                    album.cover_image
                      ? `${API_BASE}/${album.cover_image}`
                      : "/placeholder.jpg"
                  }
                  alt={album.title}
                  className="w-full h-64 object-cover"
                />
                <div className="p-4 flex justify-between items-center">
                  <span className="font-semibold text-gray-500">{album.title}</span>
                  {album.is_protected && (
                    <span className="text-sm text-gray-500">🔒</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
