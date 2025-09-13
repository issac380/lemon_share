"use client";

import { useEffect, useState } from "react";
import {
  fetchAlbumAdmin,
  deleteAsset,
  bulkUpload,
  API_BASE,
} from "../../../../lib/api";

type AdminAlbumPageProps = {
  params: Promise<{ id: string }>;
};

export default function AdminAlbumPage({ params }: AdminAlbumPageProps) {
  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      fetchAlbumAdmin(id).then((data) => {
        setAlbum(data);
        setLoading(false);
      });
    });
  }, [params]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    params.then(({ id }) => {
      bulkUpload(id, files).then(() => {
        fetchAlbumAdmin(id).then((data) => {
          setAlbum(data);
          setUploading(false);
        });
      });
    });
  }

  async function handleDeleteAsset(assetId: string) {
    await deleteAsset(assetId);
    params.then(({ id }) => {
      fetchAlbumAdmin(id).then((data) => setAlbum(data));
    });
  }

  async function handlePasswordUpdate() {
    if (!album) return;
    try {
      const formData = new FormData();
      formData.append("password", password);

      const res = await fetch(`${API_BASE}/api/admin/albums/${album.id}/password`, {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        setMessage("Password updated successfully!");
        setPassword("");
      } else {
        setMessage("Failed to update password");
      }
    } catch (err) {
      setMessage("Error updating password");
    }
  }

  if (loading) return <p className="p-8">Loading album...</p>;
  if (!album) return <p className="p-8">Album not found</p>;

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        {album.title} (Admin)
      </h1>

      {/* 🔑 Change Password Section */}
      <div className="mb-6 p-6 bg-white shadow rounded-lg">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">
          Album Password
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {album.is_protected
            ? "This album currently has a password set."
            : "This album is public (no password)."}
        </p>
        <div className="flex items-center gap-2 mb-2">
          <input
            type={showAdminPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password (leave blank to remove)"
            className="border rounded px-3 py-2 flex-1 text-black"
          />
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showAdminPassword}
              onChange={() => setShowAdminPassword(!showAdminPassword)}
              className="mr-1"
            />
            Show
          </label>
          <button
            onClick={handlePasswordUpdate}
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
        {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
      </div>

      {/* Upload Section */}
      <div className="mb-6 p-6 border-2 border-dashed border-gray-400 rounded-lg bg-white text-center">
        <p className="mb-4 text-gray-600">
          Drag and drop photos here or click to select
        </p>
        <input
          type="file"
          multiple
          onChange={handleUpload}
          className="block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100"
        />
        {uploading && <p className="mt-2 text-blue-600">Uploading...</p>}
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {album.assets.length === 0 ? (
          <p className="text-center text-gray-500 col-span-full">
            This album is empty. Upload some photos to get started!
          </p>
        ) : (
          album.assets.map((asset: any) => (
            <div key={asset.id} className="relative group">
              <img
                src={
                  asset.thumb_path || asset.file_path
                    ? `${API_BASE}/${asset.thumb_path || asset.file_path}`
                    : "/placeholder.jpg"
                }
                alt=""
                className="rounded shadow"
              />
              <button
                onClick={() => handleDeleteAsset(asset.id)}
                className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
