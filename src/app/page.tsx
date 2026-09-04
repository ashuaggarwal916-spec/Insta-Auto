'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Clip {
  id: string;
  title: string;
  status: string;
  hashtags: string[];
  keywords: string[];
  titles: string[];
  filePath?: string;
  duration?: number;
  instagramStatus: string;
}

interface Video {
  id: string;
  title: string;
  youtubeUrl: string;
  status: string;
  duration?: number;
  clips?: Clip[];
  titles?: string[];
  hashtags?: string[];
  keywords?: string[];
}

interface Job {
  id: string;
  type: string;
  status: string;
  progress: number;
  data?: string;
  result?: string;
  error?: string;
  createdAt: string;
}

interface Batch {
  id: string;
  name: string;
  status: string;
  items: any[];
  createdAt: string;
}

interface Schedule {
  id: string;
  name: string;
  status: string;
  scheduledAt: string;
  clipIds: string[];
  intervalSeconds: number;
  videoCount?: number;
  excludePrevious?: boolean;
}

const TABS = [
  { id: 'videos', label: 'Videos', icon: 'video' },
  { id: 'clips', label: 'Clips', icon: 'clip' },
  { id: 'jobs', label: 'Jobs', icon: 'gear' },
  { id: 'publish', label: 'Publish', icon: 'rocket' },
  { id: 'schedule', label: 'Schedule', icon: 'calendar' },
  { id: 'instagram', label: 'Instagram', icon: 'camera' },
];

