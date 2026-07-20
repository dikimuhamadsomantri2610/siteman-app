"use client";

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AutoLogout from "@/components/common/AutoLogout";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  ChevronRight,
  ChevronDown,
  ClipboardCheck,
  ClipboardX,
  Upload,
  Bell,
  FileBarChart2,
} from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// ─── Tipe navigasi ──────────────────────────────────────────────────────────
interface NavChild {
  name: string;
  href: string;
  icon: React.ElementType;
  iconColor?: string;
  /** Jika diset, menu hanya tampil bagi user dengan inisialDc dalam daftar ini */
  allowedDc?: string[];
}
interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  iconColor?: string;
  children?: NavChild[];
  /** Jika diset, menu hanya tampil bagi user dengan inisialDc dalam daftar ini */
  allowedDc?: string[];
}

// ─── Daftar menu ────────────────────────────────────────────────────────────
const navigation: NavItem[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    iconColor: "text-zinc-900 dark:text-white",
  },
  {
    name: "Scan & Cek Barang",
    href: "#",
    icon: ClipboardCheck,
    iconColor: "text-zinc-900 dark:text-white",
    children: [
      {
        name: "Item BCL",
        href: "/scan-cek-barang/bcl",
        icon: ClipboardCheck,
        iconColor: "text-zinc-900 dark:text-white",
      },
      {
        name: "Upload Master",
        href: "/scan-cek-barang/upload-master",
        icon: Upload,
        iconColor: "text-zinc-900 dark:text-white",
      },
    ],
  },
  {
    name: "Report",
    href: "#",
    icon: FileBarChart2,
    iconColor: "text-zinc-900 dark:text-white",
    children: [
      {
        name: "Report BCL",
        href: "/report/bcl",
        icon: FileBarChart2,
        iconColor: "text-zinc-900 dark:text-white",
      },
      {
        name: "LSPB BCL",
        href: "/report/lspb/bcl",
        icon: ClipboardX,
        iconColor: "text-zinc-900 dark:text-white",
      },
    ],
  },
];

