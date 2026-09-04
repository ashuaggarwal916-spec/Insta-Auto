// GitHub Actions Worker - ULTRA FAST - processes jobs continuously until none left
const YT_DLP = '/usr/local/bin/yt-dlp';
const FFMPEG = '/usr/bin/ffmpeg';
const FFPROBE = '/usr/bin/ffprobe';
const { exec } = require('child_process');
const { promisify } = require('util');
const { mkdir, stat } = require('fs/promises');
const { join } = require('path');

const execAsync = promisify(exec);
const WORK_DIR = '/tmp/insta-worker';
const API_BASE = 'https://instamovie.duckdns.org';
const WORKER_SECRET = process.env.WORKER_SECRET;
const CONCURRENT_JOBS = 3; // Process 3 videos in parallel

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

  // ULTRA FAST: Use best format, no conversion, direct download
  const cmd = `${YT_DLP} -f "best[ext=mp4]/best" -o "${inputPath}" "${youtubeUrl}" --no-check-certificates --no-warnings --no-playlist --downloader aria2c --downloader-args "aria2c:-x 16 -s 16 -k 1M" 2>&1`;
  
  await execAsync(cmd, { timeout: 120000 });

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

  // Create all clips in parallel for speed
  const clipPromises = [];
  for (let i = 0; i < clipCount; i++) {
    const maxStart = Math.max(0, totalDuration - clipDuration);
    const startTime = randomInt(0, maxStart);
    const endTime = Math.min(startTime + clipDuration, totalDuration);
    const outputPath = join(workDir, `clip-${i + 1}.mp4`);

    // ULTRA FAST: copy codec, no re-encoding, just remux
    const cmd = `${FFMPEG} -y -threads 0 -ss ${startTime} -i "${inputPath}" -t ${endTime - startTime} -c copy -movflags +faststart "${outputPath}" 2>&1`;
    
    clipPromises.push(
      execAsync(cmd, { timeout: 60000 }).then(async () => {
        const clipTitle = pickRandom(baseTitles, 1)[0];
        const clipHashtags = pickRandom(baseHashtags, 5);
        const clipKeywords = pickRandom(baseKeywords, 8);

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
        return true;
      }).catch(() => false)
    );
  }

  const results = await Promise.all(clipPromises);
  return results.filter(Boolean).length;
}

async function processJob(job) {
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
      body: JSON.stringify({ jobId: job.id, status: 'failed', error: 'Missing videoId or youtubeUrl' }),
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
    
    console.log(`Job ${job.id} completed: ${clipsCreated} clips, ${totalDuration}s`);
  } catch (err) {
    await fetch(`${API_BASE}/api/jobs/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WORKER_SECRET}` },
      body: JSON.stringify({ jobId: job.id, status: 'failed', error: `Clip failed: ${err.message}` }),
    });
  }
}

async function main() {
  console.log(`GitHub Actions Worker starting (concurrent: ${CONCURRENT_JOBS})...`);
  await mkdir(WORK_DIR, { recursive: true });

  let totalProcessed = 0;
  
  while (true) {
    // Get multiple pending jobs
    const jobs = [];
    for (let i = 0; i < CONCURRENT_JOBS; i++) {
      const res = await fetch(`${API_BASE}/api/jobs/pending`, {
        headers: { Authorization: `Bearer ${WORKER_SECRET}` },
      });
      
      if (!res.ok) {
        console.error('Failed to fetch jobs:', res.status);
        break;
      }
      
      const data = await res.json();
      if (!data.job) break;
      jobs.push(data.job);
    }

    if (jobs.length === 0) {
      console.log('No more pending jobs');
      break;
    }

    console.log(`Processing ${jobs.length} jobs in parallel...`);
    await Promise.all(jobs.map(job => processJob(job)));
    totalProcessed += jobs.length;
  }
  
  console.log(`Done. Total processed: ${totalProcessed}`);
}

main().catch(err => {
  console.error('Worker error:', err.message);
  process.exit(1);
});
