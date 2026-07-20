"use client";

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    /**
     * Jika diset, hanya user dengan inisialDc dalam daftar ini yang boleh akses.
     * User dengan inisialDc "System" selalu lolos.
     * Jika tidak diset, semua user terautentikasi boleh akses.
     */
    allowedDc?: string[];
}

export default function ProtectedRoute({ children, allowedDc }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, hasAccess } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Tunggu sampai token selesai dibaca dari sessionStorage
        if (isLoading) return;

        if (!isAuthenticated) {
            navigate('/login', { replace: true });
            return;
        }

        // Cek RBAC: jika ada allowedDc dan user tidak punya akses → redirect ke dashboard
        if (allowedDc && !hasAccess(allowedDc)) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, isLoading, allowedDc, hasAccess, navigate]);

    // Saat masih loading, tampilkan blank (tidak redirect dulu)
    if (isLoading) {
        return null;
    }

    if (!isAuthenticated) {
        return null;
    }

    // Jika ada allowedDc dan user tidak punya akses, jangan render konten
    if (allowedDc && !hasAccess(allowedDc)) {
        return null;
    }

    return <>{children}</>;
}

