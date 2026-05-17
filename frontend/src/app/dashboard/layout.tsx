"use client";

import { BarChart3, Box, Home, LogOut, MessageSquare, PieChart, Settings, Users, Sun, Moon, Building2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { name: "Visão Geral", href: "/dashboard", icon: Home },
    { name: "Vendas", href: "/dashboard/sales", icon: BarChart3 },
    { name: "Vendedores", href: "/dashboard/vendors", icon: Users },
    { name: "Produtos", href: "/dashboard/products", icon: Box },
    { name: "Faturamento CNPJ", href: "/dashboard/billing", icon: Building2 },
    { name: "Relatórios", href: "/dashboard/reports", icon: PieChart },
    { name: "IA Assistant", href: "/dashboard/ai", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text-main)] flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)] flex flex-col hidden md:flex shrink-0 shadow-lg transition-colors duration-300">
        <div className="h-20 flex items-center px-6 border-b border-[var(--border-subtle)]">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-md shadow-blue-500/20">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight text-[var(--text-main)]">Estrela BI</span>
          </Link>
        </div>

        <div className="flex-1 py-6 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-[var(--text-muted)]"}`} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-[var(--border-subtle)] space-y-1.5">
          <button className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <Settings className="h-5 w-5 text-gray-500" />
            Configurações
          </button>
          <button 
            onClick={() => router.push("/login")}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-5 w-5 text-red-500" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header (Mobile menu & Profile & Theme Switcher) */}
        <header className="h-20 border-b border-[var(--border-subtle)] bg-[var(--bg-header)] backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50 transition-colors duration-300">
          <div className="md:hidden flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-[var(--text-main)]">Estrela BI</span>
          </div>
          
          <div className="ml-auto flex items-center gap-6">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--border-subtle)] text-[var(--text-main)] hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
              title={`Mudar para modo ${theme === "light" ? "escuro" : "claro"}`}
            >
              {theme === "light" ? (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" /> <span className="hidden sm:inline">Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-400" /> <span className="hidden sm:inline">Light Mode</span>
                </>
              )}
            </button>

            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-bold text-[var(--text-main)]">Marcus Pereira</span>
              <span className="text-xs font-semibold text-[var(--text-muted)]">Administrador</span>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center border border-white/20 shadow-md">
              <span className="text-sm font-black text-white">MP</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 lg:p-8 bg-[var(--bg-root)] transition-colors duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
