import { useEffect, lazy, Suspense } from "react"
import { Routes, Route, useLocation, Navigate } from "react-router-dom"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Layout } from "@/components/layout/layout"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { trackEvent } from "@/lib/posthog"
import { CookieConsent } from "@/components/ui/CookieConsent"

// Eager load Home for maximum initial LCP speed
import Home from "@/pages/Home"

// Lazy-load sub-routes to slash initial JS bundle size by >85%
const ToursPage = lazy(() => import("@/pages/tours"))
const TourDetailPage = lazy(() => import("@/pages/tour-detail"))
const CheckoutPage = lazy(() => import("@/pages/checkout"))
const ConfirmationPage = lazy(() => import("@/pages/confirmation"))
const AuthPage = lazy(() => import("@/pages/auth"))
const DashboardPage = lazy(() => import("@/pages/dashboard"))
const EarningsDashboard = lazy(() => import("@/pages/earnings"))

const Admin2Layout = lazy(() => import("@/components/admin2/Admin2Layout"))
const Admin2Overview = lazy(() => import("@/pages/admin2/Admin2Overview"))
const Admin2Users = lazy(() => import("@/pages/admin2/Admin2Users"))
const Admin2Tours = lazy(() => import("@/pages/admin2/Admin2Tours"))
const Admin2Bookings = lazy(() => import("@/pages/admin2/Admin2Bookings"))
const Admin2Waitlist = lazy(() => import("@/pages/admin2/Admin2Waitlist"))
const Admin2Verifications = lazy(() => import("@/pages/admin2/Admin2Verifications"))
const Admin2Settings = lazy(() => import("@/pages/admin2/Admin2Settings"))

