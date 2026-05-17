"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Briefcase, Search, Loader2, Sparkles, Building2, Calendar, FileText, Box, AlertTriangle, CheckCircle2, XCircle, ArrowUpDown, ExternalLink, X, MapPin, Phone, CreditCard } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { DatabaseErrorAlert } from "@/components/DatabaseErrorAlert";

interface TopCustomer {
  cgc: string;
  nomeCliente: string;
  nomeFantasia: string;
  cidade: string;
  estado: string;
  qtdPedidos: number;
  faturamento: number;
  ticketMedio: number;
  ultimaCompra: string | null;
  status: string;
  diasSemComprar: number;
}

interface CustomerDetails {
  cadastro: {
    idCad: number;
    cgc: string;
    nomeCliente: string;
    nomeFantasia: string;
    endereco: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    telefone: string;
    condPag: string;
    prazo: string;
  };
  kpis: {
    faturamentoTotal: number;
    qtdPedidos: number;
    ticketMedio: number;
    ultimaCompra: string | null;
    diasSemComprar: number;
    status: string;
  };
  pedidos: {
    pedido: number;
    data: string;
    valorTotal: number;
    vendedor: string;
  }[];
  topProdutos: {
    codProduto: number;
    nomeProduto: string;
    quantidade: number;
    valorTotal: number;
    precoMedio: number;
  }[];
}

