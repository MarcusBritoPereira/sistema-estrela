"use client";

import { useEffect, useState } from "react";
import { Building2, RefreshCw, AlertTriangle, CheckCircle2, TrendingUp, ShieldAlert, DollarSign, Edit3, Save, Layers, Eye, EyeOff, BarChart3, Sliders } from "lucide-react";
import { DatabaseErrorAlert } from "@/components/DatabaseErrorAlert";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useTheme } from "@/components/ThemeProvider";

interface EmpresaCNPJ {
  deposito: number;
  nome: string;
  cnpj: string;
  faturamentoMensal: number;
  qtdNotas: number;
  limiteMensal: number;
  folegoRestante: number;
  percentualAtingido: number;
}

interface BillingSummary {
  mesAtual: string;
  faturamentoTotalGrupo: number;
  folegoTotalGrupo: number;
  empresas: EmpresaCNPJ[];
}

interface HistoricoMes {
  mesAno: string;
  ano: number;
  mes: number;
  dep_1_fat: number;
  dep_1_qtd: number;
  dep_2_fat: number;
  dep_2_qtd: number;
  dep_3_fat: number;
  dep_3_qtd: number;
  dep_4_fat: number;
  dep_4_qtd: number;
  dep_6_fat: number;
  dep_6_qtd: number;
  [key: string]: string | number;
}

const COMPANIES_CONFIG: Record<number, { name: string; color: string; hoverColor: string }> = {
  1: { name: "M L Munhoz", color: "#3b82f6", hoverColor: "#2563eb" }, // Blue
  2: { name: "Globo Dist.", color: "#10b981", hoverColor: "#059669" }, // Emerald
  3: { name: "Mundial Dist.", color: "#f59e0b", hoverColor: "#d97706" }, // Amber
  4: { name: "A C Veras", color: "#8b5cf6", hoverColor: "#7c3aed" }, // Violet
  6: { name: "Premium Dist.", color: "#ec4899", hoverColor: "#db2777" }, // Pink
};

