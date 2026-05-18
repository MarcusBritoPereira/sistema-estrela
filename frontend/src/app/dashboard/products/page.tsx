"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Box, Award, Loader2, Sparkles, Filter } from "lucide-react";
import { DatabaseErrorAlert } from "@/components/DatabaseErrorAlert";

interface ProdutoMaisVendido {
  codProduto: number;
  nomeProduto: string;
  familia: string;
  qtdVendida: number;
  faturamento: number;
  precoMedio: number;
}

export default function ProductsPage() {
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<ProdutoMaisVendido[]>([]);
  const [periodo, setPeriodo] = useState("30");
  const [top, setTop] = useState("20");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<ProdutoMaisVendido[]>(
          `/dashboard/produtos-mais-vendidos?periodo=${periodo}&top=${top}`
        );
        setProdutos(res.data);
      } catch (err) {
        console.error(err);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setError((err as any).response?.data?.message || "O servidor SQL Server está temporariamente inalcançável. Verifique sua conexão com a VPN ou rede autorizada da Distribuidora Estrela.");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [periodo, top]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  return (
    <div className="space-y-8 pb-12 transition-colors duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-blue-600 dark:text-blue-400 font-bold">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> Curva A B C
            </span>
            <span className="text-[var(--text-muted)] font-semibold">Catálogo Transacional</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-[var(--text-main)] flex items-center gap-2.5">
            <Box className="h-7 w-7 text-blue-600 dark:text-blue-500" />
            Análise e Giro de Produtos
          </h2>
          <p className="text-sm font-medium text-[var(--text-muted)] mt-1">Distribuidora Estrela — Relação dos itens com maior faturamento e volume de saída.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-black/5 dark:bg-[#161616] border border-[var(--border-subtle)] rounded-2xl p-1.5 shadow-sm">
            <span className="text-xs text-[var(--text-muted)] pl-2 font-black flex items-center gap-1"><Filter className="w-3 h-3"/> Top:</span>
            {["10", "20", "50"].map((t) => (
              <button
                key={t}
                onClick={() => setTop(t)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${top === t ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-black/5 dark:bg-[#161616] border border-[var(--border-subtle)] rounded-2xl p-1.5 shadow-sm">
            {["7", "30", "90"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${periodo === p ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
              >
                {p} Dias
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <DatabaseErrorAlert message={error} />
      ) : loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl shadow-xl backdrop-blur-md">
          <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-500 animate-spin" />
          <p className="text-sm font-bold text-[var(--text-muted)] animate-pulse">Lendo Itens e tabela de Produtos no SQL Server...</p>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-[var(--shadow-card)] transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-[var(--text-main)] flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-500 font-bold" />
                Catálogo Classificado por Faturamento Bruto (Top {top})
              </h3>
              <p className="text-xs font-medium text-[var(--text-muted)] mt-1">Giro total calculado nos últimos {periodo} dias</p>
            </div>
            <span className="text-xs bg-blue-500/10 border border-blue-500/20 px-3.5 py-1.5 rounded-full text-blue-600 dark:text-blue-400 font-black">SQL Real-time</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-xs uppercase font-black text-[var(--text-muted)] tracking-wider">
                  <th className="pb-3 pl-2">Posição</th>
                  <th className="pb-3">Cód</th>
                  <th className="pb-3">Descrição do Produto</th>
                  <th className="pb-3">Linha / Família</th>
                  <th className="pb-3 text-right">Qtd Vendida</th>
                  <th className="pb-3 text-right">Preço Médio</th>
                  <th className="pb-3 text-right pr-2">Faturamento Bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-sm font-semibold">
                {produtos.map((prod, index) => (
                  <tr key={prod.codProduto} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-4 pl-2 font-black text-[var(--text-muted)]">#{index + 1}</td>
                    <td className="py-4 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{prod.codProduto}</td>
                    <td className="py-4 font-black text-[var(--text-main)] max-w-sm truncate">{prod.nomeProduto}</td>
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
      )}
    </div>
  );
}
