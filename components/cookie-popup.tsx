"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function CookiePopup() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const cookieSeen = localStorage.getItem("cookie-seen")
    if (!cookieSeen) {
      setVisible(true)
    }
  }, [])

  const handleAccept = () => {
    setVisible(false)
    localStorage.setItem("cookie-seen", "true")
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-6 left-6 max-w-sm z-50 animate-in slide-in-from-bottom-10 duration-500 ease-out">
      <div className="bg-slate-950/85 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl flex flex-col gap-3">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white tracking-wide font-mono">COOKIE CONSENT</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            This website uses cookies and local storage to save your custom themes, playlists, active states, and focus timer settings across sessions.
          </p>
        </div>
        <div className="flex justify-end mt-1">
          <Button 
            onClick={handleAccept}
            className="bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold font-sans text-xs px-4 py-2 h-8 rounded-lg cursor-pointer transition-all"
          >
            Got it!
          </Button>
        </div>
      </div>
    </div>
  )
}
