import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { User, Department } from '../../types';
import { Users, Shield, Plus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdminUsersPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const [uData, dData] = await Promise.all([
        apiRequest<User[]>('/users'),
        apiRequest<Department[]>('/users/departments'),
      ]);
      setUsers(uData);
      setDepartments(dData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isSuperAdmin) {
      alert('Only Super Admin can change user roles.');
      return;
    }

    try {
      await apiRequest(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          User Management & Roles
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          View registered faculty, staff, and system administrators. Super Admin can adjust role permissions.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{u.name}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{u.email}</td>
                  <td className="py-3 px-4 text-slate-500">{u.phone || '-'}</td>
                  <td className="py-3 px-4 text-slate-500">{u.department || 'General'}</td>
                  <td className="py-3 px-4">
                    {isSuperAdmin ? (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-[11px]"
                      >
                        <option value="USER">USER</option>
                        <option value="FACULTY">FACULTY</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-emerald-600 font-semibold text-[11px]">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
