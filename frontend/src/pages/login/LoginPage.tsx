"use client";
import LoginBackground from './LoginBackground';
import LoginForm from './LoginForm';

export default function LoginPage() {
    return (
        <div className="login-page relative flex min-h-screen items-center justify-center p-4 overflow-hidden">
            <LoginBackground />
            <LoginForm />
        </div>
    );
}
