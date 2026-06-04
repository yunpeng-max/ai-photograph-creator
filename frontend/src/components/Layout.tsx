import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Camera,
  Home,
  Clock,
  Coins,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LocaleSwitcher from "./LocaleSwitcher";
import { cn } from "../lib/utils";

const navItems = [
  { path: "/", label: "nav.home", icon: Home },
  { path: "/history", label: "nav.history", icon: Clock },
  { path: "/points", label: "nav.points", icon: Coins },
];

export default function Layout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerShrunk, setHeaderShrunk] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHeaderShrunk(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-dark-600 flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-dark-500 border-r border-white/5 flex flex-col",
          "transition-transform duration-300 ease-in-out",
          "md:translate-x-0",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-glow">
            <Camera size={18} className="text-white" />
          </div>
          <span className="font-bold text-text-primary font-display text-base truncate">AI Photo Creator</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 truncate",
                  isActive
                    ? "bg-accent-500/10 text-accent-400 border-l-2 border-accent-400"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/5 hover:pl-4 border-l-2 border-transparent",
                )}
              >
                <Icon size={18} />
                {t(item.label)}
              </NavLink>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white text-sm font-semibold">
              {user?.nickname?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user?.nickname}
              </p>
              <p className="text-xs text-text-tertiary truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-text-tertiary hover:text-red-400 hover:bg-red-400/10 transition-colors"
              title={t("auth.logout")}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top header bar — glass morphism, shrinks on scroll */}
        <header
          className={cn(
            "sticky top-0 z-20 glass flex items-center justify-between px-4 md:px-6 transition-all duration-300",
            headerShrunk ? "h-14" : "h-16",
          )}
        >
          {/* Mobile menu button + title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 md:hidden transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Points badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-500/10 text-accent-400 text-xs font-medium border border-accent-500/20 whitespace-nowrap shrink-0">
              <Coins size={14} className="shrink-0" />
              <span className="tabular-nums">{user?.points_balance ?? 0}</span>
            </div>
            <LocaleSwitcher />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
