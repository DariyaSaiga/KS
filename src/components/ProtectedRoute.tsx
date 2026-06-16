"use client";
import { useLogContext } from '../context/LogContext';
import Login from "../app/login/page";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { currentUser, loading } = useLogContext();

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-tr from-black to-[#001B3B] flex items-center justify-center">
                <div className="text-white text-xl">Загрузка...</div>
            </div>
        );
    }

    if (!currentUser) {
        return <Login />; 
    }

    return <>{children}</>; 
}