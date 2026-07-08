import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center px-4 pt-16">
      <div className="text-center">
        <p className="text-7xl font-extrabold text-primary">404</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          Page Not Found
        </h1>
        <p className="mt-2 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="mt-6 inline-block">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Home className="size-4" />
            Go Back Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
