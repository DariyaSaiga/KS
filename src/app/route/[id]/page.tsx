"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useLogContext } from "@/context/LogContext";
import Menu from "@/components/Menu";
import { IoHeart, IoHeartOutline, IoChevronBack, IoPencil, IoTrash } from "react-icons/io5";

type RouteData = {
  id: number;
  name: string;
  level: string;
  description: string;
  color: string;
  image_url: string;
  created_by?: string;
};

type Achievement = "none" | "top" | "flash";

interface Comment {
  id: string;
  text: string;
  timestamp: number;
  userEmail: string;
}

const LEVELS = [
  "5a","5b","5c",
  "6a","6a+","6b","6b+","6c","6c+",
  "7a","7a+","7b","7b+","7c","7c+",
  "8a","8a+","8b","8b+","8c","8c+",
];

// ——— Анимация звёздочек при Flash ———
function StarBurst({ active }: { active: boolean }) {
  const particles = useMemo(() =>
    Array.from({ length: 22 }, (_, i) => ({
      id: i,
      angle: (i / 22) * 360 + Math.random() * 16,
      dist: 90 + Math.random() * 130,
      size: 12 + Math.random() * 16,
      delay: Math.random() * 0.3,
    })), []);

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          {particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            return (
              <motion.span
                key={p.id}
                className="absolute select-none"
                initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                animate={{
                  x: Math.cos(rad) * p.dist * 2.5,
                  y: Math.sin(rad) * p.dist * 2.5,
                  opacity: 0,
                  scale: 0.2,
                  rotate: 540,
                }}
                transition={{ duration: 1.3, delay: p.delay, ease: "easeOut" }}
                style={{ fontSize: p.size }}
              >
                ⭐
              </motion.span>
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}

// ——— Полноэкранный просмотр фото с зумом ———
function PhotoViewer({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const scale = useRef(1);
  const offset = useRef({ x: 0, y: 0 });
  const lastDist = useRef<number | null>(null);
  const lastTap = useRef(0);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const MIN = 1;
  const MAX = 6;

  function clampOffset(s: number, ox: number, oy: number, img: HTMLImageElement) {
    const maxX = Math.max(0, (img.offsetWidth * s - img.offsetWidth) / 2);
    const maxY = Math.max(0, (img.offsetHeight * s - img.offsetHeight) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, ox)),
      y: Math.min(maxY, Math.max(-maxY, oy)),
    };
  }

  function apply(img: HTMLImageElement) {
    const { x, y } = offset.current;
    img.style.transform = `translate(${x}px, ${y}px) scale(${scale.current})`;
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastDist.current = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      dragStart.current = null;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        // double-tap → toggle 2.5x / 1x
        const img = imgRef.current;
        if (!img) return;
        if (scale.current > 1) {
          scale.current = 1;
          offset.current = { x: 0, y: 0 };
        } else {
          scale.current = 2.5;
        }
        apply(img);
        lastTap.current = 0;
      } else {
        lastTap.current = now;
        dragStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          ox: offset.current.x,
          oy: offset.current.y,
        };
      }
      lastDist.current = null;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    const img = imgRef.current;
    if (!img) return;

    if (e.touches.length === 2 && lastDist.current !== null) {
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY
      );
      const delta = dist / lastDist.current;
      scale.current = Math.min(MAX, Math.max(MIN, scale.current * delta));
      const clamped = clampOffset(scale.current, offset.current.x, offset.current.y, img);
      offset.current = clamped;
      lastDist.current = dist;
      apply(img);
    } else if (e.touches.length === 1 && dragStart.current && scale.current > 1) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      const clamped = clampOffset(
        scale.current,
        dragStart.current.ox + dx,
        dragStart.current.oy + dy,
        img
      );
      offset.current = clamped;
      apply(img);
    }
  };

  const onTouchEnd = () => {
    lastDist.current = null;
    const img = imgRef.current;
    if (!img) return;
    if (scale.current < 1.05) {
      scale.current = 1;
      offset.current = { x: 0, y: 0 };
      apply(img);
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    const img = imgRef.current;
    if (!img) return;
    const delta = e.deltaY > 0 ? 0.85 : 1.15;
    scale.current = Math.min(MAX, Math.max(MIN, scale.current * delta));
    const clamped = clampOffset(scale.current, offset.current.x, offset.current.y, img);
    offset.current = clamped;
    apply(img);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      style={{ touchAction: "none" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onWheel={onWheel}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="max-w-full max-h-full object-contain select-none"
        style={{ transition: "transform 0.05s linear", userSelect: "none", pointerEvents: "none" }}
        draggable={false}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white text-xl z-10"
      >
        ✕
      </button>
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-sm">
        Pinch or double-tap to zoom
      </p>
    </motion.div>
  );
}

// ——— Кружок-аватар ———
function Avatar({ email, size = "w-10 h-10" }: { email: string; size?: string }) {
  const letter = (email?.split("@")[0]?.[0] ?? "?").toUpperCase();
  return (
    <div className={`${size} rounded-full bg-[#1A3A6B] border border-white/20 flex items-center justify-center text-sm font-bold flex-shrink-0`}>
      {letter}
    </div>
  );
}

export default function RouteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { currentUser } = useLogContext();

  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);

  // — Состояния —
  const [achievement, setAchievement] = useState<Achievement>("none");
  const [showFlash, setShowFlash] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [userLevel, setUserLevel] = useState("");
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showPhoto, setShowPhoto] = useState(false);

  // Загрузка трассы
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase.from("routes").select("*").eq("id", id).single();
      if (error || !data) { router.replace("/"); return; }
      setRoute(data as RouteData);
      setLoading(false);
    })();
  }, [id, router]);

  // Загрузка данных пользователя из Supabase
  useEffect(() => {
    if (!currentUser || !id) return;
    const uid = currentUser.id;
    const rid = Number(id);

    (async () => {
      const [favRes, ratingRes, achRes, levelRes, commentsRes] = await Promise.all([
        supabase.from("route_favorites").select("id").eq("user_id", uid).eq("route_id", rid).maybeSingle(),
        supabase.from("route_ratings").select("rating").eq("user_id", uid).eq("route_id", rid).maybeSingle(),
        supabase.from("route_achievements").select("achievement").eq("user_id", uid).eq("route_id", rid).maybeSingle(),
        supabase.from("route_user_levels").select("level").eq("user_id", uid).eq("route_id", rid).maybeSingle(),
        supabase.from("route_comments").select("id, text, created_at, user_email").eq("route_id", rid).order("created_at"),
      ]);

      setIsFavorite(!!favRes.data);
      setRating(ratingRes.data?.rating ?? 0);
      setAchievement((achRes.data?.achievement as Achievement) ?? "none");
      setUserLevel(levelRes.data?.level ?? "");

      if (commentsRes.data) {
        setComments(commentsRes.data.map((c) => ({
          id: c.id,
          text: c.text,
          timestamp: new Date(c.created_at).getTime(),
          userEmail: c.user_email,
        })));
      }
    })();
  }, [currentUser, id]);

  // — Обработчики —
  const handleAchievement = async (type: "top" | "flash") => {
    if (!currentUser) return;
    const next: Achievement = achievement === type ? "none" : type;
    setAchievement(next);
    if (next === "flash") { setShowFlash(true); setTimeout(() => setShowFlash(false), 1600); }

    if (next === "none") {
      await supabase.from("route_achievements").delete()
        .eq("user_id", currentUser.id).eq("route_id", Number(id));
    } else {
      await supabase.from("route_achievements").upsert(
        { user_id: currentUser.id, route_id: Number(id), achievement: next },
        { onConflict: "user_id,route_id" }
      );
    }
  };

  const handleFavorite = async () => {
    if (!currentUser) return;
    const next = !isFavorite;
    setIsFavorite(next);
    if (next) {
      await supabase.from("route_favorites").insert({ user_id: currentUser.id, route_id: Number(id) });
    } else {
      await supabase.from("route_favorites").delete()
        .eq("user_id", currentUser.id).eq("route_id", Number(id));
    }
  };

  const handleRating = async (r: number) => {
    if (!currentUser) return;
    const next = rating === r ? 0 : r;
    setRating(next);
    if (next === 0) {
      await supabase.from("route_ratings").delete()
        .eq("user_id", currentUser.id).eq("route_id", Number(id));
    } else {
      await supabase.from("route_ratings").upsert(
        { user_id: currentUser.id, route_id: Number(id), rating: next },
        { onConflict: "user_id,route_id" }
      );
    }
  };

  const handleUserLevel = async (lvl: string) => {
    if (!currentUser) return;
    const next = userLevel === lvl ? "" : lvl;
    setUserLevel(next);
    setShowLevelPicker(false);
    if (!next) {
      await supabase.from("route_user_levels").delete()
        .eq("user_id", currentUser.id).eq("route_id", Number(id));
    } else {
      await supabase.from("route_user_levels").upsert(
        { user_id: currentUser.id, route_id: Number(id), level: next },
        { onConflict: "user_id,route_id" }
      );
    }
  };

  const handleDelete = async () => {
    if (!currentUser) return;
    if (route?.created_by && currentUser.id !== route.created_by) return;
    if (!confirm("Удалить трассу? Это действие нельзя отменить.")) return;

    // Удаляем фото из storage
    if (route?.image_url) {
      const parts = route.image_url.split("/images/");
      if (parts[1]) {
        await supabase.storage.from("images").remove([parts[1]]);
      }
    }

    await supabase.from("routes").delete().eq("id", Number(id));
    router.replace("/");
  };

  const handleAddComment = async () => {
    if (!currentUser || !newComment.trim()) return;
    const { data, error } = await supabase.from("route_comments").insert({
      user_id: currentUser.id,
      user_email: currentUser.email ?? "anonymous",
      route_id: Number(id),
      text: newComment.trim(),
    }).select("id, text, created_at, user_email").single();

    if (!error && data) {
      setComments((prev) => [...prev, {
        id: data.id,
        text: data.text,
        timestamp: new Date(data.created_at).getTime(),
        userEmail: data.user_email,
      }]);
      setNewComment("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-black to-[#001B3B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }
  if (!route) return null;

  const userEmail = currentUser?.email ?? "anonymous";
  // isOwner: либо создатель трассы, либо created_by не установлен (старые трассы без владельца)
  const isOwner = !!currentUser && (!route.created_by || currentUser.id === route.created_by);

  return (
    <div className="min-h-screen bg-[#0D0D1A] text-white pb-28">
      <StarBurst active={showFlash} />

      {/* Хедер */}
      <div className="flex justify-between items-center px-3 py-3">
        <Link
          href="/"
          className="m-1 p-2 rounded-full active:bg-white/10 transition-colors flex items-center justify-center"
        >
          <IoChevronBack size={30} className="text-white" />
        </Link>

        <div className="flex items-center gap-1">
          {/* Кнопки только для создателя */}
          {isOwner && (
            <>
              <motion.div whileTap={{ scale: 0.88 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
                <Link
                  href={`/route/${id}/edit`}
                  className="w-10 h-10 flex items-center justify-center rounded-full"
                >
                  <IoPencil size={22} className="text-white/70" />
                </Link>
              </motion.div>
              <motion.button
                onClick={handleDelete}
                whileTap={{ scale: 0.88 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className="w-10 h-10 flex items-center justify-center rounded-full"
              >
                <IoTrash size={22} className="text-red-400/80" />
              </motion.button>
            </>
          )}

          <motion.button
            onClick={handleFavorite}
            whileTap={{ scale: 0.82 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="w-10 h-10 flex items-center justify-center rounded-full"
          >
            {isFavorite ? (
              <IoHeart size={30} className="text-red-500" />
            ) : (
              <IoHeartOutline size={30} className="text-white" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Фото + Top/Flash */}
      <div className="mx-3 rounded-2xl overflow-hidden relative" style={{ border: "2px solid #1A3A6B" }}>
        {route.image_url ? (
          <div
            className="relative h-64 w-full bg-[#0D0D1A] cursor-zoom-in"
            onClick={() => setShowPhoto(true)}
          >
            <Image src={route.image_url} alt={route.name} fill className="object-cover" sizes="100vw" />

            {/* Оверлей при Top/Flash */}
            <AnimatePresence>
              {achievement === "flash" && (
                <motion.div
                  key="flash-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-t from-yellow-400/60 via-yellow-300/10 to-transparent"
                />
              )}
              {achievement === "top" && (
                <motion.div
                  key="top-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-t from-green-600/60 via-green-500/10 to-transparent"
                />
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="h-64 bg-[#1A1A2E] flex items-center justify-center text-gray-500">No photo</div>
        )}

        {/* Top | Flash тоггл */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
          <div className="flex bg-black/60 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20">
            <motion.button
              onClick={() => handleAchievement("top")}
              whileTap={{ scale: 0.91 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className={`px-6 py-2 text-base font-medium transition-colors ${
                achievement === "top" ? "bg-green-600 text-white" : "text-white/60"
              }`}
            >
              Top
            </motion.button>
            <div className="w-px bg-white/20" />
            <motion.button
              onClick={() => handleAchievement("flash")}
              whileTap={{ scale: 0.91 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className={`px-6 py-2 text-base font-medium transition-colors ${
                achievement === "flash" ? "bg-yellow-500 text-black font-bold" : "text-white/60"
              }`}
            >
              {achievement === "flash" ? "⚡ Flash" : "Flash"}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Инфо */}
      <div className="px-4 pt-4 flex flex-col gap-3">

        {/* Название + цвет */}
        <div className="flex justify-between items-center gap-3">
          <h1 className="text-3xl font-bold flex-1">{route.name}</h1>
          <div className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-white/20" style={{ backgroundColor: route.color }} />
        </div>

        {/* Уровень из БД */}
        <p className="text-gray-200 text-2xl">{route.level?.toUpperCase()}</p>

        {/* Описание */}
        <p className="text-gray-200 text-base leading-relaxed">{route.description}</p>

        <div className="flex items-center gap-3">
          {/* Аватар появляется только после выбора уровня */}
          <AnimatePresence>
            {userLevel && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Avatar email={userEmail} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Кружок с уровнем — всегда виден */}
          <motion.button
            onClick={() => setShowLevelPicker(true)}
            whileTap={{ scale: 0.88 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-2 ${
              userLevel
                ? "bg-[#003676] border-blue-400 text-white"
                : "bg-[#1A3A6B] border-white/20 text-white/50"
            }`}
            title="Suggest/confirm level"
          >
            {userLevel ? userLevel.toUpperCase() : "L"}
          </motion.button>

        </div>

        {/* Рейтинг */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <motion.button
              key={s}
              onClick={() => handleRating(s)}
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(0)}
              whileTap={{ scale: 1.4 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="text-2xl"
            >
              {s <= (hoverRating || rating) ? "⭐" : "☆"}
            </motion.button>
          ))}
          {rating > 0 && (
            <motion.button
              onClick={() => handleRating(0)}
              whileTap={{ scale: 0.88 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="text-xl text-gray-500 ml-2"
            >
              reset
            </motion.button>
          )}
        </div>

        {/* Комментарии */}
        <div className="flex flex-col gap-3 mt-1">
          <p className="text-gray-400 text-2xl">
            {comments.length > 0 ? `Comments (${comments.length})` : "Add comment"}
          </p>

          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 items-start">
              <Avatar email={c.userEmail} size="w-8 h-8" />
              <div className="flex-1 bg-[#1A1A2E] rounded-xl px-3 py-2">
                <p className="text-xl text-gray-500 mb-1">{c.userEmail.split("@")[0]}</p>
                <p className="text-2xl">{c.text}</p>
              </div>
            </div>
          ))}

          {/* Поле ввода */}
          <div className="flex gap-2 items-center">
            <Avatar email={userEmail} size="w-8 h-8" />
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              placeholder="Add comment..."
              className="flex-1 bg-[#1A1A2E] rounded-xl px-3 py-2 text-lg text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-white/30"
            />
            <motion.button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              whileTap={{ scale: 0.88 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="w-9 h-9 flex items-center justify-center bg-[#003676] rounded-xl text-base disabled:opacity-30"
            >
              →
            </motion.button>
          </div>
        </div>
      </div>

      {/* Модалка выбора уровня */}
      <AnimatePresence>
        {showLevelPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-40 flex items-end"
            onClick={() => setShowLevelPicker(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full bg-[#0D0D1A] border-t border-white/10 rounded-t-2xl p-5 pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />
              <h3 className="text-xl text-center mb-1">Твой уровень</h3>
              <p className="text-sm text-gray-400 text-center mb-4">
                Уровень трассы: <span className="text-white font-bold">{route.level?.toUpperCase()}</span>
              </p>
              <div className="grid grid-cols-5 gap-2">
                {LEVELS.map((lvl) => (
                  <motion.button
                    key={lvl}
                    onClick={() => handleUserLevel(lvl)}
                    whileTap={{ scale: 0.88 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                    className={`py-2 rounded-lg text-sm font-medium ${
                      userLevel === lvl
                        ? "bg-[#003676] text-white"
                        : "bg-[#1A1A2E] text-gray-300"
                    }`}
                  >
                    {lvl.toUpperCase()}
                  </motion.button>
                ))}
              </div>
              {userLevel && (
                <motion.button
                  onClick={() => handleUserLevel("")}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="w-full mt-3 py-2 text-sm text-gray-400 border border-white/10 rounded-lg"
                >
                  Убрать мой уровень
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Полноэкранный просмотр фото */}
      <AnimatePresence>
        {showPhoto && route.image_url && (
          <PhotoViewer
            src={route.image_url}
            alt={route.name}
            onClose={() => setShowPhoto(false)}
          />
        )}
      </AnimatePresence>

      <Menu />
    </div>
  );
}
