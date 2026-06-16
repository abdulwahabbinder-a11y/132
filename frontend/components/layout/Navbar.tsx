"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Film, Menu, X, LogOut, Settings, LayoutDashboard, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser({ email: user.email! });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { email: session.user.email! } : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled || pathname !== "/"
          ? "bg-surface/90 backdrop-blur-xl border-b border-surface-border"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center group-hover:bg-brand-500 transition-colors">
              <Film className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">DocuAI</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="btn-ghost text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 btn-ghost rounded-xl px-3 py-2"
                >
                  <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center text-xs font-bold">
                    {user.email[0].toUpperCase()}
                  </div>
                  <span className="text-sm">{user.email.split("@")[0]}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 glass-card p-2 shadow-card">
                    <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-sm" onClick={() => setDropdownOpen(false)}>
                      <LayoutDashboard className="w-4 h-4 text-brand-400" />
                      Dashboard
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-sm" onClick={() => setDropdownOpen(false)}>
                      <Settings className="w-4 h-4 text-gray-400" />
                      Settings
                    </Link>
                    <div className="border-t border-surface-border my-1" />
                    <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-sm text-red-400 w-full">
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost text-sm">Sign In</Link>
                <Link href="/auth/register" className="btn-primary text-sm py-2 px-5">
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden btn-ghost p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden border-t border-surface-border bg-surface/95 backdrop-blur-xl"
        >
          <div className="px-4 py-4 space-y-2">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="block px-4 py-3 rounded-xl hover:bg-white/5 text-sm" onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="border-t border-surface-border pt-3 mt-3 space-y-2">
              {user ? (
                <button onClick={handleLogout} className="block w-full text-left px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 text-sm">
                  Log out
                </button>
              ) : (
                <>
                  <Link href="/auth/login" className="block px-4 py-3 rounded-xl hover:bg-white/5 text-sm" onClick={() => setMenuOpen(false)}>Sign In</Link>
                  <Link href="/auth/register" className="btn-primary block text-center text-sm" onClick={() => setMenuOpen(false)}>Get Started Free</Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
