import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Eager load primary landing page
import { HomePage } from './pages/HomePage';

// Lazy load public & user pages
const HallsPage = lazy(() => import('./pages/HallsPage').then(m => ({ default: m.HallsPage })));
const AvailabilityPage = lazy(() => import('./pages/AvailabilityPage').then(m => ({ default: m.AvailabilityPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then(m => ({ default: m.CalendarPage })));
const BookingRequestPage = lazy(() => import('./pages/BookingRequestPage').then(m => ({ default: m.BookingRequestPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage').then(m => ({ default: m.HowItWorksPage })));
const MyBookingsPage = lazy(() => import('./pages/MyBookingsPage').then(m => ({ default: m.MyBookingsPage })));

// Lazy load admin layout and pages
const AdminLayout = lazy(() => import('./layouts/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminBookingsPage = lazy(() => import('./pages/admin/AdminBookingsPage').then(m => ({ default: m.AdminBookingsPage })));
const AdminPendingPage = lazy(() => import('./pages/admin/AdminPendingPage').then(m => ({ default: m.AdminPendingPage })));
const AdminHallsPage = lazy(() => import('./pages/admin/AdminHallsPage').then(m => ({ default: m.AdminHallsPage })));
const AdminBlockedDatesPage = lazy(() => import('./pages/admin/AdminBlockedDatesPage').then(m => ({ default: m.AdminBlockedDatesPage })));
const AdminMaintenancePage = lazy(() => import('./pages/admin/AdminMaintenancePage').then(m => ({ default: m.AdminMaintenancePage })));
const AdminHolidaysPage = lazy(() => import('./pages/admin/AdminHolidaysPage').then(m => ({ default: m.AdminHolidaysPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminDepartmentsPage = lazy(() => import('./pages/admin/AdminDepartmentsPage').then(m => ({ default: m.AdminDepartmentsPage })));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage').then(m => ({ default: m.AdminReportsPage })));
const AdminLogsPage = lazy(() => import('./pages/admin/AdminLogsPage').then(m => ({ default: m.AdminLogsPage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] text-slate-500 text-xs">
    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
    <span>Loading page...</span>
  </div>
);

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-[#f7f6f1] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
              <Navbar />
              <div className="flex-1">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public & User Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/halls" element={<HallsPage />} />
                    <Route path="/availability" element={<AvailabilityPage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route
                      path="/book"
                      element={
                        <ProtectedRoute>
                          <BookingRequestPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/how-it-works" element={<HowItWorksPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                      path="/user/bookings"
                      element={
                        <ProtectedRoute>
                          <MyBookingsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Management Routes */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                          <AdminLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<AdminDashboardPage />} />
                      <Route path="bookings" element={<AdminBookingsPage />} />
                      <Route path="pending" element={<AdminPendingPage />} />
                      <Route path="calendar" element={<CalendarPage />} />
                      <Route path="halls" element={<AdminHallsPage />} />
                      <Route path="blocked-dates" element={<AdminBlockedDatesPage />} />
                      <Route path="maintenance" element={<AdminMaintenancePage />} />
                      <Route path="holidays" element={<AdminHolidaysPage />} />
                      <Route path="users" element={<AdminUsersPage />} />
                      <Route path="departments" element={<AdminDepartmentsPage />} />
                      <Route path="reports" element={<AdminReportsPage />} />
                      <Route path="logs" element={<AdminLogsPage />} />
                      <Route path="settings" element={<AdminSettingsPage />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </div>
              <Footer />
            </div>
          </BrowserRouter>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
