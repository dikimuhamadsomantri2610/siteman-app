"use client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import patuhTangguhImg from '@/assets/patuh_tangguh_dc.svg';
import { useLogin } from './hooks/useLogin';

export default function LoginForm() {
    const { username, setUsername, password, setPassword, isLoading, handleLogin } = useLogin();

    return (
        <Card className="login-card z-10 w-full max-w-[420px] p-2 shadow-2xl rounded-2xl backdrop-blur-xl border">
            <CardHeader className="space-y-1 text-center pb-6">
                <div className="flex justify-center mb-4">
                    <img 
                        src={patuhTangguhImg} 
                        alt="Patuh Tangguh DC" 
                        className="h-20 w-auto object-contain" 
                    />
                </div>
                <CardTitle className="login-title text-2xl font-bold tracking-tight">
                    SITEMAN
                </CardTitle>
                <CardDescription className="login-desc">
                    Masukkan username dan password Anda
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleLogin}>
                <CardContent className="space-y-5 mb-2">
                    <Input
                        id="username"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="login-input h-12 px-4 rounded-xl"
                    />
                    <Input
                        id="password"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="login-input h-12 px-4 rounded-xl"
                    />
                </CardContent>

                <CardFooter className="pt-2 pb-6">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-xl h-12 text-md font-extrabold text-white border-[3px] border-black bg-primary px-4 transition-all duration-100 disabled:opacity-60 disabled:cursor-not-allowed hover:translate-x-px hover:translate-y-px active:translate-x-[5px] active:translate-y-[5px]"
                        style={{ boxShadow: '5px 5px 0px 0px #000000' }}
                        onMouseEnter={e => {
                            if (!isLoading) (e.currentTarget as HTMLButtonElement).style.boxShadow = '4px 4px 0px 0px #000000';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '5px 5px 0px 0px #000000';
                        }}
                        onMouseDown={e => {
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                        }}
                        onMouseUp={e => {
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '4px 4px 0px 0px #000000';
                        }}
                    >
                        {isLoading ? 'Loading...' : 'Sign In'}
                    </button>
                </CardFooter>
            </form>
        </Card>
    );
}
