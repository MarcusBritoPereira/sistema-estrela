"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Users, Trophy, Loader2, Sparkles } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { DatabaseErrorAlert } from "@/components/DatabaseErrorAlert";

interface RankingVendedor {
  nomeVendedor: string;
  qtdPedidos: number;
  faturamento: number;
  ticketMedio: number;
  lucro: number;
}

export default function VendorsPage() {
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<RankingVendedor[]>([]);
  const [periodo, setPeriodo] = useState("30");
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    async function fetchVendors() {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get<RankingVendedor[]>(`http://localhost:3000/dashboard/ranking-vendedores?periodo=${periodo}`);
        setRanking(res.data);
      } catch (err) {
        console.error(err);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setError((err as any).response?.data?.message || "O servidor SQL Server real (192.168.3.64) está inalcançável. Conecte-se à VPN da Distribuidora Estrela.");
      } finally {
        setLoading(false);
      }
    }
    fetchVendors();
  }, [periodo]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  return (
    <div className="space-y-8 pb-12 transition-colors duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-amber-600 dark:text-amber-400 font-bold">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> Desempenho Comercial
            </span>
            <span className="text-[var(--text-muted)] font-semibold">Equipe de Vendas</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-[var(--text-main)] flex items-center gap-2.5">
            <Users className="h-7 w-7 text-amber-600 dark:text-amber-500" />
            Ranking e Análise de Vendedores
          </h2>
          <p className="text-sm font-medium text-[var(--text-muted)] mt-1">Distribuidora Estrela — Desempenho de vendas, faturamento faturado e ticket médio por operador.</p>
        </div>
        <div className="flex items-center gap-2 bg-black/5 dark:bg-[#161616] border border-[var(--border-subtle)] rounded-2xl p-1.5 shadow-sm">
          {["7", "30", "90"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${periodo === p ? "bg-amber-600 text-white shadow-lg shadow-amber-500/25 scale-105" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
            >
              {p} Dias
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <DatabaseErrorAlert message={error} />
      ) : loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl shadow-xl backdrop-blur-md">
          <Loader2 className="w-10 h-10 text-amber-600 dark:text-amber-500 animate-spin" />
          <p className="text-sm font-bold text-[var(--text-muted)] animate-pulse">Inspecionando faturamento de operadores no SQL Server...</p>
        </div>
      ) : (
        <>
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-[var(--shadow-card)] transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-[var(--text-main)] flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500 font-bold" />
                  Top Vendedores por Pedidos Tirados
                </h3>
                <p className="text-xs font-medium text-[var(--text-muted)] mt-1">Classificação da equipe comercial com base nos últimos {periodo} dias</p>
              </div>
            </div>
            <div className="h-[400px] w-full">
              {ranking.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm font-bold text-[var(--text-muted)]">Nenhum registro de vendedor faturado encontrado</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ranking} layout="vertical" margin={{ top: 0, right: 10, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#e2e8f0" : "#222"} horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="nomeVendedor" type="category" axisLine={false} tickLine={false} stroke={theme === "light" ? "#0f172a" : "#ccc"} fontSize={12} width={100} fontWeight="bold" />
                    <Tooltip
                      cursor={{ fill: theme === "light" ? "rgba(0,0,0,0.04)" : "rgba(255, 255, 255, 0.03)" }}
                      contentStyle={{ backgroundColor: theme === "light" ? "#ffffff" : "#181818", borderColor: theme === "light" ? "#cbd5e1" : "#333", borderRadius: "16px", padding: "12px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)" }}
                      itemStyle={{ color: theme === "light" ? "#0f172a" : "#fff", fontSize: "13px", fontWeight: "bold" }}
                      labelStyle={{ color: theme === "light" ? "#64748b" : "#aaa", fontSize: "11px", marginBottom: "4px", fontWeight: "bold" }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(val: any, name: any, props: any) => [`${props.payload.qtdPedidos} pedidos (${formatCurrency(Number(val))})`, "Desempenho"]}
                    />
                    <Bar dataKey="faturamento" fill="#f59e0b" radius={[0, 8, 8, 0]} barSize={26} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-[var(--shadow-card)] transition-colors duration-300">
            <h3 className="text-lg font-black text-[var(--text-main)] mb-6">Detalhamento Operacional da Equipe</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-xs uppercase font-black text-[var(--text-muted)] tracking-wider">
                    <th className="pb-3 pl-2">Posição</th>
                    <th className="pb-3">Vendedor / RCA</th>
                    <th className="pb-3 text-right">Pedidos Faturados</th>
                    <th className="pb-3 text-right">Ticket Médio</th>
                    <th className="pb-3 text-right pr-2">Faturamento Bruto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-sm font-semibold">
                  {ranking.map((v, index) => (
                    <tr key={v.nomeVendedor} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 pl-2 font-black text-amber-600 dark:text-amber-500">#{index + 1}</td>
                      <td className="py-4 font-black text-[var(--text-main)] flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs font-black text-amber-600 dark:text-amber-400 shadow-sm">
                          {v.nomeVendedor.substring(0, 2)}
                        </div>
                        {v.nomeVendedor}
                      </td>
                      <td className="py-4 text-right font-black text-blue-600 dark:text-blue-400">{v.qtdPedidos}</td>
                      <td className="py-4 text-right font-bold text-[var(--text-muted)]">{formatCurrency(v.ticketMedio)}</td>
                      <td className="py-4 text-right pr-2 font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(v.faturamento)}</td>
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
