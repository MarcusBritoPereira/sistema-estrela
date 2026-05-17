"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, DollarSign, Package, ShoppingCart, Target, TrendingUp, TrendingDown, Users, Loader2, Sparkles, Trophy, Award } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { DatabaseErrorAlert } from "@/components/DatabaseErrorAlert";

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

interface ExecutiveOverview {
  periodoDias: number;
  pilares: {
    comercial: {
      faturamento: number;
      crescimentoPercentual: number;
      pedidos: number;
      ticketMedio: number;
      mixMedioProdutosPorPedido: number;
      vendedoresAtivos: number;
      metaMensal: number;
      faturamentoMes: number;
      previsaoFechamentoMes: number;
      percentualMeta: number;
      percentualMetaProjetada: number;
      tendenciaMeta: string;
    };
    clientes: {
      ativos: number;
      novosOuRecuperados: number;
      emRisco: number;
      perdidos: number;
      scoreRiscoCarteira: number;
      recomendacao: string;
      curvaABC: { A: number; B: number; C: number };
    };
    produtos: {
      produtosVendidos: number;
      unidadesVendidas: number;
      curvaABC: { A: number; B: number; C: number };
    };
    financeiro: {
      lucroBrutoAproximado: number;
      margemBrutaPercentual: number;
      cmvAproximado: number;
      concentracaoTop10ClientesPercentual: number;
      faturamentoTop10Clientes: number;
      limitacoes: string[];
    };
    operacaoLogistica: {
      status: string;
      disponivelAgora: string[];
      pendenteMapeamento: string[];
    };
  };
}

interface ExecutiveAlert {
  type: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  action: string;
}

