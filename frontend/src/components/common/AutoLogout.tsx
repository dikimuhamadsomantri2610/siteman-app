"use client";
import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * AutoLogout
 * 
 * Komponen ini mendengarkan event aktivitas pengguna (mouse, keyboard, scroll, touch).
 * Jika tidak ada aktivitas selama `timeoutMs` (default 15 menit),
 * pengguna akan logout secara otomatis.
 */
interface AutoLogoutProps {
    timeoutMs?: number; // Default 15 menit = 15 * 60 * 1000
}

export default function AutoLogout({ timeoutMs = 15 * 60 * 1000 }: AutoLogoutProps) {
    const { logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const lastActivityRef = useRef<number>(Date.now());
    const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const handleLogout = useCallback(() => {
        if (isAuthenticated) {
            toast.info('Sesi Anda telah berakhir karena tidak ada aktivitas.');
            logout();
            navigate('/login');
        }
    }, [isAuthenticated, logout, navigate]);

    useEffect(() => {
        // Event yang menandakan aktivitas pengguna
        const events = [
            'mousemove',
            'mousedown',
            'keydown',
            'scroll',
            'touchstart'
        ];

        const handleActivity = () => {
            lastActivityRef.current = Date.now();
        };

        if (isAuthenticated) {
            // Pasang listener saat komponen mount atau otentikasi berubah (passive for performance)
            events.forEach(event => {
                window.addEventListener(event, handleActivity, { passive: true });
            });

            // Set activity awal
            lastActivityRef.current = Date.now();

            // Cek setiap 10 detik apakah sudah melewati batas waktu
            timerIntervalRef.current = setInterval(() => {
                if (Date.now() - lastActivityRef.current >= timeoutMs) {
                    handleLogout();
                }
            }, 10000); 
        }

        return () => {
            // Bersihkan listener dan timer saat unmount
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [isAuthenticated, timeoutMs, handleLogout]);

    return null; // Komponen ini tidak me-render UI apapun
}