const HostProfilePage = lazy(() => import("@/pages/host-profile"))
const NewTourPage = lazy(() => import("@/pages/new-tour"))
const EditTourPage = lazy(() => import("@/pages/edit-tour"))
const NotFound = lazy(() => import("@/pages/not-found"))
const HelpPage = lazy(() => import("@/pages/help"))
const WishlistPage = lazy(() => import("@/pages/wishlist"))
const SettingsPage = lazy(() => import("@/pages/settings"))
const MessagesPage = lazy(() => import("@/pages/messages"))
const MapPage = lazy(() => import("@/pages/map"))
const TreePlantingPage = lazy(() => import("@/pages/TreePlanting"))
const TreePlantedPage = lazy(() => import("@/pages/TreePlanted"))
const MentalHealthPage = lazy(() => import("@/pages/MentalHealth"))
const TravelCommitmentThankYouPage = lazy(() => import("@/pages/TravelCommitmentThankYou"))
const ThankYouPage = lazy(() => import("@/pages/ThankYou"))
const HostWaitlistPage = lazy(() => import("@/pages/host-waitlist"))
const WaitlistPage = lazy(() => import("@/pages/waitlist"))
const AboutPage = lazy(() => import("@/pages/about"))
const JournalPage = lazy(() => import("@/pages/journal"))
const FeedPage = lazy(() => import("@/pages/feed"))
const TravelerProfilePage = lazy(() => import("@/pages/traveler-profile"))
const TermsPage = lazy(() => import("@/pages/legal/terms"))
const PrivacyPage = lazy(() => import("@/pages/legal/privacy"))
const AuthCallbackPage = lazy(() => import("@/pages/AuthCallback"))
const OnboardingPage = lazy(() => import("@/pages/Onboarding"))
const OnboardingInterestsPage = lazy(() => import("@/pages/OnboardingInterests"))
const ResetPasswordPage = lazy(() => import("@/pages/ResetPassword"))
const EmailPreferencesPage = lazy(() => import("@/pages/email-preferences"))
const AdminSetupPage = lazy(() => import("@/pages/AdminSetup"))
const LogoutPage = lazy(() => import("@/pages/Logout"))
const NotificationsPage = lazy(() => import("@/pages/notifications"))
const FollowRequestsPage = lazy(() => import("@/pages/follow-requests"))
const PaymentSuccessPage = lazy(() => import("@/pages/PaymentSuccess"))
const HealthPage = lazy(() => import("@/pages/Health"))

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-[#317978] border-t-[#B7E6E5]" />
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

/**
 * App Component
 * 
 * Root component that defines client-side routes, page view analytics tracking,
 * layout wrappers, and authentication protection gates.
 */
export default function App() {
  const location = useLocation()

  useEffect(() => {
    trackEvent("$pageview", {
      path: location.pathname,
      search: location.search,
      url: window.location.href,
    })
  }, [location])

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/tours" element={<ToursPage />} />
            <Route path="/tours/:id" element={<TourDetailPage />} />
            <Route path="/checkout/:tourId" element={<CheckoutPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/confirmation/:bookingId" element={<ConfirmationPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/onboarding/interests" element={<OnboardingInterestsPage />} />
            <Route path="/host/signup" element={<Navigate to="/onboarding?become-host=true" replace />} />
            <Route path="/host/:id" element={<HostProfilePage />} />
            <Route path="/admin/*" element={<Navigate to="/admin2" replace />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Host routes */}
            <Route element={<ProtectedRoute allowedRoles={["host"]} />}>
              <Route path="/host/dashboard" element={<DashboardPage />} />
              <Route path="/host/bookings" element={<Navigate to="/host/dashboard?tab=bookings" replace />} />
              <Route path="/host/tours" element={<Navigate to="/host/dashboard?tab=tours" replace />} />
              <Route path="/host/earnings" element={<Navigate to="/dashboard/earnings" replace />} />
              <Route path="/dashboard/earnings" element={<EarningsDashboard />} />
              <Route path="/host/tours/new" element={<NewTourPage />} />
              <Route path="/host/tours/:id/edit" element={<EditTourPage />} />
            </Route>

            {/* General/Traveler routes */}
            <Route element={<ProtectedRoute allowedRoles={["traveler", "host", "admin"]} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/bookings" element={<Navigate to="/dashboard" replace />} />
              <Route path="/explore" element={<Navigate to="/tours" replace />} />
              <Route path="/profile" element={<Navigate to="/settings" replace />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile/edit" element={<SettingsPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/journal" element={<JournalPage />} />
              <Route path="/follow-requests" element={<FollowRequestsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/messages/:conversationId" element={<MessagesPage />} />
            </Route>

            {/* Public routes */}
            <Route path="/explore" element={<Navigate to="/tours" replace />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/host-waitlist" element={<HostWaitlistPage />} />
            <Route path="/waitlist" element={<WaitlistPage />} />
            <Route path="/email-preferences" element={<EmailPreferencesPage />} />

            {/* Temporary admin setup page - remove after first login */}
            <Route path="/admin-setup" element={<AdminSetupPage />} />
            <Route path="/logout" element={<LogoutPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/traveler/:id" element={<TravelerProfilePage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/tree-planting" element={<TreePlantingPage />} />
            <Route path="/tree-planted" element={<TreePlantedPage />} />
            <Route path="/mental-health" element={<MentalHealthPage />} />
            <Route path="/travel-commitment-thank-you" element={<TravelCommitmentThankYouPage />} />
            <Route path="/thank-you" element={<ThankYouPage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin v2 Dashboard (Standalone Layout) */}
          <Route path="/admin2" element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<Admin2Layout />}>
              <Route index element={<Admin2Overview />} />
              <Route path="users" element={<Admin2Users />} />
              <Route path="tours" element={<Admin2Tours />} />
              <Route path="bookings" element={<Admin2Bookings />} />
              <Route path="waitlist" element={<Admin2Waitlist />} />
              <Route path="verifications" element={<Admin2Verifications />} />
              <Route path="settings" element={<Admin2Settings />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
      <CookieConsent />
      <Analytics />
      <SpeedInsights />
    </>
  )
}
