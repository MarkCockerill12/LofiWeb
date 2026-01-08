"use client"

import { useEffect, useState } from "react"

export function CookiePopup() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const cookieSeen = localStorage.getItem("cookie-seen")

    if (!cookieSeen) {
      setVisible(true)

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false)
        localStorage.setItem("cookie-seen", "true")
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 w-80 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="glass bg-black/80 rounded-xl border border-white/10 p-4 shadow-2xl">
        <p className="text-sm text-white">This website uses cookies for your settings.</p>
      </div>
    </div>
  )
}
