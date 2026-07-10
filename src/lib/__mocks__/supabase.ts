import { vi } from "vitest"

const mockSingleResult = {
  data: null,
  error: null,
}

const chainable = {
  select: () => chainable,
  insert: () => chainable,
  update: () => chainable,
  delete: () => chainable,
  eq: () => chainable,
  order: () => chainable,
  limit: () => chainable,
  maybeSingle: async () => mockSingleResult,
  single: async () => mockSingleResult,
  then: (onfulfilled: any) => Promise.resolve({ data: [], error: null }).then(onfulfilled),
}

export const supabase = {
  from: () => chainable,
  channel: () => ({
    on: () => ({
      subscribe: vi.fn(() => ({})),
    }),
  }),
  removeChannel: vi.fn(),
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
    signInWithPassword: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    signUp: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    signInWithOAuth: vi.fn(() => Promise.resolve({ data: {}, error: null })),
  },
  storage: {
    from: () => ({
      upload: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://mock.url/image.jpg" } })),
    }),
  },
}
