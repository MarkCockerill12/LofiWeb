import assetManifest from './asset-manifest.json';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  category?: string;
}

export interface BackgroundScene {
  id: string;
  name: string;
  videoUrl: string;
  thumbnailUrl: string;
  category?: string;
}

export interface SoundEffect {
  id: string;
  name: string;
  url: string;
}

// Export data directly from the generated manifest
const isDev = process.env.NODE_ENV === 'development';
const R2_BASE = "https://pub-699441ce0cfb40449cc458823a3f1ed2.r2.dev/lofi-station";

function getUrl(url: string) {
  if (isDev) {
    return url.replace(R2_BASE, '/media');
  }
  return url;
}

function inferCategory(path: string, type: 'bg' | 'music'): string {
    try {
        // Expected format: .../lofi-station/music/CategoryName/Track.mp3
        // or /media/music/CategoryName/Track.mp3
        
        // Remove query params if any
        const cleanPath = path.split('?')[0];
        const parts = cleanPath.split('/');
        
        // Find the 'music' or 'backgrounds' segment
        // Note: The R2 path suggests 'lofi-station/music/...'
        // or '.../backgrounds/...'
        
        let targetIndex = -1;
        if (type === 'music') {
            targetIndex = parts.findIndex(p => p === 'music');
        } else {
             // Check for common background folder names or 'backgrounds' if that's the convention
             // Based on previous manifest usage, scenes might be in root or specific folders.
             // Let's assume 'backgrounds' or just look at the parent directory of the file.
             
             // If we can't find a keyword, use the parent folder name
             // But 'lofi-station' might be the parent.
             
             targetIndex = parts.findIndex(p => p === 'backgrounds' || p === 'scenes');
        }
        
        if (targetIndex !== -1 && targetIndex < parts.length - 1) {
            // The folder AFTER music/backgrounds is the category
            // e.g. music/Lofi/track.mp3 -> Lofi
            // But if the file is directly in music/, then no category?
            // music/track.mp3 -> parts[targetIndex+1] is 'track.mp3'
            
            const candidate = parts[targetIndex + 1];
            
            // Check if it's not the filename (has extension)
            if (!candidate.includes('.')) {
                // Decode URI component to handle spaces/special chars
                return decodeURIComponent(candidate);
            }
        }
        
        // Fallback: If no folder structure found, use existing logic or 'Other'
        const lower = path.toLowerCase();
        if (type === 'bg') {
             if (lower.includes('anime')) return 'Anime';
             if (lower.includes('cyber') || lower.includes('neon')) return 'Sci-Fi';
             if (lower.includes('nature') || lower.includes('forest') || lower.includes('rain')) return 'Nature';
             if (lower.includes('room') || lower.includes('study')) return 'Cozy';
             return 'Other';
        } else {
             if (lower.includes('game') || lower.includes('nintendo') || lower.includes('zelda')) return 'Video Game';
             if (lower.includes('lofi') || lower.includes('hop')) return 'Lofi';
             if (lower.includes('classical')) return 'Classical';
             if (lower.includes('jazz')) return 'Jazz';
             return 'Lofi';
        }
    } catch (e) {
        return 'Other';
    }
}

export const musicTracks: MusicTrack[] = assetManifest.musicTracks.map(t => ({
  ...t,
  url: getUrl(t.url),
  category: (t as any).category || inferCategory(t.url, 'music')
}));

export const backgroundScenes: BackgroundScene[] = assetManifest.backgroundScenes.map(s => ({
  ...s,
  videoUrl: getUrl(s.videoUrl),
  thumbnailUrl: getUrl(s.thumbnailUrl),
  category: (s as any).category || inferCategory(s.videoUrl, 'bg')
}));

// Logic to find specific alarm sound or fallback
export const alarmSounds: SoundEffect[] = [
  { 
    id: 'alarm-1', 
    name: 'Gentle Chime', 
    url: getUrl(assetManifest.ambienceSounds.find((s: any) => s.name.includes('chime'))?.url || '')
  }
];

export const ambienceSounds = assetManifest.ambienceSounds.map((s: any) => ({
  ...s,
  url: getUrl(s.url)
}));
