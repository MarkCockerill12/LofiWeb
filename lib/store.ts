import { create } from "zustand"
import { persist } from "zustand/middleware"
import { THEME_COLORS } from "./constants"
import { MusicTrack, BackgroundScene, SoundEffect, musicTracks, backgroundScenes, ambienceSounds } from "./data"

export type TimerMode = "focus" | "break"
export type ThemeColor = keyof typeof THEME_COLORS
export type ThemeVariant = "minimal" | "neon"

interface Todo {
  id: string
  text: string
  completed: boolean
}

interface Preferences {
  focusDuration: number // in minutes
  breakDuration: number // in minutes
  themeColor: ThemeColor
  secondaryColor: ThemeColor
  themeVariant: ThemeVariant
  timerOpacity: number
  volume: number
  ambientVolume: number
  uiMode: "auto" | "light" | "dark"
  showTime: boolean
  showTimer: boolean
  clockStyle: "default" | "clean" | "box" | "pill"
}

interface AmbientSounds {
  rain: boolean
  keyboard: boolean
  cafe: boolean
}

/** A named, recallable ambient blend. */
export interface AmbientPreset {
  id: string
  name: string
  sounds: AmbientSounds
  volume: number
}

interface AppState {
  // Timer state
  isPlaying: boolean
  timerMode: TimerMode
  timeLeft: number // in seconds

  // Media state
  currentTrackId: string
  currentSceneId: string
  musicPlaying: boolean
  musicDuration: number
  musicCurrentTime: number
  musicSeekRequest: number | null

  // Categorization & Favorites
  favoriteScenes: string[]
  favoriteTracks: string[]
  activePlaylist: string // "all", "favorites", or specific category

  // Explicit Queue Management
  queue: string[] // List of track IDs

  isShuffled: boolean

  // Visualizer State
  showVisualizer: boolean
  visualizerStyle: "bars" | "wave" | "circle"
  visualizerSensitivity: number

  // Timer Interaction State for Visualizer Sync
  timerInteraction: "none" | "hover" | "press"

  loopMode: "all" | "one" | "none"

  playerCommand: { type: "prev" | "next" | "restart"; timestamp: number } | null

  ambientSounds: AmbientSounds
  ambientPresets: AmbientPreset[]

  // UI state
  showTodos: boolean
  showSettings: boolean

  // Todos
  todos: Todo[]

  // Preferences
  preferences: Preferences

  // Dynamic Station Data
  musicTracks: MusicTrack[]
  backgroundScenes: BackgroundScene[]
  ambienceSounds: SoundEffect[]

  // Actions
  setStationData: (data: {
    musicTracks: MusicTrack[]
    backgroundScenes: BackgroundScene[]
    ambienceSounds: SoundEffect[]
  }) => void
  setTimerInteraction: (state: "none" | "hover" | "press") => void
  setIsPlaying: (playing: boolean) => void
  setTimerMode: (mode: TimerMode) => void
  setTimeLeft: (time: number) => void
  setCurrentTrack: (id: string) => void
  setCurrentScene: (id: string) => void
  setMusicPlaying: (playing: boolean) => void
  setMusicProgress: (time: number, duration: number) => void
  setMusicSeek: (time: number | null) => void

  toggleFavoriteScene: (id: string) => void
  toggleFavoriteTrack: (id: string) => void
  setActivePlaylist: (playlist: string) => void

  setQueue: (trackIds: string[]) => void

  toggleShuffle: () => void

  toggleVisualizer: () => void
  setVisualizerStyle: (style: "bars" | "wave" | "circle") => void
  setVisualizerSensitivity: (sensitivity: number) => void

