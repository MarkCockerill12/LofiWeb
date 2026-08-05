"use client"

import { useState, type ReactNode } from "react"
import { GripVertical } from "lucide-react"

interface ReorderableListProps<T> {
  items: T[]
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  onReorder: (items: T[]) => void
}

/**
 * Native HTML5 drag-and-drop reordering — no dependency needed for a single list.
 * Reordering commits on drop so the caller can persist once, not on every hover.
 */
export function ReorderableList<T>({ items, getKey, renderItem, onReorder }: ReorderableListProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const move = (from: number, to: number) => {
    if (from === to) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onReorder(next)
  }

  const reset = () => {
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const isDragging = dragIndex === index
        const isOver = overIndex === index && dragIndex !== index

        return (
          <div
            key={getKey(item)}
            draggable
            onDragStart={(e) => {
              setDragIndex(index)
              e.dataTransfer.effectAllowed = "move"
              // Firefox requires data to be set for a drag to begin.
              e.dataTransfer.setData("text/plain", String(index))
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = "move"
              setOverIndex(index)
            }}
            onDrop={(e) => {
              e.preventDefault()
              if (dragIndex !== null) move(dragIndex, index)
              reset()
            }}
            onDragEnd={reset}
            className={`flex items-stretch gap-2 rounded-lg transition-all ${isDragging ? "opacity-40" : ""} ${
              isOver ? "ring-2 ring-cyan-500" : ""
            }`}
          >
            <div
              className="flex items-center px-1 text-slate-500 hover:text-cyan-400 cursor-grab active:cursor-grabbing transition-colors"
              aria-hidden="true"
            >
              <GripVertical className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">{renderItem(item)}</div>
          </div>
        )
      })}
    </div>
  )
}
