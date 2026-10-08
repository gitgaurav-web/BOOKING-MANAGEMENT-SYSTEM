import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { HallsPage } from './pages/HallsPage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { CalendarPage } from './pages/CalendarPage';
import { BookingRequestPage } from './pages/BookingRequestPage';
import { LoginPage } from './pages/LoginPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { ProtectedRoute } from './components/ProtectedRoute';

// Admin Layout & Pages
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage';
import { AdminPendingPage } from './pages/admin/AdminPendingPage';
import { AdminHallsPage } from './pages/admin/AdminHallsPage';
import { AdminBlockedDatesPage } from './pages/admin/AdminBlockedDatesPage';
import { AdminMaintenancePage } from './pages/admin/AdminMaintenancePage';
import { AdminHolidaysPage } from './pages/admin/AdminHolidaysPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminDepartmentsPage } from './pages/admin/AdminDepartmentsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminLogsPage } from './pages/admin/AdminLogsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
            <Navbar />
            <div className="flex-1">
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
                <Route path="/admin" element={<AdminLayout />}>
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
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
