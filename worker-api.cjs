// Insta Worker API-based - runs on EC2, calls Vercel API to get jobs
const YT_DLP = '/tmp/yt-dlp';
const FFMPEG = '/usr/bin/ffmpeg';
const FFPROBE = '/usr/bin/ffprobe';
const { exec } = require('child_process');
const { promisify } = require('util');
const { mkdir, stat } = require('fs/promises');
const { join } = require('path');

const execAsync = promisify(exec);
const WORK_DIR = '/tmp/insta-worker';
const API_BASE = 'https://instamovie.duckdns.org';
const WORKER_SECRET = 'worker-secret';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr, count) {
  return shuffle(arr).slice(0, Math.min(count, arr.length));
}

function generateHashtags() {
  const pool = ['#viral', '#trending', '#fyp', '#foryou', '#reels', '#reelsinstagram', '#instadaily', '#instagood', '#explore', '#shorts', '#video', '#content', '#creator', '#socialmedia', '#growth', '#follow', '#like', '#share', '#entertainment', '#fun', '#comedy', '#lifestyle', '#motivation'];
  return pickRandom(pool, randomInt(8, 12));
}

function generateKeywords() {
  const pool = ['viral', 'trending', 'fyp', 'foryou', 'reels', 'shorts', 'entertainment', 'comedy', 'fun', 'lifestyle', 'motivation', 'instagram', 'video', 'content', 'creator', 'social', 'growth', 'engagement', 'audience', 'followers'];
  return pickRandom(pool, randomInt(10, 15));
}

async function fileExists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function downloadVideo(videoId, youtubeUrl, inputPath) {
  const videoDir = join(WORK_DIR, videoId);
  await mkdir(videoDir, { recursive: true });

  if (!await fileExists(YT_DLP)) {
    try {
      await execAsync('curl -sL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /tmp/yt-dlp && chmod +x /tmp/yt-dlp');
    } catch (e) {
      throw new Error('yt-dlp not found and could not download');
    }
  }

  const cmd = `${YT_DLP} -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${inputPath}" "${youtubeUrl}" --no-check-certificates --no-warnings --no-playlist 2>&1`;
  
  try {
    await execAsync(cmd, { timeout: 300000 });
  } catch (err) {
    throw new Error(`Download failed: ${err.message}`);
  }

  if (!await fileExists(inputPath)) {
    throw new Error('Download completed but file not found');
  }

  let totalDuration = 0;
  try {
    const { stdout } = await execAsync(`${FFPROBE} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}" 2>&1`);
    totalDuration = Math.floor(parseFloat(stdout.trim()) || 0);
  } catch {}

  return totalDuration;
}

async function createClips(videoId, inputPath, totalDuration, clipCount, clipDuration, userTitles, userHashtags, userKeywords) {
  const workDir = join(WORK_DIR, videoId);
  await mkdir(workDir, { recursive: true });

  const baseTitles = userTitles?.length > 0 ? userTitles : ['Video Clip'];
  const baseHashtags = userHashtags?.length > 0 ? userHashtags : generateHashtags();
  const baseKeywords = userKeywords?.length > 0 ? userKeywords : generateKeywords();

  let clipsCreated = 0;

  for (let i = 0; i < clipCount; i++) {
    const maxStart = Math.max(0, totalDuration - clipDuration);
    const startTime = randomInt(0, maxStart);
    const endTime = Math.min(startTime + clipDuration, totalDuration);
    const outputPath = join(workDir, `clip-${i + 1}.mp4`);

    try {
      await execAsync(`${FFMPEG} -y -threads 0 -i "${inputPath}" -ss ${startTime} -t ${endTime - startTime} -c:v libx264 -preset ultrafast -crf 23 -c:a aac -b:a 128k -movflags +faststart "${outputPath}" 2>&1`);
    } catch { continue; }

    const clipTitle = pickRandom(baseTitles, 1)[0];
    const clipHashtags = pickRandom(baseHashtags, 5);
    const clipKeywords = pickRandom(baseKeywords, 8);

    try {
      await fetch(`${API_BASE}/api/clips/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WORKER_SECRET}` },
        body: JSON.stringify({
          videoId,
          title: clipTitle,
          filePath: outputPath,
          duration: endTime - startTime,
          startTime,
          endTime,
          hashtags: clipHashtags,
          keywords: clipKeywords,
          titles: baseTitles,
        }),
      });
    } catch { continue; }

    clipsCreated++;
  }

  return clipsCreated;
}

