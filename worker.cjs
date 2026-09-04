// @ts-nocheck
const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const { promisify } = require('util');
const { mkdir, stat } = require('fs/promises');
const { join } = require('path');

const execAsync = promisify(exec);
const prisma = new PrismaClient();

const WORK_DIR = '/tmp/insta-worker';
const YT_DLP = join(__dirname, 'yt-dlp');
const FFMPEG = '/usr/bin/ffmpeg';
const FFPROBE = '/usr/bin/ffprobe';

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

async function createClips(videoId, userId, inputPath, totalDuration, clipCount, clipDuration, userTitles, userHashtags, userKeywords) {
  const workDir = join(WORK_DIR, videoId);
  await mkdir(workDir, { recursive: true });

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) return 0;

  const baseTitles = userTitles?.length > 0 ? userTitles : [video.title];
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

    await prisma.clip.create({
      data: {
        videoId,
        userId,
        title: clipTitle,
        filePath: outputPath,
        duration: endTime - startTime,
        startTime,
        endTime,
        status: 'ready',
        hashtags: clipHashtags,
        keywords: clipKeywords,
        titles: baseTitles,
      },
    });

    clipsCreated++;
  }

  return clipsCreated;
}

async function processDownloadAndClipJob(job) {
  const data = JSON.parse(job.data || '{}');
  const { videoId, youtubeUrl, clipCount = 5, clipDuration = 60 } = data;

  await prisma.job.update({ where: { id: job.id }, data: { status: 'processing', progress: 5 } });

  const inputPath = join(WORK_DIR, videoId, 'input.mp4');
  
  let totalDuration = 0;
  try {
    totalDuration = await downloadVideo(videoId, youtubeUrl, inputPath);
    await prisma.video.update({ where: { id: videoId }, data: { status: 'downloaded', duration: totalDuration, filePath: inputPath } });
    await prisma.job.update({ where: { id: job.id }, data: { progress: 30 } });
  } catch (err) {
    await prisma.job.update({ where: { id: job.id }, data: { status: 'failed', error: `Download failed: ${err.message}` } });
    await prisma.video.update({ where: { id: videoId }, data: { status: 'failed' } });
    return;
  }

  try {
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    const clipsCreated = await createClips(videoId, job.userId, inputPath, totalDuration, clipCount, clipDuration, video?.titles || [], video?.hashtags || [], video?.keywords || []);
    await prisma.video.update({ where: { id: videoId }, data: { status: 'completed' } });
    await prisma.job.update({ where: { id: job.id }, data: { status: 'completed', progress: 100, result: JSON.stringify({ clipsCreated, totalDuration }) } });
  } catch (err) {
    await prisma.job.update({ where: { id: job.id }, data: { status: 'failed', error: `Clip failed: ${err.message}` } });
  }
}

async function processPublishJob(job) {
  const data = JSON.parse(job.data || '{}');
  const { clipIds, minWait = 20, maxWait = 30 } = data;

  await prisma.job.update({ where: { id: job.id }, data: { status: 'processing', progress: 10 } });

  const clips = await prisma.clip.findMany({ where: { id: { in: clipIds }, status: 'ready' } });
  const shuffled = shuffle(clips);
  let published = 0;

  for (const clip of shuffled) {
    await new Promise(resolve => setTimeout(resolve, randomInt(minWait, maxWait) * 1000));
    await prisma.clip.update({ where: { id: clip.id }, data: { instagramStatus: 'published', publishedAt: new Date() } });
    published++;
    await prisma.job.update({ where: { id: job.id }, data: { progress: Math.round((published / shuffled.length) * 100) } });
  }

  await prisma.job.update({ where: { id: job.id }, data: { status: 'completed', progress: 100, result: JSON.stringify({ published }) } });
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
        await prisma.job.update({ where: { id: job.id }, data: { status: 'failed', error: `Unknown job type: ${job.type}` } });
    }
  } catch (err) {
    await prisma.job.update({ where: { id: job.id }, data: { status: 'failed', error: err.message } });
  }
}

async function pollJobs() {
  const job = await prisma.job.findFirst({ where: { status: 'pending' }, orderBy: { createdAt: 'asc' } });
  if (job) {
    console.log(`Processing job ${job.id} (${job.type})`);
    await processJob(job);
  } else {
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

async function main() {
  console.log('Worker started, polling for jobs...');
  await mkdir(WORK_DIR, { recursive: true });

  await prisma.job.updateMany({ where: { status: 'processing' }, data: { status: 'pending', progress: 0 } });

  while (true) {
    await pollJobs();
  }
}

main().catch(console.error);
