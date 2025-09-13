"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAlbums, createAlbum, deleteAlbum, API_BASE } from "../../../lib/api";

export default function Dashboard() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState(""); // 👈 new state for password

  async function loadAlbums() {
    const data = await fetchAlbums();
    setAlbums(data);
  }

  async function handleCreateAlbum(e: React.FormEvent) {
    e.preventDefault();
    await createAlbum(title, description, password); // 👈 pass password too
    setTitle("");
    setDescription("");
    setPassword(""); // reset after creating
    loadAlbums();
  }

  async function handleDeleteAlbum(id: string) {
    if (confirm("Are you sure you want to delete this album?")) {
      await deleteAlbum(id);
      loadAlbums();
    }
  }

  useEffect(() => {
    loadAlbums();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        Admin Dashboard
      </h1>

      {/* Create Album Form */}
      <form
        onSubmit={handleCreateAlbum}
        className="mb-6 p-6 bg-white shadow rounded-2xl"
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Create New Album
        </h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Album Title"
          className="border p-2 rounded w-full mb-2 text-gray-700"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Album Description"
          className="border p-2 rounded w-full mb-2 text-gray-700"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (optional)"
          className="border p-2 rounded w-full mb-4 text-gray-700"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Create Album
        </button>
      </form>

      {/* Album List */}
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Albums</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {albums.map((album) => (
          <div
            key={album.id}
            className="bg-white shadow rounded overflow-hidden"
          >
            <img
              src={
                album.cover_image
                  ? `${API_BASE}/${album.cover_image}`
                  : "/placeholder.jpg"
              }
              alt={album.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold text-gray-700">{album.title}</h3>
              <div className="flex justify-between mt-2">
                <Link href={`/admin/albums/${album.id}`}>
                  <span className="text-blue-600 cursor-pointer">Manage</span>
                </Link>
                <button
                  onClick={() => handleDeleteAlbum(album.id)}
                  className="text-red-500"
                >
                  Delete
                </button>
              </div>
              {album.is_protected && (
                <p className="text-xs text-gray-500 mt-1">🔒 Password protected</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
