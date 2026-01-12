import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// --- CONFIGURATION ---
const R2_BASE_URL = "https://pub-699441ce0cfb40449cc458823a3f1ed2.r2.dev/lofi-station";
const OUTPUT_FILE = 'lib/asset-manifest.json';

console.log("💿 Scanning Media Assets...");

async function generateManifest() {
  // 1. Scan for Music
  // Scans for mp3 and wav files in public/media/music
  const musicRoot = 'public/media/music';
  const musicFiles = await glob(`${musicRoot}/**/*.{mp3,wav}`);
  const musicTracks = musicFiles.map((file, index) => {
    // Get path relative to the music root folder
    // e.g. "Lofi/Track.mp3" or just "Track.mp3"
    const relPath = path.relative(musicRoot, file);
    
    // Extract category from folder name if it exists
    const dirname = path.dirname(relPath);
    const category = dirname === '.' ? 'Other' : dirname.replace(/\\/g, '/'); // Normalize slashes
    
    // Construct URL preserving folder structure (ensure forward slashes for URL)
    const urlPath = relPath.replace(/\\/g, '/');
    // Sanitize URL encoding if needed, or assume R2 handles spaces?
    // Best practice: Encode the components, but previous code didn't. 
    // Let's stick to raw path but correct structure first.
    // Actually, R2/Web URLs should be encoded. 
    const encodedUrlPath = urlPath.split('/').map(p => encodeURIComponent(p)).join('/');
    
    const filename = path.basename(file, path.extname(file));
    const cleanName = filename.replace(/^\d+\s*-\s*/, '').replace(/_/g, ' '); 

    return {
      id: `track-${index}`,
      title: cleanName,
      artist: "Lofi Selection", 
      url: `${R2_BASE_URL}/music/${encodedUrlPath}`,
      category: category // Add explicit category to manifest
    };
  });

  // 2. Scan for Backgrounds
  const bgRoot = 'public/media/backgrounds';
  const videoFiles = await glob(`${bgRoot}/**/*.{webm,mp4}`);
  // Group by filename to handle unique scenes? 
  // Original logic was: [...new Set(videoFiles.map(f => path.basename(f, ...)))]
  // This flattened folders. Let's preserve unique *relative* paths or assume uniqueness by ID.
  
  // Previous logic relied on name-based dedup. Let's assume files are 1:1 scenes.
  const backgroundScenes = videoFiles.map((file, index) => {
     const relPath = path.relative(bgRoot, file);
     const dirname = path.dirname(relPath);
     const category = dirname === '.' ? 'Other' : dirname.replace(/\\/g, '/');
     
     const filename = path.basename(file, path.extname(file));
     const name = filename.replace(/_/g, ' ');
     
     const urlPath = relPath.replace(/\\/g, '/');
     const encodedUrlPath = urlPath.split('/').map(p => encodeURIComponent(p)).join('/');
     
     // Detect ext for thumbnail? Assuming webp thumbnail in same structure
     // or just flattened 'thumbnails' folder? 
     // Old logic: .../backgrounds/thumbnails/${name}.webp
     // Let's keep thumbnails flat or guess subfolder. 
     // Usually thumbnails mirror video structure.
     // For safety, let's assume flat thumbnails for now unless user complains, 
     // or let's use the same folder structure for thumbnails if we can.
     
     return {
      id: `scene-${index}`,
      name: name,
      videoUrl: `${R2_BASE_URL}/backgrounds/${encodedUrlPath}`,
      thumbnailUrl: `${R2_BASE_URL}/backgrounds/thumbnails/${name}.webp`, // Updated to match local structure (public/media/backgrounds/thumbnails)
      category: category
    };
  });

  // 3. Scan for Ambience Sounds
  const soundFiles = await glob('public/media/sounds/**/*.{mp3,wav}');
  const ambienceSounds = soundFiles.map((file, index) => ({
    id: `sfx-${index}`,
    name: path.basename(file, path.extname(file)),
    url: `${R2_BASE_URL}/sounds/${path.basename(file)}`
  }));

  const data = {
    generatedAt: new Date().toISOString(),
    musicTracks,
    backgroundScenes,
    ambienceSounds
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
  console.log(`✅ Generated manifest with ${musicTracks.length} songs and ${backgroundScenes.length} scenes.`);
}

generateManifest();
