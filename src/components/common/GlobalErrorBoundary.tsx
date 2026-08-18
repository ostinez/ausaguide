import React from "react"
import { AlertTriangle, RefreshCw, Home, Trash2 } from "lucide-react"

interface ErrorBoundaryProps {
  children?: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class GlobalErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[GlobalErrorBoundary] Uncaught application error:", error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleHardReset = async () => {
    try {
      if ("caches" in window) {
        const cacheKeys = await caches.keys()
        await Promise.all(cacheKeys.map((k) => caches.delete(k)))
      }
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((r) => r.unregister()))
      }
      localStorage.clear()
      sessionStorage.clear()
    } catch (e) {
      console.warn("Storage reset warning:", e)
    }
    window.location.href = "/"
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#06363D] text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-md w-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="size-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Something went wrong
              </h1>
              <p className="text-xs text-white/70 leading-relaxed">
                An unexpected error occurred while loading this page. You can refresh or clear your local cache to recover.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-black/40 border border-white/10 rounded-xl p-3.5 text-[11px] font-mono text-red-300 max-h-32 overflow-y-auto leading-relaxed">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#0D6F73] hover:bg-[#0B3037] text-white text-xs font-bold transition duration-200 cursor-pointer shadow-md"
              >
                <RefreshCw className="size-3.5" />
                <span>Reload Page</span>
              </button>
              <button
                type="button"
                onClick={this.handleHardReset}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition duration-200 cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span>Clear Cache & Reset</span>
              </button>
            </div>

            <div className="pt-2">
              <a
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
              >
                <Home className="size-3.5" />
                <span>Back to Ausaguide Home</span>
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default GlobalErrorBoundary
