import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../../services/api';
import { User, Department } from '../../types';
import { 
  Users, 
  Shield, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  KeyRound, 
  Mail, 
  Phone, 
  UserPlus, 
  RefreshCw,
  ChevronDown,
  Check,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdminUsersPage: React.FC = () => {
  const { isSuperAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');

  // Modal State for New User
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete User Confirmation Modal State
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'FACULTY',
    departmentId: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const [uData, dData] = await Promise.all([
        apiRequest<User[]>('/users'),
        apiRequest<Department[]>('/users/departments'),
      ]);
      setUsers(uData);
      setDepartments(dData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load user management records');
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentId = (u: User): string => {
    if (u.departmentId) return u.departmentId;
    if (u.department && typeof u.department === 'object' && u.department.id) {
      return u.department.id;
    }
    return '';
  };

  const getDepartmentName = (u: User): string => {
    if (!u.department) return 'General / Campus Wide';
    if (typeof u.department === 'string') return u.department;
    return u.department.name || u.department.code || 'General / Campus Wide';
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isSuperAdmin) {
      alert('Only Super Administrator has authorization to alter user privileges.');
      return;
    }

    try {
      await apiRequest(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  const handleDepartmentChange = async (userId: string, newDeptId: string) => {
    if (!isSuperAdmin) {
      alert('Only Super Administrator can reassign faculty departments.');
      return;
    }

    try {
      await apiRequest(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ departmentId: newDeptId || null }),
      });
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user department');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    if (!isSuperAdmin) {
      alert('Only Super Administrator can alter user account activation status.');
      return;
    }

    try {
      await apiRequest(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update account status');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setDeletingUser(true);
      setDeleteError(null);
      await apiRequest(`/users/${userToDelete.id}`, { method: 'DELETE' });
      setUserToDelete(null);
      loadUsers();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to remove user account');
    } finally {
      setDeletingUser(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setModalError('Name, email, and password are required.');
      return;
    }

    if (formData.password.length < 8) {
      setModalError('Password must contain at least 8 characters.');
      return;
    }

    try {
      setSubmitting(true);
      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          phone: formData.phone.trim() || undefined,
          role: formData.role,
          departmentId: formData.departmentId || null,
          status: formData.status,
        }),
      });

      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'FACULTY',
        departmentId: '',
        status: 'ACTIVE',
      });
      loadUsers();
    } catch (err: any) {
      setModalError(err.message || 'Failed to register account');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const deptName = getDepartmentName(u).toLowerCase();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        deptName.includes(q);

      const matchesRole = selectedRole === 'ALL' || u.role === selectedRole;
      const matchesStatus = selectedStatus === 'ALL' || (u.status || 'ACTIVE') === selectedStatus;
      
      const uDeptId = getDepartmentId(u);
      const matchesDept = 
        selectedDeptFilter === 'ALL' || 
        (selectedDeptFilter === 'GENERAL' && !uDeptId) || 
        uDeptId === selectedDeptFilter;

      return matchesSearch && matchesRole && matchesStatus && matchesDept;
    });
  }, [users, searchQuery, selectedRole, selectedStatus, selectedDeptFilter]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      case 'FACULTY':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Users & Roles Management
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage registered faculty, departments, administrators, and security privileges.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-500/20 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Faculty / Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadUsers}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Role Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdownId(openDropdownId === 'filter-role' ? null : 'filter-role')}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer shadow-2xs"
              >
                <span>
                  {selectedRole === 'ALL'
                    ? 'All Roles'
                    : selectedRole === 'SUPER_ADMIN'
                    ? 'Super Admin'
                    : selectedRole === 'ADMIN'
                    ? 'Admin'
                    : selectedRole === 'FACULTY'
                    ? 'Faculty'
                    : 'User'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${openDropdownId === 'filter-role' ? 'rotate-180 opacity-100' : 'opacity-60'}`} />
              </button>
              {openDropdownId === 'filter-role' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />
                  <div className="absolute left-0 mt-1.5 w-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1">
                      Filter by Role
                    </div>
                    {[
                      { label: 'All Roles', value: 'ALL' },
                      { label: 'Super Admin', value: 'SUPER_ADMIN' },
                      { label: 'Admin', value: 'ADMIN' },
                      { label: 'Faculty', value: 'FACULTY' },
                      { label: 'User', value: 'USER' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setSelectedRole(opt.value); setOpenDropdownId(null); }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                          selectedRole === opt.value
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {selectedRole === opt.value && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Department Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdownId(openDropdownId === 'filter-dept' ? null : 'filter-dept')}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2 max-w-[210px] hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer shadow-2xs"
              >
                <span className="truncate">
                  {selectedDeptFilter === 'ALL'
                    ? 'All Departments'
                    : selectedDeptFilter === 'GENERAL'
                    ? 'General / Campus Wide'
                    : departments.find((d) => d.id === selectedDeptFilter)?.code || 'Department'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${openDropdownId === 'filter-dept' ? 'rotate-180 opacity-100' : 'opacity-60'}`} />
              </button>
              {openDropdownId === 'filter-dept' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />
                  <div className="absolute left-0 mt-1.5 w-64 max-h-64 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1">
                      Filter by Department
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedDeptFilter('ALL'); setOpenDropdownId(null); }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                        selectedDeptFilter === 'ALL'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>All Departments</span>
                      {selectedDeptFilter === 'ALL' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedDeptFilter('GENERAL'); setOpenDropdownId(null); }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                        selectedDeptFilter === 'GENERAL'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>General / Campus Wide</span>
                      {selectedDeptFilter === 'GENERAL' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                    </button>
                    {departments.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => { setSelectedDeptFilter(d.id); setOpenDropdownId(null); }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                          selectedDeptFilter === d.id
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{d.code} - {d.name}</span>
                        {selectedDeptFilter === d.id && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-1" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdownId(openDropdownId === 'filter-status' ? null : 'filter-status')}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer shadow-2xs"
              >
                <span>
                  {selectedStatus === 'ALL'
                    ? 'All Status'
                    : selectedStatus === 'ACTIVE'
                    ? 'Active Accounts'
                    : 'Inactive Accounts'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${openDropdownId === 'filter-status' ? 'rotate-180 opacity-100' : 'opacity-60'}`} />
              </button>
              {openDropdownId === 'filter-status' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />
                  <div className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1">
                      Filter by Status
                    </div>
                    {[
                      { label: 'All Status', value: 'ALL' },
                      { label: 'Active Accounts', value: 'ACTIVE', dot: 'bg-emerald-500' },
                      { label: 'Inactive Accounts', value: 'INACTIVE', dot: 'bg-rose-500' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setSelectedStatus(opt.value); setOpenDropdownId(null); }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                          selectedStatus === opt.value
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {opt.dot && <span className={`w-2 h-2 rounded-full ${opt.dot}`}></span>}
                          <span>{opt.label}</span>
                        </span>
                        {selectedStatus === opt.value && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>Showing {filteredUsers.length} of {users.length} registered accounts</span>
          {isSuperAdmin && (
            <span className="text-purple-600 dark:text-purple-400 font-semibold">
              Super Admin Mode: Role & Department dropdowns active
            </span>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2" />
            <span>Loading user directory...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No users found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No registered user matches the search or filter criteria. Try adjusting the filter parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[380px] pb-12">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Name & Account</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Role Privileges</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-center">Bookings</th>
                  {isSuperAdmin && <th className="py-3 px-4 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u, idx) => {
                  const currentDeptId = getDepartmentId(u);
                  const isCurrentSuper = u.id === currentUser?.id && u.role === 'SUPER_ADMIN';
                  const isLastRows = filteredUsers.length >= 3 && (idx === filteredUsers.length - 1 || (filteredUsers.length >= 5 && idx >= filteredUsers.length - 2));

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        openDropdownId?.includes(u.id) ? 'relative z-30' : ''
                      }`}
                    >
                      {/* Name & Account */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {u.id === currentUser?.id && (
                            <span className="text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 text-[11px] font-mono mt-0.5">{u.email}</div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        {u.phone || <span className="text-slate-400 font-sans italic">Not provided</span>}
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4">
                        {isSuperAdmin ? (
                          <div className={`relative inline-block text-left ${openDropdownId === `dept-${u.id}` ? 'z-40' : ''}`}>
                            <button
                              type="button"
                              onClick={() => setOpenDropdownId(openDropdownId === `dept-${u.id}` ? null : `dept-${u.id}`)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold text-[11px] flex items-center justify-between gap-1.5 max-w-[210px] hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer shadow-2xs"
                              title="Assign Department"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{getDepartmentName(u)}</span>
                              </div>
                              <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${openDropdownId === `dept-${u.id}` ? 'rotate-180 opacity-100' : 'opacity-60'}`} />
                            </button>

                            {openDropdownId === `dept-${u.id}` && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />
                                <div
                                  className={`absolute left-0 ${
                                    isLastRows ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top'
                                  } w-64 max-h-56 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100`}
                                >
                                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1">
                                    Assign Department
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => { handleDepartmentChange(u.id, ''); setOpenDropdownId(null); }}
                                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                                      !currentDeptId
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                  >
                                    <span>General / Campus Wide</span>
                                    {!currentDeptId && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                                  </button>
                                  {departments.map((d) => (
                                    <button
                                      key={d.id}
                                      type="button"
                                      onClick={() => { handleDepartmentChange(u.id, d.id); setOpenDropdownId(null); }}
                                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                                        currentDeptId === d.id
                                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'
                                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                      }`}
                                    >
                                      <span className="truncate">{d.code} - {d.name}</span>
                                      {currentDeptId === d.id && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-1" />}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{getDepartmentName(u)}</span>
                          </div>
                        )}
                      </td>

                      {/* Role Privileges */}
                      <td className="py-3.5 px-4">
                        {isSuperAdmin ? (
                          <div className={`relative inline-block text-left ${openDropdownId === `role-${u.id}` ? 'z-40' : ''}`}>
                            <button
                              type="button"
                              disabled={isCurrentSuper}
                              onClick={() => setOpenDropdownId(openDropdownId === `role-${u.id}` ? null : `role-${u.id}`)}
                              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-extrabold tracking-wide flex items-center gap-1.5 transition shadow-2xs ${
                                isCurrentSuper ? 'opacity-80 cursor-default' : 'cursor-pointer hover:opacity-90'
                              } ${getRoleBadge(u.role)}`}
                              title={isCurrentSuper ? 'Current Super Admin account' : 'Change role privilege'}
                            >
                              <span>{u.role}</span>
                              {!isCurrentSuper && (
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${openDropdownId === `role-${u.id}` ? 'rotate-180 opacity-100' : 'opacity-70'}`} />
                              )}
                            </button>

                            {openDropdownId === `role-${u.id}` && !isCurrentSuper && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />
                                <div
                                  className={`absolute left-0 ${
                                    isLastRows ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top'
                                  } w-60 max-h-64 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100`}
                                >
                                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1">
                                    Set Role Privilege
                                  </div>
                                  {[
                                    { role: 'SUPER_ADMIN', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300', desc: 'Full control & settings' },
                                    { role: 'ADMIN', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300', desc: 'Approve & manage halls' },
                                    { role: 'FACULTY', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300', desc: 'Request booking for events' },
                                    { role: 'USER', badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200', desc: 'Standard viewing access' },
                                  ].map((r) => (
                                    <button
                                      key={r.role}
                                      type="button"
                                      onClick={() => { handleRoleChange(u.id, r.role); setOpenDropdownId(null); }}
                                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                                        u.role === r.role
                                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-500/20'
                                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                      }`}
                                    >
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${r.badge}`}>{r.role}</span>
                                        </div>
                                        <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">{r.desc}</div>
                                      </div>
                                      {u.role === r.role && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-1" />}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-wide ${getRoleBadge(u.role)}`}>
                            {u.role}
                          </span>
                        )}
                      </td>

                      {/* Account Status */}
                      <td className="py-3.5 px-4">
                        <div className={`relative inline-block text-left ${openDropdownId === `status-${u.id}` ? 'z-40' : ''}`}>
                          {isSuperAdmin && !isCurrentSuper ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setOpenDropdownId(openDropdownId === `status-${u.id}` ? null : `status-${u.id}`)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-xs cursor-pointer ${
                                  u.status === 'INACTIVE'
                                    ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-200 dark:hover:bg-rose-900/60'
                                    : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900/60'
                                }`}
                                title="Click to toggle or change status"
                              >
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    u.status === 'INACTIVE'
                                      ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                                      : 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse'
                                  }`}
                                />
                                <span>{u.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'}</span>
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                                    openDropdownId === `status-${u.id}` ? 'rotate-180 opacity-100' : 'opacity-70'
                                  }`}
                                />
                              </button>

                              {openDropdownId === `status-${u.id}` && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setOpenDropdownId(null)}
                                  />
                                  <div
                                    className={`absolute right-0 ${
                                      isLastRows ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top'
                                    } w-52 max-h-56 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100`}
                                  >
                                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1">
                                      Account Status
                                    </div>

                                    {/* Option 1: ACTIVE */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleStatusChange(u.id, 'ACTIVE');
                                        setOpenDropdownId(null);
                                      }}
                                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                                        u.status !== 'INACTIVE'
                                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 shrink-0"></span>
                                        <div>
                                          <div className="text-emerald-700 dark:text-emerald-300 font-extrabold">ACTIVE</div>
                                          <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400">Can login & request halls</div>
                                        </div>
                                      </div>
                                      {u.status !== 'INACTIVE' && (
                                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-1" />
                                      )}
                                    </button>

                                    {/* Option 2: INACTIVE */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleStatusChange(u.id, 'INACTIVE');
                                        setOpenDropdownId(null);
                                      }}
                                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition text-left mt-1 cursor-pointer ${
                                        u.status === 'INACTIVE'
                                          ? 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30'
                                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 shrink-0"></span>
                                        <div>
                                          <div className="text-rose-700 dark:text-rose-300 font-extrabold">INACTIVE</div>
                                          <div className="text-[10px] font-normal text-slate-500 dark:text-slate-400">Access suspended</div>
                                        </div>
                                      </div>
                                      {u.status === 'INACTIVE' && (
                                        <Check className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 ml-1" />
                                      )}
                                    </button>
                                  </div>
                                </>
                              )}
                            </>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${
                                u.status === 'INACTIVE'
                                  ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  u.status === 'INACTIVE' ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                              />
                              <span>{u.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Bookings Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {u._count?.bookings ?? 0}
                        </span>
                      </td>

                      {/* Action: Remove User (Super Admin only) */}
                      {isSuperAdmin && (
                        <td className="py-3.5 px-4 text-center">
                          {u.id === currentUser?.id ? (
                            <span className="text-[10px] text-slate-400 font-medium italic">Active Self</span>
                          ) : ['iqac@sairamce.edu.in', 'coo@sairamce.edu.in'].includes(u.email.toLowerCase()) ? (
                            <span className="text-[10px] text-slate-400 font-medium italic">Root Admin</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setUserToDelete(u);
                                setDeleteError(null);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                              title={`Remove ${u.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Faculty / Admin */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Create User / Faculty Account
                  </h3>
                  <p className="text-xs text-slate-500">
                    Register a new authorized campus member or system administrator.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Preeti Rao"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    College Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. preeti@college.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Temporary Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Min 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">General / Campus Wide</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Role Privileges
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="FACULTY" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">FACULTY (Request Bookings)</option>
                    <option value="ADMIN" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">ADMIN (Approve Bookings)</option>
                    <option value="SUPER_ADMIN" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">SUPER_ADMIN (Full Control)</option>
                    <option value="USER" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">USER (Student / Staff)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submitting ? 'Creating Account...' : 'Register User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Remove User */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Remove User Account
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Permanent removal from institutional database
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{userToDelete.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Email:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{userToDelete.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Role:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{userToDelete.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Department:</span>
                <span className="text-slate-800 dark:text-slate-200">{getDepartmentName(userToDelete)}</span>
              </div>
              {userToDelete._count?.bookings ? (
                <div className="flex justify-between text-amber-600 dark:text-amber-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-medium">Associated Bookings:</span>
                  <span className="font-bold">{userToDelete._count.bookings} bookings</span>
                </div>
              ) : null}
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to permanently delete this user? Their login credentials and notifications will be wiped immediately. This action cannot be reversed.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={deletingUser}
                onClick={() => {
                  setUserToDelete(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingUser}
                onClick={handleDeleteUser}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                {deletingUser ? 'Removing...' : 'Confirm Remove User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
