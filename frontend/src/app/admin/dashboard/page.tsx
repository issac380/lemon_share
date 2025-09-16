"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { fetchAlbums, createAlbum, deleteAlbum, API_BASE } from "../../../lib/api";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [albums, setAlbums] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need to be logged in to access this page.</p>
          <Link href="/admin/login" className="text-blue-600 hover:text-blue-700">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  async function loadAlbums() {
    const data = await fetchAlbums();
    setAlbums(data);
  }

  async function handleCreateAlbum(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createAlbum(title, description, password);
      setTitle("");
      setDescription("");
      setPassword("");
      loadAlbums();
    } catch (error) {
      alert("Failed to create album. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteAlbum(id: string) {
    if (confirm("Are you sure you want to delete this album?")) {
      try {
        await deleteAlbum(id);
        loadAlbums();
      } catch (error) {
        alert("Failed to delete album. Please try again.");
      }
    }
  }

  useEffect(() => {
    loadAlbums();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {session?.user?.name}! Manage your photo albums and galleries
          </p>
        </div>

        {/* Create Album Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Create New Album
          </h2>
          <form onSubmit={handleCreateAlbum} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Album Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter album title"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter album description"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password (Optional)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to protect album"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave empty to make album public
              </p>
            </div>
            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? "Creating..." : "Create Album"}
            </button>
          </form>
        </div>

        {/* Albums Grid */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Your Albums ({albums.length})
          </h2>
          {albums.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No albums yet</h3>
              <p className="text-gray-600">Create your first album to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {albums.map((album) => (
                <div
                  key={album.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative">
                    <img
                      src={
                        album.cover_image
                          ? `${API_BASE}/${album.cover_image}`
                          : "/placeholder.jpg"
                      }
                      alt={album.title}
                      className="w-full h-48 object-cover"
                    />
                    {album.is_protected && (
                      <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Protected
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">{album.title}</h3>
                    <div className="flex justify-between items-center">
                      <Link 
                        href={`/admin/albums/${album.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                      >
                        Manage →
                      </Link>
                      <button
                        onClick={() => handleDeleteAlbum(album.id)}
                        className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
