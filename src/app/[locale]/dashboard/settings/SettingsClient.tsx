"use client";

import { useState } from "react";

export default function SettingsClient() {
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMessage("Profil berhasil diperbarui. (Silakan refresh halaman untuk melihat perubahan).");
      } else {
        setProfileMessage(data.error || "Gagal memperbarui profil.");
      }
    } catch (err) {
      setProfileMessage("Terjadi kesalahan.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage("");
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMessage("Kata sandi berhasil diperbarui.");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setPasswordMessage(data.error || "Gagal memperbarui kata sandi.");
      }
    } catch (err) {
      setPasswordMessage("Terjadi kesalahan.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <section className="pg-surface border pg-border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold pg-text-heading mb-4">Profil Pengguna</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium pg-text-sub mb-1">Nama Baru</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border pg-border rounded-lg bg-transparent pg-text-heading focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan nama baru"
              required
            />
          </div>
          <button
            type="submit"
            disabled={profileLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {profileLoading ? "Menyimpan..." : "Simpan Profil"}
          </button>
          {profileMessage && <p className="text-sm text-green-600 dark:text-green-400 mt-2">{profileMessage}</p>}
        </form>
      </section>

      {/* Password Section */}
      <section className="pg-surface border pg-border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold pg-text-heading mb-4">Ubah Kata Sandi</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium pg-text-sub mb-1">Kata Sandi Saat Ini</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 border pg-border rounded-lg bg-transparent pg-text-heading focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium pg-text-sub mb-1">Kata Sandi Baru</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border pg-border rounded-lg bg-transparent pg-text-heading focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={passwordLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {passwordLoading ? "Menyimpan..." : "Ubah Kata Sandi"}
          </button>
          {passwordMessage && <p className="text-sm pg-text-sub mt-2">{passwordMessage}</p>}
        </form>
      </section>
    </div>
  );
}
