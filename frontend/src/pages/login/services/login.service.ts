import api from '@/lib/axios';

export interface LoginPayload {
    username: string;
    password?: string;
}

// ── Dummy credentials (untuk testing tanpa backend) ────────────────────────
const DUMMY_TOKEN = (() => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
        id: 1,
        username: 'admin',
        namaLengkap: 'Administrator',
        inisialDc: 'System',
        exp: 9999999999,
    }));
    return `${header}.${payload}.dummy-signature`;
})();

export const loginUser = async (payload: LoginPayload) => {
    // Dummy login — bypass backend
    if (payload.username === 'admin' && payload.password === 'admin123') {
        return { token: DUMMY_TOKEN };
    }
    const response = await api.post('/auth/login', payload);
    return response.data;
};
