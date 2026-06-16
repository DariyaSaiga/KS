"use client";
import { useRouter } from "next/navigation";
import Menu from "../../components/Menu";
import SearchBar from "@/components/SearchBar";
import { useLogContext } from "@/context/LogContext";
import { useFilterContext, SortBy } from "@/context/FilterContext";
import { motion } from "framer-motion";
import "../home.css";

const tap = { whileTap: { scale: 0.91 }, transition: { type: "spring" as const, stiffness: 400, damping: 18 } };

const LEVELS = [
  "5a","5b","5c",
  "6a","6a+","6b","6b+","6c","6c+",
  "7a","7a+","7b","7b+","7c","7c+",
  "8a","8a+","8b","8b+","8c","8c+",
];

const PRESET_COLORS: { hex: string; name: string }[] = [
  { hex: "#FF3333", name: "Red" },
  { hex: "#FFD700", name: "Yellow" },
  { hex: "#3B82F6", name: "Blue" },
  { hex: "#22C55E", name: "Green" },
  { hex: "#F97316", name: "Orange" },
  { hex: "#FFFFFF", name: "White" },
  { hex: "#000000", name: "Black" },
  { hex: "#A855F7", name: "Purple" },
  { hex: "#EC4899", name: "Pink" },
];

export default function Filter() {
  const router = useRouter();
  const { logout } = useLogContext();
  const {
    sortBy, levelFilter, colorFilter, hideCompleted,
    setSortBy, setLevelFilter, setColorFilter, setHideCompleted, resetFilters,
  } = useFilterContext();

  const hasActiveFilters = levelFilter || colorFilter || hideCompleted || sortBy !== "newest";

  const handleApply = () => router.push("/");
  const handleReset = () => resetFilters();

  return (
    <div className="w-full min-h-screen bg-gradient-to-tr from-black to-[#001B3B] bg-cover bg-fixed bg-center">
      <header className="flex justify-between">
        <button
          onClick={logout}
          className="m-1 px-3 rounded-md border border-white active:bg-[#272727]"
        >Log out</button>
        <h2 className="logo text-5xl m-1">KS</h2>
      </header>

      <SearchBar />

      <div className="flex flex-col gap-5 px-3 pb-32">

        {/* ——— Sort ——— */}
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl">Sort by date</h2>
          <div className="flex gap-2">
            {(["newest", "oldest"] as SortBy[]).map((s) => (
              <motion.button
                key={s}
                onClick={() => setSortBy(s)}
                {...tap}
                className={`px-5 py-2 rounded-xl text-xl ${
                  sortBy === s
                    ? "bg-[#003676] text-white"
                    : "bg-[#272727] text-gray-300"
                }`}
              >
                {s === "newest" ? "Newer first" : "Older first"}
              </motion.button>
            ))}
          </div>
        </div>

        {/* ——— Level ——— */}
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl">Level</h2>
          <div className="flex flex-wrap gap-2">
            <motion.button
              onClick={() => setLevelFilter("")}
              {...tap}
              className={`px-3 py-1 rounded-lg text-xl ${
                !levelFilter ? "bg-[#003676] text-white" : "bg-[#272727] text-gray-300"
              }`}
            >
              Any
            </motion.button>
            {LEVELS.map((lvl) => (
              <motion.button
                key={lvl}
                onClick={() => setLevelFilter(levelFilter === lvl ? "" : lvl)}
                {...tap}
                className={`px-3 py-1 rounded-lg text-xl uppercase ${
                  levelFilter === lvl ? "bg-[#003676] text-white" : "bg-[#272727] text-gray-300"
                }`}
              >
                {lvl}
              </motion.button>
            ))}
          </div>
        </div>

        {/* ——— Color ——— */}
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl">Color</h2>
          <div className="flex flex-wrap gap-3 items-center">
            <motion.button
              onClick={() => setColorFilter("")}
              {...tap}
              className={`px-3 py-1 rounded-lg text-xl ${
                !colorFilter ? "bg-[#003676] text-white" : "bg-[#272727] text-gray-300"
              }`}
            >
              Any
            </motion.button>
            {PRESET_COLORS.map(({ hex, name }) => (
              <motion.button
                key={hex}
                onClick={() => setColorFilter(colorFilter === hex ? "" : hex)}
                whileTap={{ scale: 0.82 }}
                animate={{ scale: colorFilter === hex ? 1.2 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className="w-10 h-10 rounded-full flex-shrink-0"
                title={name}
                style={{
                  backgroundColor: hex,
                  border: colorFilter === hex ? "3px solid white" : "2px solid rgba(255,255,255,0.2)",
                  boxShadow: hex === "#000000" ? "0 0 0 1px rgba(255,255,255,0.3)" : undefined,
                }}
              />
            ))}
          </div>
        </div>

        {/* ——— Hide completed ——— */}
        <div className="flex items-center justify-between bg-[#272727] rounded-xl p-4">
          <div>
            <p className="text-white text-2xl">Hide completed</p>
            <p className="text-gray-400 text-base">Hides routes you've topped or flashed</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-3">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-500 rounded-full peer peer-checked:bg-[#003676] transition-colors" />
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
          </label>
        </div>

        {/* ——— Reset ——— */}
        {hasActiveFilters && (
          <motion.button
            onClick={handleReset}
            {...tap}
            className="text-gray-400 text-xl underline text-center"
          >
            Reset all filters
          </motion.button>
        )}

        {/* ——— Apply ——— */}
        <motion.button
          onClick={handleApply}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="w-full py-3 bg-[#003676] rounded-xl text-white text-2xl"
        >
          Apply
        </motion.button>
      </div>

      <Menu />
    </div>
  );
}
