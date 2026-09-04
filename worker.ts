// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

const WORK_DIR = '/tmp/insta-worker';

function randomInt(min: number, max: number) {
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

function generateSEOTitle(baseTitle, index) {
  const templates = [
    `${baseTitle} - Part ${index + 1}`,
    `${baseTitle} #${index + 1}`,
    `Best of ${baseTitle} (${index + 1})`,
    `${baseTitle} [${index + 1}]`,
    `${baseTitle} | Must Watch ${index + 1}`,
    `${baseTitle} 🔥 ${index + 1}`,
  ];
  return templates[index % templates.length];
}

function generateSEOHashtags() {
  const pool = [
    '#viral', '#trending', '#fyp', '#foryou', '#foryoupage',
    '#reels', '#reelsinstagram', '#instadaily', '#instagood',
    '#explore', '#explorepage', '#trendingreels', '#viralreels',
    '#shorts', '#shortvideo', '#video', '#content', '#creator',
    '#socialmedia', '#growth', '#follow', '#like', '#share',
    '#entertainment', '#fun', '#comedy', '#lifestyle', '#motivation',
    '#instamood', '#photooftheday', '#love', '#beautiful', '#amazing',
  ];
  return pickRandom(pool, randomInt(8, 12));
}

function generateSEOKeywords() {
  const pool = [
    'viral', 'trending', 'fyp', 'foryou', 'reels', 'shorts',
    'entertainment', 'comedy', 'fun', 'lifestyle', 'motivation',
    'instagram', 'video', 'content', 'creator', 'social',
    'growth', 'engagement', 'audience', 'followers', 'views',
    'instadaily', 'instagood', 'photooftheday', 'love', 'beautiful',
  ];
  return pickRandom(pool, randomInt(10, 15));
}

async function downloadVideo(videoId, youtubeUrl, inputPath) {
  const videoDir = join(WORK_DIR, videoId);
  await mkdir(videoDir, { recursive: true });

  // Fast download with yt-dlp
  await execAsync(`/tmp/yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${inputPath}" "${youtubeUrl}" --no-check-certificates --no-warnings --no-playlist 2>&1`);

  let totalDuration = 0;
  try {
    const { stdout } = await execAsync(`/usr/bin/ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}" 2>&1`);
    totalDuration = Math.floor(parseFloat(stdout.trim()) || 0);
  } catch (e) { /* ignore */ }

  return totalDuration;
}

async function createClips(videoId, userId, inputPath, totalDuration, clipCount, clipDuration, userTitles, userHashtags, userKeywords) {
  const workDir = join(WORK_DIR, videoId);
  await mkdir(workDir, { recursive: true });

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) return 0;

  // Use user-provided metadata or generate defaults
  const baseTitles = userTitles?.length > 0 ? userTitles : [video.title];
  const baseHashtags = userHashtags?.length > 0 ? userHashtags : generateSEOHashtags();
  const baseKeywords = userKeywords?.length > 0 ? userKeywords : generateSEOKeywords();

  let clipsCreated = 0;

  for (let i = 0; i < clipCount; i++) {
    const maxStart = Math.max(0, totalDuration - clipDuration);
    const startTime = randomInt(0, maxStart);
    const endTime = Math.min(startTime + clipDuration, totalDuration);
    const outputPath = join(workDir, `clip-${i + 1}.mp4`);

    try {
      // Ultrafast clipping with multi-threading
      await execAsync(`/usr/bin/ffmpeg -y -threads 0 -i "${inputPath}" -ss ${startTime} -t ${endTime - startTime} -c:v libx264 -preset ultrafast -crf 23 -c:a aac -b:a 128k -movflags +faststart "${outputPath}" 2>&1`);
    } catch (e) { continue; }

    // Randomly select 1 title, 5 hashtags, 8 keywords per clip
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
  
  // Step 1: Download
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

  // Step 2: Create clips with user metadata
  try {
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    const clipsCreated = await createClips(
      videoId, 
      job.userId, 
      inputPath, 
      totalDuration, 
      clipCount, 
      clipDuration,
      video?.titles || [],
      video?.hashtags || [],
      video?.keywords || []
    );
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
