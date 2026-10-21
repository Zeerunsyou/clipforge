import './style.css';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const $ = (s) => document.querySelector(s);
const app = $('#app');

app.innerHTML = `
  <div class="ambient ambient-one"></div><div class="ambient ambient-two"></div>
  <header class="topbar">
    <a class="brand" href="#"><span class="brand-mark"><i data-lucide="clapperboard"></i></span><span>clip<span class="brand-accent">forge</span></span></a>
    <div class="top-right"><span class="status-dot"></span><span>PRIVATE BY DESIGN</span><span class="top-divider"></span><span class="version">STUDIO / 01</span></div>
  </header>
  <main>
    <section class="hero">
      <div class="eyebrow"><span class="eyebrow-line"></span> YOUR MEDIA. YOUR FORMAT.</div>
      <h1>Make it <span class="gradient-text">yours.</span></h1>
      <p class="hero-copy">A cleaner way to convert media. Choose your format, dial in the quality, and let your browser do the work.</p>
    </section>
    <section class="studio-card">
      <div class="card-heading"><div><div class="section-kicker">01 / SOURCE</div><h2>Paste a media link</h2></div><span class="local-badge"><i data-lucide="shield-check"></i> Runs locally</span></div>
      <div class="url-row">
        <div class="url-input-wrap"><i data-lucide="link-2"></i><input id="urlInput" type="url" placeholder="Paste a direct MP4, WEBM, MP3, or WAV URL..." autocomplete="url" /></div>
        <button class="button button-secondary" id="useUrlBtn">Use link <i data-lucide="arrow-up-right"></i></button>
      </div>
      <div class="url-note"><i data-lucide="info"></i><span>Use a direct media link from a source that permits downloads and allows browser access (CORS). YouTube links are preview-only; they can’t be downloaded here.</span></div>
      <div id="previewBox" class="preview-box hidden"></div>
      <div class="file-info hidden" id="fileInfo"><span class="file-type"><i data-lucide="file-video"></i></span><span class="file-meta"><strong id="fileName">filename.mp4</strong><small id="fileSize">Direct media link</small></span><button class="icon-button" id="removeSource" aria-label="Clear media link"><i data-lucide="x"></i></button></div>
    </section>
    <section class="studio-card settings-card">
      <div class="card-heading"><div><div class="section-kicker">02 / OUTPUT</div><h2>Shape the result</h2></div><span class="step-count">3 SETTINGS</span></div>
      <div class="settings-grid">
        <div class="field"><label class="field-label">FORMAT</label><div class="segmented" id="formatGroup"><button class="segment active" data-format="mp3"><i data-lucide="audio-lines"></i> MP3</button><button class="segment" data-format="mp4"><i data-lucide="film"></i> MP4</button></div></div>
        <div class="field"><label class="field-label" for="quality">QUALITY</label><div class="select-wrap"><select id="quality"><option value="192">Standard · 192 kbps</option><option value="320" selected>High · 320 kbps</option><option value="128">Compact · 128 kbps</option></select><i data-lucide="chevron-down"></i></div></div>
        <div class="field field-wide"><label class="field-label">AUDIO TRACK</label><div class="sound-setting"><span class="sound-icon"><i data-lucide="volume-2"></i></span><span class="sound-copy"><strong>Include sound</strong><small>Turn off to export a silent MP4 video</small></span><button id="soundToggle" class="toggle on" role="switch" aria-checked="true" aria-label="Include sound"><span></span></button></div></div>
      </div>
      <div class="quality-hint" id="qualityHint"><i data-lucide="sparkles"></i><span>High quality audio · 320 kbps MP3</span></div>
      <button id="convertBtn" class="button button-primary" disabled><i data-lucide="wand-sparkles"></i><span id="convertText">Paste a media link to begin</span><i class="button-arrow" data-lucide="arrow-right"></i></button>
      <div id="progressWrap" class="progress-wrap hidden"><div class="progress-label"><span id="progressText">Preparing converter…</span><span id="progressPct">0%</span></div><div class="progress-track"><div id="progressBar"></div></div></div>
      <div id="resultBox" class="result-box hidden"></div>
    </section>
    <div class="privacy-line"><i data-lucide="lock-keyhole"></i><span>YOUR FILES STAY YOURS</span><span class="privacy-sep">·</span><span>PROCESSING HAPPENS IN YOUR BROWSER</span></div>
    <footer><span>© 2026 CLIPFORGE STUDIO</span><span>BUILT FOR YOUR WORKFLOW <i data-lucide="heart"></i></span></footer>
  </main>
`;

