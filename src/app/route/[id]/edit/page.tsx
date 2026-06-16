"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLogContext } from "@/context/LogContext";
import { IoChevronBack } from "react-icons/io5";
import "@/app/home.css";

const LEVELS = [
  "5a","5b","5c",
  "6a","6a+","6b","6b+","6c","6c+",
  "7a","7a+","7b","7b+","7c","7c+",
  "8a","8a+","8b","8b+","8c","8c+",
];

const PRESET_COLORS = [
  "#FF3333","#FFD700","#3B82F6","#22C55E",
  "#F97316","#FFFFFF","#000000","#A855F7","#EC4899",
];

export default function EditRoute() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { currentUser } = useLogContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#ff0000");
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState<string | null>(null);

  const colorInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("routes")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) { router.replace("/"); return; }

      // Проверка: только создатель может редактировать (если created_by не задан — старая трасса, разрешаем)
      if (data.created_by && currentUser?.id !== data.created_by) {
        router.replace(`/route/${id}`);
        return;
      }
      if (!currentUser) {
        router.replace(`/route/${id}`);
        return;
      }

      setName(data.name ?? "");
      setLevel(data.level ?? "");
      setDescription(data.description ?? "");
      setColor(data.color ?? "#ff0000");
      setExistingImageUrl(data.image_url ?? "");
      setLoading(false);
    })();
  }, [id, currentUser, router]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      let processed = file;
      if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
        const heic2any = (await import("heic2any")).default;
        const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 }) as Blob;
        processed = new File([blob], file.name.replace(/\.(heic|HEIC)$/i, ".jpg"), { type: "image/jpeg" });
      }
      setNewFile(processed);
      setNewPreview(URL.createObjectURL(processed));
    } catch {
      alert("Ошибка обработки файла");
    }
  };

  const handleSave = async () => {
    if (!name || !level || !description) {
      alert("Заполните все поля");
      return;
    }
    setSaving(true);
    try {
      let imageUrl = existingImageUrl;

      // Если выбрано новое фото — загружаем
      if (newFile) {
        const ext = newFile.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(fileName, newFile);
        if (uploadError) throw uploadError;

        const { data: pubData } = supabase.storage.from("images").getPublicUrl(fileName);
        imageUrl = pubData.publicUrl;

        // Удаляем старое фото
        if (existingImageUrl) {
          const parts = existingImageUrl.split("/images/");
          if (parts[1]) await supabase.storage.from("images").remove([parts[1]]);
        }
      }

      const { error } = await supabase
        .from("routes")
        .update({ name, level, description, color, image_url: imageUrl })
        .eq("id", Number(id));

      if (error) throw error;

      router.replace(`/route/${id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Неизвестная ошибка";
      alert(`Ошибка: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-black to-[#001B3B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-tr from-black to-[#001B3B] flex flex-col">
      <header className="flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="m-1 p-2 rounded-full active:bg-white/10 flex items-center"
        >
          <IoChevronBack size={30} className="text-white" />
        </button>
        <h2 className="logo text-5xl m-1">KS</h2>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-16">
        <h1 className="text-4xl">Edit route</h1>

        <div className="bg-[#272727] rounded-xl p-3 flex flex-col gap-4">
          {/* Name */}
          <input
            type="text"
            placeholder="Name of route"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 bg-[#4A4A4A] rounded-md h-10 text-xl"
          />

          {/* Color */}
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-9 h-9 rounded-full flex-shrink-0 transition-transform"
                style={{
                  backgroundColor: c,
                  border: color === c ? "3px solid white" : "2px solid rgba(255,255,255,0.25)",
                  transform: color === c ? "scale(1.2)" : "scale(1)",
                  boxShadow: c === "#000000" ? "0 0 0 1px rgba(255,255,255,0.3)" : undefined,
                }}
              />
            ))}
            <input
              ref={colorInputRef}
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute opacity-0 w-0 h-0"
            />
            <button
              onClick={() => colorInputRef.current?.click()}
              className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-lg border-2 border-dashed border-white/40 bg-[#4A4A4A]"
            >
              +
            </button>
          </div>

          {/* Level */}
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="p-2 border rounded-md h-10 w-20 text-white text-xl bg-[#4A4A4A]"
          >
            <option value="">Level</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l.toUpperCase()}</option>
            ))}
          </select>

          {/* Description */}
          <textarea
            placeholder="Description of route"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-2 text-inder bg-[#4A4A4A] rounded-md h-30 text-lg"
          />
        </div>

        {/* Photo */}
        <div className="flex flex-col gap-2">
          {/* Current photo */}
          {existingImageUrl && !newPreview && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={existingImageUrl} alt="current" className="w-full rounded-md object-cover max-h-64" />
              <p className="text-gray-400 text-sm mt-1 text-center">Текущее фото</p>
            </div>
          )}

          {/* New photo preview */}
          {newPreview && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={newPreview} alt="new" className="w-full rounded-md object-cover max-h-64" />
              <button
                onClick={() => { setNewFile(null); setNewPreview(null); }}
                className="absolute top-2 right-2 bg-red-500 rounded-md px-2 py-1 text-sm"
              >
                ✕
              </button>
              <p className="text-gray-400 text-sm mt-1 text-center">Новое фото</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,image/heic"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#272727] text-white rounded-md border border-white/20 active:bg-[#1A1A2E] transition-colors text-xl"
          >
            {newPreview || existingImageUrl ? "Replace photo" : "Add photo"}
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-500 active:bg-[#001B3B] text-2xl p-2 mt-2 rounded-md disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </main>
    </div>
  );
}
