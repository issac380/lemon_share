// Load API base URL from environment (frontend/.env.local or .env.production)
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

// Fetch all albums
export async function fetchAlbums() {
  const res = await fetch(`${API_BASE}/api/albums`, {
    cache: "no-store",
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error("Failed to fetch albums");
  return res.json();
}

// Create new album
export async function createAlbum(
  title: string,
  description?: string,
  password?: string
) {
  const formData = new FormData();
  formData.append("title", title);
  if (description) formData.append("description", description);
  if (password) formData.append("password", password);

  const res = await fetch(`${API_BASE}/api/admin/albums`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to create album");
  return res.json();
}

// Fetch single album with assets
export async function fetchAlbum(id: string) {
  const res = await fetch(`${API_BASE}/api/albums/${id}`, {
    cache: "no-store",
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error("Failed to fetch album");
  return res.json();
}

// Bulk upload photos
export async function bulkUpload(albumId: string, files: FileList) {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("files", file));

  const res = await fetch(
    `${API_BASE}/api/admin/albums/${albumId}/upload-multiple`,
    {
      method: "POST",
      body: formData,
    }
  );
  if (!res.ok) throw new Error("Failed bulk upload");
  return res.json();
}

// Delete album
export async function deleteAlbum(albumId: string) {
  const res = await fetch(`${API_BASE}/api/admin/albums/${albumId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete album");
  return res.json();
}

// Delete single photo
export async function deleteAsset(assetId: string) {
  const res = await fetch(`${API_BASE}/api/admin/assets/${assetId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete asset");
  return res.json();
}