// ─── NavLinks ────────────────────────────────────────────────────────────────
const NavLinks = ({
  onClick,
  isSidebarOpen = true,
}: {
  onClick?: () => void;
  isSidebarOpen?: boolean;
}) => {
  const location = useLocation();
  const { hasAccess } = useAuth();

  // State collapsible per item yang punya children
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const linkClass = (active: boolean) =>
    `flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 overflow-hidden ${isSidebarOpen ? "gap-2" : "gap-0"} ${active
      ? "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary"
      : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/60"
    }`;

  return (
    <div className="space-y-1">
      {navigation.map((item) => {
        const Icon = item.icon;

        // Sembunyikan item-level jika user tidak punya akses
        if (item.allowedDc && !hasAccess(item.allowedDc)) return null;

        const isActive =
          location.pathname === item.href ||
          item.children?.some((c) => location.pathname === c.href);
        const isOpen = openMenus[item.name] ?? false;

        // Item dengan submenu
        if (item.children && item.children.length > 0) {
          // Filter children berdasarkan akses RBAC
          const visibleChildren = item.children.filter(
            (child) => !child.allowedDc || hasAccess(child.allowedDc)
          );

          // Sembunyikan parent jika semua children tersembunyi
          if (visibleChildren.length === 0) return null;

          return (
            <div key={item.name}>
              <div
                className={linkClass(!!isActive)}
                style={{ cursor: "pointer" }}
                onClick={() => toggleMenu(item.name)}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-700">
                  <Icon className="h-4 w-4 text-zinc-700 dark:text-zinc-200" />
                </div>
                <span className={`truncate flex-1 transition-all duration-300 ease-in-out whitespace-nowrap uppercase ${isSidebarOpen ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0 pointer-events-none"}`}>
                  {item.name}
                </span>
                <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? "opacity-100 max-w-[20px]" : "opacity-0 max-w-0 pointer-events-none overflow-hidden"}`}>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                </div>
              </div>

              {isOpen && (
                <div className={`ml-2 mt-1 space-y-0.5 border-l-2 border-zinc-200 dark:border-zinc-700 pl-2 transition-all duration-300 ease-in-out ${isSidebarOpen ? "opacity-100 max-h-[500px]" : "opacity-0 max-h-0 pointer-events-none overflow-hidden"}`}>
                  {visibleChildren.map((child) => {
                    const ChildIcon = child.icon;
                    const childActive = location.pathname === child.href;
                    return (
                      <Link
                        key={child.name}
                        to={child.href}
                        onClick={onClick}
                        className={linkClass(childActive)}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                          <ChildIcon className={`h-4 w-4 ${child.iconColor ?? ""}`} />
                        </div>
                        <span className={`truncate transition-all duration-300 ease-in-out whitespace-nowrap uppercase ${isSidebarOpen ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0 pointer-events-none"}`}>
                          {child.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        // Item biasa (tanpa submenu)
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={onClick}
            className={linkClass(location.pathname === item.href)}
            title={!isSidebarOpen ? item.name : undefined}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">
              <Icon className={`h-4 w-4 ${item.iconColor ?? ""}`} />
            </div>
            <span className={`truncate transition-all duration-300 ease-in-out whitespace-nowrap uppercase ${isSidebarOpen ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0 pointer-events-none"}`}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

// ─── DashboardLayout ─────────────────────────────────────────────────────────
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout, user } = useAuth();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  // Demo notifications — replace with real API data later
  const notifications = [
    { id: 1, title: 'Load #TKL-2410 Menunggu Review', desc: 'BCL · 42 container · 809 item', time: 'Baru saja', unread: true },
    { id: 2, title: 'Load #TKL-2409 Selesai Dicek', desc: 'NON BCL · 100% completion', time: '2 jam lalu', unread: false },
  ];
  const unreadCount = notifications.filter(n => n.unread).length;

  let initials = "AD";
  if (user?.username) {
    const name = user.username;
    initials = name.length >= 3 ? name[0] + name[2] : name.substring(0, 2);
    initials = initials.toUpperCase();
  }

  return (
    <div className="grid-bg flex h-screen overflow-hidden bg-background print:h-auto print:overflow-visible print:bg-white print:text-black">
      <AutoLogout />
      {/* Desktop Sidebar */}
      <aside
        className={`hidden print:hidden border-r border-zinc-200 dark:border-zinc-800/80 bg-card md:flex md:flex-col h-full overflow-y-auto shrink-0 transition-[width] duration-300 ease-in-out ${isSidebarOpen ? "w-64" : "w-18"}`}
      >
        <div
          className={`flex h-16 items-center border-b border-zinc-200 dark:border-zinc-800/80 font-semibold text-[0.8125rem] tracking-widest uppercase overflow-hidden transition-all duration-300 px-4`}
        >
          <div className="flex items-center justify-center flex-1">
            <span className="flex items-center justify-center font-bold text-sm tracking-widest uppercase">
              <img
                src="/logo_yomart.svg"
                alt="logo"
                className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? "h-5 w-5 mr-2" : "h-6 w-6 mr-0"}`}
              />
              <span className={`transition-all duration-300 ease-in-out truncate whitespace-nowrap ${isSidebarOpen ? "opacity-100 max-w-[150px]" : "opacity-0 max-w-0 pointer-events-none"}`}>
                SITEMAN
              </span>
            </span>
          </div>
          <Button
            variant="default"
            size="icon"
            className={`h-8 w-8 shrink-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? "opacity-100 scale-100 ml-2" : "opacity-0 scale-0 pointer-events-none w-0 h-0 p-0 border-0 ml-0"}`}
            onClick={() => setIsSidebarOpen(false)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto py-3 px-2.5">
          <NavLinks isSidebarOpen={isSidebarOpen} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col print:block print:w-full print:bg-white print:text-black">
        {/* Top Navbar */}
        <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-card/90 backdrop-blur-sm px-4 sm:px-5 print:hidden">
          <div className="flex items-center gap-2">
            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  className="md:hidden shrink-0 print:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col w-64 p-0">
                <VisuallyHidden>
                  <SheetTitle>Menu Bar</SheetTitle>
                  <SheetDescription>Dashboard DC Navigation</SheetDescription>
                </VisuallyHidden>
                <div className="flex h-16 items-center border-b border-zinc-200 dark:border-zinc-800 px-4 font-semibold text-lg">
                  <img
                    src="/logo_yomart.svg"
                    alt="logo"
                    className="h-5 w-5 inline-block mr-2"
                  />
                  Siteman
                </div>
                <div className="flex-1 overflow-auto py-4 px-3">
                  <NavLinks onClick={() => setIsMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Sidebar Open Trigger */}
            {!isSidebarOpen && (
              <Button
                variant="default"
                size="icon"
                className="hidden md:flex shrink-0 print:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open sidebar</span>
              </Button>
            )}
          </div>

          <div className="w-full flex-1" />

          <div className="flex items-center gap-4 shrink-0 print:hidden">

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(prev => !prev)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
              >
                <Bell className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-extrabold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Panel */}
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <p className="font-bold text-sm text-zinc-900 dark:text-white">Notifikasi</p>
                      {unreadCount > 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
                          {unreadCount} baru
                        </span>
                      )}
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-72 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className={`px-4 py-3.5 flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors ${n.unread ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
                          <div className={`mt-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-lg ${n.unread ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                            <Bell className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold leading-tight ${n.unread ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>{n.title}</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{n.desc}</p>
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">{n.time}</p>
                          </div>
                          {n.unread && <div className="mt-2 h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                        </div>
                      ))}
                    </div>
                    {notifications.length === 0 && (
                      <div className="py-10 text-center text-zinc-400 text-sm">Tidak ada notifikasi</div>
                    )}
                  </div>
                </>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 cursor-pointer hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0px_0px_var(--color-neo-dark)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:active:shadow-none transition-all duration-100">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold uppercase">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                <DropdownMenuLabel className="font-normal p-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold uppercase">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 overflow-hidden">
                      <p className="text-sm font-medium leading-none truncate">
                        {(user as { namaLengkap?: string })?.namaLengkap ||
                          "Nama Lengkap"}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        @{user?.username || "pengguna"}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    to="/profile"
                    className="cursor-pointer flex items-center gap-2 p-2 rounded-md transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                      <Users className="h-4 w-4" />
                    </div>
                    <span>Pengaturan Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer flex items-center gap-2 p-2 rounded-md"
                  onClick={logout}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-100 dark:bg-red-950/40">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="grid-bg flex-1 overflow-y-scroll bg-background p-4 sm:p-6 print:p-0 print:overflow-visible print:bg-white print:text-black">
          <div className="mx-auto max-w-7xl print:max-w-none print:w-full print:m-0">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
