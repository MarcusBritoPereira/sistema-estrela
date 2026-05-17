"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart3, Calendar, Loader2, TrendingUp, Sparkles } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "@/components/ThemeProvider";

interface VendaDia {
  data: string;
  qtdPedidos: number;
  faturamento: number;
}

interface VendaMes {
  ano: number;
  mes: number;
  label: string;
  qtdPedidos: number;
  faturamento: number;
  lucro: number;
}

export default function SalesPage() {
  const [loading, setLoading] = useState(true);
  const [vendasDia, setVendasDia] = useState<VendaDia[]>([]);
  const [vendasMes, setVendasMes] = useState<VendaMes[]>([]);
  const [dias, setDias] = useState("30");
  const { theme } = useTheme();

  useEffect(() => {
    async function fetchSales() {
      setLoading(true);
      try {
        const baseURL = "http://localhost:3000/dashboard";
        const [resDia, resMes] = await Promise.all([
          axios.get<VendaDia[]>(`${baseURL}/vendas-dia?dias=${dias}`),
          axios.get<VendaMes[]>(`${baseURL}/vendas-mes?meses=12`),
        ]);
        setVendasDia(resDia.data);
        setVendasMes(resMes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSales();
  }, [dias]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(d);
    } catch {
      return dateStr;
    }
  };

  const totalFaturamentoDia = vendasDia.reduce((acc, curr) => acc + curr.faturamento, 0);
  const totalPedidosDia = vendasDia.reduce((acc, curr) => acc + curr.qtdPedidos, 0);

  return (
    <div className="space-y-8 pb-12 transition-colors duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> Módulo Transacional de Vendas
            </span>
            <span className="text-[var(--text-muted)] font-semibold">SQL Server Live</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-[var(--text-main)] flex items-center gap-2.5">
            <BarChart3 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            Análise de Vendas e Faturamento Bruto
          </h2>
          <p className="text-sm font-medium text-[var(--text-muted)] mt-1">Distribuidora Estrela — Histórico diário e mensal de faturamento e volume de notas emitidas.</p>
        </div>
        <div className="flex items-center gap-2 bg-black/5 dark:bg-[#161616] border border-[var(--border-subtle)] rounded-2xl p-1.5 shadow-sm">
          {["15", "30", "60"].map((p) => (
            <button
              key={p}
              onClick={() => setDias(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${dias === p ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 scale-105" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
            >
              {p} Dias
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl shadow-xl backdrop-blur-md">
          <Loader2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-spin" />
          <p className="text-sm font-bold text-[var(--text-muted)] animate-pulse">Calculando notas e cupons no SQL Server...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-[var(--shadow-card)] hover:border-emerald-500/30 transition-all">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[var(--text-muted)]">Faturamento no Período ({dias} dias)</span>
              <p className="text-3xl font-black text-[var(--text-main)] mt-2">{formatCurrency(totalFaturamentoDia)}</p>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-[var(--shadow-card)] hover:border-emerald-500/30 transition-all">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[var(--text-muted)]">Volume de Notas/Pedidos ({dias} dias)</span>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{totalPedidosDia.toLocaleString("pt-BR")} pedidos faturados</p>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-[var(--shadow-card)] hover:border-emerald-500/30 transition-all">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[var(--text-muted)]">Ticket Médio por Pedido</span>
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-2">{formatCurrency(totalPedidosDia > 0 ? totalFaturamentoDia / totalPedidosDia : 0)}</p>
            </div>
          </div>

          {/* Vendas por Dia */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-[var(--shadow-card)] transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-[var(--text-main)] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-500 font-bold" />
                  Faturamento Diário Bruto
                </h3>
                <p className="text-xs font-medium text-[var(--text-muted)] mt-1">Picos de faturamento dia a dia nos últimos {dias} dias</p>
              </div>
            </div>
            <div className="h-[350px] w-full">
              {vendasDia.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm font-bold text-[var(--text-muted)]">Nenhum faturamento diário encontrado</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={vendasDia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSalesDay" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#e2e8f0" : "#222"} vertical={false} />
                    <XAxis dataKey="data" stroke={theme === "light" ? "#64748b" : "#777"} fontSize={11} tickFormatter={formatDate} tickLine={false} axisLine={false} fontWeight="bold" />
                    <YAxis stroke={theme === "light" ? "#64748b" : "#777"} fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" tickFormatter={(val) => `R$ ${Math.round(val / 1000)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: theme === "light" ? "#ffffff" : "#181818", borderColor: theme === "light" ? "#cbd5e1" : "#333", borderRadius: "16px", padding: "12px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)" }}
                      itemStyle={{ color: theme === "light" ? "#0f172a" : "#fff", fontSize: "13px", fontWeight: "bold" }}
                      labelStyle={{ color: theme === "light" ? "#64748b" : "#aaa", fontSize: "11px", marginBottom: "4px", fontWeight: "bold" }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(val: any, name: any, props: any) => [`${formatCurrency(Number(val))} (${props.payload.qtdPedidos} ped)`, "Faturamento"]}
                      labelFormatter={(label) => `Data: ${formatDate(String(label))}`}
                    />
                    <Area type="monotone" dataKey="faturamento" stroke="#10b981" strokeWidth={3.5} fillOpacity={1} fill="url(#colorSalesDay)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Vendas por Mês Bar Chart */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-[var(--shadow-card)] transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-[var(--text-main)] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-500 font-bold" />
                  Histórico Consolidado Mensal (Últimos 12 Meses)
                </h3>
                <p className="text-xs font-medium text-[var(--text-muted)] mt-1">Comparativo do faturamento global mês a mês</p>
              </div>
            </div>
            <div className="h-[350px] w-full">
              {vendasMes.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm font-bold text-[var(--text-muted)]">Nenhum dado mensal encontrado</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vendasMes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#e2e8f0" : "#222"} vertical={false} />
                    <XAxis dataKey="label" stroke={theme === "light" ? "#64748b" : "#777"} fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" />
                    <YAxis stroke={theme === "light" ? "#64748b" : "#777"} fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" tickFormatter={(val) => `R$ ${Math.round(val / 1000)}k`} />
                    <Tooltip
                      cursor={{ fill: theme === "light" ? "rgba(0,0,0,0.04)" : "rgba(255, 255, 255, 0.03)" }}
                      contentStyle={{ backgroundColor: theme === "light" ? "#ffffff" : "#181818", borderColor: theme === "light" ? "#cbd5e1" : "#333", borderRadius: "16px", padding: "12px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)" }}
                      itemStyle={{ color: theme === "light" ? "#0f172a" : "#fff", fontSize: "13px", fontWeight: "bold" }}
                      labelStyle={{ color: theme === "light" ? "#64748b" : "#aaa", fontSize: "11px", marginBottom: "4px", fontWeight: "bold" }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(val: any, name: any, props: any) => [`${formatCurrency(Number(val))} (${props.payload.qtdPedidos} notas)`, "Faturamento"]}
                    />
                    <Bar dataKey="faturamento" fill="#2563eb" radius={[8, 8, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
