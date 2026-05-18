"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Users, Trophy, Loader2, Sparkles, Calendar, FileText, Box, ExternalLink, X, CreditCard, ShoppingBag, Tag, UserCheck, Briefcase } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { DatabaseErrorAlert } from "@/components/DatabaseErrorAlert";

interface RankingVendedor {
  area: string;
  nomeVendedor: string;
  qtdPedidos: number;
  faturamento: number;
  ticketMedio: number;
  lucro: number;
}

interface VendorDetailsPayload {
  vendedor: {
    area: string;
    nomeVendedor: string;
    faturamentoTotal: number;
    qtdPedidos: number;
    ticketMedio: number;
    lucroTotal: number;
    totalClientesAtendidos: number;
    ultimaVenda: string | null;
  };
  pedidos: {
    pedido: number;
    data: string;
    valorTotal: number;
    cgc: string;
    nomeCliente: string;
    condPag: string;
    prazo: string;
  }[];
  topProdutos: {
    codProduto: number;
    nomeProduto: string;
    familia: string;
    quantidade: number;
    valorTotal: number;
    precoMedio: number;
  }[];
}

interface OrderDetailsPayload {
  pedido: {
    pedido: number;
    data: string;
    situacao: number;
    valorTotal: number;
    vendedor: string;
    cgc: string;
    nomeCliente: string;
    condPag: string;
    prazo: string;
  };
  itens: {
    item: number;
    codProduto: number;
    nomeProduto: string;
    familia: string;
    quantidade: number;
    precoUnitario: number;
    valorTotal: number;
  }[];
}