function icons() {
  document.querySelectorAll('[data-lucide]').forEach((el) => {
    const name = el.getAttribute('data-lucide');
    const paths = {
      clapperboard: '<path d="m4 2 16 0 2 5H2L4 2Z"/><path d="M2 7h20v13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7Z"/><path d="m8 2 2 5m4-5 2 5"/>',
      'shield-check': '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
      'upload-cloud': '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M20 16.6A5 5 0 0 0 18 7h-1.3A8 8 0 1 0 4 16.25"/><path d="M8 16h8"/>',
      'link-2': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
      'arrow-up-right': '<path d="M7 17 17 7"/><path d="M7 7h10v10"/>', info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>',
      'file-video': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="m10 12 5 3-5 3z"/>',
      x: '<path d="m18 6-12 12M6 6l12 12"/>', 'audio-lines': '<path d="M2 10v4m4-7v10m4-13v16m4-11v6m4-9v12m4-8v4"/>',
      film: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M3 7h4m-4 5h4m-4 5h4m10-14v18m0-14h4m-4 5h4m-4 5h4"/>',
      'chevron-down': '<path d="m6 9 6 6 6-6"/>', 'volume-2': '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07m3.53-10.6a10 10 0 0 1 0 14.14"/>',
      'sparkles': '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z"/>',
      'wand-sparkles': '<path d="m15 4 5 5M13 6l2-2 5 5-2 2"/><path d="m3 21 10-10"/><path d="m6 4 .7 2.3L9 7l-2.3.7L6 10l-.7-2.3L3 7l2.3-.7L6 4Z"/><path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L17 17l2.3-.7L19 14Z"/>',
      'arrow-right': '<path d="M5 12h14m-7-7 7 7-7 7"/>', 'lock-keyhole': '<circle cx="12" cy="16" r="1"/><rect width="14" height="11" x="5" y="11" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/>',
      heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>',
      download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
      check: '<path d="m20 6-11 11-5-5"/>', 'external-link': '<path d="M15 3h6v6"/><path d="m10 14 11-11"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'
    };
    el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
  });
}
icons();

let sourceUrl = null;
let sourceName = '';
let format = 'mp3';
let includeSound = true;
let ffmpeg = null;
let busy = false;

const setProgress = (pct, label) => {
  $('#progressWrap').classList.remove('hidden');
  $('#progressBar').style.width = `${pct}%`;
  $('#progressPct').textContent = `${Math.round(pct)}%`;
  $('#progressText').textContent = label;
};
const formatBytes = (bytes) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
const safeName = (name) => name.replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '_').slice(0, 90) || 'converted-media';

