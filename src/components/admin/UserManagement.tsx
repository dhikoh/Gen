"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
  createdAt: string;
  currentPlan: { id: string; name: string } | null;
}

interface Plan {
  id: string;
  name: string;
}

export default function UserManagement({ initialPlans }: { initialPlans: Plan[] }) {
  const t = useTranslations("Admin");
  const tu = useTranslations("AdminUsers");
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalAction, setModalAction] = useState<"ROLE" | "DAYS" | "PLAN" | "PASSWORD" | "DELETE" | null>(null);
  
  // Form state
  const [newRole, setNewRole] = useState("USER");
  const [daysToAdd, setDaysToAdd] = useState(30);
  const [newPlanId, setNewPlanId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(search);
  };

  const executeAction = async () => {
    if (!selectedUser || !modalAction) return;
    setActionLoading(true);

    try {
      if (modalAction === "DELETE") {
        const res = await fetch(`/api/admin/users/${selectedUser.id}`, { method: "DELETE" });
        if (res.ok) {
          setUsers(users.filter(u => u.id !== selectedUser.id));
          closeModal();
        } else {
          const data = await res.json();
          toast.error(data.error || tu('failDelete'));
        }
      } else {
        const payload: any = { action: "" };
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
        }

        const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          fetchUsers(search);
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
    setNewPassword("");
  };

  const openModal = (user: User, action: typeof modalAction) => {
    setSelectedUser(user);
    setModalAction(action);
    setNewRole(user.role);
    setNewPlanId(user.currentPlan?.id || "");
    if (action === "PASSWORD") setNewPassword(Math.random().toString(36).slice(-8));
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
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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

      {/* Action Modal */}
      {modalAction && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-panel rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                {modalAction === "ROLE" && tu('changeRole')}
                {modalAction === "DAYS" && tu('addActiveDays')}
                {modalAction === "PLAN" && tu('changePlan')}
                {modalAction === "PASSWORD" && tu('resetPassword')}
                {modalAction === "DELETE" && tu('deleteUser')}
              </h3>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">&times;</button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{tu('target')} <strong className="text-zinc-900 dark:text-white">{selectedUser.email}</strong></p>
              
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
                  <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md" />
                </div>
              )}

              {modalAction === "DELETE" && (
                <p className="text-red-600 dark:text-red-400 text-sm">{tu('deleteWarning')}</p>
              )}
            </div>

            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md">{tu('cancel')}</button>
              <button 
                onClick={executeAction}
                disabled={actionLoading}
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
