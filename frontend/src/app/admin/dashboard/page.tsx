"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { fetchAlbums, createAlbum, deleteAlbum, getSiteSettings, updateSiteSettings, reorderAlbums, toggleAlbumPublish, API_BASE } from "../../../lib/api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [albums, setAlbums] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'galleries' | 'customize' | 'preview'>('galleries');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Album creation
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Function definitions must be before useEffect
  async function loadAlbums() {
    const data = await fetchAlbums();
    setAlbums(data);
  }

  async function loadSiteSettings() {
    const data = await getSiteSettings();
    setSiteSettings(data);
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

  async function handleDragEnd(result: any) {
    if (!result.destination) return;

    const items = Array.from(albums);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setAlbums(items);

    // Update order in backend
    const albumOrders = items.map((album, index) => ({
      id: album.id,
      order: index
    }));

    try {
      await reorderAlbums(albumOrders);
    } catch (error) {
      alert("Failed to reorder albums. Please try again.");
      loadAlbums(); // Revert on error
    }
  }

  async function handleTogglePublish(albumId: string, isPublished: boolean) {
    try {
      await toggleAlbumPublish(albumId, isPublished);
      loadAlbums();
    } catch (error) {
      alert("Failed to update album status. Please try again.");
    }
  }

  async function handleSaveSettings() {
    setIsSaving(true);
    try {
      await updateSiteSettings(siteSettings);
      setIsEditing(false);
      alert("Settings saved successfully!");
    } catch (error) {
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (session) {
      loadAlbums();
      loadSiteSettings();
    }
  }, [session]);

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


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Squarespace-like Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Site Manager</h1>
              <p className="text-sm text-gray-500">Welcome back, {session?.user?.name}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setActiveTab('preview')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Preview Site
              </button>
              <button
                onClick={() => setActiveTab('customize')}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Customize
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('galleries')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'galleries'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Galleries
            </button>
            
            <button
              onClick={() => setActiveTab('customize')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'customize'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Customize
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'preview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Preview
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Galleries Tab */}
        {activeTab === 'galleries' && (
          <div className="space-y-8">
            {/* Create Album Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Create New Gallery
              </h2>
              <form onSubmit={handleCreateAlbum} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gallery Title
                    </label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter gallery title"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
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
                      placeholder="Enter password to protect gallery"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter gallery description"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? "Creating..." : "Create Gallery"}
                </button>
              </form>
            </div>

            {/* Drag & Drop Galleries */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Your Galleries ({albums.length})
                </h2>
                <p className="text-sm text-gray-500">Drag to reorder</p>
              </div>
              
              {albums.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No galleries yet</h3>
                  <p className="text-gray-600">Create your first gallery to get started!</p>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="galleries">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3"
                      >
                        {albums.map((album, index) => (
                          <Draggable key={album.id} draggableId={album.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`bg-gray-50 rounded-lg p-4 border-2 transition-all ${
                                  snapshot.isDragging ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="text-gray-400 hover:text-gray-600 cursor-grab"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                      </svg>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                      <img
                                        src={
                                          album.cover_image
                                            ? `${API_BASE}/${album.cover_image}`
                                            : "/placeholder.jpg"
                                        }
                                        alt={album.title}
                                        className="w-12 h-12 object-cover rounded-lg"
                                      />
                                      <div>
                                        <h3 className="font-medium text-gray-900">{album.title}</h3>
                                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                                          {album.is_protected && (
                                            <span className="flex items-center">
                                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                              </svg>
                                              Protected
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleTogglePublish(album.id, !album.is_published)}
                                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                                        album.is_published
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      {album.is_published ? 'Published' : 'Draft'}
                                    </button>
                                    <Link
                                      href={`/admin/albums/${album.id}`}
                                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                    >
                                      Manage
                                    </Link>
                                    <button
                                      onClick={() => handleDeleteAlbum(album.id)}
                                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>
        )}

        {/* Customize Tab */}
        {activeTab === 'customize' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Site Customization</h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                  {isEditing && (
                    <button
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Title
                  </label>
                  {isEditing ? (
                    <input
                      value={siteSettings.site_title || ''}
                      onChange={(e) => setSiteSettings({...siteSettings, site_title: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  ) : (
                    <p className="text-gray-900 text-lg">{siteSettings.site_title || 'PORTRAITS BY KT MERRY'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Subtitle
                  </label>
                  {isEditing ? (
                    <input
                      value={siteSettings.site_subtitle || ''}
                      onChange={(e) => setSiteSettings({...siteSettings, site_subtitle: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  ) : (
                    <p className="text-gray-600">{siteSettings.site_subtitle || 'PHOTO GALLERIES'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hero Text (Optional)
                  </label>
                  {isEditing ? (
                    <textarea
                      value={siteSettings.hero_text || ''}
                      onChange={(e) => setSiteSettings({...siteSettings, hero_text: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      placeholder="Enter hero text that appears on the homepage"
                    />
                  ) : (
                    <p className="text-gray-600">{siteSettings.hero_text || 'No hero text set'}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Theme Color
                    </label>
                    {isEditing ? (
                      <input
                        type="color"
                        value={siteSettings.theme_color || '#000000'}
                        onChange={(e) => setSiteSettings({...siteSettings, theme_color: e.target.value})}
                        className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
                      />
                    ) : (
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-full border border-gray-300"
                          style={{ backgroundColor: siteSettings.theme_color || '#000000' }}
                        ></div>
                        <span className="text-gray-600">{siteSettings.theme_color || '#000000'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Color
                    </label>
                    {isEditing ? (
                      <input
                        type="color"
                        value={siteSettings.background_color || '#ffffff'}
                        onChange={(e) => setSiteSettings({...siteSettings, background_color: e.target.value})}
                        className="w-full h-12 border border-gray-300 rounded-lg cursor-pointer"
                      />
                    ) : (
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-full border border-gray-300"
                          style={{ backgroundColor: siteSettings.background_color || '#ffffff' }}
                        ></div>
                        <span className="text-gray-600">{siteSettings.background_color || '#ffffff'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Site Preview</h2>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <iframe
                  src="/"
                  className="w-full h-[600px]"
                  title="Site Preview"
                />
              </div>
              <div className="mt-4 flex justify-center">
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Open in New Tab
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
