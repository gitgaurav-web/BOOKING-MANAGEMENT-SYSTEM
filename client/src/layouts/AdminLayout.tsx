import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminSidebar } from '../components/AdminSidebar';

export const AdminLayout: React.FC = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-500 text-sm">
        Verifying administrator credentials...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login?redirect=/admin" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <AdminSidebar />
        <main className="flex-1 w-full overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
