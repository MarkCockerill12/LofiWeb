"use client"

import { useAppStore } from "@/lib/store"
import { useState, useEffect } from "react"
import { X, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { getUIColors } from "@/lib/utils"
import { backgroundScenes } from "@/lib/data"
import confetti from "canvas-confetti"

const THEME_COLORS = {
  cyan: "#06b6d4",
  purple: "#a855f7",
  orange: "#f97316",
  green: "#10b981",
  pink: "#ec4899",
  white: "#ffffff",
  black: "#000000",
}

export function TodoWidget() {
  const showTodos = useAppStore((state) => state.showTodos)
  const toggleTodos = useAppStore((state) => state.toggleTodos)
  const todos = useAppStore((state) => state.todos)
  const addTodo = useAppStore((state) => state.addTodo)
  const toggleTodo = useAppStore((state) => state.toggleTodo)
  const deleteTodo = useAppStore((state) => state.deleteTodo)
  const themeColor = useAppStore((state) => state.preferences.themeColor)
  const secondaryColor = useAppStore((state) => state.preferences.secondaryColor)
  const uiMode = useAppStore((state) => state.preferences.uiMode)
  const currentSceneId = useAppStore((state) => state.currentSceneId)

  const [newTodoText, setNewTodoText] = useState("")
  const [isMobile, setIsMobile] = useState(false)

  const color = THEME_COLORS[themeColor]

  const currentScene = backgroundScenes.find((s) => s.id === currentSceneId)
  const bgHex = secondaryColor ? THEME_COLORS[secondaryColor] : currentScene?.color || "#000000"
  const uiColors = getUIColors(bgHex, uiMode)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      addTodo(newTodoText.trim())
      setNewTodoText("")
    }
  }

  const handleToggleTodo = (id: string, currentStatus: boolean) => {
    if (!currentStatus) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: [THEME_COLORS[themeColor]],
        zIndex: 200,
        disableForReducedMotion: true,
      })
    }
    toggleTodo(id)
  }

  const TodoContent = (
    <div
      className="glass rounded-xl border p-4 w-80"
      style={{
        backgroundColor: uiColors.bg,
        borderColor: uiColors.border,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold" style={{ color: uiColors.text }}>
          Tasks
        </h2>
        <Button
          onClick={toggleTodos}
          variant="ghost"
          size="icon"
          className="rounded-full w-7 h-7"
          style={{ color: uiColors.textSecondary }}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex gap-2 mb-3">
        <Input
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
          placeholder="Add a task..."
          className="text-sm h-9"
          style={{
            backgroundColor: `${uiColors.bg}66`,
            borderColor: newTodoText ? color : uiColors.border,
            color: uiColors.text,
          }}
        />
        <Button
          onClick={handleAddTodo}
          size="icon"
          className="rounded-lg shrink-0 h-9 w-9"
          style={{
            backgroundColor: color,
            color: "#000",
          }}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-1.5 max-h-80 overflow-y-auto">
        {todos.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: uiColors.textSecondary }}>
            No tasks yet. Add one above!
          </p>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-2 p-2 rounded-lg transition-all group"
              style={{
                backgroundColor: `${uiColors.bg}66`,
                opacity: todo.completed ? 0.6 : 1,
              }}
            >
              <Checkbox
                checked={todo.completed}
                onCheckedChange={() => handleToggleTodo(todo.id, todo.completed)}
                style={{
                  borderColor: color,
                  backgroundColor: todo.completed ? color : undefined,
                }}
              />
              <span
                className={`flex-1 text-sm ${todo.completed ? "line-through" : ""}`}
                style={{ color: todo.completed ? uiColors.textSecondary : uiColors.text }}
              >
                {todo.text}
              </span>
              <Button
                onClick={() => deleteTodo(todo.id)}
                variant="ghost"
                size="icon"
                className="w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: uiColors.textSecondary }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )

  if (!showTodos) return null

  if (isMobile) {
    return (
      <Sheet open={showTodos} onOpenChange={toggleTodos}>
        <SheetContent
          side="bottom"
          className="h-[60vh] border"
          style={{
            backgroundColor: uiColors.bg,
            borderColor: uiColors.border,
          }}
        >
          <SheetHeader>
            <SheetTitle style={{ color: uiColors.text }}>Tasks</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <div className="flex gap-2 mb-3">
              <Input
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                placeholder="Add a task..."
                style={{
                  backgroundColor: `${uiColors.bg}66`,
                  borderColor: newTodoText ? color : uiColors.border,
                  color: uiColors.text,
                }}
              />
              <Button
                onClick={handleAddTodo}
                size="icon"
                className="rounded-lg shrink-0"
                style={{
                  backgroundColor: color,
                  color: "#000",
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: "calc(60vh - 120px)" }}>
              {todos.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: uiColors.textSecondary }}>
                  No tasks yet. Add one above!
                </p>
              ) : (
                todos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 p-3 rounded-lg transition-all group"
                    style={{
                      backgroundColor: `${uiColors.bg}66`,
                      opacity: todo.completed ? 0.6 : 1,
                    }}
                  >
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleTodo(todo.id, todo.completed)}
                      style={{
                        borderColor: color,
                        backgroundColor: todo.completed ? color : undefined,
                      }}
                    />
                    <span
                      className={`flex-1 text-sm ${todo.completed ? "line-through" : ""}`}
                      style={{ color: todo.completed ? uiColors.textSecondary : uiColors.text }}
                    >
                      {todo.text}
                    </span>
                    <Button
                      onClick={() => deleteTodo(todo.id)}
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: uiColors.textSecondary }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-40 animate-in slide-in-from-right duration-300">
      {TodoContent}
    </div>
  )
}
