import { useEffect } from "react"
import { Routes, Route, useLocation, Navigate } from "react-router-dom"
import { Layout } from "@/components/layout/layout"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { trackEvent } from "@/lib/posthog"
import { CookieConsent } from "@/components/ui/CookieConsent"
import Home from "@/pages/Home"
import ToursPage from "@/pages/tours"
import TourDetailPage from "@/pages/tour-detail"
import CheckoutPage from "@/pages/checkout"
import ConfirmationPage from "@/pages/confirmation"
import AuthPage from "@/pages/auth"
import DashboardPage from "@/pages/dashboard"
import EarningsDashboard from "@/pages/earnings"
import AdminDashboard from "@/pages/AdminDashboard"
import HostProfilePage from "@/pages/host-profile"
import NewTourPage from "@/pages/new-tour"
import EditTourPage from "@/pages/edit-tour"
import NotFound from "@/pages/not-found"
import HelpPage from "@/pages/help"
import WishlistPage from "@/pages/wishlist"
import SettingsPage from "@/pages/settings"
import MessagesPage from "@/pages/messages"
import MapPage from "@/pages/map"
import TreePlantingPage from "@/pages/TreePlanting"
import TreePlantedPage from "@/pages/TreePlanted"
import MentalHealthPage from "@/pages/MentalHealth"
import TravelCommitmentThankYouPage from "@/pages/TravelCommitmentThankYou"
import ThankYouPage from "@/pages/ThankYou"
import HostWaitlistPage from "@/pages/host-waitlist"
import WaitlistPage from "@/pages/waitlist"
import AboutPage from "@/pages/about"
import JournalPage from "@/pages/journal"
import FeedPage from "@/pages/feed"
import TravelerProfilePage from "@/pages/traveler-profile"
import AdminSettingsPage from "@/pages/admin-settings"
import AdminHostsPage from "@/pages/admin-hosts"
import TermsPage from "@/pages/legal/terms"
import PrivacyPage from "@/pages/legal/privacy"
import AuthCallbackPage from "@/pages/AuthCallback"
import OnboardingPage from "@/pages/Onboarding"

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

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
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/tours" element={<ToursPage />} />
          <Route path="/tours/:id" element={<TourDetailPage />} />
          <Route path="/checkout/:tourId" element={<CheckoutPage />} />
          <Route path="/confirmation/:bookingId" element={<ConfirmationPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/host/signup" element={<Navigate to="/onboarding?become-host=true" replace />} />
          <Route path="/host/:id" element={<HostProfilePage />} />
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/host/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/earnings" element={<EarningsDashboard />} />
            <Route path="/host/tours/new" element={<NewTourPage />} />
            <Route path="/host/tours/:id/edit" element={<EditTourPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/hosts" element={<AdminHostsPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile/edit" element={<SettingsPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/messages" element={<MessagesPage />} />
          </Route>

          {/* Public routes */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/host-waitlist" element={<HostWaitlistPage />} />
          <Route path="/waitlist" element={<WaitlistPage />} />

          <Route path="/feed" element={<FeedPage />} />
          <Route path="/traveler/:id" element={<TravelerProfilePage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/tree-planting" element={<TreePlantingPage />} />
          <Route path="/tree-planted" element={<TreePlantedPage />} />
          <Route path="/mental-health" element={<MentalHealthPage />} />
          <Route path="/travel-commitment-thank-you" element={<TravelCommitmentThankYouPage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <CookieConsent />
    </>
  )
}