export default function BillingPage() {
  const [data, setData] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingLimit, setEditingLimit] = useState<{ [key: number]: string }>({});
  const [savingLimit, setSavingLimit] = useState<{ [key: number]: boolean }>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Histórico States
  const [historyData, setHistoryData] = useState<HistoricoMes[]>([]);
  const [historyPeriod, setHistoryPeriod] = useState<string>("6m");
  const [historyMetric, setHistoryMetric] = useState<"fat" | "qtd">("fat");
  const [activeCompanies, setActiveCompanies] = useState<{ [dep: number]: boolean }>({
    1: true,
    2: true,
    3: true,
    4: true,
    6: true,
  });
  const [historyLoading, setHistoryLoading] = useState(false);

  const { theme } = useTheme();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:3000/reports/faturamento-cnpj");
      if (res.status === 503) {
        setError("503");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Falha ao carregar dados de faturamento por CNPJ");
      const json = await res.json();
      setData(json);

      const limitsMap: { [key: number]: string } = {};
      json.empresas.forEach((emp: EmpresaCNPJ) => {
        limitsMap[emp.deposito] = String(emp.limiteMensal);
      });
      setEditingLimit(limitsMap);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro de conexão ao servidor");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (period: string) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/reports/faturamento-historico?period=${period}`);
      if (res.ok) {
        const json = await res.json();
        setHistoryData(json);
      }
    } catch (err) {
      console.error("Falha ao carregar histórico", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchHistory(historyPeriod);
  }, [historyPeriod]);

  const handleSaveLimit = async (deposito: number) => {
    const novoLimiteStr = editingLimit[deposito];
    const novoLimite = parseFloat(novoLimiteStr);
    if (isNaN(novoLimite) || novoLimite < 0) {
      alert("Por favor, insira um valor de limite válido.");
      return;
    }

    setSavingLimit((prev) => ({ ...prev, [deposito]: true }));
    setSuccessMsg(null);
    try {
      const res = await fetch("http://localhost:3000/reports/faturamento-cnpj/limite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deposito, limite: novoLimite }),
      });
      if (!res.ok) throw new Error("Erro ao salvar o limite no servidor");
      
      setSuccessMsg("Teto mensal atualizado com sucesso!");
      await fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Falha ao salvar o limite");
      }
    } finally {
      setSavingLimit((prev) => ({ ...prev, [deposito]: false }));
    }
  };

  const toggleCompany = (dep: number) => {
    setActiveCompanies((prev) => ({ ...prev, [dep]: !prev[dep] }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-[#121212]/95 border border-[var(--border-subtle)] p-4 rounded-2xl shadow-xl backdrop-blur-md">
          <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-2 border-b border-[var(--border-subtle)] pb-1">
            {label}
          </p>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {payload.map((item: any) => {
              const dep = Number(item.dataKey.split("_")[1]);
              const isQtd = historyMetric === "qtd";
              const val = Number(item.value);
              if (val === 0) return null;
              return (
                <div key={item.dataKey} className="flex items-center justify-between gap-8 text-xs font-bold">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.fill }} />
                    <span className="text-[var(--text-main)] font-black">{COMPANIES_CONFIG[dep]?.name}</span>
                  </div>
                  <span className="font-black text-sm" style={{ color: item.fill }}>
                    {isQtd ? `${val} notas` : `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  if (error === "503") {
    return <DatabaseErrorAlert message="O servidor SQL Server da Distribuidora Estrela está temporariamente inalcançável para o cálculo das notas por CNPJ. Verifique sua conexão VPN." />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 lg:p-8 rounded-3xl shadow-[var(--shadow-card)]">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-600/20 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Gestão Multi-Empresas
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Dados Reais Conectados
            </span>
          </div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Faturamento e Limites por CNPJ</h1>
          <p className="text-sm font-medium text-[var(--text-muted)] mt-1">
            Acompanhamento ao vivo das emissões de NFe autorizadas no mês de <span className="font-bold text-[var(--text-main)] capitalize">{data?.mesAtual || "Maio"}</span> na base do SQL Server.
          </p>
        </div>

        <button
          onClick={() => {
            fetchData();
            fetchHistory(historyPeriod);
          }}
          disabled={loading || historyLoading}
          className="self-start md:self-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${(loading || historyLoading) ? "animate-spin" : ""}`} />
          Atualizar Dados
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-300 text-sm font-bold flex items-center gap-2 shadow-sm animate-bounce-once">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Consolidados Grupo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 lg:p-8 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <DollarSign className="w-32 h-32" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-blue-200 block mb-1">Faturamento Total do Grupo (Mês Atual)</span>
            <h2 className="text-4xl font-black mb-4">
              R$ {data ? data.faturamentoTotalGrupo.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00"}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-100 bg-black/20 backdrop-blur-md px-4 py-2.5 rounded-2xl w-fit">
            <TrendingUp className="w-4 h-4 text-emerald-300" />
            <span>Soma consolidada dos 5 CNPJs ativos da Estrela</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-6 lg:p-8 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Layers className="w-32 h-32" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-200 block mb-1">Fôlego Consolidado Disponível (Margem Livre Total)</span>
            <h2 className="text-4xl font-black mb-4">
              R$ {data ? data.folegoTotalGrupo.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00"}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-100 bg-black/20 backdrop-blur-md px-4 py-2.5 rounded-2xl w-fit">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Capacidade total restante para emissão antes do teto mensal</span>
          </div>
        </div>
      </div>

      {/* NOVO: Gráfico Histórico Comparativo de Faturamento */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 lg:p-8 shadow-[var(--shadow-card)] space-y-6 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-blue-600" /> Histórico Comparativo Mensal por CNPJ
            </h2>
            <p className="text-sm font-medium text-[var(--text-muted)] mt-1">
              Acompanhamento da evolução de receita e volume de notas de cada empresa lado a lado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Toggle Métrica */}
            <div className="flex items-center bg-black/5 dark:bg-[#161616] p-1 rounded-2xl border border-[var(--border-subtle)] shadow-inner">
              <button
                onClick={() => setHistoryMetric("fat")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  historyMetric === "fat" ? "bg-blue-600 text-white shadow-md shadow-blue-500/25" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                <DollarSign className="w-4 h-4" /> Valores (R$)
              </button>
              <button
                onClick={() => setHistoryMetric("qtd")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  historyMetric === "qtd" ? "bg-blue-600 text-white shadow-md shadow-blue-500/25" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                <Sliders className="w-4 h-4" /> Volume (Notas)
              </button>
            </div>

            {/* Filtro de Período */}
            <div className="flex items-center bg-black/5 dark:bg-[#161616] p-1 rounded-2xl border border-[var(--border-subtle)] shadow-inner">
              {[
                { label: "6 Meses", value: "6m" },
                { label: "12 Meses", value: "12m" },
                { label: "Ano 2026", value: "2026" },
                { label: "Ano 2025", value: "2025" },
                { label: "Ano 2024", value: "2024" },
                { label: "Ano 2023", value: "2023" },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => setHistoryPeriod(p.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    historyPeriod === p.value ? "bg-blue-600 text-white shadow-md shadow-blue-500/25" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Legenda Interativa Personalizada (Clique para isolar/ocultar) */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <span className="text-xs font-black uppercase text-[var(--text-muted)] mr-2">Filtro Rápido (Clique para Ocultar/Exibir):</span>
          {Object.keys(COMPANIES_CONFIG).map((k) => {
            const dep = Number(k);
            const info = COMPANIES_CONFIG[dep];
            const isActive = activeCompanies[dep];
            return (
              <button
                key={dep}
                onClick={() => toggleCompany(dep)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 border shadow-sm ${
                  isActive
                    ? "bg-white dark:bg-[#1a1a1a] text-[var(--text-main)] border-[var(--border-subtle)] hover:scale-105"
                    : "bg-black/5 dark:bg-white/5 text-[var(--text-muted)] border-transparent opacity-40 line-through hover:opacity-70"
                }`}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: info.color }} />
                <span>{info.name}</span>
                {isActive ? <Eye className="w-3.5 h-3.5 ml-1 text-blue-500" /> : <EyeOff className="w-3.5 h-3.5 ml-1" />}
              </button>
            );
          })}
        </div>

        {/* Gráfico Recharts */}
        <div className="h-[420px] w-full pt-4">
          {historyLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="text-sm font-bold text-[var(--text-muted)]">Carregando série histórica do SQL Server...</span>
            </div>
          ) : historyData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm font-bold text-[var(--text-muted)]">
              Nenhum registro encontrado para o período selecionado.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#e2e8f0" : "#222"} vertical={false} />
                <XAxis dataKey="mesAno" stroke={theme === "light" ? "#64748b" : "#777"} fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} />
                <YAxis
                  stroke={theme === "light" ? "#64748b" : "#777"}
                  fontSize={11}
                  fontWeight="bold"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (historyMetric === "qtd" ? `${val}` : `R$ ${Math.round(val / 1000)}k`)}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: theme === "light" ? "rgba(0,0,0,0.04)" : "rgba(255, 255, 255, 0.03)" }} />
                {Object.keys(COMPANIES_CONFIG).map((k) => {
                  const dep = Number(k);
                  if (!activeCompanies[dep]) return null;
                  const dataKey = `dep_${dep}_${historyMetric}`;
                  return (
                    <Bar
                      key={dep}
                      dataKey={dataKey}
                      name={COMPANIES_CONFIG[dep].name}
                      fill={COMPANIES_CONFIG[dep].color}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Cards por Empresa/CNPJ */}
      <div className="space-y-6">
        <h2 className="text-xl font-black text-[var(--text-main)] flex items-center gap-2 pl-2">
          <Building2 className="w-5 h-5 text-blue-600" /> Limites e Monitoramento por CNPJ Emissor
        </h2>

        {loading && !data && (
          <div className="flex flex-col items-center justify-center p-12 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <span className="text-sm font-bold text-[var(--text-muted)]">Carregando transações do SQL Server por depósito...</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {data?.empresas.map((emp) => {
            const isWarning = emp.percentualAtingido >= 80 && emp.percentualAtingido < 100;
            const isCritical = emp.percentualAtingido >= 100;

            let barColor = "bg-emerald-500 shadow-emerald-500/30";
            if (isWarning) barColor = "bg-amber-500 shadow-amber-500/30";
            if (isCritical) barColor = "bg-red-500 shadow-red-500/30";

            return (
              <div
                key={emp.deposito}
                className={`bg-[var(--bg-card)] border ${
                  isCritical ? "border-red-500/50 dark:border-red-500/40 shadow-red-500/10" : "border-[var(--border-subtle)] hover:border-blue-500/30"
                } rounded-3xl p-6 lg:p-8 shadow-[var(--shadow-card)] transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6`}
              >
                {/* Info Empresa */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2.5">
                    <span className="bg-black/5 dark:bg-white/5 border border-[var(--border-subtle)] px-3 py-1 rounded-xl text-xs font-black text-[var(--text-main)]">
                      Depósito {emp.deposito}
                    </span>
                    <span className="text-xs font-bold text-[var(--text-muted)]">{emp.cnpj}</span>
                    {isCritical && (
                      <span className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> Teto Excedido!
                      </span>
                    )}
                    {isWarning && (
                      <span className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Próximo ao Limite
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-black text-[var(--text-main)] truncate mb-4">{emp.nome}</h3>

                  {/* Faturamento e Metas Comparativo */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-black/5 dark:bg-[#161616] p-4 rounded-2xl border border-[var(--border-subtle)]">
                    <div>
                      <span className="text-[11px] uppercase font-bold text-[var(--text-muted)] block mb-0.5">Faturamento (Mês)</span>
                      <span className="text-lg font-black text-[var(--text-main)]">
                        R$ {emp.faturamentoMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] block mt-0.5">{emp.qtdNotas} notas faturadas</span>
                    </div>

                    <div>
                      <span className="text-[11px] uppercase font-bold text-[var(--text-muted)] block mb-0.5">Fôlego para Faturar</span>
                      <span className={`text-lg font-black ${isCritical ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                        R$ {emp.folegoRestante.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] block mt-0.5">Margem livre disponível</span>
                    </div>

                    <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-[var(--border-subtle)] md:pl-4 pt-3 md:pt-0">
                      <span className="text-[11px] uppercase font-bold text-[var(--text-muted)] block mb-0.5">Progresso do Teto</span>
                      <span className={`text-lg font-black ${isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {emp.percentualAtingido}%
                      </span>
                      <span className="text-xs text-[var(--text-muted)] block mt-0.5">
                        Teto: R$ {emp.limiteMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso Dinâmica */}
                  <div className="mt-4 space-y-1.5">
                    <div className="h-3.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-[var(--border-subtle)] p-0.5 shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-500 shadow-md ${barColor}`}
                        style={{ width: `${Math.min(emp.percentualAtingido, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Input de Edição do Limite */}
                <div className="flex flex-col gap-3 bg-black/5 dark:bg-white/5 border border-[var(--border-subtle)] p-5 rounded-2xl lg:w-72 shrink-0">
                  <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" /> Ajustar Teto Mensal
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block mb-1">Novo Valor (R$):</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-muted)]">R$</span>
                      <input
                        type="number"
                        step="1000"
                        value={editingLimit[emp.deposito] ?? ""}
                        onChange={(e) => setEditingLimit({ ...editingLimit, [emp.deposito]: e.target.value })}
                        className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl text-sm font-black text-[var(--text-main)] focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                        placeholder="Ex: 2500000"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveLimit(emp.deposito)}
                    disabled={savingLimit[emp.deposito]}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                  >
                    {savingLimit[emp.deposito] ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Salvar Teto
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
