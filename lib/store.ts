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

  ambientSounds: AmbientSounds

  // UI state
  showTodos: boolean
  showSettings: boolean

  // Todos
  todos: Todo[]

  // Preferences
  preferences: Preferences

  // Actions
  setIsPlaying: (playing: boolean) => void
  setTimerMode: (mode: TimerMode) => void
  setTimeLeft: (time: number) => void
  setCurrentTrack: (id: string) => void
  setCurrentScene: (id: string) => void
  setMusicVolume: (volume: number) => void
  setMusicPlaying: (playing: boolean) => void // Add action
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
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setTimerMode: (mode) => set({ timerMode: mode }),
      setTimeLeft: (time) => set({ timeLeft: time }),
      setCurrentTrack: (id) => set({ currentTrackId: id }),
      setCurrentScene: (id) => set({ currentSceneId: id }),
      setMusicVolume: (volume) => set({ musicVolume: volume }),
      setMusicPlaying: (playing) => set({ musicPlaying: playing }), // Add action implementation
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
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        }))
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
      name: "lofi-study-storage",
      partialize: (state) => ({
        todos: state.todos,
        preferences: state.preferences,
        currentTrackId: state.currentTrackId,
        currentSceneId: state.currentSceneId,
        ambientSounds: state.ambientSounds,
      }),
    },
  ),
)
