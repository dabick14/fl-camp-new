import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { User as FirebaseUser } from 'firebase/auth'
import type { Camp, CampParticipant } from '@models/index'

interface AuthStore {
  user: FirebaseUser | null
  isAuthenticated: boolean
  idToken: string | null
  setUser: (user: FirebaseUser | null) => void
  setIdToken: (token: string | null) => void
  clear: () => void
}

/**
 * Global auth state store
 */
export const useAuthStore = create<AuthStore>(
  subscribeWithSelector((set) => ({
    user: null,
    isAuthenticated: false,
    idToken: null,

    setUser: (user) =>
      set({
        user,
        isAuthenticated: !!user,
      }),

    setIdToken: (token) => set({ idToken: token }),

    clear: () =>
      set({
        user: null,
        isAuthenticated: false,
        idToken: null,
      }),
  })),
)

interface CampStore {
  selectedCampId: string | null
  camps: Map<string, Camp>
  setSelectedCamp: (campId: string) => void
  setCamps: (camps: Camp[]) => void
  addCamp: (camp: Camp) => void
  removeCamp: (campId: string) => void
}

/**
 * Global camp state store
 */
export const useCampStore = create<CampStore>(
  subscribeWithSelector((set) => ({
    selectedCampId: null,
    camps: new Map(),

    setSelectedCamp: (campId) => set({ selectedCampId: campId }),

    setCamps: (camps) =>
      set({
        camps: new Map(camps.map((c) => [c.id, c])),
      }),

    addCamp: (camp) =>
      set((state) => {
        const newCamps = new Map(state.camps)
        newCamps.set(camp.id, camp)
        return { camps: newCamps }
      }),

    removeCamp: (campId) =>
      set((state) => {
        const newCamps = new Map(state.camps)
        newCamps.delete(campId)
        return { camps: newCamps }
      }),
  })),
)

interface ParticipantStore {
  participants: Map<string, CampParticipant>
  selectedParticipantId: string | null
  setParticipants: (participants: CampParticipant[]) => void
  addParticipant: (participant: CampParticipant) => void
  updateParticipant: (participant: CampParticipant) => void
  removeParticipant: (participantId: string) => void
  setSelectedParticipant: (participantId: string | null) => void
}

/**
 * Global participant state store
 */
export const useParticipantStore = create<ParticipantStore>(
  subscribeWithSelector((set) => ({
    participants: new Map(),
    selectedParticipantId: null,

    setParticipants: (participants) =>
      set({
        participants: new Map(participants.map((p) => [p.id, p])),
      }),

    addParticipant: (participant) =>
      set((state) => {
        const newParticipants = new Map(state.participants)
        newParticipants.set(participant.id, participant)
        return { participants: newParticipants }
      }),

    updateParticipant: (participant) =>
      set((state) => {
        const newParticipants = new Map(state.participants)
        newParticipants.set(participant.id, participant)
        return { participants: newParticipants }
      }),

    removeParticipant: (participantId) =>
      set((state) => {
        const newParticipants = new Map(state.participants)
        newParticipants.delete(participantId)
        return { participants: newParticipants }
      }),

    setSelectedParticipant: (participantId) =>
      set({ selectedParticipantId: participantId }),
  })),
)
