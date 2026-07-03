import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { VehicleFilters } from '@carmatch/shared'

interface LocationState {
  latitude?: number
  longitude?: number
  postalCode?: string
  city?: string
  radiusKm: number | null
}

interface SessionState {
  token: string | null
  userId: string | null
  isGuest: boolean
  location: LocationState
  filters: VehicleFilters
  hydrated: boolean
  setSession: (token: string, userId: string, isGuest: boolean) => void
  clearSession: () => void
  setLocation: (loc: Partial<LocationState>) => void
  setFilters: (f: VehicleFilters) => void
  hydrate: () => Promise<void>
}

const KEY = 'carmatch/session/v1'

export const useSession = create<SessionState>((set, get) => ({
  token: null,
  userId: null,
  isGuest: true,
  location: { radiusKm: 100 },
  filters: {},
  hydrated: false,

  setSession: (token, userId, isGuest) => {
    set({ token, userId, isGuest })
    void persist(get())
  },
  clearSession: () => {
    set({ token: null, userId: null, isGuest: true })
    void AsyncStorage.removeItem(KEY)
  },
  setLocation: (loc) => {
    set({ location: { ...get().location, ...loc } })
    void persist(get())
  },
  setFilters: (filters) => {
    set({ filters })
    void persist(get())
  },
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY)
      if (raw) {
        const data = JSON.parse(raw) as Partial<SessionState>
        set({
          token: data.token ?? null,
          userId: data.userId ?? null,
          isGuest: data.isGuest ?? true,
          location: data.location ?? { radiusKm: 100 },
          filters: data.filters ?? {},
        })
      }
    } finally {
      set({ hydrated: true })
    }
  },
}))

async function persist(s: SessionState) {
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify({
      token: s.token,
      userId: s.userId,
      isGuest: s.isGuest,
      location: s.location,
      filters: s.filters,
    }),
  )
}
