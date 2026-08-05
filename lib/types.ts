export interface MusicTrack {
  id: string
  title: string
  artist: string
  url: string
  category?: string
}

export interface BackgroundScene {
  id: string
  name: string
  videoUrl: string
  thumbnailUrl: string
  category?: string
}

export interface SoundEffect {
  id: string
  name: string
  url: string
}
