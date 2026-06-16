"use client";
import { createContext, useEffect, useState, ReactNode, useContext } from "react";
import { useForm, UseFormRegister, UseFormHandleSubmit, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from "zod";
import { User } from "@supabase/supabase-js";
import { supabase } from '../lib/supabase';
import { useRouter } from "next/navigation";

const loginFormSchema = z.object({
    email: z.string().email("Incorrect email"),
    password: z.string().min(6, "Password must be at least 6 characters long")
});

type LoginFormData = z.infer<typeof loginFormSchema>;

type LoginForm = {
    register: UseFormRegister<LoginFormData>;
    handleSubmit: UseFormHandleSubmit<LoginFormData>;
    errors: FieldErrors<LoginFormData>;
};

type LogContextType = {
    loginForm: LoginForm;
    login: (data: LoginFormData) => Promise<void>;
    logout: () => Promise<void>;
    currentUser: User | null;
    loading: boolean;
};

const LogContext = createContext<LogContextType | null>(null);

export const LogContextProvider = ({ children }: { children: ReactNode }) => {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const loginForm = useForm<LoginFormData>({
        resolver: zodResolver(loginFormSchema)
    });

    useEffect(() => {
        const getSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.error('Session error:', error);
                    setLoading(false);
                    return;
                }

                if (session?.user) {
                    setCurrentUser(session.user);
                }
            } catch (error) {
                console.error('Get session error:', error);
            } finally {
                setLoading(false);
            }
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event);
                setCurrentUser(session?.user || null);
                setLoading(false);

                if (event === 'SIGNED_IN') {
                    console.log('✅ User signed in');
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [router]);

    const login = async (data: LoginFormData) => {
        try {
            const { data: authData, error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password
            });

            if (error) {
                alert("Ошибка входа: " + error.message);
                return;
            }

            if (authData.user) {
                setCurrentUser(authData.user);
                router.push("/");
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Неизвестная ошибка";
            alert("Ошибка входа: " + message);
        }
    };

    const logout = async () => {
      try {
        await supabase.auth.signOut();
        setCurrentUser(null);
        window.location.href = '/login';
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Неизвестная ошибка";
        console.error('Logout error:', error);
        alert("Ошибка выхода: " + message);
      }
    };

    const value: LogContextType = {
        loginForm: {
            register: loginForm.register,
            handleSubmit: loginForm.handleSubmit,
            errors: loginForm.formState.errors,
        },
        login,
        logout,
        currentUser,
        loading
    };

    return (
        <LogContext.Provider value={value}>
            {children}
        </LogContext.Provider>
    );
};

export const useLogContext = (): LogContextType => {
    const context = useContext(LogContext);
    if (!context) {
        throw new Error("useLogContext must be used within a LogContextProvider");
    }
    return context;
};
