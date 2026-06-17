"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import Menu from "../../components/Menu";
import PlusIcon from "../../../public/icons/Plus.svg";
import NotIcon from "../../../public/icons/not.svg";
import { useLogContext } from "@/context/LogContext";
import { IoSettingsSharp, IoPencil, IoCheckmark } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import "../home.css";

const tapSpring = { whileTap: { scale: 0.91 as number }, transition: { type: "spring" as const, stiffness: 400, damping: 18 } };

type DrawingTool = "circle-red" | "circle-yellow" | "line" | "arrow";

interface Stroke {
  tool: DrawingTool;
  x1: number; y1: number;
  x2: number; y2: number;
}

function toolColor(tool: DrawingTool) {
  if (tool === "circle-red") return "#FF3333";
  if (tool === "circle-yellow") return "#FFD700";
  return "#FFFFFF";
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, lw: number) {
  const { tool, x1, y1, x2, y2 } = stroke;
  const color = toolColor(tool);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (tool === "circle-red" || tool === "circle-yellow") {
    const r = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    if (r < 3) return;
    ctx.beginPath();
    ctx.arc(x1, y1, r, 0, Math.PI * 2);
    ctx.stroke();
  } else if (tool === "line") {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  } else if (tool === "arrow") {
    const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const headLen = Math.max(lw * 4, dist * 0.2);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }
}

// lineWidth scaled to canvas resolution (~8px at 400px display width)
function scaledLW(canvas: HTMLCanvasElement) {
  return Math.max(6, canvas.width * 0.02);
}