export default function CustomersPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<TopCustomer[]>([]);
  const [periodo, setPeriodo] = useState("30");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("faturamento");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [error, setError] = useState<string | null>(null);

  // Modal / Drawer state
  const [selectedCgc, setSelectedCgc] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [activeTab, setActiveTab] = useState<"pedidos" | "produtos">("pedidos");


  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Top Customers
  useEffect(() => {
    async function fetchCustomers() {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get<TopCustomer[]>(
          `http://localhost:3000/customers?dias=${periodo}&search=${encodeURIComponent(debouncedSearch)}&sortBy=${sortBy}&sortOrder=${sortOrder}`
        );
        setCustomers(res.data);
      } catch (err) {
        console.error(err);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setError((err as any).response?.data?.message || "O servidor SQL Server real (100.76.189.43) está inalcançável. Conecte-se à VPN da Distribuidora Estrela.");
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, [periodo, debouncedSearch, sortBy, sortOrder]);

  // Fetch Customer Details when a row is clicked
  useEffect(() => {
    if (!selectedCgc) {
      setCustomerDetails(null);
      return;
    }
    async function fetchDetails() {
      setDetailsLoading(true);
      try {
        const res = await axios.get<CustomerDetails>(`http://localhost:3000/customers/${selectedCgc}?dias=${periodo}`);
        setCustomerDetails(res.data);
      } catch (err) {
        console.error(err);
        alert("Erro ao buscar detalhes do cliente no SQL Server.");
      } finally {
        setDetailsLoading(false);
      }
    }
    fetchDetails();
  }, [selectedCgc, periodo]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("pt-BR").format(d);
  };

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === "DESC" ? "ASC" : "DESC");
    } else {
      setSortBy(col);
      setSortOrder("DESC");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Ativo":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
          </span>
        );
      case "Em Risco":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" /> Em Risco
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 shadow-sm">
            <XCircle className="w-3.5 h-3.5" /> Inativo
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-12 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-blue-600 dark:text-blue-400 font-bold">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> Inteligência Executiva
            </span>
            <span className="text-[var(--text-muted)] font-semibold">Carteira Ativa</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-[var(--text-main)] flex items-center gap-2.5">
            <Briefcase className="h-7 w-7 text-blue-600 dark:text-blue-500" />
            Top Clientes & Histórico de Compras
          </h2>
          <p className="text-sm font-medium text-[var(--text-muted)] mt-1">
            Análise de clientes cadastrados, frequência de pedidos, faturamento acumulado e curva de produtos.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Pesquisar por Razão Social ou CNPJ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl text-sm font-semibold placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-sm transition-all"
            />
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1.5 bg-black/5 dark:bg-[#161616] border border-[var(--border-subtle)] rounded-2xl p-1.5 shadow-sm">
            {["7", "30", "60", "90", "120"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  periodo === p
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                {p}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {error ? (
        <DatabaseErrorAlert message={error} />
      ) : loading ? (
        <div className="flex flex-col items-center justify-center h-80 space-y-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl shadow-xl backdrop-blur-md">
          <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-500 animate-spin" />
          <p className="text-sm font-bold text-[var(--text-muted)] animate-pulse">
            Consultando cadastro de clientes e notas faturadas no SQL Server...
          </p>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl overflow-hidden shadow-[var(--shadow-card)] transition-colors duration-300">
          <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--text-muted)]">
              Mostrando os <strong className="text-[var(--text-main)] font-black">{customers.length}</strong> maiores clientes no período
            </span>
            <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
              💡 Clique em qualquer cliente para abrir a Ficha Completa
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-black/5 dark:bg-white/5">
                  <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                    Cliente / Razão Social
                  </th>
                  <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                    Localidade
                  </th>
                  <th
                    onClick={() => handleSort("pedidos")}
                    className="py-4 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-main)] transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Pedidos <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("faturamento")}
                    className="py-4 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-main)] transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Faturamento Total <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                    Ticket Médio
                  </th>
                  <th
                    onClick={() => handleSort("ultimaCompra")}
                    className="py-4 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-main)] transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Última Compra <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-sm font-semibold">
                {customers.map((c) => (
                  <tr
                    key={c.cgc}
                    onClick={() => setSelectedCgc(c.cgc)}
                    className="hover:bg-blue-500/5 dark:hover:bg-blue-500/10 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="font-black text-[var(--text-main)] text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                        {c.nomeCliente}
                        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-xs font-bold text-[var(--text-muted)] mt-0.5">
                        CNPJ/CPF: {c.cgc} {c.nomeFantasia && `• ${c.nomeFantasia}`}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-main)]">
                        <MapPin className="w-4 h-4 text-[var(--text-muted)]" />
                        {c.cidade ? `${c.cidade} / ${c.estado}` : "--"}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-base font-black text-[var(--text-main)]">
                      {c.qtdPedidos}
                    </td>
                    <td className="py-4 px-6 text-base font-black text-blue-600 dark:text-blue-400 tracking-tight">
                      {formatCurrency(c.faturamento)}
                    </td>
                    <td className="py-4 px-6 font-bold text-[var(--text-main)]">
                      {formatCurrency(c.ticketMedio)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-[var(--text-main)]">
                        {formatDate(c.ultimaCompra)}
                      </div>
                      <div className="text-xs font-semibold text-[var(--text-muted)]">
                        {c.ultimaCompra ? `${c.diasSemComprar} dias atrás` : "Nunca comprou"}
                      </div>
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(c.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drawer / Modal: Ficha do Cliente */}
      {selectedCgc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end animate-in fade-in duration-300">
          <div className="w-full max-w-4xl h-full bg-[var(--bg-root)] shadow-2xl flex flex-col overflow-hidden transform transition-transform duration-300 slide-in-from-right border-l border-[var(--border-subtle)]">
            {/* Modal Header */}
            <div className="p-6 lg:p-8 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border-b border-[var(--border-subtle)] flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                    <Building2 className="w-6 h-6" />
                  </span>
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-black text-[var(--text-main)] tracking-tight">
                      {customerDetails?.cadastro?.nomeCliente || `Cliente ${selectedCgc}`}
                    </h3>
                    <p className="text-sm font-bold text-[var(--text-muted)]">
                      CNPJ/CPF: {selectedCgc} {customerDetails?.cadastro?.nomeFantasia && `• Fantasia: ${customerDetails.cadastro.nomeFantasia}`}
                    </p>
                  </div>
                </div>

                {customerDetails && (
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-[var(--text-muted)] mt-4">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      {customerDetails.cadastro.endereco}, {customerDetails.cadastro.numero} — {customerDetails.cadastro.bairro} ({customerDetails.cadastro.cidade} / {customerDetails.cadastro.estado})
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      {customerDetails.cadastro.telefone}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-purple-500" />
                      Condição: {customerDetails.cadastro.condPag} • Prazo: {customerDetails.cadastro.prazo}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedCgc(null)}
                className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:scale-105 active:scale-95 transition-all shadow-sm"
                title="Fechar ficha"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
              {detailsLoading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-3">
                  <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-500 animate-spin" />
                  <p className="text-sm font-bold text-[var(--text-muted)]">
                    Carregando histórico de pedidos e produtos deste cliente...
                  </p>
                </div>
              ) : customerDetails ? (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/20 rounded-3xl p-6 shadow-sm">
                      <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Faturamento Total ({periodo}d)
                      </span>
                      <p className="text-3xl font-black text-[var(--text-main)] tracking-tight mt-1">
                        {formatCurrency(customerDetails.kpis.faturamentoTotal)}
                      </p>
                      <div className="text-xs font-bold text-[var(--text-muted)] mt-2 flex items-center justify-between">
                        <span>Status de Risco:</span>
                        {getStatusBadge(customerDetails.kpis.status)}
                      </div>
                    </div>

                    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-sm">
                      <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                        Pedidos Faturados
                      </span>
                      <p className="text-3xl font-black text-[var(--text-main)] tracking-tight mt-1">
                        {customerDetails.kpis.qtdPedidos}
                      </p>
                      <div className="text-xs font-bold text-[var(--text-muted)] mt-2 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        Último: {formatDate(customerDetails.kpis.ultimaCompra)}
                      </div>
                    </div>

                    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-sm">
                      <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
                        Ticket Médio
                      </span>
                      <p className="text-3xl font-black text-[var(--text-main)] tracking-tight mt-1">
                        {formatCurrency(customerDetails.kpis.ticketMedio)}
                      </p>
                      <div className="text-xs font-bold text-[var(--text-muted)] mt-2">
                        {customerDetails.kpis.ultimaCompra
                          ? `${customerDetails.kpis.diasSemComprar} dias sem comprar`
                          : "Sem histórico"}
                      </div>
                    </div>
                  </div>

                  {/* Tabs Navigation */}
                  <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
                    <button
                      onClick={() => setActiveTab("pedidos")}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                        activeTab === "pedidos"
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                          : "bg-black/5 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      }`}
                    >
                      <FileText className="w-4 h-4" /> Histórico de Pedidos ({customerDetails.pedidos.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("produtos")}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                        activeTab === "produtos"
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                          : "bg-black/5 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      }`}
                    >
                      <Box className="w-4 h-4" /> Produtos Mais Comprados ({customerDetails.topProdutos.length})
                    </button>
                  </div>

                  {/* Tab Content: Pedidos */}
                  {activeTab === "pedidos" && (
                    <div className="space-y-4">
                      {customerDetails.pedidos.length === 0 ? (
                        <div className="text-center py-12 text-sm font-bold text-[var(--text-muted)] bg-black/5 dark:bg-white/5 rounded-3xl">
                          Nenhum pedido faturado para este cliente no período selecionado.
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
                                  Vendedor Responsável
                                </th>
                                <th className="py-3 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] text-right">
                                  Valor Total
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-subtle)] text-sm font-semibold">
                              {customerDetails.pedidos.map((p) => (
                                <tr key={p.pedido} className="hover:bg-blue-500/5 transition-colors">
                                  <td className="py-3.5 px-6 font-black text-[var(--text-main)]">
                                    #{p.pedido}
                                  </td>
                                  <td className="py-3.5 px-6 font-bold text-[var(--text-main)]">
                                    {formatDate(p.data)}
                                  </td>
                                  <td className="py-3.5 px-6 font-bold text-[var(--text-muted)]">
                                    {p.vendedor}
                                  </td>
                                  <td className="py-3.5 px-6 font-black text-blue-600 dark:text-blue-400 text-right tracking-tight">
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
                      {customerDetails.topProdutos.length === 0 ? (
                        <div className="text-center py-12 text-sm font-bold text-[var(--text-muted)] bg-black/5 dark:bg-white/5 rounded-3xl">
                          Nenhum produto faturado para este cliente no período selecionado.
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
                                <th className="py-3 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] text-center">
                                  Quantidade
                                </th>
                                <th className="py-3 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] text-right">
                                  Preço Médio
                                </th>
                                <th className="py-3 px-6 text-xs font-black uppercase tracking-wider text-[var(--text-muted)] text-right">
                                  Volume Total
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-subtle)] text-sm font-semibold">
                              {customerDetails.topProdutos.map((prod) => (
                                <tr key={prod.codProduto} className="hover:bg-blue-500/5 transition-colors">
                                  <td className="py-3.5 px-6 font-bold text-[var(--text-muted)]">
                                    {prod.codProduto}
                                  </td>
                                  <td className="py-3.5 px-6 font-black text-[var(--text-main)]">
                                    {prod.nomeProduto}
                                  </td>
                                  <td className="py-3.5 px-6 font-black text-[var(--text-main)] text-center">
                                    {prod.quantidade}
                                  </td>
                                  <td className="py-3.5 px-6 font-bold text-[var(--text-muted)] text-right">
                                    {formatCurrency(prod.precoMedio)}
                                  </td>
                                  <td className="py-3.5 px-6 font-black text-blue-600 dark:text-blue-400 text-right tracking-tight">
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
    </div>
  );
}
