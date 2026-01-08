export interface MusicTrack {
  id: string
  title: string
  artist: string
  url: string
}

export interface BackgroundScene {
  id: string
  name: string
  videoUrl: string
  fallbackUrl: string
  thumbnailUrl: string
}

export interface AlarmSound {
  id: string
  name: string
  url: string
}

const BASE_URL = "https://pub-699441ce0cfb40449cc458823a3f1ed2.r2.dev/lofi-app"

export const musicTracks: MusicTrack[] = [
  {
    id: "1",
    title: "Midnight Study",
    artist: "Lofi Beats",
    url: `${BASE_URL}/music/midnight-study.mp3`,
  },
  {
    id: "2",
    title: "Coffee Shop Vibes",
    artist: "Chill Hop",
    url: `${BASE_URL}/music/coffee-shop.mp3`,
  },
  {
    id: "3",
    title: "Rainy Day Focus",
    artist: "Study Sounds",
    url: `${BASE_URL}/music/rainy-day.mp3`,
  },
  {
    id: "4",
    title: "Sunset Dreams",
    artist: "Ambient Waves",
    url: `${BASE_URL}/music/sunset-dreams.mp3`,
  },
]

export const backgroundScenes: BackgroundScene[] = [
  {
    id: "1",
    name: "City Night",
    videoUrl: `${BASE_URL}/videos/city-night.webm`,
    fallbackUrl: `${BASE_URL}/videos/city-night.mp4`,
    thumbnailUrl: `${BASE_URL}/thumbnails/city-night.webp`,
  },
  {
    id: "2",
    name: "Cozy Room",
    videoUrl: `${BASE_URL}/videos/cozy-room.webm`,
    fallbackUrl: `${BASE_URL}/videos/cozy-room.mp4`,
    thumbnailUrl: `${BASE_URL}/thumbnails/cozy-room.webp`,
  },
  {
    id: "3",
    name: "Forest Path",
    videoUrl: `${BASE_URL}/videos/forest.webm`,
    fallbackUrl: `${BASE_URL}/videos/forest.mp4`,
    thumbnailUrl: `${BASE_URL}/thumbnails/forest.webp`,
  },
  {
    id: "4",
    name: "Ocean Waves",
    videoUrl: `${BASE_URL}/videos/ocean.webm`,
    fallbackUrl: `${BASE_URL}/videos/ocean.mp4`,
    thumbnailUrl: `${BASE_URL}/thumbnails/ocean.webp`,
  },
]

export const alarmSounds: AlarmSound[] = [
  {
    id: "1",
    name: "Gentle Chime",
    url: `${BASE_URL}/sounds/gentle-chime.mp3`,
  },
]
