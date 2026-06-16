// components/Route.tsx
"use client";
import Image from "next/image";
import { RouteType } from "../components/RouteList";
import { useLogContext } from '../context/LogContext';
import { useRouter } from "next/navigation";
import { useState } from 'react';
import { motion } from "framer-motion";

export default function Route({id, name, level, description, color, image_url}: RouteType){
    const { currentUser, loading: authLoading } = useLogContext();
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);

    const handleClick = () => {
        if (isNavigating || authLoading) return;
        
        console.log('🟢 Navigating to route:', id);
        
        if (currentUser) {
            setIsNavigating(true);
            router.push(`/route/${id}`);
        } else {
            router.push('/login');
        }
    };

    if (authLoading) {
        return (
            <div className="p-3 flex gap-4 bg-[#272727] rounded-lg animate-pulse">
                <div className="w-32 h-32 bg-[#4A4A4A] rounded-md"></div>
                <div className="w-full space-y-2">
                    <div className="h-6 bg-[#4A4A4A] rounded"></div>
                    <div className="h-4 bg-[#4A4A4A] rounded"></div>
                    <div className="h-4 bg-[#4A4A4A] rounded w-3/4"></div>
                </div>
            </div>
        );
    }

    return(
        <motion.div
            onClick={handleClick}
            className="p-3 flex gap-4 bg-[#272727] rounded-lg cursor-pointer relative"
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
            {isNavigating && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
            )}
            
            <div className="relative w-32 h-32 flex-shrink-0 bg-[#4A4A4A] rounded-md overflow-hidden">
                {image_url ? (
                  <Image
                    src={image_url}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  <span className="text-gray-400 flex items-center justify-center h-full">Нет фото</span>
                )}
            </div>
            <div className="w-full">
                <div className="flex justify-between">
                    <h1 className="text-xl">{name}</h1>
                    <div className="w-5 h-5 rounded-full " style={{ backgroundColor: color }}></div>
                </div>
                <h1 className="text-lg">{level}</h1>
                <p className="text-sm">{description}</p>
                
                {!currentUser && (
                    <div className="text-xs text-yellow-400 mt-2">
                        🔒 Требуется авторизация
                    </div>
                )}
            </div>
        </motion.div>
    );
};