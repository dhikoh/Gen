"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface User {
  id: string;
  name: string;
  username: string;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  email: string;
  role: string;
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
  createdAt: string;
  currentPlan: { id: string; name: string } | null;
}

interface UserDetail extends User {
  channels: { id: string; channelName: string; isLocked: boolean; usageCount: number; lastUsedAt: string | null }[];
  invoices: { id: string; status: string; amount: number; method: string; createdAt: string; reviewedAt: string | null; plan: { name: string } }[];
}

interface Plan {
  id: string;
  name: string;
}

export default function UserManagement({ initialPlans }: { initialPlans: Plan[] }) {
  const t = useTranslations("Admin");
  const tu = useTranslations("AdminUsers");
  
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [modalAction, setModalAction] = useState<"ROLE" | "DAYS" | "PLAN" | "PASSWORD" | "DELETE" | "PROFILE" | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [stats, setStats] = useState<{videoDraftCount: number, imageDraftCount: number}>({videoDraftCount: 0, imageDraftCount: 0});
  
  // Form state
  const [newRole, setNewRole] = useState("USER");
  const [daysToAdd, setDaysToAdd] = useState(30);
  const [newPlanId, setNewPlanId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Profile Form state
  const [profileForm, setProfileForm] = useState({ name: "", username: "", email: "", phoneNumber: "", dateOfBirth: "" });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (planFilter) params.set("planId", planFilter);
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter, planFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const fetchUserDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (res.ok) {
        const data = await res.json();
        setUserDetail(data.user);
        setStats(data.stats);
        setProfileForm({
          name: data.user.name || "",
          username: data.user.username || "",
          email: data.user.email || "",
          phoneNumber: data.user.phoneNumber || "",
          dateOfBirth: data.user.dateOfBirth ? new Date(data.user.dateOfBirth).toISOString().split('T')[0] : "",
        });
      }
    } catch (e) {
      console.error(e);
      toast.error(tu('systemError'));
    }
    setDetailLoading(false);
  };

  const executeAction = async () => {
    if (!selectedUser || !modalAction) return;
    setActionLoading(true);

    try {
      if (modalAction === "DELETE") {
        const res = await fetch(`/api/admin/users/${selectedUser.id}`, { method: "DELETE" });
        if (res.ok) {
          fetchUsers();
          closeModal();
        } else {
          const data = await res.json();
          toast.error(data.error || tu('failDelete'));
        }
      } else {
        const payload: Record<string, unknown> = { action: "" };
        if (modalAction === "ROLE") {
          payload.action = "UPDATE_ROLE";
          payload.role = newRole;
        } else if (modalAction === "DAYS") {
          payload.action = "ADD_DAYS";
          payload.daysToAdd = daysToAdd;
        } else if (modalAction === "PLAN") {
          payload.action = "UPDATE_PLAN";
          payload.planId = newPlanId;
        } else if (modalAction === "PASSWORD") {
          payload.action = "RESET_PASSWORD";
          payload.newPassword = newPassword;
        } else if (modalAction === "PROFILE") {
          payload.action = "UPDATE_PROFILE";
          Object.assign(payload, profileForm);
        }

        const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          fetchUsers();
          closeModal();
          toast.success(tu('successAction'));
        } else {
          const data = await res.json();
          toast.error(data.error || tu('failAction'));
        }
      }
    } catch (error) {
      toast.error(tu('systemError'));
    }
    setActionLoading(false);
  };

  const closeModal = () => {
    setModalAction(null);
    setSelectedUser(null);
    setUserDetail(null);
    setNewPassword("");
  };

  const openModal = (user: User, action: typeof modalAction) => {
    setSelectedUser(user);
    setModalAction(action);
    setNewRole(user.role);
    setNewPlanId(user.currentPlan?.id || "");
    if (action === "PASSWORD") setNewPassword(Math.random().toString(36).slice(-8));
    if (action === "PROFILE") fetchUserDetail(user.id);
  };

  const getRemainingDays = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const now = new Date();
    const exp = new Date(expiresAt);
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return `${diffDays} ${tu('daysLeft')}`;
    if (diffDays === 0) return tu('lastDay');
    return tu('expired');
  };

  return (
    <div className="glass-panel shadow-lg rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{tu('usersManagement')}</h2>
          <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
            <input
              type="text"
              placeholder={tu('searchPlaceholder')}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-l-md text-sm w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-purple-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-l-0 border-zinc-300 dark:border-zinc-800 rounded-r-md text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700">
              {tu('search')}
            </button>
          </form>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="text-sm px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded">
            <option value="">{tu('allRoles')}</option>
            <option value="USER">USER</option>
            <option value="SUPERADMIN">SUPERADMIN</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="text-sm px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded">
            <option value="">{tu('allStatus')}</option>
            <option value="ACTIVE">{tu('statusActive')}</option>
            <option value="INACTIVE">{tu('statusInactive')}</option>
          </select>
          <select value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }} className="text-sm px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded">
            <option value="">{tu('allPlans')}</option>
            {initialPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        {loading ? (
          <div className="p-8 text-center text-zinc-500">{tu('loading')}</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 font-medium">{t('nameEmail')}</th>
                <th className="px-6 py-3 font-medium">{t('role')}</th>
                <th className="px-6 py-3 font-medium">{t('subStatus')}</th>
                <th className="px-6 py-3 font-medium text-right">{tu('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900 dark:text-white">{u.name}</div>
                    <div className="text-zinc-500 dark:text-zinc-400 text-xs">{u.email}</div>
                    <div className="text-zinc-500 dark:text-zinc-400 text-xs">@{u.username}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      u.role === "SUPERADMIN" 
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" 
                        : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      u.subscriptionStatus === "ACTIVE" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}>
                      {u.subscriptionStatus}
                    </span>
                    <div className="text-xs text-zinc-500 mt-1">{u.currentPlan?.name || t('free')}</div>
                    {u.subscriptionExpiresAt && (
                      <div className="text-xs font-medium mt-0.5 text-orange-600 dark:text-orange-400">
                        {getRemainingDays(u.subscriptionExpiresAt)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openModal(u, "PROFILE")} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded text-blue-800 dark:text-blue-500">{tu('profile')}</button>
                    <button onClick={() => openModal(u, "ROLE")} className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300">{tu('role')}</button>
                    <button onClick={() => openModal(u, "DAYS")} className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300">{tu('addDays')}</button>
                    <button onClick={() => openModal(u, "PLAN")} className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-700 dark:text-zinc-300">{tu('plan')}</button>
                    <button onClick={() => openModal(u, "PASSWORD")} className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 rounded text-yellow-800 dark:text-yellow-500">{tu('pass')}</button>
                    <button onClick={() => openModal(u, "DELETE")} className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded text-red-800 dark:text-red-500">{tu('del')}</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">{tu('noUsers')}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Pagination */}
      <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {tu('totalUsers')}: {total}
        </div>
        <div className="flex gap-2">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded disabled:opacity-50"
          >{tu('prevPage')}</button>
          <button 
            disabled={page * pageSize >= total} 
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded disabled:opacity-50"
          >{tu('nextPage')}</button>
        </div>
      </div>

      {/* Action Modal */}
      {modalAction && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-panel rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                {modalAction === "ROLE" && tu('changeRole')}
                {modalAction === "DAYS" && tu('addActiveDays')}
                {modalAction === "PLAN" && tu('changePlan')}
                {modalAction === "PASSWORD" && tu('resetPassword')}
                {modalAction === "DELETE" && tu('deleteUser')}
                {modalAction === "PROFILE" && tu('editProfile')}
              </h3>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {modalAction !== "PROFILE" && <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{tu('target')} <strong className="text-zinc-900 dark:text-white">{selectedUser.email}</strong></p>}
              
              {modalAction === "ROLE" && (
                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md">
                  <option value="USER">USER</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                </select>
              )}

              {modalAction === "DAYS" && (
                <input type="number" value={daysToAdd} onChange={e => setDaysToAdd(parseInt(e.target.value))} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md" min="1" />
              )}

              {modalAction === "PLAN" && (
                <select value={newPlanId} onChange={e => setNewPlanId(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md">
                  <option value="">{tu('choosePlan')}</option>
                  {initialPlans.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}

              {modalAction === "PASSWORD" && (
                <div>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-2">{tu('savePasswordInfo')}</p>
                  <input type="text" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md" />
                </div>
              )}

              {modalAction === "DELETE" && (
                <p className="text-red-600 dark:text-red-400 text-sm">{tu('deleteWarning')}</p>
              )}

              {modalAction === "PROFILE" && (
                detailLoading ? <div className="text-center">{tu('loading')}</div> : userDetail && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">{tu('name')}</label>
                        <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md" />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">{tu('username')}</label>
                        <input type="text" value={profileForm.username} onChange={e => setProfileForm({...profileForm, username: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md" />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">{tu('email')}</label>
                        <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md" />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">{tu('phone')}</label>
                        <input type="text" value={profileForm.phoneNumber} onChange={e => setProfileForm({...profileForm, phoneNumber: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md" />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">{tu('dob')}</label>
                        <input type="date" value={profileForm.dateOfBirth} onChange={e => setProfileForm({...profileForm, dateOfBirth: e.target.value})} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md" />
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">{tu('stats')}</h4>
                      <div className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                        <div>{tu('videoDrafts')}: {stats.videoDraftCount}</div>
                        <div>{tu('imageDrafts')}: {stats.imageDraftCount}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">{tu('channels')}</h4>
                      {userDetail.channels.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {userDetail.channels.map(c => (
                            <div key={c.id} className="text-sm p-2 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 flex justify-between">
                              <span>{c.channelName}</span>
                              <span className="text-zinc-500">
                                {c.isLocked ? tu('locked') : tu('active')} &bull; {c.usageCount} uses
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : <div className="text-sm text-zinc-500">{tu('noChannels')}</div>}
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">{tu('invoices')}</h4>
                      {userDetail.invoices.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {userDetail.invoices.map(inv => (
                            <div key={inv.id} className="text-sm p-2 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 flex justify-between">
                              <span>{inv.plan.name} - Rp {inv.amount.toLocaleString('id-ID')}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${inv.status === 'APPROVED' ? 'bg-green-100 text-green-800' : inv.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {inv.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : <div className="text-sm text-zinc-500">{tu('noInvoices')}</div>}
                    </div>

                  </div>
                )
              )}
            </div>

            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 shrink-0">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md">{tu('cancel')}</button>
              <button 
                onClick={executeAction}
                disabled={actionLoading || (modalAction === "PROFILE" && detailLoading)}
                className={`px-4 py-2 text-sm font-medium rounded-md text-white ${modalAction === "DELETE" ? "bg-red-600 hover:bg-red-700" : "bg-purple-600 hover:bg-purple-700"} disabled:opacity-50`}
              >
                {actionLoading ? tu('processing') : tu('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
