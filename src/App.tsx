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
import { AdminLayout } from "@/components/layout/AdminLayout"
import AdminDashboard from "@/pages/admin/AdminDashboard"
import AdminTours from "@/pages/admin/AdminTours"
import AdminUsers from "@/pages/admin/AdminUsers"
import AdminBookings from "@/pages/admin/AdminBookings"
import AdminWaitlist from "@/pages/admin/AdminWaitlist"
import AdminVerifications from "@/pages/admin/AdminVerifications"
import AdminSettings from "@/pages/admin/AdminSettings"

import Admin2Layout from "@/components/admin2/Admin2Layout"
import Admin2Overview from "@/pages/admin2/Admin2Overview"
import Admin2Users from "@/pages/admin2/Admin2Users"
import Admin2Tours from "@/pages/admin2/Admin2Tours"
import Admin2Bookings from "@/pages/admin2/Admin2Bookings"
import Admin2Waitlist from "@/pages/admin2/Admin2Waitlist"
import Admin2Verifications from "@/pages/admin2/Admin2Verifications"
import Admin2Settings from "@/pages/admin2/Admin2Settings"

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
import TermsPage from "@/pages/legal/terms"
import PrivacyPage from "@/pages/legal/privacy"
import AuthCallbackPage from "@/pages/AuthCallback"
import OnboardingPage from "@/pages/Onboarding"
import ResetPasswordPage from "@/pages/ResetPassword"
import EmailPreferencesPage from "@/pages/email-preferences"
import AdminSetupPage from "@/pages/AdminSetup"
import LogoutPage from "@/pages/Logout"

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
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/host/signup" element={<Navigate to="/onboarding?become-host=true" replace />} />
          <Route path="/host/:id" element={<HostProfilePage />} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="tours" element={<AdminTours />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="waitlist" element={<AdminWaitlist />} />
              <Route path="verifications" element={<AdminVerifications />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* Host routes */}
          <Route element={<ProtectedRoute allowedRoles={["host"]} />}>
            <Route path="/host/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/earnings" element={<EarningsDashboard />} />
            <Route path="/host/tours/new" element={<NewTourPage />} />
            <Route path="/host/tours/:id/edit" element={<EditTourPage />} />
          </Route>

          {/* General/Traveler routes */}
          <Route element={<ProtectedRoute allowedRoles={["traveler", "host", "admin"]} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
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
      <CookieConsent />
    </>
  )
}