export default function Add() {
  const { currentUser } = useLogContext();
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#ff0000");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Drawing
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [drawingTool, setDrawingTool] = useState<DrawingTool>("circle-red");
  const activeRef = useRef<{ on: boolean; x1: number; y1: number }>({ on: false, x1: 0, y1: 0 });
  const [showEditor, setShowEditor] = useState(false);
  const canvasDataUrlRef = useRef<string | null>(null); // saved when editor closes

  const closeEditor = useCallback(() => {
    if (canvasRef.current) {
      canvasDataUrlRef.current = canvasRef.current.toDataURL("image/jpeg", 0.95);
    }
    setShowEditor(false);
  }, []);

  // Callback ref — re-draws when canvas mounts (e.g. editor opens)
  const setCanvasRef = useCallback((node: HTMLCanvasElement | null) => {
    canvasRef.current = node;
    if (node && loadedImageRef.current) {
      const img = loadedImageRef.current;
      node.width = img.naturalWidth;
      node.height = img.naturalHeight;
      const ctx = node.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        strokesRef.current.forEach((s) => drawStroke(ctx, s, scaledLW(node)));
      }
    }
  }, []);

  const redrawCanvas = useCallback((extra?: Stroke) => {
    const canvas = canvasRef.current;
    const img = loadedImageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const all = extra ? [...strokesRef.current, extra] : strokesRef.current;
    all.forEach((s) => drawStroke(ctx, s, scaledLW(canvas)));
  }, []);

  useEffect(() => {
    strokesRef.current = strokes;
    redrawCanvas();
  }, [strokes, redrawCanvas]);

  useEffect(() => {
    if (!filePreview) { loadedImageRef.current = null; return; }
    const img = new window.Image();
    img.onload = () => {
      loadedImageRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
    };
    img.src = filePreview;
  }, [filePreview]);

  const pt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (canvas.width / r.width),
      y: (clientY - r.top) * (canvas.height / r.height),
    };
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = pt(e.clientX, e.clientY);
    activeRef.current = { on: true, x1: x, y1: y };
  };
  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeRef.current.on) return;
    const { x, y } = pt(e.clientX, e.clientY);
    redrawCanvas({ tool: drawingTool, x1: activeRef.current.x1, y1: activeRef.current.y1, x2: x, y2: y });
  };
  const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeRef.current.on) return;
    const { x, y } = pt(e.clientX, e.clientY);
    setStrokes((p) => [...p, { tool: drawingTool, x1: activeRef.current.x1, y1: activeRef.current.y1, x2: x, y2: y }]);
    activeRef.current.on = false;
  };

  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const t = e.touches[0];
    const { x, y } = pt(t.clientX, t.clientY);
    activeRef.current = { on: true, x1: x, y1: y };
  };
  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!activeRef.current.on) return;
    const t = e.touches[0];
    const { x, y } = pt(t.clientX, t.clientY);
    redrawCanvas({ tool: drawingTool, x1: activeRef.current.x1, y1: activeRef.current.y1, x2: x, y2: y });
  };
  const onTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!activeRef.current.on) return;
    const t = e.changedTouches[0];
    const { x, y } = pt(t.clientX, t.clientY);
    setStrokes((p) => [...p, { tool: drawingTool, x1: activeRef.current.x1, y1: activeRef.current.y1, x2: x, y2: y }]);
    activeRef.current.on = false;
  };

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
      setStrokes([]);
      strokesRef.current = [];
      setFilePreview(URL.createObjectURL(processed));
      setSelectedFile(processed);
    } catch (err) {
      console.error(err);
      alert("Ошибка обработки файла");
    }
  };

  const removeImage = () => {
    setFilePreview(null);
    setSelectedFile(null);
    setStrokes([]);
    strokesRef.current = [];
    canvasDataUrlRef.current = null;
  };

  const handleAddRoute = async () => {
    if (!name || !level || !description || !filePreview) {
      alert("Заполните все поля и выберите фото");
      return;
    }
    setUploading(true);
    try {
      // Use saved canvas data URL (from when editor was closed) or original file
      let fileToUpload = selectedFile!;
      const dataUrl = canvasDataUrlRef.current;
      if (dataUrl) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        fileToUpload = new File([blob], `route_${Date.now()}.jpg`, { type: "image/jpeg" });
      } else if (canvasRef.current) {
        fileToUpload = await new Promise<File>((resolve, reject) => {
          canvasRef.current!.toBlob(
            (blob) => blob
              ? resolve(new File([blob], `route_${Date.now()}.jpg`, { type: "image/jpeg" }))
              : reject(new Error("Canvas пустой")),
            "image/jpeg", 0.9
          );
        });
      }

      const ext = fileToUpload.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("images").upload(fileName, fileToUpload);
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("images").getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("routes").insert([
        { name, level, description, color, image_url: publicData.publicUrl, created_by: currentUser?.id },
      ]);
      if (insertError) throw insertError;

      alert("Трасса успешно добавлена!");
      setName(""); setLevel(""); setDescription(""); setColor("#ff0000");
      setFilePreview(null); setSelectedFile(null); setStrokes([]); strokesRef.current = []; canvasDataUrlRef.current = null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Неизвестная ошибка";
      alert(`Ошибка: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const colorInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tools: { id: DrawingTool; label: string }[] = [
    { id: "circle-red",    label: "⊙" },
    { id: "circle-yellow", label: "⊙" },
    { id: "line",          label: "╱" },
    { id: "arrow",         label: "→" },
  ];

  return (
    <div className="w-full h-screen bg-gradient-to-tr from-black to-[#001B3B] flex flex-col">
      <header className="flex justify-between items-center">
        <Link href="/settings" className="m-1 p-2 rounded-full active:bg-white/10 flex items-center">
          <IoSettingsSharp size={28} className="text-white" />
        </Link>
        <h2 className="logo text-5xl m-1">KS</h2>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-30">
        <h1 className="text-4xl">Add new route</h1>

        <div className="bg-[#272727] rounded-xl p-3 flex flex-col gap-4">
          {/* Name */}
          <input
            type="text"
            placeholder="Name of route"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 bg-[#4A4A4A] rounded-md h-10 text-xl"
          />

          {/* Color picker */}
          <div className="flex items-center gap-2 flex-wrap">
            {["#FF3333","#FFD700","#3B82F6","#22C55E","#F97316","#FFFFFF","#000000","#A855F7","#EC4899"].map((c) => (
              <motion.button
                key={c}
                onClick={() => setColor(c)}
                whileTap={{ scale: 0.82 }}
                animate={{ scale: color === c ? 1.2 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className="w-9 h-9 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: c,
                  border: color === c ? "3px solid white" : "2px solid rgba(255,255,255,0.25)",
                  boxShadow: c === "#000000" ? "0 0 0 1px rgba(255,255,255,0.3)" : undefined,
                }}
              />
            ))}
            {/* Custom color */}
            <input
              ref={colorInputRef}
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute opacity-0 w-0 h-0"
            />
            <motion.button
              onClick={() => colorInputRef.current?.click()}
              {...tapSpring}
              className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-lg border-2 border-dashed border-white/40 bg-[#4A4A4A]"
              title="Другой цвет"
            >
              +
            </motion.button>
          </div>

          {/* Level */}
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="p-2 border rounded-md h-10 w-20 text-white text-xl"
          >
            <option value="">Level</option>
            <option value="5a">5A</option>
            <option value="5b">5B</option>
            <option value="5c">5C</option>
            <option value="6a">6A</option>
            <option value="6a+">6A+</option>
            <option value="6b">6B</option>
            <option value="6b+">6B+</option>
            <option value="6c">6C</option>
            <option value="6c+">6C+</option>
            <option value="7a">7A</option>
            <option value="7a+">7A+</option>
            <option value="7b">7B</option>
            <option value="7b+">7B+</option>
            <option value="7c">7C</option>
            <option value="7c+">7C+</option>
            <option value="8a">8A</option>
            <option value="8a+">8A+</option>
            <option value="8b">8B</option>
            <option value="8b+">8B+</option>
            <option value="8c">8C</option>
            <option value="8c+">8C+</option>
          </select>

          {/* Description */}
          <textarea
            placeholder="Description of route"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-2 text-inder bg-[#4A4A4A] rounded-md h-30 text-lg"
          />
        </div>

        {/* Photo section */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,image/heic"
          onChange={handleFileChange}
          className="hidden"
        />

        {!filePreview ? (
          <div className="flex justify-center">
            <motion.button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="flex items-center gap-2 px-4 py-2 bg-[#003676] text-white rounded-md"
            >
              <PlusIcon />
              <p className="text-xl">Add photo of route</p>
            </motion.button>
          </div>
        ) : (
          /* Small thumbnail — tap to open editor */
          <motion.div
            className="relative rounded-xl overflow-hidden"
            style={{ height: 140 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            onClick={() => setShowEditor(true)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={filePreview} alt="route" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-2">
              <IoPencil size={22} className="text-white" />
              <span className="text-white text-xl">
                {strokes.length > 0 ? `Edit (${strokes.length})` : "Edit photo"}
              </span>
            </div>
            <motion.button
              onClick={(e) => { e.stopPropagation(); removeImage(); }}
              whileTap={{ scale: 0.88 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="absolute top-2 right-2 bg-red-500/80 rounded-full p-1"
            >
              <NotIcon className="w-5 h-5 transform scale-75" />
            </motion.button>
          </motion.div>
        )}

        {/* Fullscreen canvas editor overlay */}
        <AnimatePresence>
          {showEditor && filePreview && (
            <motion.div
              className="fixed inset-0 z-50 bg-black flex flex-col"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            >
              {/* Toolbar top */}
              <div className="flex justify-between items-center px-4 py-3 bg-black/80">
                <div className="flex items-center gap-3">
                  {tools.map((t) => (
                    <motion.button
                      key={t.id}
                      onClick={() => setDrawingTool(t.id)}
                      whileTap={{ scale: 0.88 }}
                      animate={{ scale: drawingTool === t.id ? 1.15 : 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18 }}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl border-2 ${
                        drawingTool === t.id ? "border-white bg-[#003676]" : "border-white/30 bg-[#272727]"
                      }`}
                      style={{ color: toolColor(t.id) }}
                    >
                      {t.label}
                    </motion.button>
                  ))}
                  <motion.button
                    onClick={() => setStrokes((p) => p.slice(0, -1))}
                    disabled={strokes.length === 0}
                    whileTap={{ scale: 0.88 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl bg-[#272727] border-2 border-white/30 disabled:opacity-30"
                  >
                    ↩
                  </motion.button>
                </div>
                <motion.button
                  onClick={closeEditor}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="flex items-center gap-1 bg-[#003676] px-4 py-2 rounded-xl text-white text-xl"
                >
                  <IoCheckmark size={20} />
                  Done
                </motion.button>
              </div>

              {/* Canvas */}
              <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                <canvas
                  ref={setCanvasRef}
                  className="max-w-full max-h-full"
                  style={{ touchAction: "none" }}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={(e) => { if (activeRef.current.on) onMouseUp(e); }}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleAddRoute}
          disabled={uploading}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="bg-blue-500 text-2xl p-2 mt-2 rounded-md disabled:opacity-50"
        >
          {uploading ? "Adding..." : "Add route"}
        </motion.button>
      </main>

      <Menu />
    </div>
  );
}
