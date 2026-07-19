'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, LogOut, Plus, Trash2, Music, Check, Film, Upload, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MusicTrack {
  id: string
  title: string
  artist: string
  url: string
  category?: string
}

interface BackgroundScene {
  id: string
  name: string
  videoUrl: string
  thumbnailUrl: string
  category?: string
}

export default function AdminPage() {
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<'tracks' | 'scenes'>('tracks')
  
  // Station Data States
  const [tracks, setTracks] = useState<MusicTrack[]>([])
  const [scenes, setScenes] = useState<BackgroundScene[]>([])
  const [manifest, setManifest] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Add Song Form States
  const [trackTitle, setTrackTitle] = useState("")
  const [trackCategory, setTrackCategory] = useState("Lofi")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [uploadingTrack, setUploadingTrack] = useState(false)
  
  // Add Scene Form States
  const [sceneName, setSceneName] = useState("")
  const [sceneCategory, setSceneCategory] = useState("Cozy")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploadingScene, setUploadingScene] = useState(false)

  const [successMsg, setSuccessMsg] = useState("")

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth")
      if (res.ok) {
        const data = await res.json()
        setIsAuthenticated(data.authenticated)
        if (data.authenticated) {
          loadStationData()
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadStationData = async () => {
    try {
      const res = await fetch("/api/station")
      if (res.ok) {
        const data = await res.json()
        setManifest(data)
        setTracks(data.musicTracks || [])
        setScenes(data.backgroundScenes || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      })

      if (res.ok) {
        setIsAuthenticated(true)
        loadStationData()
      } else {
        const data = await res.json()
        setError(data.error || "Incorrect password")
      }
    } catch (err) {
      setError("Failed to connect to authentication API")
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" })
      setIsAuthenticated(false)
      setTracks([])
      setScenes([])
      setManifest(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!audioFile || !manifest) return

    setUploadingTrack(true)
    setError("")
    setSuccessMsg("")

    const formData = new FormData()
    formData.append("file", audioFile)
    formData.append("folder", `lofi-station/music/${trackCategory.trim()}`)

    try {
      // 1. Upload audio file
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      if (!uploadRes.ok) {
        const errData = await uploadRes.json()
        throw new Error(errData.error || "Upload failed")
      }

      const uploadData = await uploadRes.json()
      const r2Url = uploadData.url

      // 2. Append new track metadata
      const newTrack: MusicTrack = {
        id: `track-${Date.now()}`,
        title: trackTitle.trim(),
        artist: "",
        url: r2Url,
        category: trackCategory.trim()
      }

      const updatedManifest = {
        ...manifest,
        musicTracks: [...(manifest.musicTracks || []), newTrack]
      }

      // 3. Save Updated Manifest
      const saveRes = await fetch("/api/station", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updatedManifest })
      })

      if (saveRes.ok) {
        setManifest(updatedManifest)
        setTracks(updatedManifest.musicTracks)
        setSuccessMsg(`"${trackTitle}" has been successfully added to the catalog!`)
        
        // Reset form
        setTrackTitle("")
        setAudioFile(null)
        
        const confetti = (await import('canvas-confetti')).default
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      } else {
        throw new Error("Failed to write database manifest update to R2")
      }
    } catch (err: any) {
      setError(err.message || "Operation failed")
    } finally {
      setUploadingTrack(false)
    }
  }

  // Client side WebP thumbnail generator and video length cap validator
  const generateVideoThumbnail = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video")
      video.preload = "auto"
      video.muted = true
      video.playsInline = true
      video.src = URL.createObjectURL(file)
      
      video.onloadedmetadata = () => {
        // Cap video at 30 seconds
        if (video.duration > 30.5) {
          URL.revokeObjectURL(video.src)
          reject(new Error("Video duration exceeds the 30 seconds limit! Please trim it down."))
          return
        }
        // Seek to 0.5 seconds to capture a frame
        video.currentTime = 0.5
      }

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas")
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("Failed to get 2D canvas context"))
            return
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error("Canvas export to WebP blob failed"))
              }
              URL.revokeObjectURL(video.src)
            },
            "image/webp",
            0.8
          )
        } catch (err) {
          reject(err)
        }
      }

      video.onerror = () => {
        reject(new Error("Failed to load video file for thumbnail rendering"))
      }
    })
  }

  const handleAddScene = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoFile || !manifest) return

    setUploadingScene(true)
    setError("")
    setSuccessMsg("")

    try {
      // 1. Generate WebP thumbnail blob client-side
      console.log("Validating video and generating WebP thumbnail...")
      const thumbBlob = await generateVideoThumbnail(videoFile)
      const thumbFile = new File([thumbBlob], "thumbnail.webp", { type: "image/webp" })

      // 2. Upload Scene Video
      const videoData = new FormData()
      videoData.append("file", videoFile)
      videoData.append("folder", "lofi-station/backgrounds")

      console.log("Uploading scene video file...")
      const videoRes = await fetch("/api/upload", {
        method: "POST",
        body: videoData
      })
      if (!videoRes.ok) {
        const errData = await videoRes.json()
        throw new Error(errData.error || "Video upload failed")
      }
      const videoUpload = await videoRes.json()
      const videoUrl = videoUpload.url

      // 3. Upload Thumbnail WebP
      const thumbData = new FormData()
      thumbData.append("file", thumbFile)
      thumbData.append("folder", "lofi-station/backgrounds/thumbnails")

      console.log("Uploading WebP thumbnail...")
      const thumbRes = await fetch("/api/upload", {
        method: "POST",
        body: thumbData
      })
      if (!thumbRes.ok) {
        const errData = await thumbRes.json()
        throw new Error(errData.error || "Thumbnail upload failed")
      }
      const thumbUpload = await thumbRes.json()
      const thumbnailUrl = thumbUpload.url

      // 4. Save to Manifest
      const newScene: BackgroundScene = {
        id: `scene-${Date.now()}`,
        name: sceneName.trim(),
        videoUrl,
        thumbnailUrl,
        category: sceneCategory.trim()
      }

      const updatedManifest = {
        ...manifest,
        backgroundScenes: [...(manifest.backgroundScenes || []), newScene]
      }

      const saveRes = await fetch("/api/station", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updatedManifest })
      })

      if (saveRes.ok) {
        setManifest(updatedManifest)
        setScenes(updatedManifest.backgroundScenes)
        setSuccessMsg(`"${sceneName}" scene has been successfully added!`)
        
        // Reset form
        setSceneName("")
        setVideoFile(null)

        const confetti = (await import('canvas-confetti')).default
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      } else {
        throw new Error("Failed to write database manifest update to R2")
      }
    } catch (err: any) {
      setError(err.message || "Operation failed")
    } finally {
      setUploadingScene(false)
    }
  }

  const handleDeleteSong = async (trackId: string, trackTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${trackTitle}" from the library?`)) return
    if (!manifest) return

    try {
      const updatedManifest = {
        ...manifest,
        musicTracks: (manifest.musicTracks || []).filter((t: any) => t.id !== trackId)
      }

      const saveRes = await fetch("/api/station", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updatedManifest })
      })

      if (saveRes.ok) {
        setManifest(updatedManifest)
        setTracks(updatedManifest.musicTracks)
      } else {
        alert("Failed to delete song from R2 database manifest")
      }
    } catch (err) {
      console.error(err)
      alert("Error connection occurred")
    }
  }

  const handleDeleteScene = async (sceneId: string, sceneName: string) => {
    if (!confirm(`Are you sure you want to delete scene "${sceneName}"?`)) return
    if (!manifest) return

    try {
      const updatedManifest = {
        ...manifest,
        backgroundScenes: (manifest.backgroundScenes || []).filter((s: any) => s.id !== sceneId)
      }

      const saveRes = await fetch("/api/station", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updatedManifest })
      })

      if (saveRes.ok) {
        setManifest(updatedManifest)
        setScenes(updatedManifest.backgroundScenes)
      } else {
        alert("Failed to delete scene from R2 database manifest")
      }
    } catch (err) {
      console.error(err)
      alert("Error connection occurred")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-mono">
        Loading admin console...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-slate-950 text-slate-100 p-6 flex flex-col items-center">
      
      {/* Header */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
            <Music className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider font-mono">LOFI STATION ADMIN</h1>
        </div>
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-950/80 p-1 rounded-lg border border-white/10 text-xs font-mono">
              <button
                onClick={() => { setActiveTab('tracks'); setSuccessMsg(''); setError(''); }}
                className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'tracks' ? 'bg-cyan-500 text-black font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                Music Tracks
              </button>
              <button
                onClick={() => { setActiveTab('scenes'); setSuccessMsg(''); setError(''); }}
                className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'scenes' ? 'bg-cyan-500 text-black font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                Background Scenes
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl mt-12"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">
                <Lock className="w-8 h-8" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-center mb-6 tracking-wide font-mono">ENTER ADMINISTRATIVE SYSTEM</h2>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono text-center tracking-widest text-lg"
                required
              />
              {error && (
                <p className="text-red-400 text-xs font-mono text-center">{error}</p>
              )}
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-mono py-6 text-sm">
                VERIFY SIGNATURE
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-8"
          >
            {activeTab === 'tracks' ? (
              <>
                {/* Add Song Form */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-black/60 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl space-y-4">
                    <h2 className="text-lg font-bold font-mono tracking-wider text-cyan-400 flex items-center gap-2">
                      <Plus className="w-5 h-5" /> ADD NEW TRACK
                    </h2>
                    <form onSubmit={handleAddSong} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-mono uppercase">Song Title</label>
                        <input
                          type="text"
                          value={trackTitle}
                          onChange={(e) => setTrackTitle(e.target.value)}
                          placeholder="e.g. Lost in Tokyo"
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 font-sans"
                          required
                        />
                      </div>



                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-mono uppercase">Playlist Category</label>
                        <select
                          value={trackCategory}
                          onChange={(e) => setTrackCategory(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 font-sans"
                        >
                          <option value="Lofi">Lofi</option>
                          <option value="Vibes">Vibes</option>
                          <option value="Video Game">Video Game</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-mono uppercase">Audio File (.mp3 / .wav)</label>
                        <label className="border border-dashed border-white/10 hover:border-cyan-500 rounded-lg px-4 py-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/50 text-center">
                          <Upload className="w-6 h-6 text-slate-400 mb-2" />
                          <span className="text-xs font-semibold text-slate-300">
                            {audioFile ? audioFile.name : "Select audio file"}
                          </span>
                          <input
                            type="file"
                            accept="audio/mp3,audio/mpeg,audio/wav"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) setAudioFile(file)
                            }}
                            className="hidden"
                            required
                          />
                        </label>
                      </div>

                      {error && (
                        <p className="text-red-400 text-xs font-mono text-center">{error}</p>
                      )}

                      {successMsg && (
                        <p className="text-green-400 text-xs font-mono text-center flex items-center justify-center gap-1.5 bg-green-500/10 py-2 rounded-lg border border-green-500/20">
                          <Check className="w-4 h-4" /> {successMsg}
                        </p>
                      )}

                      <Button 
                        type="submit" 
                        disabled={uploadingTrack}
                        className="w-full bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-black font-semibold font-mono tracking-wider transition-all"
                      >
                        {uploadingTrack ? "UPLOADING TO R2..." : "SUBMIT SONG"}
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Tracks Catalog */}
                <div className="lg:col-span-3 bg-black/60 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col h-[75vh]">
                  <h2 className="text-lg font-bold font-mono tracking-wider mb-4 text-purple-400 flex items-center gap-2">
                    <Music className="w-5 h-5 animate-pulse" /> MUSIC CATALOG ({tracks.length} SONGS)
                  </h2>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {tracks.map((track) => (
                      <div
                        key={track.id}
                        className="bg-slate-950/50 hover:bg-slate-900 border border-white/5 hover:border-white/10 p-3 rounded-lg flex items-center justify-between transition-all"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="text-sm font-semibold text-white truncate">{track.title}</h4>
                          <p className="text-xs text-slate-400 truncate flex items-center gap-2 mt-0.5">
                            {track.artist && (
                              <>
                                <span>{track.artist}</span>
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                              </>
                            )}
                            <span className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] uppercase font-mono">{track.category || 'Other'}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteSong(track.id, track.title)}
                          className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                          title="Delete Track"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Add Scene Form */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-black/60 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl space-y-4">
                    <h2 className="text-lg font-bold font-mono tracking-wider text-cyan-400 flex items-center gap-2">
                      <Video className="w-5 h-5" /> ADD NEW SCENE
                    </h2>
                    <form onSubmit={handleAddScene} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-mono uppercase">Scene Name</label>
                        <input
                          type="text"
                          value={sceneName}
                          onChange={(e) => setSceneName(e.target.value)}
                          placeholder="e.g. Sakura Train Station"
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 font-sans"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-mono uppercase">Category</label>
                        <select
                          value={sceneCategory}
                          onChange={(e) => setSceneCategory(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 font-sans"
                        >
                          <option value="Sakura">Sakura</option>
                          <option value="Retrowave">Retrowave</option>
                          <option value="Sci-Fi">Sci-Fi</option>
                          <option value="Nature">Nature</option>
                          <option value="Cozy">Cozy</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-mono uppercase">Video File (.webm / .mp4 - max 30s)</label>
                        <label className="border border-dashed border-white/10 hover:border-cyan-500 rounded-lg px-4 py-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/50 text-center">
                          <Film className="w-6 h-6 text-slate-400 mb-2 animate-pulse" />
                          <span className="text-xs font-semibold text-slate-300">
                            {videoFile ? videoFile.name : "Select video file"}
                          </span>
                          <input
                            type="file"
                            accept="video/webm,video/mp4"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) setVideoFile(file)
                            }}
                            className="hidden"
                            required
                          />
                        </label>
                      </div>

                      {error && (
                        <p className="text-red-400 text-xs font-mono text-center">{error}</p>
                      )}

                      {successMsg && (
                        <p className="text-green-400 text-xs font-mono text-center flex items-center justify-center gap-1.5 bg-green-500/10 py-2 rounded-lg border border-green-500/20">
                          <Check className="w-4 h-4" /> {successMsg}
                        </p>
                      )}

                      <Button 
                        type="submit" 
                        disabled={uploadingScene}
                        className="w-full bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-black font-semibold font-mono tracking-wider transition-all"
                      >
                        {uploadingScene ? "CONVERTING & UPLOADING..." : "SUBMIT SCENE"}
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Scenes Catalog */}
                <div className="lg:col-span-3 bg-black/60 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col h-[75vh]">
                  <h2 className="text-lg font-bold font-mono tracking-wider mb-4 text-purple-400 flex items-center gap-2">
                    <Film className="w-5 h-5 animate-pulse" /> BACKGROUND SCENES ({scenes.length} SCENES)
                  </h2>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {scenes.map((scene) => (
                      <div
                        key={scene.id}
                        className="bg-slate-950/50 hover:bg-slate-900 border border-white/5 hover:border-white/10 p-3 rounded-xl flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-4 min-w-0 pr-4">
                          <div className="relative w-20 aspect-video rounded-md overflow-hidden bg-slate-900 border border-white/5 shrink-0">
                            {scene.thumbnailUrl && (
                              <img src={scene.thumbnailUrl} alt={scene.name} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-white truncate">{scene.name}</h4>
                            <p className="text-xs text-slate-400 truncate flex items-center gap-2 mt-0.5">
                              <span className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] uppercase font-mono">{scene.category || 'Other'}</span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteScene(scene.id, scene.name)}
                          className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Delete Scene"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
