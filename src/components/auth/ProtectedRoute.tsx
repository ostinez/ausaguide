import { Navigate, Outlet } from "react-router-dom"

interface ProtectedRouteProps {
  children?: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const userId = localStorage.getItem("user_id")

  if (!userId) {
    return <Navigate to="/auth" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
