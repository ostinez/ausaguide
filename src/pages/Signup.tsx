import { Link } from "react-router-dom"
import { SignUpForm } from "@/pages/auth"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useSEO } from "@/hooks/useSEO"

export default function SignupPage() {
  useSEO({
    title: "Create an Account | Ausaguide",
    description: "Sign up for Ausaguide to explore Kenya with real local guides or become a verified host.",
  })

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center px-4 py-16 overflow-hidden">
      {/* Background decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute bottom-10 right-10 size-[400px] rounded-full bg-[#0D6F73]/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-6 space-y-2">
          <Link to="/" className="inline-block transition-transform hover:scale-105">
            <img
              src="/logo-primary.png"
              alt="Ausaguide Logo"
              className="h-10 w-auto mx-auto object-contain"
            />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight font-headline">
            Join Ausaguide
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Be a Local. Share Your World.
          </p>
        </div>

        {/* Signup Card */}
        <Card className="border border-border/80 bg-card/95 shadow-2xl backdrop-blur-md rounded-3xl overflow-hidden">
          <CardHeader className="pb-2 text-center">
            <p className="text-sm font-semibold text-foreground">
              Create your account
            </p>
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Log in
              </Link>
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <SignUpForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