  setLoopMode: (mode: "all" | "one" | "none") => void
  sendPlayerCommand: (command: { type: "prev" | "next" | "restart"; timestamp: number } | null) => void
  toggleTodos: () => void
  toggleSettings: () => void
  addTodo: (text: string) => void
  toggleTodo: (id: string) => void
  deleteTodo: (id: string) => void
  updatePreferences: (prefs: Partial<Preferences>) => void
  applyTimerPreset: (focus: number, breakDuration: number) => void
  resetTimer: () => void
  toggleAmbientSound: (sound: keyof AmbientSounds) => void
  saveAmbientPreset: (name: string) => void
  applyAmbientPreset: (id: string) => void
  deleteAmbientPreset: (id: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      isPlaying: false,
      timerMode: "focus",
      timeLeft: 25 * 60,
      currentTrackId: "1",
      currentSceneId: "1",
      musicPlaying: false,
      musicDuration: 0,
      musicCurrentTime: 0,
      musicSeekRequest: null,

      favoriteScenes: [],
      favoriteTracks: [],
      activePlaylist: "all",
      queue: [],

      isShuffled: false,

      showVisualizer: false,
      visualizerStyle: "bars",
      visualizerSensitivity: 1, // Multiplier for visualizer height/radius
      timerInteraction: "none",

      loopMode: "all",
      playerCommand: null,
      showTodos: false,
      showSettings: false,
      todos: [],
      ambientSounds: {
        rain: false,
        keyboard: false,
        cafe: false,
      },
      ambientPresets: [],
      preferences: {
        focusDuration: 25,
        breakDuration: 5,
        themeColor: "cyan",
        secondaryColor: "purple",
        themeVariant: "minimal",
        timerOpacity: 0.9,
        volume: 0.5,
        ambientVolume: 0.3,
        uiMode: "auto",
        showTime: true,
        showTimer: true,
        clockStyle: "default",
      },

      musicTracks: musicTracks,
      backgroundScenes: backgroundScenes,
      ambienceSounds: ambienceSounds,
      setStationData: (data) =>
        set({
          musicTracks: data.musicTracks,
          backgroundScenes: data.backgroundScenes,
          ambienceSounds: data.ambienceSounds,
        }),

      // Actions
      setTimerInteraction: (interaction) => set({ timerInteraction: interaction }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setTimerMode: (mode) => set({ timerMode: mode }),
      setTimeLeft: (time) => set({ timeLeft: time }),
      setCurrentTrack: (id) => set({ currentTrackId: id }),
      setCurrentScene: (id) => set({ currentSceneId: id }),
      setMusicPlaying: (playing) => set({ musicPlaying: playing }),
      setMusicProgress: (time, duration) => set({ musicCurrentTime: time, musicDuration: duration }),
      setMusicSeek: (time) => set({ musicSeekRequest: time }),

      toggleFavoriteScene: (id) =>
        set((state) => ({
          favoriteScenes: state.favoriteScenes.includes(id)
            ? state.favoriteScenes.filter((sid) => sid !== id)
            : [...state.favoriteScenes, id],
        })),
      toggleFavoriteTrack: (id) =>
        set((state) => ({
          favoriteTracks: state.favoriteTracks.includes(id)
            ? state.favoriteTracks.filter((tid) => tid !== id)
            : [...state.favoriteTracks, id],
        })),
      setActivePlaylist: (playlist) => set({ activePlaylist: playlist }),
      setQueue: (trackIds) => set({ queue: trackIds }),
      toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
      toggleVisualizer: () => set((state) => ({ showVisualizer: !state.showVisualizer })),
      setVisualizerStyle: (style) => set({ visualizerStyle: style }),
      setVisualizerSensitivity: (sensitivity) => set({ visualizerSensitivity: sensitivity }),
      setLoopMode: (mode) => set({ loopMode: mode }),
      sendPlayerCommand: (command) => set({ playerCommand: command }),

      toggleTodos: () => set((state) => ({ showTodos: !state.showTodos })),
      toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),

      addTodo: (text) => {
        const newTodo: Todo = {
          id: Date.now().toString(),
          text,
          completed: false,
        }
        set((state) => ({ todos: [...state.todos, newTodo] }))
      },

      toggleTodo: (id) => {
        set((state) => ({
          todos: state.todos
            .map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
            .sort((a, b) => {
              // Move completed todos to bottom
              if (a.completed && !b.completed) return 1
              if (!a.completed && b.completed) return -1
              return 0
            }),
        }))
      },

      deleteTodo: (id) => {
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        }))
      },

      updatePreferences: (prefs) => {
        set((state) => {
          const newPreferences = { ...state.preferences, ...prefs }
          const updates: Partial<AppState> = { preferences: newPreferences }

          const currentMode = state.timerMode
          const focusChanged = prefs.focusDuration !== undefined && prefs.focusDuration !== state.preferences.focusDuration
          const breakChanged = prefs.breakDuration !== undefined && prefs.breakDuration !== state.preferences.breakDuration

          if ((currentMode === "focus" && focusChanged) || (currentMode === "break" && breakChanged)) {
            const newDuration = currentMode === "focus" ? newPreferences.focusDuration : newPreferences.breakDuration
            updates.isPlaying = false
            updates.timeLeft = newDuration * 60
          }

          return updates
        })
      },

      applyTimerPreset: (focus, breakDuration) => {
        set((state) => {
          const preferences = { ...state.preferences, focusDuration: focus, breakDuration }
          const duration = state.timerMode === "focus" ? focus : breakDuration
          return { preferences, timeLeft: duration * 60, isPlaying: false }
        })
      },

      resetTimer: () => {
        const { timerMode, preferences } = get()
        const duration = timerMode === "focus" ? preferences.focusDuration : preferences.breakDuration
        set({ timeLeft: duration * 60, isPlaying: false })
      },

      toggleAmbientSound: (sound) => {
        set((state) => ({
          ambientSounds: {
            ...state.ambientSounds,
            [sound]: !state.ambientSounds[sound],
          },
        }))
      },

      saveAmbientPreset: (name) => {
        set((state) => ({
          ambientPresets: [
            ...state.ambientPresets,
            {
              id: `preset-${Date.now()}`,
              name,
              sounds: { ...state.ambientSounds },
              volume: state.preferences.ambientVolume,
            },
          ],
        }))
      },

      applyAmbientPreset: (id) => {
        set((state) => {
          const preset = state.ambientPresets.find((p) => p.id === id)
          if (!preset) return {}
          return {
            ambientSounds: { ...preset.sounds },
            preferences: { ...state.preferences, ambientVolume: preset.volume },
          }
        })
      },

      deleteAmbientPreset: (id) => {
        set((state) => ({ ambientPresets: state.ambientPresets.filter((p) => p.id !== id) }))
      },
    }),
    {
      name: "lofi-study-storage-v2",
      partialize: (state) => ({
        todos: state.todos,
        preferences: state.preferences,
        currentTrackId: state.currentTrackId,
        currentSceneId: state.currentSceneId,
        ambientSounds: state.ambientSounds,
        ambientPresets: state.ambientPresets,
        favoriteScenes: state.favoriteScenes,
        favoriteTracks: state.favoriteTracks,
        activePlaylist: state.activePlaylist,
        queue: state.queue,
        isShuffled: state.isShuffled,
        loopMode: state.loopMode,
        showVisualizer: state.showVisualizer,
        visualizerStyle: state.visualizerStyle,
        visualizerSensitivity: state.visualizerSensitivity,
      }),
    },
  ),
)
