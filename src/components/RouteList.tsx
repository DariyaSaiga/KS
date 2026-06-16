// components/RouteList.tsx
"use client";
import Route from "./Route";
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";
import { useFilterContext } from "@/context/FilterContext";
import { useLogContext } from "@/context/LogContext";
import { motion } from "framer-motion";

export type RouteType = {
  id: number;
  name: string;
  level: string;
  description: string;
  color: string;
  image_url: string;
  created_by?: string;
};

export default function RouteList() {
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());

  const { sortBy, levelFilter, colorFilter, hideCompleted } = useFilterContext();
  const { currentUser } = useLogContext();

  // Re-fetch when sort order changes
  useEffect(() => {
    fetchRoutes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  // Fetch completed route IDs when needed
  useEffect(() => {
    if (!currentUser || !hideCompleted) {
      setCompletedIds(new Set());
      return;
    }
    supabase
      .from("route_achievements")
      .select("route_id")
      .eq("user_id", currentUser.id)
      .then(({ data }) => {
        if (data) setCompletedIds(new Set(data.map((r) => r.route_id)));
      });
  }, [currentUser, hideCompleted]);

  async function fetchRoutes() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("routes")
        .select("*")
        .order("id", { ascending: sortBy === "oldest" });

      if (error) { setError(error.message); return; }
      setRoutes((data as RouteType[]) || []);
    } catch {
      setError("Ошибка загрузки трасс");
    } finally {
      setLoading(false);
    }
  }

  // Client-side filtering
  const filtered = routes.filter((r) => {
    if (levelFilter && r.level.toLowerCase() !== levelFilter.toLowerCase()) return false;
    if (colorFilter && r.color.toLowerCase() !== colorFilter.toLowerCase()) return false;
    if (hideCompleted && completedIds.has(r.id)) return false;
    return true;
  });

  const hasActiveFilters = levelFilter || colorFilter || hideCompleted;

  return (
    <main className="p-4 mb-25">
      <div className="flex flex-col gap-3">
        {loading ? (
          <p className="text-gray-400">Загрузка трасс...</p>
        ) : error ? (
          <p className="text-red-400">Ошибка: {error}</p>
        ) : filtered.length > 0 ? (
          <>
            {hasActiveFilters && (
              <p className="text-gray-500 text-sm">
                {filtered.length} из {routes.length} трасс
              </p>
            )}
            {filtered.map((route, i) => (
              <motion.div
                key={route.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: i * 0.05, ease: "easeOut" }}
              >
                <Route {...route} />
              </motion.div>
            ))}
          </>
        ) : routes.length > 0 ? (
          <p className="text-gray-400">Нет трасс по выбранным фильтрам</p>
        ) : (
          <p className="text-gray-400">Нет доступных трасс</p>
        )}
      </div>
    </main>
  );
}
