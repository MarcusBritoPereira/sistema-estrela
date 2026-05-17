"use client";

import { useEffect, useState } from "react";
import { Building2, RefreshCw, AlertTriangle, CheckCircle2, TrendingUp, ShieldAlert, DollarSign, Edit3, Save, Layers } from "lucide-react";
import { DatabaseErrorAlert } from "@/components/DatabaseErrorAlert";

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

export default function BillingPage() {
  const [data, setData] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingLimit, setEditingLimit] = useState<{ [key: number]: string }>({});
  const [savingLimit, setSavingLimit] = useState<{ [key: number]: boolean }>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

      // Preencher o state de input de edição com os limites atuais
      const limitsMap: { [key: number]: string } = {};
      json.empresas.forEach((emp: EmpresaCNPJ) => {
        limitsMap[emp.deposito] = String(emp.limiteMensal);
      });
      setEditingLimit(limitsMap);
    } catch (err: any) {
      setError(err.message || "Erro de conexão ao servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      await fetchData(); // Recarregar os dados para atualizar o fôlego e percentuais
    } catch (err: any) {
      alert(err.message || "Falha ao salvar o limite");
    } finally {
      setSavingLimit((prev) => ({ ...prev, [deposito]: false }));
    }
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
          onClick={fetchData}
          disabled={loading}
          className="self-start md:self-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
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
