import { create } from "zustand"
import { persist } from "zustand/middleware"

export type TimerMode = "focus" | "break"
export type ThemeColor = "cyan" | "purple" | "orange" | "green" | "pink" | "white" | "black"
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
  uiMode: "auto" | "light" | "dark" // Added UI mode preference
}

interface AmbientSounds {
  rain: boolean
  keyboard: boolean
  cafe: boolean
}

interface AppState {
  // Timer state
  isPlaying: boolean
  timerMode: TimerMode
  timeLeft: number // in seconds

  // Media state
  currentTrackId: string
  currentSceneId: string
  musicVolume: number
  musicPlaying: boolean // Add music playing state
  musicDuration: number // Add duration
  musicCurrentTime: number // Add current time
  musicSeekRequest: number | null // Add seek request
  
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
  
  playerCommand: { type: 'prev' | 'next' | 'restart', timestamp: number } | null

  ambientSounds: AmbientSounds

  // UI state
  showTodos: boolean
  showSettings: boolean

  // Todos
  todos: Todo[]

  // Preferences
  preferences: Preferences

  // Actions
  setTimerInteraction: (state: "none" | "hover" | "press") => void
  setIsPlaying: (playing: boolean) => void
  setTimerMode: (mode: TimerMode) => void
  setTimeLeft: (time: number) => void
  setCurrentTrack: (id: string) => void
  setCurrentScene: (id: string) => void
  setMusicVolume: (volume: number) => void
  setMusicPlaying: (playing: boolean) => void // Add action
  setMusicProgress: (time: number, duration: number) => void // Add action
  setMusicSeek: (time: number | null) => void // Add action
  
  toggleFavoriteScene: (id: string) => void
  toggleFavoriteTrack: (id: string) => void
  setActivePlaylist: (playlist: string) => void
  
  setQueue: (trackIds: string[]) => void
  
  toggleShuffle: () => void
  
  toggleVisualizer: () => void
  setVisualizerStyle: (style: "bars" | "wave" | "circle") => void
  setVisualizerSensitivity: (sensitivity: number) => void
  
  setLoopMode: (mode: "all" | "one" | "none") => void
  sendPlayerCommand: (command: { type: 'prev' | 'next' | 'restart', timestamp: number } | null) => void
  toggleTodos: () => void
  toggleSettings: () => void
  addTodo: (text: string) => void
  toggleTodo: (id: string) => void
  deleteTodo: (id: string) => void
  updatePreferences: (prefs: Partial<Preferences>) => void
  resetTimer: () => void
  toggleAmbientSound: (sound: keyof AmbientSounds) => void
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
      musicVolume: 0.5,
      musicPlaying: false, // Add initial state
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
      },

      // Actions
      setTimerInteraction: (interaction) => set({ timerInteraction: interaction }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setTimerMode: (mode) => set({ timerMode: mode }),
      setTimeLeft: (time) => set({ timeLeft: time }),
      setCurrentTrack: (id) => set({ currentTrackId: id }),
      setCurrentScene: (id) => set({ currentSceneId: id }),
      setMusicVolume: (volume) => set({ musicVolume: volume }),
      setMusicPlaying: (playing) => set({ musicPlaying: playing }), 
      setMusicProgress: (time, duration) => set({ musicCurrentTime: time, musicDuration: duration }),
      setMusicSeek: (time) => set({ musicSeekRequest: time }),
      
      toggleFavoriteScene: (id) => set((state) => {
          const exists = state.favoriteScenes.includes(id)
          return {
              favoriteScenes: exists 
                  ? state.favoriteScenes.filter(sid => sid !== id)
                  : [...state.favoriteScenes, id]
          }
      }),
      toggleFavoriteTrack: (id) => set((state) => {
          const exists = state.favoriteTracks.includes(id)
          return {
              favoriteTracks: exists 
                  ? state.favoriteTracks.filter(tid => tid !== id)
                  : [...state.favoriteTracks, id]
          }
      }),
      setActivePlaylist: (playlist) => set({ activePlaylist: playlist }),
      setQueue: (trackIds) => set({ queue: trackIds }),
            toggleShuffle: () => set(state => ({ isShuffled: !state.isShuffled })),
            toggleVisualizer: () => set(state => ({ showVisualizer: !state.showVisualizer })),
      setVisualizerStyle: (style) => set({ visualizerStyle: style }),      setVisualizerSensitivity: (sensitivity) => set({ visualizerSensitivity: sensitivity }),      
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
           let updates: Partial<AppState> = { preferences: newPreferences }
           
           // Check if duration for current mode changed
           const currentMode = state.timerMode
           const focusChanged = prefs.focusDuration !== undefined && prefs.focusDuration !== state.preferences.focusDuration
           const breakChanged = prefs.breakDuration !== undefined && prefs.breakDuration !== state.preferences.breakDuration
           
           if ((currentMode === 'focus' && focusChanged) || (currentMode === 'break' && breakChanged)) {
               const newDuration = currentMode === 'focus' ? newPreferences.focusDuration : newPreferences.breakDuration
               updates.isPlaying = false
               updates.timeLeft = newDuration * 60
           }
           
           return updates
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
    }),
    {
      name: "lofi-study-storage-v2",
      partialize: (state) => ({
        todos: state.todos,
        preferences: state.preferences,
        currentTrackId: state.currentTrackId,
        currentSceneId: state.currentSceneId,
        ambientSounds: state.ambientSounds,
        favoriteScenes: state.favoriteScenes,
        favoriteTracks: state.favoriteTracks,
        activePlaylist: state.activePlaylist,
        queue: state.queue, // Persist queue
        isShuffled: state.isShuffled,
        loopMode: state.loopMode,
        showVisualizer: state.showVisualizer,
        visualizerStyle: state.visualizerStyle,
        visualizerSensitivity: state.visualizerSensitivity,
        // Persist timer state
        timerMode: state.timerMode,
        timeLeft: state.timeLeft,
      }),
    },
  ),
)