export default function VendorsPage() {
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<RankingVendedor[]>([]);
  const [periodo, setPeriodo] = useState("30");
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  // Modal / Drawer state: Ficha do Vendedor / Rota
  const [selectedVendor, setSelectedVendor] = useState<{ area: string; nomeVendedor: string } | null>(null);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorDetails, setVendorDetails] = useState<VendorDetailsPayload | null>(null);
  const [activeTab, setActiveTab] = useState<"pedidos" | "produtos">("pedidos");

  // Sub-Modal state: Detalhes do Pedido Completo
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetailsPayload | null>(null);

  // Fetch ranking
  useEffect(() => {
    async function fetchVendors() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<RankingVendedor[]>(`/dashboard/ranking-vendedores?periodo=${periodo}`);
        setRanking(res.data);
      } catch (err) {
        console.error(err);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setError((err as any).response?.data?.message || "O servidor SQL Server está temporariamente inalcançável. Verifique sua conexão com a VPN ou rede autorizada da Distribuidora Estrela.");
      } finally {
        setLoading(false);
      }
    }
    fetchVendors();
  }, [periodo]);

  // Fetch Vendor Details
  useEffect(() => {
    if (!selectedVendor) {
      setVendorDetails(null);
      return;
    }
    const currentVendor = selectedVendor;
    async function fetchVendorInfo() {
      setVendorLoading(true);
      try {
        const res = await api.get<VendorDetailsPayload>(`/dashboard/vendedores/${currentVendor.area}?periodo=${periodo}`);
        setVendorDetails(res.data);
      } catch (err) {
        console.error(err);
        alert("Erro ao buscar detalhes e pedidos do vendedor no SQL Server.");
      } finally {
        setVendorLoading(false);
      }
    }
    fetchVendorInfo();
  }, [selectedVendor, periodo]);

  // Fetch Order Details
  useEffect(() => {
    if (!selectedOrderId) {
      setOrderDetails(null);
      return;
    }
    async function fetchOrder() {
      setOrderLoading(true);
      try {
        const res = await api.get<OrderDetailsPayload>(`/customers/orders/${selectedOrderId}`);
        setOrderDetails(res.data);
      } catch (err) {
        console.error(err);
        alert("Erro ao buscar os itens e detalhes deste pedido no SQL Server.");
      } finally {
        setOrderLoading(false);
      }
    }
    fetchOrder();
  }, [selectedOrderId]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
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
                    <Bar
                      dataKey="faturamento"
                      fill="#f59e0b"
                      radius={[0, 8, 8, 0]}
                      barSize={26}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onClick={(data: any) => {
                        const area = data?.area || data?.payload?.area;
                        const nomeVendedor = data?.nomeVendedor || data?.payload?.nomeVendedor;
                        if (area && nomeVendedor) {
                          setSelectedVendor({ area, nomeVendedor });
                        }
                      }}
                      className="cursor-pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-[var(--shadow-card)] transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-[var(--text-main)]">Detalhamento Operacional da Equipe</h3>
              <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                💡 Clique em qualquer vendedor para abrir a Ficha Completa e Lista de Pedidos
              </span>
            </div>
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
                    <tr
                      key={v.nomeVendedor}
                      onClick={() => setSelectedVendor({ area: v.area, nomeVendedor: v.nomeVendedor })}
                      className="hover:bg-amber-500/5 dark:hover:bg-amber-500/10 cursor-pointer transition-colors group"
                    >
                      <td className="py-4 pl-2 font-black text-amber-600 dark:text-amber-500">#{index + 1}</td>
                      <td className="py-4 font-black text-[var(--text-main)] flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs font-black text-amber-600 dark:text-amber-400 shadow-sm group-hover:scale-110 transition-transform">
                          {v.nomeVendedor.substring(0, 2)}
                        </div>
                        <span className="group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                          {v.nomeVendedor}
                          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
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

          {/* Janela Widescreen: Ficha do Vendedor / Rota */}
          {selectedVendor && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-300">
              <div className="w-full max-w-[96vw] h-[95vh] bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-3xl shadow-2xl flex flex-col overflow-hidden transform transition-all duration-300 animate-in zoom-in-95">
                {/* Modal Header */}
                <div className="p-6 lg:p-8 bg-gradient-to-r from-amber-600/10 via-orange-600/10 to-transparent border-b border-[var(--border-subtle)] flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="p-2.5 rounded-2xl bg-amber-600 text-white shadow-md shadow-amber-500/20">
                        <Users className="w-6 h-6" />
                      </span>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl lg:text-3xl font-black text-[var(--text-main)] tracking-tight">
                            {selectedVendor.nomeVendedor}
                          </h3>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm">
                            Rota {selectedVendor.area}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-[var(--text-muted)] mt-0.5">
                          Desempenho Comercial & Relação de Pedidos Tirados nos últimos {periodo} dias
                        </p>
                      </div>
                    </div>

                    {vendorDetails && (
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-[var(--text-muted)] mt-4">
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                          Clientes Atendidos no Período: <strong className="text-[var(--text-main)] font-black">{vendorDetails.vendedor.totalClientesAtendidos} CNPJs</strong>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                          Última Venda: <strong className="text-[var(--text-main)] font-black">{formatDate(vendorDetails.vendedor.ultimaVenda)}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedVendor(null)}
                    className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:scale-105 active:scale-95 transition-all shadow-sm"
                    title="Fechar ficha"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
                  {vendorLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-3">
                      <Loader2 className="w-10 h-10 text-amber-600 dark:text-amber-500 animate-spin" />
                      <p className="text-sm font-bold text-[var(--text-muted)]">
                        Carregando histórico de pedidos e produtos faturados deste vendedor...
                      </p>
                    </div>
                  ) : vendorDetails ? (
                    <>
                      {/* KPI Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-amber-600/10 to-orange-600/10 border border-amber-500/20 rounded-3xl p-6 shadow-sm">
                          <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Faturamento Total ({periodo}d)
                          </span>
                          <p className="text-3xl font-black text-[var(--text-main)] tracking-tight mt-1">
                            {formatCurrency(vendorDetails.vendedor.faturamentoTotal)}
                          </p>
                        </div>

                        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-sm">
                          <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                            Pedidos Tirados
                          </span>
                          <p className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight mt-1">
                            {vendorDetails.vendedor.qtdPedidos}
                          </p>
                        </div>

                        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-sm">
                          <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                            Ticket Médio por Pedido
                          </span>
                          <p className="text-3xl font-black text-[var(--text-main)] tracking-tight mt-1">
                            {formatCurrency(vendorDetails.vendedor.ticketMedio)}
                          </p>
                        </div>

                        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-sm">
                          <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                            Lucro Bruto Gerado
                          </span>
                          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-1">
                            {formatCurrency(vendorDetails.vendedor.lucroTotal)}
                          </p>
                        </div>
                      </div>

                      {/* Tabs Navigation */}
                      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4 flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setActiveTab("pedidos")}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                              activeTab === "pedidos"
                                ? "bg-amber-600 text-white shadow-lg shadow-amber-500/25"
                                : "bg-black/5 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                            }`}
                          >
                            <FileText className="w-4 h-4" /> Relação de Pedidos ({vendorDetails.pedidos.length})
                          </button>
                          <button
                            onClick={() => setActiveTab("produtos")}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                              activeTab === "produtos"
                                ? "bg-amber-600 text-white shadow-lg shadow-amber-500/25"
                                : "bg-black/5 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                            }`}
                          >
                            <Box className="w-4 h-4" /> Top Produtos Vendidos ({vendorDetails.topProdutos.length})
                          </button>
                        </div>

                        {activeTab === "pedidos" && (
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                            💡 Clique em qualquer pedido para abrir a Ficha e Itens Completos
                          </span>
                        )}
                      </div>

                      {/* Tab Content: Pedidos */}
                      {activeTab === "pedidos" && (
                        <div className="space-y-4">
                          {vendorDetails.pedidos.length === 0 ? (
                            <div className="text-center py-12 text-sm font-bold text-[var(--text-muted)] bg-black/5 dark:bg-white/5 rounded-3xl">
                              Nenhum pedido faturado para este vendedor no período selecionado.
                            </div>
                          ) : (
                            <div className="border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-sm">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-black/5 dark:bg-white/5 border-b border-[var(--border-subtle)]">
                                    <th className="py-3 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                                      Nº Pedido
                                    </th>
                                    <th className="py-3 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                                      Data do Pedido
                                    </th>
                                    <th className="py-3 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                                      Cliente / Razão Social
                                    </th>
                                    <th className="py-3 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] text-center">
                                      Condição de Pagamento
                                    </th>
                                    <th className="py-3 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] text-right">
                                      Valor Total
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-subtle)] text-sm font-semibold">
                                  {vendorDetails.pedidos.map((p) => (
                                    <tr
                                      key={p.pedido}
                                      onClick={() => setSelectedOrderId(p.pedido)}
                                      className="hover:bg-amber-500/5 dark:hover:bg-amber-500/10 cursor-pointer transition-colors group"
                                    >
                                      <td className="py-3.5 px-6 font-black text-[var(--text-main)] flex items-center gap-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                        #{p.pedido}
                                        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </td>
                                      <td className="py-3.5 px-6 font-bold text-[var(--text-main)]">
                                        {formatDate(p.data)}
                                      </td>
                                      <td className="py-3.5 px-6 font-black text-[var(--text-main)] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                        <div>{p.nomeCliente}</div>
                                        <div className="text-xs font-bold text-[var(--text-muted)] font-normal">CNPJ/CPF: {p.cgc}</div>
                                      </td>
                                      <td className="py-3.5 px-6 font-bold text-[var(--text-muted)] text-center">
                                        <span className="px-2.5 py-1 rounded-full text-xs bg-black/5 dark:bg-white/5 border border-[var(--border-subtle)]">
                                          {p.condPag} {p.prazo !== "0" && `(${p.prazo}d)`}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-6 font-black text-amber-600 dark:text-amber-400 text-right tracking-tight text-base">
                                        {formatCurrency(p.valorTotal)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab Content: Produtos */}
                      {activeTab === "produtos" && (
                        <div className="space-y-4">
                          {vendorDetails.topProdutos.length === 0 ? (
                            <div className="text-center py-12 text-sm font-bold text-[var(--text-muted)] bg-black/5 dark:bg-white/5 rounded-3xl">
                              Nenhum produto faturado por este vendedor no período selecionado.
                            </div>
                          ) : (
                            <div className="border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-sm">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-black/5 dark:bg-white/5 border-b border-[var(--border-subtle)]">
                                    <th className="py-3 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                                      Cód
                                    </th>
                                    <th className="py-3 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                                      Produto
                                    </th>
                                    <th className="py-3 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                                      Família
                                    </th>
                                    <th className="py-3 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] text-center">
                                      Quantidade Vendida
                                    </th>
                                    <th className="py-3 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] text-right">
                                      Preço Médio
                                    </th>
                                    <th className="py-3 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] text-right">
                                      Volume Total Bruto
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-subtle)] text-sm font-semibold">
                                  {vendorDetails.topProdutos.map((prod) => (
                                    <tr key={prod.codProduto} className="hover:bg-amber-500/5 transition-colors">
                                      <td className="py-3.5 px-6 font-bold text-[var(--text-muted)]">
                                        {prod.codProduto}
                                      </td>
                                      <td className="py-3.5 px-6 font-black text-[var(--text-main)]">
                                        {prod.nomeProduto}
                                      </td>
                                      <td className="py-3.5 px-6 font-bold text-[var(--text-muted)]">
                                        <span className="px-2.5 py-1 rounded-full text-xs bg-black/5 dark:bg-white/5 border border-[var(--border-subtle)]">
                                          {prod.familia}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-6 font-black text-[var(--text-main)] text-center text-base">
                                        {prod.quantidade} UN
                                      </td>
                                      <td className="py-3.5 px-6 font-bold text-[var(--text-muted)] text-right">
                                        {formatCurrency(prod.precoMedio)}
                                      </td>
                                      <td className="py-3.5 px-6 font-black text-emerald-600 dark:text-emerald-400 text-right tracking-tight text-base">
                                        {formatCurrency(prod.valorTotal)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* Sub-Janela Modal: Detalhes do Pedido Completo */}
          {selectedOrderId && (
            <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-300">
              <div className="w-full max-w-[85vw] max-h-[92vh] bg-[var(--bg-root)] border border-[var(--border-subtle)] rounded-3xl shadow-2xl flex flex-col overflow-hidden transform transition-all duration-300 animate-in zoom-in-95">
                {/* Pedido Header */}
                <div className="p-6 lg:p-8 bg-gradient-to-r from-blue-600/15 via-indigo-600/15 to-transparent border-b border-[var(--border-subtle)] flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="p-3 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/25">
                        <ShoppingBag className="w-6 h-6" />
                      </span>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl lg:text-3xl font-black text-[var(--text-main)] tracking-tight">
                            Pedido #{selectedOrderId}
                          </h3>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                            Faturado
                          </span>
                        </div>
                        <p className="text-base font-black text-[var(--text-main)] mt-1">
                          {orderDetails?.pedido?.nomeCliente || "Carregando cliente..."}
                        </p>
                      </div>
                    </div>

                    {orderDetails && (
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-[var(--text-muted)] pt-2">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          Emissão: {formatDate(orderDetails.pedido.data)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-indigo-500" />
                          Vendedor: <strong className="text-[var(--text-main)]">{orderDetails.pedido.vendedor}</strong>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-purple-500" />
                          Condição de Pagamento: <strong className="text-[var(--text-main)]">{orderDetails.pedido.condPag}</strong> (Prazo: {orderDetails.pedido.prazo})
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedOrderId(null)}
                    className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:scale-105 active:scale-95 transition-all shadow-sm"
                    title="Fechar pedido"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Pedido Body */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
                  {orderLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-3">
                      <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-500 animate-spin" />
                      <p className="text-sm font-bold text-[var(--text-muted)]">
                        Carregando os itens faturados no SQL Server...
                      </p>
                    </div>
                  ) : orderDetails ? (
                    <>
                      {/* Resumo Financeiro */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/20 rounded-3xl p-5 shadow-sm">
                          <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            Valor Total Faturado
                          </span>
                          <p className="text-3xl font-black text-[var(--text-main)] tracking-tight mt-1">
                            {formatCurrency(orderDetails.pedido.valorTotal)}
                          </p>
                        </div>

                        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-5 shadow-sm">
                          <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                            Itens no Pedido
                          </span>
                          <p className="text-3xl font-black text-[var(--text-main)] tracking-tight mt-1">
                            {orderDetails.itens.length} {orderDetails.itens.length === 1 ? "produto" : "produtos"}
                          </p>
                        </div>

                        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-5 shadow-sm">
                          <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                            Volume Total de Peças
                          </span>
                          <p className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight mt-1">
                            {orderDetails.itens.reduce((acc, curr) => acc + curr.quantidade, 0)} UN
                          </p>
                        </div>
                      </div>

                      {/* Tabela de Itens */}
                      <div className="border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-sm">
                        <div className="p-4 bg-black/5 dark:bg-white/5 border-b border-[var(--border-subtle)] flex items-center justify-between">
                          <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-blue-500" /> Relação de Itens Vendidos
                          </span>
                        </div>
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-black/5 dark:bg-white/5 border-b border-[var(--border-subtle)] text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                              <th className="py-3 px-6 w-12 text-center">Item</th>
                              <th className="py-3 px-6 w-24">Código</th>
                              <th className="py-3 px-6">Descrição do Produto</th>
                              <th className="py-3 px-6">Família</th>
                              <th className="py-3 px-6 text-center w-24">Quantidade</th>
                              <th className="py-3 px-6 text-right w-36">Preço Unitário</th>
                              <th className="py-3 px-6 text-right w-36">Valor Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border-subtle)] text-sm font-semibold">
                            {orderDetails.itens.map((it) => (
                              <tr key={it.item} className="hover:bg-blue-500/5 transition-colors">
                                <td className="py-3.5 px-6 font-bold text-[var(--text-muted)] text-center">
                                  {it.item}
                                </td>
                                <td className="py-3.5 px-6 font-bold text-[var(--text-muted)]">
                                  {it.codProduto}
                                </td>
                                <td className="py-3.5 px-6 font-black text-[var(--text-main)]">
                                  {it.nomeProduto}
                                </td>
                                <td className="py-3.5 px-6 font-bold text-[var(--text-muted)]">
                                  <span className="px-2.5 py-1 rounded-full text-xs bg-black/5 dark:bg-white/5 border border-[var(--border-subtle)]">
                                    {it.familia}
                                  </span>
                                </td>
                                <td className="py-3.5 px-6 font-black text-[var(--text-main)] text-center">
                                  {it.quantidade}
                                </td>
                                <td className="py-3.5 px-6 font-bold text-[var(--text-main)] text-right">
                                  {formatCurrency(it.precoUnitario)}
                                </td>
                                <td className="py-3.5 px-6 font-black text-blue-600 dark:text-blue-400 tracking-tight text-right">
                                  {formatCurrency(it.valorTotal)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

