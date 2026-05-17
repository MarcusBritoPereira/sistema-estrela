"use client";

import { useState } from "react";
import { ArrowRight, BarChart3, Lock, ShieldCheck, User, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AuthUser, saveAuthSession } from "@/lib/auth";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<LoginResponse>("/auth/login", { email, password });
      saveAuthSession(response.data.accessToken, response.data.refreshToken, response.data.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
          ? (err as { response: { data: { message: string } } }).response.data.message
          : "Não foi possível autenticar. Verifique seu e-mail, senha e conexão com o servidor.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
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
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
          <div className="flex items-center gap-2 mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400 text-sm font-bold">
            <ShieldCheck className="h-5 w-5" />
            <span>Autenticação JWT obrigatória</span>
          </div>

          {error && (
            <div className="mb-6 flex gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--text-main)] ml-1">E-mail Corporativo</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--border-subtle)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-[var(--text-main)] font-medium placeholder:text-[var(--text-muted)]"
                  placeholder="seu.email@empresa.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-[var(--text-main)]">Senha</label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--border-subtle)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-[var(--text-main)] font-medium placeholder:text-[var(--text-muted)]"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
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
