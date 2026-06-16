"use client";
import Menu from "../components/Menu";
import SearchBar from "@/components/SearchBar";
import RouteList from "../components/RouteList";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLogContext } from "@/context/LogContext";

import "./home.css"

export default function Home() {
  const { logout } = useLogContext();

  return (
    <ProtectedRoute>
      <div className="w-full bg-gradient-to-tr from-black to-[#001B3B] min-h-screen bg-cover bg-fixed bg-center">
        <header className="flex justify-between">
          <button
            onClick={logout}
            className="m-1 px-3 rounded-md border border-white active:bg-[#272727]"
            title="Выйти из аккаунта"
          >Log out</button>
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
