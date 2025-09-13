"use client";

import { useEffect, useState } from "react";
import { fetchAlbum, API_BASE } from "../../../lib/api";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

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

  useEffect(() => {
    params.then(({ id }) => {
      fetchAlbum(id).then((data) => {
        setAlbum(data);
        setLoading(false);
        if (!data.is_protected) {
          setUnlocked(true); // public albums open automatically
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
        console.log("Unlocked album:", data);
        if (data.unlocked) {
          setUnlocked(true);
          setAlbum(data);    // load assets
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


  if (loading) return <p className="p-8">Loading album...</p>;
  if (!album) return <p className="p-8">Album not found</p>;

  // 👇 Password gate
  if (album.is_protected && !unlocked) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-black text-white p-8">
        <div className="w-full max-w-sm flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-4">{album.title}</h1>
          <p className="mb-4 text-gray-400">This album is password protected.</p>

          {/* Password input + toggle */}
          <div className="w-full mb-4">
            <div className="flex items-center gap-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="flex-1 border border-gray-600 rounded px-3 py-2 text-white bg-gray-800"
              />
              <label className="flex items-center text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="mr-1"
                />
                Show
              </label>
            </div>
          </div>

          {/* Unlock button */}
          <button
            onClick={handleUnlock}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Unlock
          </button>

          {/* Error */}
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </main>
    );
  }


  // Normal gallery view
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-100">{album.title}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {album.assets.length === 0 ? (
          <p className="text-center text-gray-400 col-span-full">
            No photos yet. 📷
          </p>
        ) : (
          album.assets.map((asset: any, idx: number) => (
            <img
              key={asset.id}
              src={
                asset.thumb_path || asset.file_path
                  ? `${API_BASE}/${asset.thumb_path || asset.file_path}`
                  : "/placeholder.jpg"
              }
              alt=""
              className="rounded shadow cursor-pointer hover:opacity-80 transition"
              onClick={() => setLightboxIndex(idx)} // 👈 open lightbox
            />
          ))
        )}
      </div>

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
    </main>
  );
}
