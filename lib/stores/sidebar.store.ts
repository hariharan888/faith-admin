import { create } from 'zustand'

interface SidebarState {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  toggle: () => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  setIsCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
  toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
}))