function isYoutubeHost(hostname) {
  const host = hostname.toLowerCase();
  return host === 'youtu.be' || host.endsWith('.youtu.be') ||
    host === 'youtube.com' || host.endsWith('.youtube.com') ||
    host === 'youtube-nocookie.com' || host.endsWith('.youtube-nocookie.com') ||
    host === 'googlevideo.com' || host.endsWith('.googlevideo.com');
}
function showSourceError(message) {
  const box = $('#previewBox');
  box.classList.remove('hidden');
  box.innerHTML = '';
  const error = document.createElement('p');
  error.className = 'error-text';
  error.textContent = message;
  box.append(error);
}
function clearSource() {
  sourceUrl = null;
  sourceName = '';
  $('#fileInfo').classList.add('hidden');
  $('#convertBtn').disabled = true;
  $('#convertText').textContent = 'Paste a media link to begin';
  $('#resultBox').classList.add('hidden');
  $('#progressWrap').classList.add('hidden');
}
function setMediaSource(raw) {
  clearSource();
  let url;
  try {
    url = new URL(raw);
  } catch {
    showSourceError('Enter a valid direct media URL.');
    return;
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    showSourceError('Use a public HTTP or HTTPS media URL without embedded credentials.');
    return;
  }
  if (isYoutubeHost(url.hostname)) {
    const id = parseYoutubeId(url.toString());
    if (!id) {
      showSourceError('This YouTube URL can’t be previewed. YouTube videos are preview-only and can’t be downloaded here.');
      return;
    }
    $('#previewBox').classList.remove('hidden');
    $('#previewBox').innerHTML = `<div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}" title="YouTube video preview" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div><div class="preview-caption"><i data-lucide="external-link"></i> Preview only · Use a permitted direct media link to convert.</div>`;
    icons();
    return;
  }
  sourceUrl = url.toString();
  const lastPathPart = url.pathname.split('/').pop() || 'media';
  try {
    sourceName = decodeURIComponent(lastPathPart);
  } catch {
    sourceName = lastPathPart;
  }
  sourceName = sourceName.replace(/[^\w.-]+/g, '_').slice(0, 90) || 'media';
  $('#fileInfo').classList.remove('hidden');
  $('#fileName').textContent = sourceName;
  $('#fileSize').textContent = 'Direct link · fetched to this browser only';
  $('#convertBtn').disabled = false;
  $('#convertText').textContent = 'Convert media link';
  $('#previewBox').classList.add('hidden');
  $('#resultBox').classList.add('hidden');
  $('#progressWrap').classList.add('hidden');
}
$('#useUrlBtn').addEventListener('click', () => setMediaSource($('#urlInput').value.trim()));
$('#urlInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') setMediaSource($('#urlInput').value.trim());
});
$('#urlInput').addEventListener('input', () => {
  clearSource();
  $('#previewBox').classList.add('hidden');
});
$('#removeSource').addEventListener('click', () => {
  clearSource();
  $('#urlInput').value = '';
  $('#previewBox').classList.add('hidden');
});
document.querySelectorAll('[data-format]').forEach(btn => btn.addEventListener('click', () => {
  format = btn.dataset.format;
  document.querySelectorAll('[data-format]').forEach(b => b.classList.toggle('active', b === btn));
  const quality = $('#quality');
  if (format === 'mp3') {
    quality.innerHTML = '<option value="128">Compact · 128 kbps</option><option value="192">Standard · 192 kbps</option><option value="320" selected>High · 320 kbps</option>';
    $('#qualityHint').innerHTML = '<i data-lucide="sparkles"></i><span>High quality audio · 320 kbps MP3</span>';
    $('#soundToggle').disabled = true; includeSound = true; $('#soundToggle').classList.add('on'); $('#soundToggle').setAttribute('aria-checked','true');
  } else {
    quality.innerHTML = '<option value="360">360p · Compact</option><option value="480">480p · Standard</option><option value="720" selected>720p · HD</option><option value="1080">1080p · Full HD</option>';
    $('#qualityHint').innerHTML = '<i data-lucide="sparkles"></i><span>HD video · H.264 MP4 output</span>';
    $('#soundToggle').disabled = false;
  }
  icons(); updateHint();
}));
$('#quality').addEventListener('change', updateHint);
function updateHint() {
  const q = $('#quality').value;
  $('#qualityHint').innerHTML = `<i data-lucide="sparkles"></i><span>${format === 'mp3' ? `${q} kbps audio · MP3 output` : `${q}p target · MP4 video output`}</span>`;
  icons();
}
$('#soundToggle').addEventListener('click', () => {
  if (format === 'mp3') return;
  includeSound = !includeSound;
  $('#soundToggle').classList.toggle('on', includeSound);
  $('#soundToggle').setAttribute('aria-checked', String(includeSound));
  $('#soundToggle').innerHTML = '<span></span>';
  updateHint();
});
function parseYoutubeId(raw) {
  try {
    const u = new URL(raw);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('/')[0];
    if (['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(u.hostname)) {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/);
      return m?.[1] || null;
    }
  } catch {}
  return null;
}
async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;
  ffmpeg = new FFmpeg();
  ffmpeg.on('progress', ({ progress }) => setProgress(Math.min(96, Math.max(1, progress * 100)), 'Converting your media…'));
  ffmpeg.on('log', ({ message }) => console.debug('[ClipForge]', message));
  const base = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
  setProgress(2, 'Loading conversion engine…');
  await ffmpeg.load({
    coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm')
  });
  return ffmpeg;
}
$('#convertBtn').addEventListener('click', async () => {
  if (!sourceUrl || busy) return;
  busy = true; $('#convertBtn').disabled = true; $('#resultBox').classList.add('hidden');
  const original = safeName(sourceName);
  const extension = sourceName.match(/\.([^.]+)$/)?.[1];
  const ext = extension?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const input = `input.${ext}`, output = `${original}.${format}`;
  try {
    const engine = await loadFFmpeg();
    setProgress(5, 'Fetching source media…');
    let response;
    try {
      response = await fetch(sourceUrl, { credentials: 'omit' });
    } catch {
      throw new Error('Could not access that link. The source must allow cross-origin browser access (CORS) and permit downloads.');
    }
    if (!response.ok) throw new Error(`The media source returned HTTP ${response.status}.`);
    if (isYoutubeHost(new URL(response.url).hostname)) {
      throw new Error('YouTube links and YouTube media streams can’t be downloaded here. Use a permitted direct media link instead.');
    }
    const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const supportedExtensions = /\.(?:aac|avi|flac|m4a|m4v|mkv|mov|mp3|mp4|mpeg|mpg|ogg|wav|webm)$/i;
    if (!contentType.startsWith('audio/') && !contentType.startsWith('video/') &&
      contentType !== 'application/octet-stream' && !(contentType === '' && supportedExtensions.test(new URL(sourceUrl).pathname))) {
      throw new Error('That URL did not return a recognizable audio or video file.');
    }
    const media = await response.blob();
    if (!media.size) throw new Error('The media source returned an empty file.');
    setProgress(8, 'Preparing your media…');
    await engine.writeFile(input, await fetchFile(media));
    let args;
    if (format === 'mp3') {
      args = ['-i', input, '-vn', '-codec:a', 'libmp3lame', '-b:a', `${$('#quality').value}k`, '-y', output];
    } else {
      args = ['-i', input, '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-vf', `scale=-2:min(ih\\,${$('#quality').value})`, '-pix_fmt', 'yuv420p'];
      if (includeSound) args.push('-c:a', 'aac', '-b:a', '192k');
      else args.push('-an');
      args.push('-movflags', '+faststart', '-y', output);
    }
    setProgress(8, 'Converting your media…');
    const exitCode = await engine.exec(args);
    if (exitCode !== 0) throw new Error('Conversion failed. Try a different input file or format.');
    const data = await engine.readFile(output);
    const mime = format === 'mp3' ? 'audio/mpeg' : 'video/mp4';
    const blob = new Blob([data.buffer], { type: mime });
    const url = URL.createObjectURL(blob);
    $('#progressBar').style.width = '100%'; $('#progressPct').textContent = '100%'; $('#progressText').textContent = 'Conversion complete';
    $('#resultBox').classList.remove('hidden');
    $('#resultBox').innerHTML = `<div class="result-icon"><i data-lucide="check"></i></div><div class="result-copy"><strong>Your file is ready</strong><small>${output} · ${formatBytes(blob.size)}</small></div><a class="download-button" href="${url}" download="${output}"><i data-lucide="download"></i> Download</a>`;
    icons();
    await engine.deleteFile(input).catch(() => {}); await engine.deleteFile(output).catch(() => {});
  } catch (err) {
    console.error(err);
    $('#resultBox').classList.remove('hidden');
    $('#resultBox').innerHTML = `<div class="error-result"><i data-lucide="info"></i><span>${String(err?.message || err).replace(/[<>&]/g, '')}</span></div>`;
    icons();
  } finally {
    busy = false; $('#convertBtn').disabled = !sourceUrl;
  }
});
