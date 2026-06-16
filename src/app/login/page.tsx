'use client';
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useLogContext } from "@/context/LogContext";
import KS from "../../../public/images/KoSyachnik-PRO.svg"
import AnimatedHolds from "@/components/AnimatedHolds";
import "../../app/home.css"

export default function Login(){
    const [showPassword, setShowPassword] = useState(false);
    const { loginForm, login, loading } = useLogContext();

    const [started, setStarted] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    const handleClick = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setButtonRect(rect);
          setExpanded(true);
        }
      };

    return(
        <main className="relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden">
            <AnimatePresence>
                {!started && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                        {/* Фон картинки */}
                        <div className="fixed inset-0 z-0">
                            <Image
                                src="/images/background.png"
                                alt="Background"
                                fill
                                priority
                                className="object-cover"
                                sizes="100vw"
                            />
                            <div className="absolute inset-0 bg-black/60" />
                        </div>

                        {/* Лого */}
                        <div className="mt-60 mb-20 relative z-10">
                            <KS className="w-80 h-auto" />
                        </div>
                        <div className="relative w-screen h-screen flex items-center justify-center">
                            {/* Кнопка */}
                            <button
                              ref={buttonRef}
                              onClick={handleClick}
                              className="relative z-10 bg-black text-white px-40 py-3 rounded-md text-2xl"
                            >
                              Login
                            </button>

                            {/* Заливка */}
                            {expanded && buttonRect && (
                              <motion.div
                                initial={{
                                  width: buttonRect.width,
                                  height: buttonRect.height,
                                  left: buttonRect.left + buttonRect.width / 2,
                                  top: buttonRect.top + buttonRect.height / 2,
                                  x: "-50%",
                                  y: "-50%",
                                  borderRadius: "0.5rem",
                                  scale: 1
                                }}
                                animate={{
                                  scale: 50,
                                  borderRadius: "0%",
                                  transition: { duration: 1, ease: "easeInOut" }
                                }}
                                onAnimationComplete={() => setStarted(true)}
                                className="absolute z-20 bg-black"
                                style={{
                                  position: "fixed",
                                  transformOrigin: "center center"
                                }}
                              />
                            )}
                        </div>  
                    </div>
                )}

                {started && (
                    <motion.div
                        key="login-form"
                        className="absolute inset-0 flex flex-col items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                    >
                        <div className="fixed inset-0 bg-black z-0"/>
                        <AnimatedHolds />

                        <div className="absolute top-30 left-1/2 transform -translate-x-1/2">
                            <KS/>
                        </div>
                        
                        <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-lg p-8 py-15 w-7/8">
                            <h1 className="text-white text-4xl font-bold text-center mb-8">Welcome back</h1>
                            <form onSubmit={loginForm.handleSubmit(login)} className="space-y-4">
                                {/* Email */}
                                <div>
                                    <input
                                        {...loginForm.register('email')}
                                        placeholder="Email"
                                        type="email"
                                        className="w-full p-3 bg-white/20 text-sm text-inder text-white rounded-md border border-white/30 placeholder-white/60 focus:outline-none focus:border-white/50"
                                        disabled={loading}
                                    />
                                    {loginForm.errors.email && (
                                        <span className="text-red-300 text-sm mt-1 block">
                                            {loginForm.errors.email.message}
                                        </span>
                                    )}
                                </div>
                                {/* Password */}
                                <div className="relative">
                                    <input
                                        {...loginForm.register('password')}
                                        placeholder="Password"
                                        type={showPassword ? "text" : "password"}
                                        className="w-full p-3 bg-white/20 text-sm text-inder text-white rounded-md border border-white/30 placeholder-white/60 focus:outline-none focus:border-white/50 pr-10"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute text-sm text-inder right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                    {loginForm.errors.password && (
                                        <span className="text-red-300 text-sm mt-1 block">
                                            {loginForm.errors.password.message}
                                        </span>
                                    )}
                                </div>
                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full p-3 text-xl bg-[#003676] text-white rounded-md active:bg-[#001B3B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                                >
                                    {loading ? "Login..." : "Login"}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}