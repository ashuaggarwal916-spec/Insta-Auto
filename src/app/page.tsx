'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('videos');
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoName, setVideoName] = useState('');
  const [videos, setVideos] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (!token || !savedUser) { router.push('/login'); return; }
    setUser(JSON.parse(savedUser));
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/videos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to load videos (${res.status})`);
      setVideos(await res.json());
    } catch (err: any) {
      setError(err.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = async () => {
    if (!youtubeUrl.trim()) { setError('YouTube URL required'); return; }
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ youtubeUrl, title: videoName || 'Untitled Video' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to create video (${res.status})`);
      }
      setSuccess('Video import started');
      setShowAddVideo(false);
      setYoutubeUrl('');
      setVideoName('');
      fetchVideos();
    } catch (err: any) {
      setError(err.message || 'Failed to create video');
    }
  };

  const handleGenerateClips = async (videoId: string) => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/clips/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ videoId, trimStart: 0, trimEnd: 0, clipCount: 5 }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to start clipping (${res.status})`);
      }
      setSuccess('Clip generation started');
      fetchVideos();
    } catch (err: any) {
      setError(err.message || 'Failed to start clipping');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col">
        <h1 className="text-2xl font-bold text-indigo-600 mb-8">Insta</h1>
        <nav className="space-y-2 flex-1">
          {['videos', 'clips', 'instagram', 'queue', 'logs', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-2 rounded-lg capitalize ${
                activeTab === tab ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 mb-2">{user?.email}</p>
          <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700">Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">
        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4">{success}</div>}

        {activeTab === 'videos' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Videos</h2>
              <button
                onClick={() => setShowAddVideo(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                + Add Video
              </button>
            </div>
            {showAddVideo && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <h3 className="font-semibold mb-4">Add YouTube Video</h3>
                <input
                  type="text"
                  placeholder="YouTube URL (works with private/unlisted)"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full p-3 border rounded-lg mb-3 dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  type="text"
                  placeholder="Video Name (optional)"
                  value={videoName}
                  onChange={(e) => setVideoName(e.target.value)}
                  className="w-full p-3 border rounded-lg mb-3 dark:bg-gray-700 dark:border-gray-600"
                />
                <div className="flex gap-2">
                  <button onClick={handleAddVideo} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Import</button>
                  <button onClick={() => { setShowAddVideo(false); setError(''); }} className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-lg">Cancel</button>
                </div>
              </div>
            )}
            {loading ? (
              <p className="text-gray-500">Loading videos...</p>
            ) : videos.length === 0 ? (
              <p className="text-gray-500">No videos yet. Add your first video above.</p>
            ) : (
              <div className="grid gap-4">
                {videos.map((video) => (
                  <div key={video.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{video.title}</h3>
                        <p className="text-sm text-gray-500">{video.youtubeUrl}</p>
                        <p className="text-sm text-gray-500">Status: {video.status} | Clips: {video.clips?.length || 0}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleGenerateClips(video.id)}
                          className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                        >
                          Generate Clips
                        </button>
                        <button className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'clips' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Clips</h2>
            <p className="text-gray-500">Generated clips will appear here after processing.</p>
          </div>
        )}
        {activeTab === 'instagram' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Instagram Connection</h2>
            <a
              href={`${API_URL}/api/instagram/auth`}
              className="inline-block bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700"
            >
              Connect Instagram
            </a>
          </div>
        )}
        {activeTab === 'queue' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Upload Queue</h2>
            <p className="text-gray-500">Active upload batches will appear here.</p>
          </div>
        )}
        {activeTab === 'logs' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Activity Logs</h2>
            <p className="text-gray-500">System activity logs will appear here.</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Settings</h2>
            <p className="text-gray-500">User settings and preferences.</p>
          </div>
        )}
      </main>
    </div>
  );
}
