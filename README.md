# ClipForge — Vercel-ready media converter

A responsive browser-based media converter. Conversion uses FFmpeg WebAssembly in the visitor's browser; media files are not uploaded to your server.

## Deploy to Vercel
1. Extract this ZIP.
2. Push the `clipforge-vercel` folder to a GitHub repository.
3. In Vercel, choose **Add New → Project** and import the repository.
4. Vercel should detect Vite. Use:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
5. Deploy.

You can also run it locally with Node.js 20+:
```bash
npm install
npm run dev
```

## Features
- MP3 output with 128, 192, or 320 kbps options.
- MP4 output with 360p, 480p, 720p, and 1080p target-height options.
- Optional audio track for MP4 output.
- Direct audio/video URL input (the source must allow cross-origin browser access).
- YouTube video/Shorts link preview.
- Local in-browser processing; no upload API or secrets required.

## Important limitations
- YouTube links are preview-only. ClipForge does not download YouTube videos or streams. For videos you own, download them through YouTube Studio, then use a source that permits direct downloads and supports CORS to convert them by URL.
- Direct media URLs are fetched by your browser, not uploaded to ClipForge. The source must allow cross-origin access (CORS), return an audio/video file, and permit the download. Some URLs require sign-in, block browser access, or expire and will not work.
- Browser conversion is resource-intensive and large files may fail or run slowly, especially on mobile devices. First-time use downloads the FFmpeg WebAssembly engine.
- MP4 resolution is a target maximum height; the source's dimensions are preserved proportionally. FFmpeg WebAssembly codecs and browser memory limits vary by device.
- Vite serves the static app on Vercel; there is no long-running media server to configure.
