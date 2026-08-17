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

 it("handles participant sorting consistently in createOrGetConversation", async () => {
 const mockInsert = vi.fn().mockReturnValue({
 select: vi.fn().mockReturnValue({
 single: vi.fn().mockResolvedValue({ data: { id: "new-conv-id" }, error: null }),
 }),
 })

 const mockSelect = vi.fn().mockReturnValue({
 or: vi.fn().mockReturnValue({
 order: vi.fn().mockResolvedValue({ data: [], error: null }),
 maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
 }),
 })

 ;(supabase.from as any).mockImplementation((table: string) => {
 if (table === "conversations") {
 return {
 select: mockSelect,
 insert: mockInsert,
 }
 }
 return {
 select: vi.fn().mockReturnValue({
 or: vi.fn().mockReturnValue({
 order: vi.fn().mockResolvedValue({ data: [], error: null }),
 }),
 eq: vi.fn().mockReturnValue({
 eq: vi.fn().mockReturnValue({
 eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
 }),
 maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
 }),
 }),
 }
 })

 const { result } = renderHook(() => useConversations("user-b"))

 let convId: string | null = null
 await act(async () => {
 convId = await result.current.createOrGetConversation("user-a")
 })

 expect(convId).toBe("new-conv-id")
 expect(mockInsert).toHaveBeenCalledWith(
 expect.objectContaining({
 participant_a: "user-a",
 participant_b: "user-b",
 })
 )
 })
})

describe("useMessages Hook", () => {
 beforeEach(() => {
 vi.clearAllMocks()
 })

 it("sends message with correct receiver_id", async () => {
 const mockInsert = vi.fn().mockResolvedValue({ error: null })
 const mockUpdate = vi.fn().mockReturnValue({
 eq: vi.fn().mockReturnValue({
 eq: vi.fn().mockReturnValue({
 eq: vi.fn().mockResolvedValue({ error: null }),
 }),
 }),
 })

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
