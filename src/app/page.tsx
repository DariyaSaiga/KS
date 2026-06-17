"use client";
import Link from "next/link";
import Menu from "../components/Menu";
import SearchBar from "@/components/SearchBar";
import RouteList from "../components/RouteList";
import ProtectedRoute from "@/components/ProtectedRoute";
import { IoSettingsSharp } from "react-icons/io5";

import "./home.css"

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="w-full bg-gradient-to-tr from-black to-[#001B3B] min-h-screen bg-cover bg-fixed bg-center">
        <header className="flex justify-between items-center">
          <Link href="/settings" className="m-1 p-2 rounded-full active:bg-white/10 flex items-center">
            <IoSettingsSharp size={28} className="text-white" />
          </Link>
          <h2 className="logo text-5xl m-1">KS</h2>
        </header>
        <SearchBar/>
        <div className="h-[calc(100dvh-200px)] overflow-y-auto">
          <RouteList/>
        </div>
        <Menu/>
      </div>
    </ProtectedRoute>
  );
}
