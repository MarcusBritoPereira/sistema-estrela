"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowDownRight, ArrowUpRight, DollarSign, Package, ShoppingCart, TrendingUp, Users, Loader2, Sparkles, Trophy, Award } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "@/components/ThemeProvider";

interface Kpis {
  faturamentoTotal: number;
  totalPedidos: number;
  ticketMedio: number;
  lucroTotal: number;
  faturamentoHoje: number;
  pedidosHoje: number;
  totalClientes: number;
  faturamentoMes: number;
  pedidosMes: number;
  faturamentoMesAnterior: number;
  crescimentoMensal: string;
}

interface VendaMes {
  ano: number;
  mes: number;
  label: string;
  qtdPedidos: number;
  faturamento: number;
  lucro: number;
}

interface RankingVendedor {
  nomeVendedor: string;
  qtdPedidos: number;
  faturamento: number;
  ticketMedio: number;
  lucro: number;
}

interface ProdutoMaisVendido {
  codProduto: number;
  nomeProduto: string;
  familia: string;
  qtdVendida: number;
  faturamento: number;
  precoMedio: number;
}

export default function DashboardOverview() {
  const [periodo, setPeriodo] = useState<string>("30");
  const [loading, setLoading] = useState<boolean>(true);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [vendasMes, setVendasMes] = useState<VendaMes[]>([]);
  const [ranking, setRanking] = useState<RankingVendedor[]>([]);
  const [produtos, setProdutos] = useState<ProdutoMaisVendido[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const { theme } = useTheme();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const baseURL = "http://localhost:3000/dashboard";
        const [resKpis, resMes, resRanking, resProd, resInsights] = await Promise.all([
          axios.get<Kpis>(`${baseURL}/kpis?periodo=${periodo}`),
          axios.get<VendaMes[]>(`${baseURL}/vendas-mes?meses=6`),
          axios.get<RankingVendedor[]>(`${baseURL}/ranking-vendedores?periodo=${periodo}`),
          axios.get<ProdutoMaisVendido[]>(`${baseURL}/produtos-mais-vendidos?periodo=${periodo}&top=5`),
          axios.get<string[]>(`${baseURL}/insights`),
        ]);

        setKpis(resKpis.data);
        setVendasMes(resMes.data);
        setRanking(resRanking.data);
        setProdutos(resProd.data);
        setInsights(resInsights.data);
      } catch (error) {
        console.error("Erro ao carregar dados do BI:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [periodo]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const isGrowthPositive = kpis ? parseFloat(kpis.crescimentoMensal) >= 0 : true;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              BI em Tempo Real
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Conectado ao SQL Server</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-[var(--text-main)]">Dashboard Analítico</h2>
          <p className="text-sm font-medium text-[var(--text-muted)] mt-1">Distribuidora Estrela — Indicadores comerciais e inteligência de vendas.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-black/5 dark:bg-[#161616] border border-[var(--border-subtle)] rounded-2xl p-1.5 shadow-sm">
            {["7", "30", "90"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  periodo === p ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                {p} dias
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl shadow-xl backdrop-blur-md">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-sm font-bold text-[var(--text-muted)] animate-pulse">Sincronizando com o banco de dados local...</p>
        </div>
      ) : (
        <>
          {/* AI Insights Card */}
          {insights.length > 0 && (
            <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900/40 dark:from-blue-900/40 dark:via-indigo-900/30 dark:to-purple-900/40 border border-blue-500/30 rounded-3xl p-6 relative overflow-hidden shadow-2xl backdrop-blur-xl">
              <div className="absolute -right-10 -bottom-10 opacity-10 transform rotate-12 pointer-events-none">
                <TrendingUp className="w-64 h-64 text-blue-400" />
              </div>
              <div className="relative z-10 flex items-start gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg mt-0.5">
                  <Sparkles className="h-6 w-6 text-white animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                    IA Analítica: Insights Automatizados
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                    {insights.map((insight, idx) => (
                      <div key={idx} className="bg-black/40 border border-white/10 rounded-2xl p-3.5 text-xs text-blue-100 font-medium flex items-start gap-2.5 hover:bg-black/60 transition-colors shadow-inner">
                        <span className="text-base font-bold leading-none">{insight.substring(0, 2)}</span>
                        <span className="flex-1">{insight.substring(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Faturamento Período",
                value: formatCurrency(kpis?.faturamentoTotal || 0),
                change: `${kpis?.totalPedidos || 0} pedidos faturados`,
                icon: DollarSign,
                color: "text-blue-600 dark:text-blue-400",
                bg: "bg-blue-500/10 border-blue-500/20",
              },
              {
                title: "Faturamento do Mês",
                value: formatCurrency(kpis?.faturamentoMes || 0),
                change: `${kpis?.crescimentoMensal || 0}% vs. mês anterior`,
                isGrowth: true,
                isPositive: isGrowthPositive,
                icon: ShoppingCart,
                color: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-500/10 border-emerald-500/20",
              },
              {
                title: "Ticket Médio",
                value: formatCurrency(kpis?.ticketMedio || 0),
                change: "Média geral por nota fiscal",
                icon: Package,
                color: "text-indigo-600 dark:text-indigo-400",
                bg: "bg-indigo-500/10 border-indigo-500/20",
              },
              {
                title: "Clientes Atendidos",
                value: (kpis?.totalClientes || 0).toLocaleString("pt-BR"),
                change: "CNPJs distintos comprando",
                icon: Users,
                color: "text-amber-600 dark:text-amber-400",
                bg: "bg-amber-500/10 border-amber-500/20",
              },
            ].map((kpi, index) => (
              <div key={index} className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 hover:border-blue-500/30 transition-all shadow-[var(--shadow-card)] group">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">{kpi.title}</p>
                    <p className="text-2xl font-black text-[var(--text-main)] group-hover:scale-105 transform origin-left transition-transform duration-300">{kpi.value}</p>
                  </div>
                  <div className={`p-3.5 rounded-2xl border ${kpi.bg} shadow-sm`}>
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-3 border-t border-[var(--border-subtle)]">
                  {kpi.isGrowth ? (
                    <span className={`flex items-center text-xs font-extrabold ${kpi.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {kpi.isPositive ? <ArrowUpRight className="h-4 w-4 mr-0.5 font-bold" /> : <ArrowDownRight className="h-4 w-4 mr-0.5 font-bold" />}
                      {kpi.change}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-[var(--text-muted)]">{kpi.change}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-7">
            {/* Main Chart - Monthly Revenue */}
            <div className="lg:col-span-4 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-[var(--shadow-card)] flex flex-col justify-between transition-colors duration-300">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-[var(--text-main)] flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                    Faturamento Mensal
                  </h3>
                  <p className="text-xs font-medium text-[var(--text-muted)] mt-1">Evolução do faturamento geral nos últimos meses</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase text-[var(--text-muted)] block">Total Exibido</span>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                    {formatCurrency(vendasMes.reduce((acc, curr) => acc + curr.faturamento, 0))}
                  </span>
                </div>
              </div>
              <div className="h-[320px] w-full">
                {vendasMes.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm font-bold text-[var(--text-muted)]">Nenhum dado mensal faturado encontrado</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={vendasMes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#e2e8f0" : "#222"} vertical={false} />
                      <XAxis dataKey="label" stroke={theme === "light" ? "#64748b" : "#777"} fontSize={11} tickLine={false} axisLine={false} fontWeight="bold" />
                      <YAxis
                        stroke={theme === "light" ? "#64748b" : "#777"}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        fontWeight="bold"
                        tickFormatter={(val) => `R$ ${Math.round(val / 1000)}k`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: theme === "light" ? "#ffffff" : "#181818", borderColor: theme === "light" ? "#cbd5e1" : "#333", borderRadius: "16px", padding: "12px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)" }}
                        itemStyle={{ color: theme === "light" ? "#0f172a" : "#fff", fontSize: "13px", fontWeight: "bold" }}
                        labelStyle={{ color: theme === "light" ? "#64748b" : "#aaa", fontSize: "11px", marginBottom: "4px", fontWeight: "bold" }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(value: any) => [formatCurrency(Number(value)), "Faturamento"]}
                      />
                      <Area type="monotone" dataKey="faturamento" stroke="#2563eb" strokeWidth={3.5} fillOpacity={1} fill="url(#colorFaturamento)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Vendors Ranking Bar Chart */}
            <div className="lg:col-span-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-[var(--shadow-card)] flex flex-col justify-between transition-colors duration-300">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-[var(--text-main)] flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500 font-bold" />
                    Ranking de Operadores
                  </h3>
                  <p className="text-xs font-medium text-[var(--text-muted)] mt-1">Top em faturamento no período selecionado</p>
                </div>
              </div>
              <div className="flex-1 min-h-[320px]">
                {ranking.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm font-bold text-[var(--text-muted)]">Nenhum vendedor encontrado</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ranking} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#e2e8f0" : "#222"} horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="nomeVendedor"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        stroke={theme === "light" ? "#0f172a" : "#ccc"}
                        fontSize={11}
                        fontWeight="bold"
                        width={80}
                        tickFormatter={(val) => val.length > 10 ? `${val.substring(0, 10)}...` : val}
                      />
                      <Tooltip
                        cursor={{ fill: theme === "light" ? "rgba(0,0,0,0.04)" : "rgba(255, 255, 255, 0.03)" }}
                        contentStyle={{ backgroundColor: theme === "light" ? "#ffffff" : "#181818", borderColor: theme === "light" ? "#cbd5e1" : "#333", borderRadius: "16px", padding: "12px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)" }}
                        itemStyle={{ color: theme === "light" ? "#0f172a" : "#fff", fontSize: "13px", fontWeight: "bold" }}
                        labelStyle={{ color: theme === "light" ? "#64748b" : "#aaa", fontSize: "11px", marginBottom: "4px", fontWeight: "bold" }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(value: any, name: any, props: any) => [
                          `${formatCurrency(Number(value))} (${props.payload.qtdPedidos} ped)`,
                          "Faturamento",
                        ]}
                      />
                      <Bar dataKey="faturamento" fill="#2563eb" radius={[0, 8, 8, 0]} barSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Top Selling Products List */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-[var(--shadow-card)] transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-[var(--text-main)] flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-500 font-bold" />
                  Top Produtos Mais Vendidos
                </h3>
                <p className="text-xs font-medium text-[var(--text-muted)] mt-1">Produtos com maior faturamento e volume no período</p>
              </div>
              <span className="text-xs bg-black/5 dark:bg-white/5 border border-[var(--border-subtle)] px-3 py-1.5 rounded-full text-[var(--text-main)] font-black">Top 5 Exclusivo</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-xs uppercase font-black text-[var(--text-muted)] tracking-wider">
                    <th className="pb-3 pl-2">Ranking</th>
                    <th className="pb-3">Produto</th>
                    <th className="pb-3">Linha / Família</th>
                    <th className="pb-3 text-right">Qtd Vendida</th>
                    <th className="pb-3 text-right">Preço Médio</th>
                    <th className="pb-3 text-right pr-2">Faturamento Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-sm font-semibold">
                  {produtos.map((prod, index) => (
                    <tr key={prod.codProduto} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 pl-2">
                        <div className={`w-7 h-7 rounded-2xl flex items-center justify-center text-xs font-black shadow-md ${
                          index === 0 ? "bg-amber-500 text-black shadow-amber-500/20" :
                          index === 1 ? "bg-slate-300 text-black shadow-slate-300/20" :
                          index === 2 ? "bg-amber-700 text-white shadow-amber-700/20" :
                          "bg-black/10 dark:bg-white/10 text-[var(--text-muted)]"
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-4 font-black text-[var(--text-main)] max-w-xs truncate">{prod.nomeProduto}</td>
                      <td className="py-4 text-xs font-bold text-[var(--text-muted)]">
                        <span className="bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] inline-block">
                          {prod.familia || "Diversos"}
                        </span>
                      </td>
                      <td className="py-4 text-right font-black text-blue-600 dark:text-blue-400">{prod.qtdVendida.toLocaleString("pt-BR")} un</td>
                      <td className="py-4 text-right font-bold text-[var(--text-muted)]">{formatCurrency(prod.precoMedio)}</td>
                      <td className="py-4 text-right pr-2 font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(prod.faturamento)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