function TabIcon({ icon, className = '' }: { icon: string; className?: string }) {
  const icons: Record<string, JSX.Element> = {
    video: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m10 9 5 3-5 3z" fill="currentColor"/></svg>,
    clip: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h7l5-5V4a2 2 0 0 0-2-2z"/><path d="M14 2v6h6"/><path d="m9 13 2 2 4-4"/></svg>,
    gear: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.93 19.07 1.41-1.41"/><path d="m17.66 6.34 1.41-1.41"/></svg>,
    rocket: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
    calendar: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>,
    camera: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
    logo: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
    stats: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>,
    check: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
    alert: <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  };
  return <>{icons[icon] || <span className={className}>●</span>}</>;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activeTab, setActiveTab] = useState('videos');
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoName, setVideoName] = useState('');
  const [titles, setTitles] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [keywords, setKeywords] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [instaConnected, setInstaConnected] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [clipCount, setClipCount] = useState(5);
  const [clipDuration, setClipDuration] = useState(60);
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());
  const [batchInterval, setBatchInterval] = useState(30);
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleClipCount, setScheduleClipCount] = useState(10);
  const [scheduleExcludePrevious, setScheduleExcludePrevious] = useState(true);
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  const [publishingStatus, setPublishingStatus] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const stats = {
    totalVideos: videos.length,
    totalClips: clips.length,
    completedJobs: jobs.filter(j => j.status === 'completed').length,
    pendingJobs: jobs.filter(j => j.status === 'processing' || j.status === 'queued').length,
  };

  const checkInstagram = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/instagram', { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) return;
      const data = await res.json();
      setInstaConnected(!!data.connected);
    } catch { /* ignore */ }
  }, []);

  // Handle OAuth callback from Instagram
  const handleOAuthCallback = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('instagram_code');
    const state = urlParams.get('state');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      setError(`Instagram error: ${urlParams.get('error_description') || errorParam}`);
      window.history.replaceState({}, '/', '/');
      return;
    }

    if (code && state) {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Session expired. Please log in again.');
          window.history.replaceState({}, '/', '/');
          setLoading(false);
          return;
        }
        const res = await fetch('/api/instagram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ code, state }),
        });
        
        // Check content type before parsing JSON
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          setError('Invalid response from server. Please try again.');
          window.history.replaceState({}, '/', '/');
          setLoading(false);
          return;
        }
        
        const data = await res.json();
        if (res.ok && data.success) {
          setSuccess(`Connected to Instagram as ${data.username || 'user'}`);
          setInstaConnected(true);
          // Refresh connection state
          setTimeout(() => checkInstagram(), 500);
        } else {
          setError(data.error || 'Failed to connect Instagram');
          setInstaConnected(false);
        }
      } catch (err: any) {
        setError('Failed to process Instagram callback');
        setInstaConnected(false);
      }
      window.history.replaceState({}, '/', '/');
      setLoading(false);
    }
  }, [checkInstagram]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (!token || !savedUser) { window.location.href = '/login'; return; }
    setUser(JSON.parse(savedUser));
    fetchData();
    checkInstagram();
    handleOAuthCallback();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Refresh Instagram connection state when tab changes to instagram
  useEffect(() => {
    if (activeTab === 'instagram') {
      checkInstagram();
    }
  }, [activeTab, checkInstagram]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [vRes, cRes, jRes, bRes, sRes] = await Promise.all([
        fetch('/api/videos', { headers }),
        fetch('/api/clips/generate', { headers }),
        fetch('/api/jobs', { headers }),
        fetch('/api/batches', { headers }),
        fetch('/api/schedules', { headers }),
      ]);
      if (vRes.ok) setVideos(await vRes.json());
      if (cRes.ok) setClips(await cRes.json());
      if (jRes.ok) setJobs(await jRes.json());
      if (bRes.ok) setBatches(await bRes.json());
      if (sRes.ok) setSchedules(await sRes.json());
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  const handleDisconnectInstagram = async () => {
    setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired');
        return;
      }
      const res = await fetch('/api/instagram', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setInstaConnected(false);
        setSuccess('Instagram disconnected');
      } else {
        setError('Failed to disconnect');
      }
    } catch { setError('Failed to disconnect'); }
  };

  const handleAddVideo = async () => {
    if (!youtubeUrl.trim()) { setError('YouTube URL required'); return; }
    setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const titlesArr = titles.split('\n').filter(t => t.trim());
      const hashtagsArr = hashtags.split(/[,\n]/).filter(h => h.trim());
      const keywordsArr = keywords.split(/[,\n]/).filter(k => k.trim());
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ youtubeUrl, title: videoName || 'Untitled Video', titles: titlesArr, hashtags: hashtagsArr, keywords: keywordsArr }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || `Failed (${res.status})`); }
      setSuccess('Video import started');
      setShowAddVideo(false); setYoutubeUrl(''); setVideoName(''); setTitles(''); setHashtags(''); setKeywords('');
      fetchData();
    } catch (err: any) { setError(err.message); }
  };

  const handleGenerateClips = async (videoId: string) => {
    setGenerating(videoId);
    setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/clips/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ videoId, clipCount, clipDuration }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || `Failed (${res.status})`); }
      const data = await res.json();
      setSuccess(data.message);
      fetchData();
    } catch (err: any) { setError(err.message); }
    setGenerating(null);
  };

  const handleConnectInstagram = async () => {
    setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please log in again.');
        return;
      }
      const res = await fetch('/api/instagram/auth', { headers: { Authorization: `Bearer ${token}` } });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setError('Failed to get Instagram auth URL');
        return;
      }
      
      const data = await res.json();
      if (data.authUrl) { 
        window.location.href = data.authUrl; 
      } else { 
        setError('Instagram not configured'); 
      }
    } catch { 
      setError('Failed to get Instagram auth URL'); 
    }
  };

  const handleSelectClip = (clipId: string) => {
    const next = new Set(selectedClips);
    if (next.has(clipId)) next.delete(clipId); else next.add(clipId);
    setSelectedClips(next);
  };

  const handleStartPublishing = async () => {
    if (selectedClips.size === 0) { setError('Select at least one clip to publish'); return; }
    setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clipIds: Array.from(selectedClips), minWait: 20, maxWait: 30, mode: 'batch' }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || `Failed (${res.status})`); }
      const data = await res.json();
      setSuccess(`Publishing started: ${data.totalClips} clips, estimated ${data.estimatedTime}`);
      setPublishingStatus(data);
      setSelectedClips(new Set());
      fetchData();
    } catch (err: any) { setError(err.message); }
  };

  const handleStartBatch2 = async () => {
    const readyClips = clips.filter(c => c.status === 'ready');
    if (readyClips.length === 0) { setError('No ready clips available'); return; }
    const shuffled = [...sortShuffled(readyClips)];
    const count = Math.min(randomInt(20, 25), shuffled.length);
    const selected = shuffled.slice(0, count);
    setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clipIds: selected.map(c => c.id), minWait: 20, maxWait: 30, mode: 'batch2' }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || `Failed (${res.status})`); }
      const data = await res.json();
      setSuccess(`Batch 2 started: ${data.totalClips} clips publishing with 20-30s random waits`);
      setPublishingStatus(data);
      fetchData();
    } catch (err: any) { setError(err.message); }
  };

  const handleCreateSchedule = async () => {
    if (!scheduleName.trim() || !scheduleTime || selectedClips.size === 0) { setError('Schedule name, time, and clips required'); return; }
    setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: scheduleName, clipIds: Array.from(selectedClips), scheduledAt: scheduleTime, intervalSeconds: batchInterval, videoCount: scheduleClipCount, excludePrevious: scheduleExcludePrevious }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || `Failed (${res.status})`); }
      setSuccess('Schedule created');
      setShowCreateSchedule(false); setScheduleName(''); setScheduleTime(''); setSelectedClips(new Set());
      fetchData();
    } catch (err: any) { setError(err.message); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Mobile menu toggle */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden glass-card rounded-xl p-3 text-white/70 hover:text-white transition-colors"
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 glass-nav flex flex-col transform transition-transform duration-300 ease-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <TabIcon icon="logo" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient">Insta</h1>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">Video Automation</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/10 text-white border border-purple-500/30 shadow-lg shadow-purple-500/10'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              <TabIcon icon={tab.icon} className={`w-4 h-4 transition-colors ${activeTab === tab.id ? 'text-purple-400' : 'text-white/30 group-hover:text-white/50'}`} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 shadow-lg shadow-purple-400/50" />
              )}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-purple-500/20">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-white/30 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-sm text-red-400/70 hover:text-red-300 font-medium py-2.5 rounded-xl hover:bg-red-500/10 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-white capitalize">{activeTab}</h1>
            <p className="text-sm text-white/40 mt-1">
              {activeTab === 'videos' && 'Import and manage your YouTube videos'}
              {activeTab === 'clips' && 'Select and organize clips for publishing'}
              {activeTab === 'jobs' && 'Monitor background processing jobs'}
              {activeTab === 'publish' && 'Publish clips to Instagram with smart scheduling'}
              {activeTab === 'schedule' && 'Manage automated publishing schedules'}
              {activeTab === 'instagram' && 'Connect and manage your Instagram account'}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Videos" value={stats.totalVideos} icon="video" color="purple" />
            <StatCard label="Clips" value={stats.totalClips} icon="clip" color="pink" />
            <StatCard label="Completed" value={stats.completedJobs} icon="check" color="green" />
            <StatCard label="Processing" value={stats.pendingJobs} icon="gear" color="blue" />
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 glass-card rounded-2xl border border-red-500/20 flex items-center gap-3 animate-in">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <TabIcon icon="alert" className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 glass-card rounded-2xl border border-green-500/20 flex items-center gap-3 animate-in">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <TabIcon icon="check" className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-sm text-green-300">{success}</p>
            </div>
          )}

          {/* Content Area */}
          <div className="glass-card rounded-3xl p-6 lg:p-8">
            {/* Videos Tab */}
            {activeTab === 'videos' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Your Videos</h2>
                    <p className="text-xs text-white/30 mt-0.5">Import YouTube videos with SEO metadata</p>
                  </div>
                  <button onClick={() => setShowAddVideo(true)} className="btn-premium px-5 py-2.5 text-white rounded-xl text-sm font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                    Add Video
                  </button>
                </div>

                {showAddVideo && (
                  <div className="mb-6 p-6 glass rounded-2xl border border-white/5">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                      Import YouTube Video
                    </h3>
                    <div className="space-y-3">
                      <input type="text" placeholder="YouTube URL" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="w-full p-3.5 glass-input rounded-xl text-sm text-white placeholder-white/25 outline-none" />
                      <input type="text" placeholder="Video Name (optional)" value={videoName} onChange={(e) => setVideoName(e.target.value)} className="w-full p-3.5 glass-input rounded-xl text-sm text-white placeholder-white/25 outline-none" />
                      <div className="border-t border-white/5 pt-4 mt-4">
                        <p className="text-xs text-white/40 mb-3 flex items-center gap-2">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                          SEO Metadata — randomly selected during posting
                        </p>
                        <textarea placeholder="Titles (one per line, 3-4 recommended)" value={titles} onChange={(e) => setTitles(e.target.value)} className="w-full p-3.5 glass-input rounded-xl text-sm text-white placeholder-white/25 outline-none h-24 resize-none" />
                        <textarea placeholder="Hashtags (comma or newline, 8-10 recommended)" value={hashtags} onChange={(e) => setHashtags(e.target.value)} className="w-full p-3.5 glass-input rounded-xl text-sm text-white placeholder-white/25 outline-none h-20 resize-none mt-3" />
                        <textarea placeholder="Keywords (comma or newline, 10-15 recommended)" value={keywords} onChange={(e) => setKeywords(e.target.value)} className="w-full p-3.5 glass-input rounded-xl text-sm text-white placeholder-white/25 outline-none h-20 resize-none mt-3" />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button onClick={handleAddVideo} className="btn-premium px-5 py-2.5 text-white rounded-xl text-sm font-medium">Import</button>
                        <button onClick={() => { setShowAddVideo(false); setError(''); }} className="px-5 py-2.5 bg-white/5 text-white/60 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">Cancel</button>
                      </div>
                    </div>
                  </div>
                )}

                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                  </div>
                ) : videos.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                      <TabIcon icon="video" className="w-8 h-8 text-white/20" />
                    </div>
                    <p className="text-white/40 text-sm">No videos yet. Import your first YouTube video to get started.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {videos.map((video) => (
                      <div key={video.id} className="glass rounded-2xl p-5 card-hover group">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white truncate group-hover:text-purple-300 transition-colors">{video.title}</h3>
                            <p className="text-xs text-white/30 truncate mt-1">{video.youtubeUrl}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <StatusBadge status={video.status} />
                              <span className="text-xs text-white/20">{video.clips?.length || 0} clips</span>
                              {video.titles && video.titles.length > 0 && <span className="text-xs text-purple-400/60">{video.titles.length} titles</span>}
                              {video.hashtags && video.hashtags.length > 0 && <span className="text-xs text-pink-400/60">{video.hashtags.length} hashtags</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => handleGenerateClips(video.id)}
                            disabled={generating === video.id}
                            className="px-4 py-2 bg-green-500/10 text-green-400 rounded-xl text-xs font-medium hover:bg-green-500/20 transition-all disabled:opacity-50 border border-green-500/20"
                          >
                            {generating === video.id ? 'Queued...' : 'Generate Clips'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Clips Tab */}
            {activeTab === 'clips' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Clips</h2>
                    <p className="text-xs text-white/30 mt-0.5">Select clips for publishing</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowCreateSchedule(true)} className="px-4 py-2 glass rounded-xl text-xs font-medium text-blue-300 hover:bg-blue-500/10 transition-colors flex items-center gap-1.5">
                      <TabIcon icon="calendar" className="w-3.5 h-3.5" />
                      Schedule ({selectedClips.size})
                    </button>
                    <button onClick={handleStartPublishing} className="px-4 py-2 btn-premium rounded-xl text-xs font-medium text-white flex items-center gap-1.5">
                      <TabIcon icon="rocket" className="w-3.5 h-3.5" />
                      Publish ({selectedClips.size})
                    </button>
                  </div>
                </div>

                {clips.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                      <TabIcon icon="clip" className="w-8 h-8 text-white/20" />
                    </div>
                    <p className="text-white/40 text-sm">No clips yet. Generate clips from your videos.</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {clips.map((clip) => (
                      <div
                        key={clip.id}
                        onClick={() => handleSelectClip(clip.id)}
                        className={`glass rounded-xl p-4 cursor-pointer transition-all duration-200 flex items-center gap-3 ${
                          selectedClips.has(clip.id) ? 'border-purple-500/40 bg-purple-500/5' : 'hover:bg-white/3'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          selectedClips.has(clip.id) ? 'border-purple-500 bg-purple-500' : 'border-white/20'
                        }`}>
                          {selectedClips.has(clip.id) && <TabIcon icon="check" className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">{clip.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusBadge status={clip.status} />
                            <span className="text-xs text-white/20">{clip.hashtags?.length || 0} hashtags</span>
                            <span className="text-xs text-white/20">{clip.keywords?.length || 0} keywords</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Jobs Tab */}
            {activeTab === 'jobs' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-white">Jobs</h2>
                  <p className="text-xs text-white/30 mt-0.5">Background job processing status</p>
                </div>
                {jobs.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                      <TabIcon icon="gear" className="w-8 h-8 text-white/20" />
                    </div>
                    <p className="text-white/40 text-sm">No jobs yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {jobs.map((job) => (
                      <div key={job.id} className="glass rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{job.type}</span>
                            <StatusBadge status={job.status} />
                          </div>
                          <span className="text-xs text-white/20">{new Date(job.createdAt).toLocaleString()}</span>
                        </div>
                        {job.status === 'processing' && (
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000" style={{ width: `${job.progress}%` }} />
                          </div>
                        )}
                        {job.error && <p className="text-xs text-red-400/70 mt-2">{job.error}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Publish Tab */}
            {activeTab === 'publish' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-white">Publish</h2>
                  <p className="text-xs text-white/30 mt-0.5">Start publishing clips to Instagram</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass rounded-2xl p-6 card-hover">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                      <TabIcon icon="rocket" className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1">Start Publishing</h3>
                    <p className="text-xs text-white/40 mb-4">Publish selected clips with random 20-30s waits</p>
                    <button onClick={handleStartPublishing} disabled={selectedClips.size === 0} className="w-full py-3 btn-premium rounded-xl text-sm font-medium text-white disabled:opacity-30 disabled:cursor-not-allowed">
                      Start ({selectedClips.size} clips)
                    </button>
                  </div>
                  <div className="glass rounded-2xl p-6 card-hover">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
                      <TabIcon icon="stats" className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1">Batch 2</h3>
                    <p className="text-xs text-white/40 mb-4">Auto-select 20-25 clips and publish</p>
                    <button onClick={handleStartBatch2} disabled={clips.filter(c => c.status === 'ready').length === 0} className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-sm font-medium text-white disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/20 transition-all">
                      Start Batch 2
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-white">Schedules</h2>
                  <p className="text-xs text-white/30 mt-0.5">Manage your publishing schedules</p>
                </div>
                {schedules.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                      <TabIcon icon="calendar" className="w-8 h-8 text-white/20" />
                    </div>
                    <p className="text-white/40 text-sm">No schedules yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {schedules.map((schedule) => (
                      <div key={schedule.id} className="glass rounded-2xl p-5 card-hover">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-white">{schedule.name}</h3>
                            <p className="text-xs text-white/30 mt-1">{new Date(schedule.scheduledAt).toLocaleString()} • {schedule.clipIds?.length || 0} clips • {schedule.intervalSeconds}s interval</p>
                          </div>
                          <StatusBadge status={schedule.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Instagram Tab */}
            {activeTab === 'instagram' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-white">Instagram Connection</h2>
                  <p className="text-xs text-white/30 mt-0.5">Connect your Instagram account to auto-post clips</p>
                </div>
                <div className="glass rounded-2xl p-6 max-w-md">
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`w-3 h-3 rounded-full ${instaConnected ? 'bg-green-500' : 'bg-red-500'} status-dot`} />
                    <span className="font-medium text-white">{instaConnected ? 'Connected' : 'Not Connected'}</span>
                  </div>
                  {!instaConnected ? (
                    <button onClick={handleConnectInstagram} className="w-full py-3 btn-premium rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2">
                      <TabIcon icon="camera" className="w-4 h-4" />
                      Connect with Instagram
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-white/40">Your Instagram account is connected and ready to publish.</p>
                      <button onClick={handleDisconnectInstagram} className="w-full py-2.5 bg-red-500/10 text-red-300 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-colors border border-red-500/20 flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const colorMap: Record<string, string> = {
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-400',
    pink: 'from-pink-500/20 to-pink-500/5 text-pink-400',
    green: 'from-green-500/20 to-green-500/5 text-green-400',
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-400',
  };
  return (
    <div className="glass-card rounded-2xl p-4 lg:p-5 card-hover">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center`}>
          <TabIcon icon={icon} className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl lg:text-3xl font-bold text-white stat-number">{value}</p>
      <p className="text-xs text-white/40 mt-1">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'bg-green-500/10 text-green-400 border-green-500/20',
    ready: 'bg-green-500/10 text-green-400 border-green-500/20',
    processing: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    queued: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    pending: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${styles[status] || 'bg-white/5 text-white/40 border-white/10'}`}>
      {status}
    </span>
  );
}

function sortShuffled<T>(arr: T[]): T[] { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
