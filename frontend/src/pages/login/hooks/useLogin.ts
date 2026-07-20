"use client";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { loginUser } from '../services/login.service';

export const useLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await loginUser({ username, password });
            login(response.token);
            toast.success('Login Berhasil', { description: 'Selamat datang kembali!' });
            navigate('/', { replace: true });
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error('Login Gagal', {
                description: err.response?.data?.message || 'Terjadi kesalahan sistem',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return {
        username,
        setUsername,
        password,
        setPassword,
        isLoading,
        handleLogin
    };
};