export default function DashboardOverview() {
  const [periodo, setPeriodo] = useState<string>("30");
  const [loading, setLoading] = useState<boolean>(true);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [vendasMes, setVendasMes] = useState<VendaMes[]>([]);
  const [ranking, setRanking] = useState<RankingVendedor[]>([]);
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<ProdutoMaisVendido[]>([]);
  const [produtosMenosVendidos, setProdutosMenosVendidos] = useState<ProdutoMaisVendido[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [executiveOverview, setExecutiveOverview] = useState<ExecutiveOverview | null>(null);
  const [executiveAlerts, setExecutiveAlerts] = useState<ExecutiveAlert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const baseURL = "/dashboard";
        const [resKpis, resMes, resRanking, resProdMais, resProdMenos, resInsights, resExecutive, resAlerts] = await Promise.all([
          api.get<Kpis>(`${baseURL}/kpis?periodo=${periodo}`),
          api.get<VendaMes[]>(`${baseURL}/vendas-mes?meses=6`),
          api.get<RankingVendedor[]>(`${baseURL}/ranking-vendedores?periodo=${periodo}`),
          api.get<ProdutoMaisVendido[]>(`${baseURL}/produtos-mais-vendidos?periodo=${periodo}&top=5`),
          api.get<ProdutoMaisVendido[]>(`${baseURL}/produtos-menos-vendidos?periodo=${periodo}&top=5`),
          api.get<string[]>(`${baseURL}/insights`),
          api.get<ExecutiveOverview>(`${baseURL}/executive-overview?periodo=${periodo}`),
          api.get<ExecutiveAlert[]>(`${baseURL}/executive-alerts`),
        ]);

        setKpis(resKpis.data);
        setVendasMes(resMes.data);
        setRanking(resRanking.data);
        setProdutosMaisVendidos(resProdMais.data);
        setProdutosMenosVendidos(resProdMenos.data);
        setInsights(resInsights.data);
        setExecutiveOverview(resExecutive.data);
        setExecutiveAlerts(resAlerts.data);
      } catch (error) {
        console.error("Erro ao carregar dados do BI:", error);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setError((error as any).response?.data?.message || "O servidor SQL Server está temporariamente inalcançável. Verifique sua conexão com a VPN ou rede autorizada da Distribuidora Estrela.");
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
                className={`px-4.5 py-2.5 min-h-[44px] flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                  periodo === p ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                {p} dias
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <DatabaseErrorAlert message={error} />
      ) : loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl shadow-xl backdrop-blur-md">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-sm font-bold text-[var(--text-muted)] animate-pulse">Sincronizando com o banco de dados local...</p>
        </div>
      ) : (
        <>
          {/* AI Insights Card */}
          {insights.length > 0 && (
            <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 dark:from-blue-900/40 dark:via-indigo-900/30 dark:to-slate-900/40 border border-blue-500/30 rounded-3xl p-6 lg:p-8 relative overflow-hidden shadow-xl backdrop-blur-xl transition-all duration-300">
              <div className="absolute -right-10 -bottom-10 opacity-10 transform rotate-12 pointer-events-none">
                <TrendingUp className="w-64 h-64 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="relative z-10 flex items-start gap-4">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3.5 rounded-2xl shadow-lg mt-0.5 shrink-0">
                  <Sparkles className="h-6 w-6 text-white animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-black text-[var(--text-main)] mb-2 flex items-center gap-2">
                    IA Analítica: Insights Automatizados
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
                    {insights.map((insight, idx) => (
                      <div key={idx} className="bg-white/90 dark:bg-black/40 border border-[var(--border-subtle)] dark:border-white/10 rounded-2xl p-4 text-xs text-[var(--text-main)] dark:text-blue-100 font-bold flex items-start gap-3 hover:bg-white dark:hover:bg-black/60 transition-all shadow-sm">
                        <span className="text-lg font-black leading-none">{insight.substring(0, 2)}</span>
                        <span className="flex-1 leading-relaxed font-semibold">{insight.substring(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Executive Command Center */}
          {executiveOverview && (
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-[var(--shadow-card)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
                  <div>
                    <h3 className="text-xl font-black text-[var(--text-main)] flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Centro de Inteligência Executiva
                    </h3>
                    <p className="text-xs font-semibold text-[var(--text-muted)] mt-1">Leitura dos 5 pilares com dados reais disponíveis no SQL Server.</p>
                  </div>
                  <span className="px-3 py-1.5 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-xs font-black border border-blue-500/20">
                    Janela: {executiveOverview.periodoDias} dias
                  </span>
                </div>

                <div className="flex flex-col gap-5">
                  {/* Top 3 KPI Pillars */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* 1. Comercial */}
                    <div className="rounded-3xl border border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.02] p-5 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs uppercase tracking-wider font-black text-[var(--text-muted)]">Comercial</span>
                          <span className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <DollarSign className="w-4 h-4 font-bold" />
                          </span>
                        </div>
                        <p className="text-2xl font-black text-[var(--text-main)] tracking-tight">{formatCurrency(executiveOverview.pilares.comercial.faturamento)}</p>
                      </div>
                      <div className="mt-5 flex items-center gap-2 pt-3.5 border-t border-[var(--border-subtle)]">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${executiveOverview.pilares.comercial.crescimentoPercentual >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
                          {executiveOverview.pilares.comercial.crescimentoPercentual >= 0 ? "+" : ""}{executiveOverview.pilares.comercial.crescimentoPercentual}%
                        </span>
                        <span className="text-xs font-semibold text-[var(--text-muted)]">vs. período anterior</span>
                      </div>
                    </div>

                    {/* 2. Clientes */}
                    <div className="rounded-3xl border border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.02] p-5 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs uppercase tracking-wider font-black text-[var(--text-muted)]">Clientes Ativos</span>
                          <span className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            <Users className="w-4 h-4 font-bold" />
                          </span>
                        </div>
                        <p className="text-2xl font-black text-[var(--text-main)] tracking-tight">{executiveOverview.pilares.clientes.ativos.toLocaleString("pt-BR")}</p>
                      </div>
                      <div className="mt-5 flex flex-wrap items-center gap-2 pt-3.5 border-t border-[var(--border-subtle)]">
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-xl text-xs font-bold">
                          {executiveOverview.pilares.clientes.novosOuRecuperados} novos/recuperados
                        </span>
                        <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-xl text-xs font-bold">
                          {executiveOverview.pilares.clientes.emRisco} em risco
                        </span>
                      </div>
                    </div>

                    {/* 3. Produtos */}
                    <div className="rounded-3xl border border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.02] p-5 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs uppercase tracking-wider font-black text-[var(--text-muted)]">Produtos Ativos</span>
                          <span className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Package className="w-4 h-4 font-bold" />
                          </span>
                        </div>
                        <p className="text-2xl font-black text-[var(--text-main)] tracking-tight">{executiveOverview.pilares.produtos.produtosVendidos.toLocaleString("pt-BR")}</p>
                      </div>
                      <div className="mt-5 pt-3.5 border-t border-[var(--border-subtle)] flex items-center">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-xl inline-block">
                          {executiveOverview.pilares.produtos.unidadesVendidas.toLocaleString("pt-BR")} unidades vendidas
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Executive Forecast & Risk */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
                      <span className="text-xs uppercase tracking-wider font-black text-blue-700 dark:text-blue-300">Previsão de fechamento</span>
                      <p className="text-2xl font-black text-[var(--text-main)] mt-2">{formatCurrency(executiveOverview.pilares.comercial.previsaoFechamentoMes)}</p>
                      <p className="text-xs font-semibold text-[var(--text-muted)] mt-1">
                        Mês atual: {formatCurrency(executiveOverview.pilares.comercial.faturamentoMes)}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                      <span className="text-xs uppercase tracking-wider font-black text-emerald-700 dark:text-emerald-300">Meta mensal</span>
                      <p className="text-2xl font-black text-[var(--text-main)] mt-2">
                        {executiveOverview.pilares.comercial.metaMensal > 0 ? `${executiveOverview.pilares.comercial.percentualMetaProjetada}%` : "Não configurada"}
                      </p>
                      <p className="text-xs font-semibold text-[var(--text-muted)] mt-1">
                        Tendência: {executiveOverview.pilares.comercial.tendenciaMeta.replaceAll("-", " ")}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
                      <span className="text-xs uppercase tracking-wider font-black text-amber-700 dark:text-amber-300">Risco da carteira</span>
                      <p className="text-2xl font-black text-[var(--text-main)] mt-2">{executiveOverview.pilares.clientes.scoreRiscoCarteira}%</p>
                      <p className="text-xs font-semibold text-[var(--text-muted)] mt-1">{executiveOverview.pilares.clientes.recomendacao}</p>
                    </div>
                  </div>

                  {/* Curva ABC Banner */}
                  <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-600/[0.03] via-indigo-600/[0.02] to-blue-600/[0.03] dark:from-blue-400/[0.04] p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-blue-500/10">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-[var(--text-main)] tracking-tight">Curva ABC (Pareto 80/20)</h4>
                          <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">Distribuição de receita concentrada nos itens e clientes de maior volume</p>
                          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">Top 10 clientes: {executiveOverview.pilares.financeiro.concentracaoTop10ClientesPercentual}% da receita ({formatCurrency(executiveOverview.pilares.financeiro.faturamentoTop10Clientes)})</p>
                        </div>
                      </div>
                      <span className="self-start sm:self-center text-xs bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
                        Receita Concentrada
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Produtos */}
                      <div className="bg-black/[0.01] dark:bg-white/[0.01] rounded-2xl p-4 border border-[var(--border-subtle)]">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-black text-[var(--text-main)] flex items-center gap-2">
                            <span className="text-base">📦</span> Produtos Ativos
                          </span>
                          <span className="text-xs font-extrabold text-[var(--text-muted)] bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg">A (80%) • B (15%) • C (5%)</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2.5 text-center">
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 transition-all hover:scale-[1.02]" title="Curva A: Produtos que geram 80% do faturamento">
                            <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">Curva A</span>
                            <span className="text-2xl font-black text-[var(--text-main)]">{executiveOverview.pilares.produtos.curvaABC.A}</span>
                          </div>
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 transition-all hover:scale-[1.02]" title="Curva B: Produtos que geram 15% do faturamento">
                            <span className="text-[11px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider block mb-1">Curva B</span>
                            <span className="text-2xl font-black text-[var(--text-main)]">{executiveOverview.pilares.produtos.curvaABC.B}</span>
                          </div>
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 transition-all hover:scale-[1.02]" title="Curva C: Produtos que geram 5% do faturamento">
                            <span className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">Curva C</span>
                            <span className="text-2xl font-black text-[var(--text-main)]">{executiveOverview.pilares.produtos.curvaABC.C}</span>
                          </div>
                        </div>
                      </div>

                      {/* Clientes */}
                      <div className="bg-black/[0.01] dark:bg-white/[0.01] rounded-2xl p-4 border border-[var(--border-subtle)]">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-black text-[var(--text-main)] flex items-center gap-2">
                            <span className="text-base">👥</span> Clientes Ativos
                          </span>
                          <span className="text-xs font-extrabold text-[var(--text-muted)] bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg">A (80%) • B (15%) • C (5%)</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2.5 text-center">
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 transition-all hover:scale-[1.02]" title="Curva A: Clientes que respondem por 80% do faturamento">
                            <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">Curva A</span>
                            <span className="text-2xl font-black text-[var(--text-main)]">{executiveOverview.pilares.clientes.curvaABC.A}</span>
                          </div>
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 transition-all hover:scale-[1.02]" title="Curva B: Clientes que respondem por 15% do faturamento">
                            <span className="text-[11px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider block mb-1">Curva B</span>
                            <span className="text-2xl font-black text-[var(--text-main)]">{executiveOverview.pilares.clientes.curvaABC.B}</span>
                          </div>
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 transition-all hover:scale-[1.02]" title="Curva C: Clientes que respondem por 5% do faturamento">
                            <span className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">Curva C</span>
                            <span className="text-2xl font-black text-[var(--text-main)]">{executiveOverview.pilares.clientes.curvaABC.C}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-black text-[var(--text-main)]">Alertas Automáticos</h3>
                </div>
                <div className="space-y-3 max-h-[330px] overflow-auto pr-1">
                  {executiveAlerts.slice(0, 6).map((alert, idx) => (
                    <div key={`${alert.title}-${idx}`} className={`rounded-2xl border p-3 ${alert.severity === "critical" ? "border-red-500/30 bg-red-500/10" : alert.severity === "warning" ? "border-amber-500/30 bg-amber-500/10" : "border-blue-500/30 bg-blue-500/10"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase tracking-wider font-black text-[var(--text-muted)]">{alert.type}</span>
                        <span className="text-[10px] uppercase font-black">{alert.severity}</span>
                      </div>
                      <p className="text-sm font-black text-[var(--text-main)] mt-1">{alert.title}</p>
                      <p className="text-xs font-medium text-[var(--text-muted)] mt-1">{alert.description}</p>
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-2">Ação: {alert.action}</p>
                    </div>
                  ))}
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
                    Ranking de Vendedores
                  </h3>
                  <p className="text-xs font-medium text-[var(--text-muted)] mt-1">Top vendedores por pedidos tirados no período selecionado</p>
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
                          `${props.payload.qtdPedidos} pedidos (${formatCurrency(Number(value))})`,
                          "Desempenho",
                        ]}
                      />
                      <Bar dataKey="faturamento" fill="#2563eb" radius={[0, 8, 8, 0]} barSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Top and Bottom Selling Products Comparison */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Top Mais Vendidos */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-[var(--shadow-card)] flex flex-col justify-between transition-colors duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-[var(--text-main)] flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-500 font-bold" />
                    Top Produtos Mais Vendidos
                  </h3>
                  <p className="text-xs font-medium text-[var(--text-muted)] mt-1">Produtos com maior faturamento e volume no período</p>
                </div>
                <span className="text-xs bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full font-black flex items-center gap-1 shadow-sm">
                  <TrendingUp className="w-3.5 h-3.5" /> Top 5 Exclusivo
                </span>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] text-xs uppercase font-black text-[var(--text-muted)] tracking-wider">
                      <th className="pb-3 pl-2 w-12">Pos</th>
                      <th className="pb-3">Produto</th>
                      <th className="pb-3">Família</th>
                      <th className="pb-3 text-right">Qtd</th>
                      <th className="pb-3 text-right">Preço Médio</th>
                      <th className="pb-3 text-right pr-2">Faturamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] text-sm font-semibold">
                    {produtosMaisVendidos.map((prod, index) => (
                      <tr key={prod.codProduto} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 pl-2">
                          <div className={`w-7 h-7 rounded-2xl flex items-center justify-center text-xs font-black shadow-md ${
                            index === 0 ? "bg-amber-500 text-black shadow-amber-500/20" :
                            index === 1 ? "bg-slate-300 text-black shadow-slate-300/20" :
                            index === 2 ? "bg-amber-700 text-white shadow-amber-700/20" :
                            "bg-black/10 dark:bg-white/10 text-[var(--text-muted)]"
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-3 font-black text-[var(--text-main)] max-w-[160px] sm:max-w-[200px] truncate" title={prod.nomeProduto}>{prod.nomeProduto}</td>
                        <td className="py-3 text-xs font-bold text-[var(--text-muted)]">
                          <span className="bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-xl border border-[var(--border-subtle)] inline-block max-w-[100px] truncate" title={prod.familia || "Diversos"}>
                            {prod.familia || "Diversos"}
                          </span>
                        </td>
                        <td className="py-3 text-right font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">{prod.qtdVendida.toLocaleString("pt-BR")} un</td>
                        <td className="py-3 text-right font-bold text-[var(--text-muted)] whitespace-nowrap">{formatCurrency(prod.precoMedio)}</td>
                        <td className="py-3 text-right pr-2 font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{formatCurrency(prod.faturamento)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Menos Vendidos */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-[var(--shadow-card)] flex flex-col justify-between transition-colors duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-[var(--text-main)] flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-500 font-bold" />
                    Top Produtos Menos Vendidos
                  </h3>
                  <p className="text-xs font-medium text-[var(--text-muted)] mt-1">Produtos ativos com menor faturamento no período</p>
                </div>
                <span className="text-xs bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-full font-black flex items-center gap-1 shadow-sm">
                  <AlertTriangle className="w-3.5 h-3.5" /> Atenção no Giro
                </span>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] text-xs uppercase font-black text-[var(--text-muted)] tracking-wider">
                      <th className="pb-3 pl-2 w-12">Pos</th>
                      <th className="pb-3">Produto</th>
                      <th className="pb-3">Família</th>
                      <th className="pb-3 text-right">Qtd</th>
                      <th className="pb-3 text-right">Preço Médio</th>
                      <th className="pb-3 text-right pr-2">Faturamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] text-sm font-semibold">
                    {produtosMenosVendidos.map((prod, index) => (
                      <tr key={prod.codProduto} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 pl-2">
                          <div className="w-7 h-7 rounded-2xl flex items-center justify-center text-xs font-black shadow-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            #{index + 1}
                          </div>
                        </td>
                        <td className="py-3 font-black text-[var(--text-main)] max-w-[160px] sm:max-w-[200px] truncate" title={prod.nomeProduto}>{prod.nomeProduto}</td>
                        <td className="py-3 text-xs font-bold text-[var(--text-muted)]">
                          <span className="bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-xl border border-[var(--border-subtle)] inline-block max-w-[100px] truncate" title={prod.familia || "Diversos"}>
                            {prod.familia || "Diversos"}
                          </span>
                        </td>
                        <td className="py-3 text-right font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">{prod.qtdVendida.toLocaleString("pt-BR")} un</td>
                        <td className="py-3 text-right font-bold text-[var(--text-muted)] whitespace-nowrap">{formatCurrency(prod.precoMedio)}</td>
                        <td className="py-3 text-right pr-2 font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">{formatCurrency(prod.faturamento)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
