"use client";

import { BG_ICONS, BG_LOGOS, STYLE } from './constants/login.constants';

export default function LoginBackground() {
    return (
        <>
            <style>{STYLE}</style>

            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none z-0"
                style={{ background: 'var(--login-orb1)', filter: 'blur(80px)' }} />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none z-0"
                style={{ background: 'var(--login-orb2)', filter: 'blur(80px)' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none z-0"
                style={{ background: 'var(--login-orb3)', filter: 'blur(120px)' }} />

            {BG_ICONS.map(({ Icon, size, x, y, delay, dur, opacity }, i) => (
                <div
                    key={i}
                    className="absolute z-10 pointer-events-none"
                    style={{ left: x, top: y, opacity, color: 'var(--login-icon)', animation: `floatY ${dur} ease-in-out ${delay} infinite` }}
                >
                    <Icon size={size} strokeWidth={2} />
                </div>
            ))}

            {BG_LOGOS.map(({ src, size, x, y, delay, dur, opacity }, i) => (
                <div
                    key={`logo-${i}`}
                    className="absolute z-10 pointer-events-none"
                    style={{ left: x, top: y, opacity, animation: `floatY ${dur} ease-in-out ${delay} infinite` }}
                >
                    <img src={src} alt="" width={size} height={size} style={{ display: 'block' }} />
                </div>
            ))}

            <div className="login-grid-overlay absolute inset-0 z-0 pointer-events-none" />


        </>
    );
}
