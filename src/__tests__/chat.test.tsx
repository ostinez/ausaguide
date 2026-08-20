import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useConversations } from "@/hooks/useConversations"
import { useMessages } from "@/hooks/useMessages"
import { supabase } from "@/lib/supabase"

vi.mock("@/lib/supabase", () => {
 const channelMock = {
 on: vi.fn().mockReturnThis(),
 subscribe: vi.fn().mockReturnThis(),
 unsubscribe: vi.fn().mockReturnThis(),
 send: vi.fn().mockResolvedValue(true),
 }

 return {
 supabase: {
 from: vi.fn(),
 channel: vi.fn().mockReturnValue(channelMock),
 removeChannel: vi.fn(),
 getChannels: vi.fn().mockReturnValue([]),
 auth: {
 getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } }),
 },
 },
 }
})

describe("useConversations Hook", () => {
 beforeEach(() => {
 vi.clearAllMocks()
 })

 it("returns conversations with correct shape (confirmed bookings only)", async () => {
 ;(supabase.from as any).mockImplementation((table: string) => {
 if (table === "conversations") {
 return {
 select: vi.fn().mockReturnValue({
 or: vi.fn().mockReturnValue({
 order: vi.fn().mockResolvedValue({ data: [], error: null }),
 }),
 }),
 }
 }
 return {
 select: vi.fn().mockReturnValue({
 eq: vi.fn().mockReturnValue({
 maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
 }),
 }),
 }
 })

 const { result } = renderHook(() => useConversations("user-b"))

 // Verify the hook returns the expected shape
 expect(result.current).toHaveProperty("conversations")
 expect(result.current).toHaveProperty("loading")
 expect(result.current).toHaveProperty("error")
 expect(result.current).toHaveProperty("refreshConversations")
 // createOrGetConversation is intentionally removed — chats only via confirmed bookings
 expect(result.current).not.toHaveProperty("createOrGetConversation")
 expect(Array.isArray(result.current.conversations)).toBe(true)
 })
})

describe("useMessages Hook", () => {
 beforeEach(() => {
 vi.clearAllMocks()
 })

 it("sends message with correct receiver_id", async () => {
 const mockInsert = vi.fn().mockResolvedValue({ error: null })
 const mockQueryBuilder: any = {
 eq: vi.fn().mockImplementation(() => mockQueryBuilder),
 neq: vi.fn().mockImplementation(() => mockQueryBuilder),
 then: vi.fn().mockImplementation((cb: any) => Promise.resolve({ error: null }).then(cb)),
 }
 const mockUpdate = vi.fn().mockReturnValue(mockQueryBuilder)

 ;(supabase.from as any).mockImplementation((table: string) => {
 if (table === "messages") {
 return {
 select: vi.fn().mockReturnValue({
 eq: vi.fn().mockReturnValue({
 order: vi.fn().mockResolvedValue({ data: [], error: null }),
 }),
 }),
 insert: mockInsert,
 update: mockUpdate,
 }
 }
 if (table === "conversations") {
 return {
 update: vi.fn().mockReturnValue({
 eq: vi.fn().mockResolvedValue({ error: null }),
 }),
 }
 }
 return {}
 })

 const { result } = renderHook(() => useMessages("conv-123", "user-1", "user-2"))

 let success = false
 await act(async () => {
 success = await result.current.sendMessage("Hello Ausaguide!")
 })

 expect(success).toBe(true)
 expect(mockInsert).toHaveBeenCalledWith(
 expect.objectContaining({
 conversation_id: "conv-123",
 sender_id: "user-1",
 receiver_id: "user-2",
 message: "Hello Ausaguide!",
 read: false,
 })
 )
 })
})
