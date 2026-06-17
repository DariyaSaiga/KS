"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { IoChevronBack, IoCamera, IoPencil, IoLogOut, IoLockClosed, IoCheckmark, IoClose } from "react-icons/io5";
import { supabase } from "@/lib/supabase";
import { useLogContext } from "@/context/LogContext";
import Menu from "@/components/Menu";
import "../home.css";

type Stats = { tops: number; flashes: number };

export default function Settings() {
  const router = useRouter();
  const { currentUser, logout } = useLogContext();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");

  const [stats, setStats] = useState<Stats>({ tops: 0, flashes: 0 });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser) { router.replace("/login"); return; }
    const meta = currentUser.user_metadata ?? {};
    setDisplayName(meta.display_name ?? "");
    setAvatarUrl(meta.avatar_url ?? null);

    // Статистика
    supabase
      .from("route_achievements")
      .select("achievement")
      .eq("user_id", currentUser.id)
      .then(({ data }) => {
        if (!data) return;
        setStats({
          tops: data.filter((r) => r.achievement === "top").length,
          flashes: data.filter((r) => r.achievement === "flash").length,
        });
      });
  }, [currentUser, router]);

  // ——— Аватар ———
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${currentUser.id}.${ext}`;
      await supabase.storage.from("images").upload(path, file, { upsert: true });
      const { data } = supabase.storage.from("images").getPublicUrl(path);
      const url = data.publicUrl + "?t=" + Date.now(); // cache bust
      await supabase.auth.updateUser({ data: { avatar_url: url } });
      setAvatarUrl(url);
    } catch {
      alert("Ошибка загрузки фото");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ——— Имя ———
  const handleSaveName = async () => {
    if (!currentUser) return;
    setSavingName(true);
    await supabase.auth.updateUser({ data: { display_name: nameInput.trim() } });
    setDisplayName(nameInput.trim());
    setEditingName(false);
    setSavingName(false);
  };

  const startEditName = () => {
    setNameInput(displayName);
    setEditingName(true);
  };

  // ——— Пароль ———
  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) { setPasswordMsg("Пароли не совпадают"); return; }
    if (newPassword.length < 6) { setPasswordMsg("Минимум 6 символов"); return; }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPasswordMsg(error.message); }
    else {
      setPasswordMsg("Пароль изменён ✓");
      setNewPassword(""); setConfirmPassword("");
      setTimeout(() => { setShowPasswordForm(false); setPasswordMsg(""); }, 1500);
    }
    setSavingPassword(false);
  };

  const email = currentUser?.email ?? "";
  const letter = (displayName?.[0] ?? email?.[0] ?? "?").toUpperCase();

  return (
    <div className="w-full min-h-screen bg-gradient-to-tr from-black to-[#001B3B] text-white">
      {/* Хедер */}
      <header className="flex justify-between items-center">
        <Link
          href="/"
          className="m-1 p-2 rounded-full active:bg-white/10 flex items-center"
        >
          <IoChevronBack size={30} className="text-white" />
        </Link>
        <h2 className="logo text-5xl m-1">KS</h2>
      </header>

      <div className="flex flex-col gap-5 px-4 pb-32 pt-2">
        <h1 className="text-4xl">Settings</h1>

        {/* ——— Аватар + имя + email ——— */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="relative">
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              whileTap={{ scale: 0.93 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="w-24 h-24 rounded-full bg-[#1A3A6B] border-2 border-white/20 flex items-center justify-center overflow-hidden"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold">{letter}</span>
              )}
            </motion.button>
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#003676] rounded-full flex items-center justify-center border-2 border-[#0D0D1A]">
              {uploadingAvatar ? (
                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <IoCamera size={16} className="text-white" />
              )}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />

          {/* Имя */}
          <AnimatePresence mode="wait">
            {editingName ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2"
              >
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  className="bg-[#272727] rounded-xl px-3 py-2 text-xl text-white border border-white/20 focus:outline-none focus:border-white/40 w-48 text-center"
                  placeholder="Твоё имя"
                />
                <motion.button onClick={handleSaveName} disabled={savingName} whileTap={{ scale: 0.88 }} transition={{ type: "spring", stiffness: 400, damping: 18 }} className="w-9 h-9 bg-[#003676] rounded-full flex items-center justify-center">
                  <IoCheckmark size={18} />
                </motion.button>
                <motion.button onClick={() => setEditingName(false)} whileTap={{ scale: 0.88 }} transition={{ type: "spring", stiffness: 400, damping: 18 }} className="w-9 h-9 bg-[#272727] rounded-full flex items-center justify-center">
                  <IoClose size={18} />
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                key="display"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                onClick={startEditName}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className="flex items-center gap-2 text-2xl text-white"
              >
                <span>{displayName || "Добавить имя"}</span>
                <IoPencil size={16} className="text-white/40" />
              </motion.button>
            )}
          </AnimatePresence>

          <p className="text-gray-400 text-lg">{email}</p>
        </div>

        {/* ——— Статистика ——— */}
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl text-gray-400">Statistics</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#272727] rounded-2xl p-4 flex flex-col items-center gap-1">
              <span className="text-4xl font-bold text-green-400">{stats.tops}</span>
              <span className="text-lg text-gray-400">Tops</span>
            </div>
            <div className="bg-[#272727] rounded-2xl p-4 flex flex-col items-center gap-1">
              <span className="text-4xl font-bold text-yellow-400">{stats.flashes}</span>
              <span className="text-lg text-gray-400">Flashes ⚡</span>
            </div>
          </div>
          <div className="bg-[#272727] rounded-2xl p-4 flex justify-between items-center">
            <span className="text-xl text-gray-400">Total climbed</span>
            <span className="text-2xl font-bold">{stats.tops + stats.flashes}</span>
          </div>
        </div>

        {/* ——— Пароль ——— */}
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl text-gray-400">Account</h2>
          <motion.button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="bg-[#272727] rounded-2xl p-4 flex justify-between items-center"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#1A3A6B] rounded-xl flex items-center justify-center">
                <IoLockClosed size={18} />
              </div>
              <span className="text-xl">Change password</span>
            </div>
            <motion.span
              animate={{ rotate: showPasswordForm ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="text-gray-400 text-lg"
            >
              ›
            </motion.span>
          </motion.button>

          <AnimatePresence>
            {showPasswordForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-[#1A1A2E] rounded-2xl p-4 flex flex-col gap-3">
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-[#272727] rounded-xl px-3 py-2 text-xl text-white border border-white/10 focus:outline-none focus:border-white/30"
                  />
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-[#272727] rounded-xl px-3 py-2 text-xl text-white border border-white/10 focus:outline-none focus:border-white/30"
                  />
                  {passwordMsg && (
                    <p className={`text-base ${passwordMsg.includes("✓") ? "text-green-400" : "text-red-400"}`}>
                      {passwordMsg}
                    </p>
                  )}
                  <motion.button
                    onClick={handleSavePassword}
                    disabled={savingPassword}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                    className="bg-[#003676] rounded-xl py-2 text-xl disabled:opacity-50"
                  >
                    {savingPassword ? "Saving..." : "Save"}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ——— Выход ——— */}
        <motion.button
          onClick={logout}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="flex items-center gap-3 bg-[#272727] rounded-2xl p-4 mt-2"
        >
          <div className="w-9 h-9 bg-red-500/20 rounded-xl flex items-center justify-center">
            <IoLogOut size={18} className="text-red-400" />
          </div>
          <span className="text-xl text-red-400">Log out</span>
        </motion.button>
      </div>
      <Menu />
    </div>
  );
}
