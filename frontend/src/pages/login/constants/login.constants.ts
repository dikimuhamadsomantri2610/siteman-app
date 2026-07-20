import { Package, Truck, Boxes, BarChart3, ShoppingCart, Warehouse, ClipboardList, Layers, ArrowRightLeft, ScanLine } from 'lucide-react';

const logoYomart = '/logo_yomart.svg';

export const BG_ICONS = [
    { Icon: Truck,          size: 36, x: '5%',  y: '10%', delay: '0s',   dur: '14s', opacity: 0.40 },
    { Icon: Boxes,          size: 28, x: '15%', y: '70%', delay: '2s',   dur: '18s', opacity: 0.35 },
    { Icon: Warehouse,      size: 44, x: '78%', y: '8%',  delay: '1s',   dur: '20s', opacity: 0.35 },
    { Icon: ShoppingCart,   size: 30, x: '88%', y: '65%', delay: '3s',   dur: '15s', opacity: 0.40 },
    { Icon: BarChart3,      size: 32, x: '45%', y: '85%', delay: '0.5s', dur: '17s', opacity: 0.30 },
    { Icon: ClipboardList,  size: 26, x: '60%', y: '15%', delay: '4s',   dur: '22s', opacity: 0.35 },
    { Icon: Layers,         size: 34, x: '30%', y: '20%', delay: '1.5s', dur: '19s', opacity: 0.30 },
    { Icon: ArrowRightLeft, size: 28, x: '70%', y: '78%', delay: '2.5s', dur: '16s', opacity: 0.35 },
    { Icon: ScanLine,       size: 30, x: '22%', y: '45%', delay: '3.5s', dur: '21s', opacity: 0.30 },
    { Icon: Package,        size: 38, x: '85%', y: '35%', delay: '0s',   dur: '13s', opacity: 0.40 },
    { Icon: Truck,          size: 24, x: '50%', y: '5%',  delay: '5s',   dur: '24s', opacity: 0.28 },
    { Icon: Boxes,          size: 32, x: '92%', y: '90%', delay: '1s',   dur: '16s', opacity: 0.30 },
];

export const BG_LOGOS = [
    { src: logoYomart, size: 48, x: '8%',  y: '40%', delay: '1s',   dur: '19s', opacity: 0.45 },
    { src: logoYomart, size: 36, x: '72%', y: '50%', delay: '3s',   dur: '23s', opacity: 0.40 },
    { src: logoYomart, size: 42, x: '38%', y: '60%', delay: '5.5s', dur: '17s', opacity: 0.38 },
];

export const STYLE = `
@keyframes floatY {
  0%   { transform: translateY(0px)   translateX(0px)   rotate(0deg);  }
  25%  { transform: translateY(-18px) translateX(8px)   rotate(5deg);  }
  50%  { transform: translateY(-36px) translateX(0px)   rotate(10deg); }
  75%  { transform: translateY(-18px) translateX(-8px)  rotate(5deg);  }
  100% { transform: translateY(0px)   translateX(0px)   rotate(0deg);  }
}

:root {
  --login-bg-from:   #0c4a6e;
  --login-bg-via:    #1e3a8a;
  --login-bg-to:     #1e1b4b;
  --login-orb1:      radial-gradient(circle, #38bdf840 0%, transparent 70%);
  --login-orb2:      radial-gradient(circle, #60a5fa30 0%, transparent 70%);
  --login-orb3:      radial-gradient(circle, #3b82f618 0%, transparent 70%);
  --login-icon:              #7dd3fc;
  --login-grid:              #7dd3fc;
  --login-accent:            #3b82f6;
  --login-accent-glow:       #3b82f650;
  --login-accent-btn-glow:   #3b82f640;
  --login-card-bg:           rgba(255,255,255,0.75);
  --login-card-border:       rgba(59,130,246,0.15);
  --login-text:      #1e3a5f;
  --login-desc:      #64748b;
  --login-input-bg:     rgba(255,255,255,0.9);
  --login-input-border: rgba(59,130,246,0.25);
  --login-input-text:   #1e293b;
  --login-btn-text:  #ffffff;
}

.dark {
  --login-bg-from:   #0a112b;
  --login-bg-via:    #0d1a3a;
  --login-bg-to:     #060c1f;
  --login-orb1:      radial-gradient(circle, #5294ff18 0%, transparent 70%);
  --login-orb2:      radial-gradient(circle, #5294ff12 0%, transparent 70%);
  --login-orb3:      radial-gradient(circle, #5294ff08 0%, transparent 70%);
  --login-icon:              #7aadff;
  --login-grid:              #5294ff;
  --login-accent:            #5294FF;
  --login-accent-glow:       #5294ff40;
  --login-accent-btn-glow:   #5294ff35;
  --login-card-bg:           rgba(9,9,11,0.6);
  --login-card-border:       rgba(82,148,255,0.12);
  --login-text:      #f4f4f5;
  --login-desc:      #a1a1aa;
  --login-input-bg:     rgba(255,255,255,0.06);
  --login-input-border: rgba(82,148,255,0.18);
  --login-input-text:   #f4f4f5;
  --login-btn-text:  #ffffff;
}

.login-page { background: linear-gradient(135deg, var(--login-bg-from), var(--login-bg-via), var(--login-bg-to)); }
.login-card { background: var(--login-card-bg); border-color: var(--login-card-border); }
.login-icon-badge { background: var(--login-accent); box-shadow: 0 8px 32px var(--login-accent-glow); color: var(--login-btn-text); }
.login-title  { color: var(--login-text); }
.login-desc   { color: var(--login-desc); }
.login-input { background: var(--login-input-bg) !important; border-color: var(--login-input-border) !important; color: var(--login-input-text) !important; }
.login-input::placeholder { color: var(--login-desc); }
.login-btn { background: var(--login-accent) !important; color: var(--login-btn-text) !important; box-shadow: 0 4px 20px var(--login-accent-btn-glow); }
.login-btn:hover { filter: brightness(1.08); }
.login-grid-overlay { background-image: linear-gradient(var(--login-grid) 1.5px, transparent 1.5px), linear-gradient(to right, var(--login-grid) 1.5px, transparent 1.5px); background-size: 40px 40px; opacity: 0.07; }

[data-sonner-toast] [data-title], [data-sonner-toast] [data-description] { color: #000000 !important; }
[data-sonner-toast] [data-icon] svg, [data-sonner-toast][data-type="success"] > [data-icon] { color: #16a34a !important; stroke: #16a34a !important; }
[data-sonner-toast][data-type="error"] { background: #1e3a8a !important; border-color: rgba(220,38,38,0.35) !important; }
[data-sonner-toast][data-type="error"] > [data-icon] svg, [data-sonner-toast][data-type="error"] > [data-icon] { color: #dc2626 !important; stroke: #dc2626 !important; }
[data-sonner-toast][data-type="error"] [data-title], [data-sonner-toast][data-type="error"] [data-description] { color: #ffffff !important; }

.dark [data-sonner-toast] [data-title], .dark [data-sonner-toast] [data-description] { color: #ffffff !important; }
.dark [data-sonner-toast] [data-icon] svg, .dark [data-sonner-toast][data-type="success"] > [data-icon] { color: #22c55e !important; stroke: #22c55e !important; }
.dark [data-sonner-toast][data-type="error"] { background: #09090b !important; border-color: rgba(248,113,113,0.30) !important; }
.dark [data-sonner-toast][data-type="error"] > [data-icon] svg, .dark [data-sonner-toast][data-type="error"] > [data-icon] { color: #f87171 !important; stroke: #f87171 !important; }
`;
