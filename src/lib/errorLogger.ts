import { supabase } from "@/lib/supabase"
import { Sentry } from "@/lib/sentry"

/**
 * Centrally logs technical errors:
 * 1. Outputs structured diagnostic details to the browser console.
 * 2. Writes the incident to the persistent public.error_logs Supabase table.
 * 3. Captures the exception in Sentry (if configured).
 */
export async function logErrorToDatabase(
  context: string,
  error: unknown,
  metadata?: Record<string, any>
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  console.error(`[ErrorLogs][${context}]:`, error)

  try {
    // Sentry capture
    if (error instanceof Error) {
      Sentry.captureException(error, { extra: { context, ...metadata } })
    } else {
      Sentry.captureMessage(`[${context}] ${errorMessage}`, { extra: metadata })
    }

    // Determine current user if stored in session
    const userEmail = typeof window !== "undefined" ? localStorage.getItem("user_email") || null : null

    // Asynchronously insert into public.error_logs
    await supabase.from("error_logs").insert({
      error_context: context,
      error_message: errorMessage,
      user_email: userEmail,
      metadata: {
        ...metadata,
        stack: errorStack,
        url: typeof window !== "undefined" ? window.location.href : "",
        pathname: typeof window !== "undefined" ? window.location.pathname : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        timestamp: new Date().toISOString(),
      },
    })
  } catch (loggingErr) {
    // Never allow telemetry/logging failure to crash the UI
    console.warn("[ErrorLogs] Failed to record error to database:", loggingErr)
  }
}
