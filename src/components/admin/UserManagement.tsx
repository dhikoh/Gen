"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [modalAction, setModalAction] = useState<"ROLE" | "DAYS" | "PLAN" | "PASSWORD" | "DELETE" | "PROFILE" | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [stats, setStats] = useState<{videoDraftCount: number, imageDraftCount: number}>({videoDraftCount: 0, imageDraftCount: 0});

  const [newRole, setNewRole] = useState("USER");
  const [daysToAdd, setDaysToAdd] = useState(30);
  const [newPlanId, setNewPlanId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
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
      if (res.ok) { const data = await res.json(); setUsers(data.users); setTotal(data.total); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter, statusFilter, planFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchUsers(); };

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
    } catch (e) { console.error(e); toast.error(tu('systemError')); }
    setDetailLoading(false);
  };

  const executeAction = async () => {
    if (!selectedUser || !modalAction) return;
    setActionLoading(true);
    try {
      if (modalAction === "DELETE") {
        const res = await fetch(`/api/admin/users/${selectedUser.id}`, { method: "DELETE" });
        if (res.ok) { fetchUsers(); closeModal(); }
        else { const data = await res.json(); toast.error(data.error || tu('failDelete')); }
      } else {
        const payload: Record<string, unknown> = { action: "" };
        if (modalAction === "ROLE") { payload.action = "UPDATE_ROLE"; payload.role = newRole; }
        else if (modalAction === "DAYS") { payload.action = "ADD_DAYS"; payload.daysToAdd = daysToAdd; }
        else if (modalAction === "PLAN") { payload.action = "UPDATE_PLAN"; payload.planId = newPlanId; }
        else if (modalAction === "PASSWORD") { payload.action = "RESET_PASSWORD"; payload.newPassword = newPassword; }
        else if (modalAction === "PROFILE") { payload.action = "UPDATE_PROFILE"; Object.assign(payload, profileForm); }
        const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) { fetchUsers(); closeModal(); toast.success(tu('successAction')); }
        else { const data = await res.json(); toast.error(data.error || tu('failAction')); }
      }
    } catch { toast.error(tu('systemError')); }
    setActionLoading(false);
  };

  const closeModal = () => { setModalAction(null); setSelectedUser(null); setUserDetail(null); setNewPassword(""); };

  const openModal = (user: User, action: typeof modalAction) => {
    setSelectedUser(user); setModalAction(action); setNewRole(user.role);
    setNewPlanId(user.currentPlan?.id || "");
    if (action === "PASSWORD") setNewPassword(Math.random().toString(36).slice(-8));
    if (action === "PROFILE") fetchUserDetail(user.id);
  };

  const getRemainingDays = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const diffDays = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
    if (diffDays > 0) return `${diffDays} ${tu('daysLeft')}`;
    if (diffDays === 0) return tu('lastDay');
    return tu('expired');
  };

  const inputCls = "w-full px-3 py-2 text-sm outline-none rounded-lg neu-input";
  const divider = { borderTop: '1px solid var(--pg-shadow-dark)' };
  const dividerB = { borderBottom: '1px solid var(--pg-shadow-dark)' };

  return (
    <div className="neu-flat rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 flex flex-col gap-4" style={dividerB}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--pg-text)' }}>{tu('usersManagement')}</h2>
          <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
            <input type="text" placeholder={tu('searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 text-sm w-full sm:w-64 focus:outline-none rounded-l-lg neu-input" />
            <button type="submit" className="px-4 py-2 text-sm font-medium rounded-r-lg neu-btn" style={{ color: 'var(--pg-text-sub)' }}>
              {tu('search')}
            </button>
          </form>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: roleFilter, onChange: (v: string) => { setRoleFilter(v); setPage(1); }, options: [{ v: "", l: tu('allRoles') }, { v: "USER", l: "USER" }, { v: "SUPERADMIN", l: "SUPERADMIN" }] },
            { value: statusFilter, onChange: (v: string) => { setStatusFilter(v); setPage(1); }, options: [{ v: "", l: tu('allStatus') }, { v: "ACTIVE", l: tu('statusActive') }, { v: "INACTIVE", l: tu('statusInactive') }] },
          ].map((sel, i) => (
            <select key={i} value={sel.value} onChange={(e) => sel.onChange(e.target.value)} className="text-xs px-2 py-1 rounded-lg outline-none neu-input">
              {sel.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          ))}
          <select value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }} className="text-xs px-2 py-1 rounded-lg outline-none neu-input">
            <option value="">{tu('allPlans')}</option>
            {initialPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-h-[400px]">
        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--pg-text-muted)' }}>{tu('loading')}</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase" style={{ background: 'var(--pg-surface)' }}>
              <tr>
                <th className="px-6 py-3 font-semibold" style={{ color: 'var(--pg-text-sub)' }}>{t('nameEmail')}</th>
                <th className="px-6 py-3 font-semibold" style={{ color: 'var(--pg-text-sub)' }}>{t('role')}</th>
                <th className="px-6 py-3 font-semibold" style={{ color: 'var(--pg-text-sub)' }}>{t('subStatus')}</th>
                <th className="px-6 py-3 font-semibold text-right" style={{ color: 'var(--pg-text-sub)' }}>{tu('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="transition-colors" style={{ borderTop: '1px solid var(--pg-shadow-dark)' }}>
                  <td className="px-6 py-4">
                    <div className="font-semibold" style={{ color: 'var(--pg-text)' }}>{u.name}</div>
                    <div className="text-xs" style={{ color: 'var(--pg-text-muted)' }}>{u.email}</div>
                    <div className="text-xs" style={{ color: 'var(--pg-text-muted)' }}>@{u.username}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      u.role === "SUPERADMIN" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" : ""
                    }`}
                      style={u.role !== "SUPERADMIN" ? { background: 'var(--pg-surface)', color: 'var(--pg-text-sub)', border: '1px solid var(--pg-shadow-dark)' } : {}}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      u.subscriptionStatus === "ACTIVE" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : ""
                    }`}
                      style={u.subscriptionStatus !== "ACTIVE" ? { background: 'var(--pg-surface)', color: 'var(--pg-text-muted)', border: '1px solid var(--pg-shadow-dark)' } : {}}
                    >
                      {u.subscriptionStatus}
                    </span>
                    <div className="text-xs mt-1" style={{ color: 'var(--pg-text-muted)' }}>{u.currentPlan?.name || t('free')}</div>
                    {u.subscriptionExpiresAt && (
                      <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--pg-warn)' }}>{getRemainingDays(u.subscriptionExpiresAt)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end flex-wrap gap-1">
                      <button onClick={() => openModal(u, "PROFILE")} className="text-xs px-2 py-1 rounded font-medium" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--pg-brand)' }}>{tu('profile')}</button>
                      <button onClick={() => openModal(u, "ROLE")} className="text-xs px-2 py-1 rounded font-medium neu-btn" style={{ color: 'var(--pg-text-sub)' }}>{tu('role')}</button>
                      <button onClick={() => openModal(u, "DAYS")} className="text-xs px-2 py-1 rounded font-medium neu-btn" style={{ color: 'var(--pg-text-sub)' }}>{tu('addDays')}</button>
                      <button onClick={() => openModal(u, "PLAN")} className="text-xs px-2 py-1 rounded font-medium neu-btn" style={{ color: 'var(--pg-text-sub)' }}>{tu('plan')}</button>
                      <button onClick={() => openModal(u, "PASSWORD")} className="text-xs px-2 py-1 rounded font-medium" style={{ background: 'rgba(253,177,29,0.12)', color: 'var(--pg-warn)' }}>{tu('pass')}</button>
                      <button onClick={() => openModal(u, "DELETE")} className="text-xs px-2 py-1 rounded font-medium" style={{ background: 'rgba(225,112,85,0.12)', color: 'var(--pg-danger)' }}>{tu('del')}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr><td colSpan={4} className="px-6 py-8 text-center" style={{ color: 'var(--pg-text-muted)' }}>{tu('noUsers')}</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 flex justify-between items-center" style={divider}>
        <div className="text-sm" style={{ color: 'var(--pg-text-muted)' }}>{tu('totalUsers')}: {total}</div>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm rounded-lg disabled:opacity-50 neu-btn" style={{ color: 'var(--pg-text-sub)' }}>{tu('prevPage')}</button>
          <button disabled={page * pageSize >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm rounded-lg disabled:opacity-50 neu-btn" style={{ color: 'var(--pg-text-sub)' }}>{tu('nextPage')}</button>
        </div>
      </div>

      {/* Modal */}
      {modalAction && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="neu-flat rounded-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 flex justify-between items-center shrink-0" style={dividerB}>
              <h3 className="font-semibold" style={{ color: 'var(--pg-text)' }}>
                {modalAction === "ROLE" && tu('changeRole')}
                {modalAction === "DAYS" && tu('addActiveDays')}
                {modalAction === "PLAN" && tu('changePlan')}
                {modalAction === "PASSWORD" && tu('resetPassword')}
                {modalAction === "DELETE" && tu('deleteUser')}
                {modalAction === "PROFILE" && tu('editProfile')}
              </h3>
              <button onClick={closeModal} className="text-lg leading-none" style={{ color: 'var(--pg-text-muted)' }}>×</button>
            </div>

            <div className="p-6 overflow-y-auto">
              {modalAction !== "PROFILE" && (
                <p className="text-sm mb-4" style={{ color: 'var(--pg-text-sub)' }}>
                  {tu('target')} <strong style={{ color: 'var(--pg-text)' }}>{selectedUser.email}</strong>
                </p>
              )}

              {modalAction === "ROLE" && (
                <select value={newRole} onChange={e => setNewRole(e.target.value)} className={inputCls}>
                  <option value="USER">USER</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                </select>
              )}

              {modalAction === "DAYS" && (
                <input type="number" value={daysToAdd} onChange={e => setDaysToAdd(parseInt(e.target.value))} className={inputCls} min="1" />
              )}

              {modalAction === "PLAN" && (
                <select value={newPlanId} onChange={e => setNewPlanId(e.target.value)} className={inputCls}>
                  <option value="">{tu('choosePlan')}</option>
                  {initialPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}

              {modalAction === "PASSWORD" && (
                <div>
                  <p className="text-xs mb-2" style={{ color: 'var(--pg-warn)' }}>{tu('savePasswordInfo')}</p>
                  <input type="text" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputCls} />
                </div>
              )}

              {modalAction === "DELETE" && (
                <p className="text-sm" style={{ color: 'var(--pg-danger)' }}>{tu('deleteWarning')}</p>
              )}

              {modalAction === "PROFILE" && (
                detailLoading ? <div className="text-center" style={{ color: 'var(--pg-text-muted)' }}>{tu('loading')}</div> : userDetail && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: tu('name'), key: 'name', type: 'text' },
                        { label: tu('username'), key: 'username', type: 'text' },
                        { label: tu('email'), key: 'email', type: 'email' },
                        { label: tu('phone'), key: 'phoneNumber', type: 'text' },
                        { label: tu('dob'), key: 'dateOfBirth', type: 'date' },
                      ].map(({ label, key, type }) => (
                        <div key={key}>
                          <label className="block text-xs mb-1" style={{ color: 'var(--pg-text-sub)' }}>{label}</label>
                          <input type={type} value={profileForm[key as keyof typeof profileForm]}
                            onChange={e => setProfileForm({ ...profileForm, [key]: e.target.value })} className={inputCls} />
                        </div>
                      ))}
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--pg-text)' }}>{tu('stats')}</h4>
                      <div className="flex gap-4 text-sm" style={{ color: 'var(--pg-text-sub)' }}>
                        <div>{tu('videoDrafts')}: {stats.videoDraftCount}</div>
                        <div>{tu('imageDrafts')}: {stats.imageDraftCount}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--pg-text)' }}>{tu('channels')}</h4>
                      {userDetail.channels.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {userDetail.channels.map(c => (
                            <div key={c.id} className="text-sm p-2 rounded-lg flex justify-between" style={{ background: 'var(--pg-surface)', border: '1px solid var(--pg-shadow-dark)' }}>
                              <span style={{ color: 'var(--pg-text)' }}>{c.channelName}</span>
                              <span style={{ color: 'var(--pg-text-muted)' }}>{c.isLocked ? tu('locked') : tu('active')} • {tu('usageCount', { count: c.usageCount })}</span>
                            </div>
                          ))}
                        </div>
                      ) : <div className="text-sm" style={{ color: 'var(--pg-text-muted)' }}>{tu('noChannels')}</div>}
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--pg-text)' }}>{tu('invoices')}</h4>
                      {userDetail.invoices.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {userDetail.invoices.map(inv => (
                            <div key={inv.id} className="text-sm p-2 rounded-lg flex justify-between" style={{ background: 'var(--pg-surface)', border: '1px solid var(--pg-shadow-dark)' }}>
                              <span style={{ color: 'var(--pg-text)' }}>{inv.plan.name} - Rp {inv.amount.toLocaleString('id-ID')}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                inv.status === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : inv.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}>
                                {inv.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : <div className="text-sm" style={{ color: 'var(--pg-text-muted)' }}>{tu('noInvoices')}</div>}
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="px-6 py-4 flex justify-end gap-3 shrink-0" style={{ ...divider, background: 'var(--pg-surface)' }}>
              <button onClick={closeModal} className="px-4 py-2 text-sm rounded-lg neu-btn" style={{ color: 'var(--pg-text-sub)' }}>{tu('cancel')}</button>
              <button
                onClick={executeAction}
                disabled={actionLoading || (modalAction === "PROFILE" && detailLoading)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-50 ${modalAction === "DELETE" ? "" : "neu-btn-brand"}`}
                style={modalAction === "DELETE" ? { background: 'var(--pg-danger)' } : {}}
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