async function processDownloadAndClipJob(job) {
  // Parse job.data - could be string or object
  let data;
  try {
    data = typeof job.data === 'string' ? JSON.parse(job.data) : job.data;
  } catch (e) {
    await fetch(`${API_BASE}/api/jobs/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WORKER_SECRET}` },
      body: JSON.stringify({ jobId: job.id, status: 'failed', error: `Invalid job data: ${e.message}` }),
    });
    return;
  }

  const { videoId, youtubeUrl, clipCount = 5, clipDuration = 60 } = data;
  
  if (!videoId || !youtubeUrl) {
    await fetch(`${API_BASE}/api/jobs/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WORKER_SECRET}` },
      body: JSON.stringify({ jobId: job.id, status: 'failed', error: 'Missing videoId or youtubeUrl in job data' }),
    });
    return;
  }

  await fetch(`${API_BASE}/api/jobs/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WORKER_SECRET}` },
    body: JSON.stringify({ jobId: job.id, status: 'processing', progress: 5 }),
  });

  const inputPath = join(WORK_DIR, videoId, 'input.mp4');
  
  let totalDuration = 0;
  try {
    totalDuration = await downloadVideo(videoId, youtubeUrl, inputPath);
    
    await fetch(`${API_BASE}/api/videos/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WORKER_SECRET}` },
      body: JSON.stringify({ videoId, status: 'downloaded', duration: totalDuration, filePath: inputPath }),
    });
    
    await fetch(`${API_BASE}/api/jobs/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WORKER_SECRET}` },
      body: JSON.stringify({ jobId: job.id, progress: 30 }),
    });
  } catch (err) {
    await fetch(`${API_BASE}/api/jobs/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WORKER_SECRET}` },
      body: JSON.stringify({ jobId: job.id, status: 'failed', error: `Download failed: ${err.message}` }),
    });
    return;
  }

  try {
    const clipsCreated = await createClips(videoId, inputPath, totalDuration, clipCount, clipDuration, [], [], []);
    
    await fetch(`${API_BASE}/api/videos/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WORKER_SECRET}` },
      body: JSON.stringify({ videoId, status: 'completed' }),
    });
    
    await fetch(`${API_BASE}/api/jobs/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WORKER_SECRET}` },
      body: JSON.stringify({ jobId: job.id, status: 'completed', progress: 100, result: JSON.stringify({ clipsCreated, totalDuration }) }),
    });
  } catch (err) {
    await fetch(`${API_BASE}/api/jobs/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WORKER_SECRET}` },
      body: JSON.stringify({ jobId: job.id, status: 'failed', error: `Clip failed: ${err.message}` }),
    });
  }
}

async function processPublishJob(job) {
  let data;
  try {
    data = typeof job.data === 'string' ? JSON.parse(job.data) : job.data;
  } catch (e) {
    await fetch(`${API_BASE}/api/jobs/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WORKER_SECRET}` },
      body: JSON.stringify({ jobId: job.id, status: 'failed', error: `Invalid job data: ${e.message}` }),
    });
    return;
  }

  const { clipIds, minWait = 20, maxWait = 30 } = data;

  await fetch(`${API_BASE}/api/jobs/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WORKER_SECRET}` },
    body: JSON.stringify({ jobId: job.id, status: 'processing', progress: 10 }),
  });

  const clips = shuffle(clipIds);
  let published = 0;

  for (const clipId of clips) {
    await new Promise(resolve => setTimeout(resolve, randomInt(minWait, maxWait) * 1000));
    await fetch(`${API_BASE}/api/clips/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WORKER_SECRET}` },
      body: JSON.stringify({ clipId }),
    });
    published++;
    await fetch(`${API_BASE}/api/jobs/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WORKER_SECRET}` },
      body: JSON.stringify({ jobId: job.id, progress: Math.round((published / clips.length) * 100) }),
    });
  }

  await fetch(`${API_BASE}/api/jobs/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WORKER_SECRET}` },
    body: JSON.stringify({ jobId: job.id, status: 'completed', progress: 100, result: JSON.stringify({ published }) }),
  });
}

async function processJob(job) {
  try {
    switch (job.type) {
      case 'download_and_clip':
        await processDownloadAndClipJob(job);
        break;
      case 'publish':
        await processPublishJob(job);
        break;
      default:
        await fetch(`${API_BASE}/api/jobs/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WORKER_SECRET}` },
          body: JSON.stringify({ jobId: job.id, status: 'failed', error: `Unknown job type: ${job.type}` }),
        });
    }
  } catch (err) {
    await fetch(`${API_BASE}/api/jobs/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WORKER_SECRET}` },
      body: JSON.stringify({ jobId: job.id, status: 'failed', error: err.message }),
    });
  }
}

async function pollJobs() {
  try {
    const res = await fetch(`${API_BASE}/api/jobs/pending`, {
      headers: { Authorization: `Bearer ${WORKER_SECRET}` },
    });
    
    if (!res.ok) {
      console.error('Poll failed:', res.status);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return;
    }
    
    const data = await res.json();
    if (data && data.job) {
      console.log(`Processing job ${data.job.id} (${data.job.type})`);
      await processJob(data.job);
    } else {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  } catch (err) {
    console.error('Poll error:', err.message);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

async function main() {
  console.log('Worker started (API-based), polling for jobs...');
  await mkdir(WORK_DIR, { recursive: true });

  while (true) {
    await pollJobs();
  }
}

main().catch(console.error);
