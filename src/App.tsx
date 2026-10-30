import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { Footer } from './components/layout/Footer'
import { Header } from './components/layout/Header'
import { VolunteerLayout } from './components/layout/VolunteerLayout'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { GetInvolvedPage } from './pages/GetInvolvedPage'
import { HistoryPage } from './pages/HistoryPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ResourcesPage } from './pages/ResourcesPage'
import { ServicesPage } from './pages/ServicesPage'
import {
  ForgotPasswordPage,
  ResetPasswordPage,
  VolunteerDocumentPage,
  VolunteerLandingPage,
  VolunteerLoginPage,
  VolunteerRegistrationPage,
} from './pages/VolunteerPublicPages'
import {
  OpportunitiesPage,
  OpportunityDetailsPage,
  VolunteerActivityPage,
  VolunteerAnnouncementsPage,
  VolunteerApplicationPage,
  VolunteerAvailabilityPage,
  VolunteerDashboardPage,
  VolunteerProfilePage,
  VolunteerResourcesPage,
  VolunteerSettingsPage,
  VolunteerTrainingPage,
} from './pages/VolunteerPortalPages'
import {
  AdminContentEditorPage,
  AdminContentListPage,
  AdminDashboardPage,
  AdminGeneralPreferencesPage,
  AdminLayout,
  AdminLoginPage,
  AdminRoute,
} from './pages/AdminPages'
import { AdminVolunteerSignupsPage } from './pages/AdminVolunteerSignupsPage'
import { PublicCmsDetailPage } from './pages/PublicCmsDetailPage'

const AdminAppointmentsPage = lazy(() => import('./pages/AdminSchedulingPages').then((module) => ({ default: module.AdminAppointmentsPage })))
const AdminSchedulingPage = lazy(() => import('./pages/AdminSchedulingPages').then((module) => ({ default: module.AdminSchedulingPage })))
const AppointmentBlocksPage = lazy(() => import('./pages/AdminSchedulingPages').then((module) => ({ default: module.AppointmentBlocksPage })))
const AppointmentDetailPage = lazy(() => import('./pages/AdminSchedulingPages').then((module) => ({ default: module.AppointmentDetailPage })))
const AppointmentEditorPage = lazy(() => import('./pages/AdminSchedulingPages').then((module) => ({ default: module.AppointmentEditorPage })))
const SchedulingRoute = lazy(() => import('./pages/AdminSchedulingPages').then((module) => ({ default: module.SchedulingRoute })))
const SchedulingSettingsPage = lazy(() => import('./pages/AdminSchedulingPages').then((module) => ({ default: module.SchedulingSettingsPage })))
const PublicSchedulingPage = lazy(() => import('./pages/PublicSchedulingPage').then((module) => ({ default: module.PublicSchedulingPage })))

function App() {
  const { pathname } = useLocation()
  const isPrivateVolunteerPage = pathname.startsWith('/volunteer/') &&
    !['/volunteer/register', '/volunteer/login', '/volunteer/application-status', '/volunteer/forgot-password', '/volunteer/reset-password', '/volunteer/privacy-notice', '/volunteer/code-of-conduct'].includes(pathname)
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/')
  const routes = (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/services/:slug" element={<PublicCmsDetailPage contentType="service" />} />
      <Route path="/resources" element={<ResourcesPage />} />
      <Route path="/resources/:slug" element={<PublicCmsDetailPage contentType="resource" />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/get-involved" element={<GetInvolvedPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/schedule" element={<Suspense fallback={<p className="py-10 text-center">Loading appointment booking…</p>}><PublicSchedulingPage /></Suspense>} />
      <Route path="/volunteer" element={<VolunteerLandingPage />} />
      <Route path="/volunteer/register" element={<VolunteerRegistrationPage />} />
      <Route path="/volunteer/privacy-notice" element={<VolunteerDocumentPage document="privacy-notice" />} />
      <Route path="/volunteer/code-of-conduct" element={<VolunteerDocumentPage document="code-of-conduct" />} />
      <Route path="/volunteer/login" element={<VolunteerLoginPage />} />
      <Route path="/volunteer/application" element={<Navigate to="/volunteer/application-status" replace />} />
      <Route path="/volunteer/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/volunteer/reset-password" element={<ResetPasswordPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="preferences" element={<AdminGeneralPreferencesPage />} />
          <Route path="volunteers" element={<AdminVolunteerSignupsPage />} />
          <Route path="content" element={<AdminContentListPage />} />
          <Route path="content/new" element={<AdminContentEditorPage />} />
          <Route path="content/:id/edit" element={<AdminContentEditorPage />} />
        </Route>
      </Route>
      <Route element={<Suspense fallback={<p className="py-10 text-center">Loading scheduling…</p>}><SchedulingRoute /></Suspense>}>
        <Route path="/admin/scheduling" element={<AdminLayout />}>
          <Route index element={<Suspense fallback={<p className="py-10 text-center">Loading scheduling…</p>}><AdminSchedulingPage /></Suspense>} />
          <Route path="appointments" element={<Suspense fallback={<p className="py-10 text-center">Loading scheduling…</p>}><AdminAppointmentsPage /></Suspense>} />
          <Route path="appointments/new" element={<Suspense fallback={<p className="py-10 text-center">Loading scheduling…</p>}><AppointmentEditorPage /></Suspense>} />
          <Route path="appointments/:id" element={<Suspense fallback={<p className="py-10 text-center">Loading scheduling…</p>}><AppointmentDetailPage /></Suspense>} />
          <Route path="appointments/:id/edit" element={<Suspense fallback={<p className="py-10 text-center">Loading scheduling…</p>}><AppointmentEditorPage /></Suspense>} />
          <Route path="blocked-times" element={<Suspense fallback={<p className="py-10 text-center">Loading scheduling…</p>}><AppointmentBlocksPage /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<p className="py-10 text-center">Loading scheduling…</p>}><SchedulingSettingsPage /></Suspense>} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/volunteer/application-status" element={<VolunteerApplicationPage />} />
        <Route path="/volunteer" element={<VolunteerLayout />}>
          <Route path="dashboard" element={<VolunteerDashboardPage />} />
          <Route path="profile" element={<VolunteerProfilePage />} />
          <Route path="availability" element={<VolunteerAvailabilityPage />} />
          <Route path="settings" element={<VolunteerSettingsPage />} />
          <Route path="opportunities" element={<OpportunitiesPage />} />
          <Route path="opportunities/:opportunityId" element={<OpportunityDetailsPage />} />
          <Route path="training" element={<VolunteerTrainingPage />} />
          <Route path="activity" element={<VolunteerActivityPage />} />
          <Route path="announcements" element={<VolunteerAnnouncementsPage />} />
          <Route path="resources" element={<VolunteerResourcesPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )

  return (
    <div className="min-h-screen bg-[#fff8f7] text-[#251818]">
      {!isPrivateVolunteerPage && !isAdminPage && <Header />}
      {isPrivateVolunteerPage || isAdminPage ? routes : <main>{routes}</main>}
      {!isPrivateVolunteerPage && !isAdminPage && <Footer />}
    </div>
  )
}

export default App
