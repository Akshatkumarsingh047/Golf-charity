import { create } from 'zustand'
import type { Score, User } from '@/types'

// ─── Score store ──────────────────────────────────────────────────────────────
interface ScoreState {
  scores: Score[]
  setScores: (scores: Score[]) => void
  addScore: (score: Score) => void
  removeScore: (id: string) => void
  updateScore: (id: string, updates: Partial<Score>) => void
}

export const useScoreStore = create<ScoreState>((set) => ({
  scores: [],
  setScores: (scores) => set({ scores }),
  addScore: (score) => set((state) => {
    // Maintain max 5, sorted by date desc
    const newScores = [score, ...state.scores]
      .sort((a, b) => new Date(b.score_date).getTime() - new Date(a.score_date).getTime())
      .slice(0, 5)
    return { scores: newScores }
  }),
  removeScore: (id) => set((state) => ({ scores: state.scores.filter(s => s.id !== id) })),
  updateScore: (id, updates) => set((state) => ({
    scores: state.scores
      .map(s => s.id === id ? { ...s, ...updates } : s)
      .sort((a, b) => new Date(b.score_date).getTime() - new Date(a.score_date).getTime()),
  })),
}))

// ─── User store ───────────────────────────────────────────────────────────────
interface UserState {
  user: Partial<User> | null
  setUser: (user: Partial<User> | null) => void
  updateUser: (updates: Partial<User>) => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateUser: (updates) => set((state) => ({ user: state.user ? { ...state.user, ...updates } : updates })),
}))

// ─── UI store ─────────────────────────────────────────────────────────────────
interface UIState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
