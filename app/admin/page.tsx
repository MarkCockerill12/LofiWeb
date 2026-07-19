'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, LogOut, Plus, Trash2, Music, Check, Film, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MusicTrack {
  id: string
  title: string
  artist: string
  url: string
  category?: string
}

export default function AdminPage() {
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState("")
  
  // Station Data States
  const [tracks, setTracks] = useState<MusicTrack[]>([])
  const [manifest, setManifest] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Add Song Form States
  const [title, setTitle] = useState("")
  const [artist, setArtist] = useState("")
  const [category, setCategory] = useState("Lofi")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
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
      setManifest(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!audioFile || !manifest) return

    setUploading(true)
    setError("")
    setSuccessMsg("")

    const formData = new FormData()
    formData.append("file", audioFile)
    // Put inside folder hierarchy lofi-station/music/CategoryName
    formData.append("folder", `lofi-station/music/${category.trim()}`)

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
        title: title.trim(),
        artist: artist.trim(),
        url: r2Url,
        category: category.trim()
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
        setSuccessMsg(`"${title}" has been successfully added to the catalog!`)
        
        // Reset form
        setTitle("")
        setArtist("")
        setAudioFile(null)
        
        // Trigger celebration confetti
        const confetti = (await import('canvas-confetti')).default
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      } else {
        throw new Error("Failed to write database manifest update to R2")
      }
    } catch (err: any) {
      setError(err.message || "Operation failed")
    } finally {
      setUploading(false)
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
      <div className="w-full max-w-5xl flex justify-between items-center mb-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
            <Music className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider font-mono">LOFI STATION ADMIN</h1>
        </div>
        {isAuthenticated && (
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 border border-red-500/20"
          >
            <LogOut className="w-4 h-4" /> Logout
          </Button>
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
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-8"
          >
            {/* Left side: Add Song Form */}
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
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Lost in Tokyo"
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 font-sans"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-mono uppercase">Artist / Credit</label>
                    <input
                      type="text"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      placeholder="e.g. Lofi Selection"
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 font-sans"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-mono uppercase">Playlist Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
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
                    disabled={uploading}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-black font-semibold font-mono tracking-wider transition-all"
                  >
                    {uploading ? "UPLOADING TO R2..." : "SUBMIT SONG"}
                  </Button>
                </form>
              </div>
            </div>

            {/* Right side: Tracks Catalog */}
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
                        <span>{track.artist}</span>
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
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
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
