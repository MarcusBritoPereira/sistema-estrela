"use client";

import { useState } from "react";
import { ArrowRight, BarChart3, Lock, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API login
    setTimeout(() => {
      setIsLoading(false);
      router.push("/dashboard");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text-main)] flex flex-col justify-center items-center p-4 selection:bg-blue-500/30 transition-colors duration-300">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors min-h-[48px] px-3 py-2 rounded-xl">
        <ArrowRight className="h-4 w-4 rotate-180" />
        <span className="text-sm font-bold">Voltar ao Portal</span>
      </Link>
      
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-3.5 rounded-2xl mb-4 shadow-xl shadow-blue-500/20">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--text-main)] mb-2">Acesso Corporativo</h1>
          <p className="text-[var(--text-muted)] font-semibold text-sm">Distribuidora Estrela — Sistema Interno de Inteligência Comercial</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-8 shadow-[var(--shadow-card)] relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600" />
          
          <div className="flex items-center gap-2.5 mb-6 bg-black/5 dark:bg-white/5 p-3.5 rounded-xl border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-main)]">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Acesso monitorado e restrito aos gestores e diretoria.</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-extrabold text-[var(--text-main)] block" htmlFor="email">
                Identificação ou E-mail Corporativo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]" />
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full min-h-[48px] bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-xl py-3 pl-11 pr-4 text-[var(--text-main)] font-black placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder="Ex: marcus@distribuidoraestrela.com.br"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-extrabold text-[var(--text-main)] block" htmlFor="password">
                  Senha de Acesso
                </label>
                <span className="text-xs font-bold text-[var(--text-muted)]">TI: Ramal 204</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[48px] bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-xl py-3 pl-11 pr-4 text-[var(--text-main)] font-black placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center disabled:opacity-70 text-sm tracking-wide cursor-pointer"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Entrar no Sistema Analítico"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
