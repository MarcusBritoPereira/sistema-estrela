"use client";

import { useState } from "react";
import axios from "axios";
import { PieChart, Download, FileSpreadsheet, Sparkles, CheckCircle2, FileText, Table, Calendar, Sliders } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface ReportDef {
  id: string;
  title: string;
  endpoint: string;
  desc: string;
}

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<{ id: string; format: string } | null>(null);
  const [dias, setDias] = useState("30");
  const [isCustom, setIsCustom] = useState(false);
  const [startDate, setStartDate] = useState("2026-05-01");
  const [endDate, setEndDate] = useState("2026-05-16");
  const [feedback, setFeedback] = useState<string | null>(null);
  const { theme } = useTheme();

  const reports: ReportDef[] = [
    {
      id: "faturamento",
      title: "Consolidado Geral de Faturamento Bruto",
      endpoint: "consolidado-faturamento",
      desc: "Histórico diário contendo data, número de pedidos faturados, ticket médio e receita bruta no período.",
    },
    {
      id: "estoque",
      title: "Giro de Estoque e Curva ABC de Produtos",
      endpoint: "giro-estoque",
      desc: "Relação detalhada dos 100 itens de maior saída com volume vendido, preço médio unitário e receita.",
    },
    {
      id: "equipe",
      title: "Desempenho da Equipe Comercial e Operadores",
      endpoint: "desempenho-equipe",
      desc: "Listagem completa da equipe com total de notas emitidas, ticket médio e receita individual.",
    },
    {
      id: "clientes",
      title: "Carteira Ativa de Clientes Atendidos",
      endpoint: "carteira-clientes",
      desc: "Relação de CNPJs/Clientes distintos atendidos, volume de compras e data do último pedido.",
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatDataForExport = (data: any[], id: string) => {
    if (id === "faturamento") {
      const list = data.map((item) => ({
        "Data": item.data ? new Date(item.data).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "--",
        "Qtd Pedidos Faturados": item.qtdPedidos,
        "Faturamento Total (R$)": Number(item.faturamento).toFixed(2),
        "Ticket Médio (R$)": Number(item.ticketMedio).toFixed(2),
      }));
      const totalPedidos = data.reduce((acc, curr) => acc + (Number(curr.qtdPedidos) || 0), 0);
      const totalFat = data.reduce((acc, curr) => acc + (Number(curr.faturamento) || 0), 0);
      const mediaTicket = totalPedidos > 0 ? totalFat / totalPedidos : 0;
      list.push({
        "Data": "TOTAL / MÉDIA",
        "Qtd Pedidos Faturados": totalPedidos,
        "Faturamento Total (R$)": totalFat.toFixed(2),
        "Ticket Médio (R$)": mediaTicket.toFixed(2),
      });
      return list;
    }
    if (id === "estoque") {
      const list = data.map((item) => ({
        "Código Reduzido": item.codProduto,
        "Descrição do Item": item.nomeProduto,
        "Linha / Família": item.familia,
        "Qtd Total Vendida": item.qtdVendida,
        "Preço Médio Negociado (R$)": Number(item.precoMedio).toFixed(2),
        "Faturamento Bruto (R$)": Number(item.faturamento).toFixed(2),
      }));
      const totalQtd = data.reduce((acc, curr) => acc + (Number(curr.qtdVendida) || 0), 0);
      const totalFat = data.reduce((acc, curr) => acc + (Number(curr.faturamento) || 0), 0);
      const precoMedio = totalQtd > 0 ? totalFat / totalQtd : 0;
      list.push({
        "Código Reduzido": "TOTAL / MÉDIA",
        "Descrição do Item": "--",
        "Linha / Família": "--",
        "Qtd Total Vendida": totalQtd,
        "Preço Médio Negociado (R$)": precoMedio.toFixed(2),
        "Faturamento Bruto (R$)": totalFat.toFixed(2),
      });
      return list;
    }
    if (id === "equipe") {
      const list = data.map((item) => ({
        "Operador / Vendedor": item.nomeVendedor,
        "Total Pedidos": item.qtdPedidos,
        "Ticket Médio (R$)": Number(item.ticketMedio).toFixed(2),
        "Faturamento Bruto (R$)": Number(item.faturamento).toFixed(2),
      }));
      const totalPedidos = data.reduce((acc, curr) => acc + (Number(curr.qtdPedidos) || 0), 0);
      const totalFat = data.reduce((acc, curr) => acc + (Number(curr.faturamento) || 0), 0);
      const mediaTicket = totalPedidos > 0 ? totalFat / totalPedidos : 0;
      list.push({
        "Operador / Vendedor": "TOTAL / MÉDIA",
        "Total Pedidos": totalPedidos,
        "Ticket Médio (R$)": mediaTicket.toFixed(2),
        "Faturamento Bruto (R$)": totalFat.toFixed(2),
      });
      return list;
    }
    if (id === "clientes") {
      const list = data.map((item) => ({
        "Identificação / Cliente": item.documentoCliente,
        "Pedidos no Período": item.qtdPedidos,
        "Faturamento Acumulado (R$)": Number(item.faturamentoTotal).toFixed(2),
        "Última Movimentação": item.dataUltimaCompra ? new Date(item.dataUltimaCompra).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "--",
      }));
      const totalPedidos = data.reduce((acc, curr) => acc + (Number(curr.qtdPedidos) || 0), 0);
      const totalFat = data.reduce((acc, curr) => acc + (Number(curr.faturamentoTotal) || 0), 0);
      list.push({
        "Identificação / Cliente": "TOTAL / ACUMULADO",
        "Pedidos no Período": totalPedidos,
        "Faturamento Acumulado (R$)": totalFat.toFixed(2),
        "Última Movimentação": "--",
      });
      return list;
    }
    return data;
  };

  const handleExport = async (rep: ReportDef, format: "pdf" | "xls" | "csv") => {
    setDownloading({ id: rep.id, format });
    setFeedback(null);
    try {
      const url = isCustom 
        ? `http://localhost:3000/reports/${rep.endpoint}?startDate=${startDate}&endDate=${endDate}`
        : `http://localhost:3000/reports/${rep.endpoint}?dias=${dias}`;

      const res = await axios.get(url);
      const rawData = res.data;

      const periodLabel = isCustom ? `${startDate} a ${endDate}` : `Últimos ${dias} dias`;

      if (!rawData || rawData.length === 0) {
        setFeedback(`Nenhum dado faturado encontrado para "${rep.title}" (${periodLabel}).`);
        setDownloading(null);
        return;
      }

      const formattedData = formatDataForExport(rawData, rep.id);
      const filename = `EstrelaBI_${rep.id}_${isCustom ? `${startDate}_${endDate}` : `${dias}dias`}`;

      if (format === "csv") {
        const headers = Object.keys(formattedData[0]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = formattedData.map((row: any) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(","));
        const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const urlBlob = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = urlBlob;
        a.download = `${filename}.csv`;
        a.click();
      } else if (format === "xls") {
        const XLSX = await import("xlsx");
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Relatório Estrela BI");
        XLSX.writeFile(wb, `${filename}.xlsx`);
      } else if (format === "pdf") {
        const { default: jsPDF } = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");
        const doc = new jsPDF("l", "pt", "a4");
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 58, 138);
        doc.text(`Distribuidora Estrela — Relatório Executivo`, 40, 40);
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        doc.text(rep.title, 40, 60);

        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`Período de Análise: ${periodLabel} | Gerado em: ${new Date().toLocaleString("pt-BR")} | Base: SQL Server Live`, 40, 80);

        const headers = Object.keys(formattedData[0]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allRows = formattedData.map((row: any) => headers.map((h) => String(row[h] ?? "--")));
        const bodyRows = allRows.slice(0, -1);
        const footRow = allRows[allRows.length - 1];

        autoTable(doc, {
          startY: 100,
          head: [headers.map((h) => h.toUpperCase())],
          body: bodyRows,
          foot: [footRow],
          theme: "grid",
          headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
          footStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: "bold" },
          styles: { fontSize: 8, cellPadding: 6 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
        });

        doc.save(`${filename}.pdf`);
      }

      setFeedback(`✅ Arquivo "${filename}.${format === "xls" ? "xlsx" : format}" exportado com sucesso (${periodLabel})!`);
    } catch (err: unknown) {
      console.error("Erro na exportação:", err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setFeedback(`❌ ${(err as any).response?.data?.message || (err as any).message || "Erro ao conectar com a base de dados para gerar o relatório."}`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-8 pb-12 transition-colors duration-300 animate-fade-in">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-blue-600 dark:text-blue-400 font-bold">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> Motor de Exportação Universal
            </span>
            <span className="text-[var(--text-muted)] font-semibold">Relatórios Dinâmicos</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-[var(--text-main)] flex items-center gap-2.5">
            <PieChart className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Central de Exportação Executiva
          </h2>
          <p className="text-sm font-medium text-[var(--text-muted)] mt-1">Distribuidora Estrela — Faça download instantâneo das tabelas transacionais do SQL Server em PDF, Excel e CSV.</p>
        </div>

        {/* Period Control Selector */}
        <div className="flex flex-wrap items-center gap-3 bg-black/5 dark:bg-[#161616] border border-[var(--border-subtle)] p-2 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1.5 px-2 py-1">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-[var(--text-main)]">Filtro de Período:</span>
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-[#0A0A0A] p-1 rounded-xl border border-[var(--border-subtle)] shadow-inner">
            {["15", "30", "90"].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setIsCustom(false);
                  setDias(p);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!isCustom && dias === p ? "bg-blue-600 text-white shadow-lg" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
              >
                {p} Dias
              </button>
            ))}
            <button
              onClick={() => setIsCustom(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${isCustom ? "bg-blue-600 text-white shadow-lg" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
            >
              <Sliders className="w-3 h-3" />
              Personalizado
            </button>
          </div>

          {/* Custom Date Inputs when isCustom is true */}
          {isCustom && (
            <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-subtle)] animate-fade-in">
              <div className="flex items-center gap-1.5 bg-white dark:bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl px-2.5 py-1 shadow-sm">
                <span className="text-[10px] uppercase font-black text-[var(--text-muted)]">Início:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`bg-transparent text-xs text-[var(--text-main)] font-bold focus:outline-none cursor-pointer ${theme === "dark" ? "[color-scheme:dark]" : "[color-scheme:light]"}`}
                />
              </div>
              <span className="text-[var(--text-muted)] text-xs font-bold">até</span>
              <div className="flex items-center gap-1.5 bg-white dark:bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-xl px-2.5 py-1 shadow-sm">
                <span className="text-[10px] uppercase font-black text-[var(--text-muted)]">Fim:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`bg-transparent text-xs text-[var(--text-main)] font-bold focus:outline-none cursor-pointer ${theme === "dark" ? "[color-scheme:dark]" : "[color-scheme:light]"}`}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-200 text-sm font-medium flex items-center gap-2 shadow-lg backdrop-blur-md">
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((rep) => (
          <div key={rep.id} className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-[var(--shadow-card)] flex flex-col justify-between hover:border-blue-500/30 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs bg-black/5 dark:bg-white/5 border border-[var(--border-subtle)] px-3 py-1 rounded-full font-bold text-[var(--text-main)] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Consultando Base Local
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {isCustom ? `Personalizado (${startDate} a ${endDate})` : `Disponível Live (${dias} dias)`}
                </span>
              </div>
              <h3 className="text-xl font-black text-[var(--text-main)] mb-2">{rep.title}</h3>
              <p className="text-sm font-medium text-[var(--text-muted)] leading-relaxed mb-6">{rep.desc}</p>
            </div>
            
            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2.5">
              <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider block mb-2">Opções de Download Direto:</span>
              <div className="grid grid-cols-3 gap-3">
                {/* PDF Button */}
                <button
                  onClick={() => handleExport(rep, "pdf")}
                  disabled={downloading !== null}
                  className="bg-red-500/10 hover:bg-red-600 border border-red-500/30 hover:border-transparent text-red-600 dark:text-red-300 hover:text-white font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs shadow-sm disabled:opacity-40 group"
                >
                  {downloading?.id === rep.id && downloading?.format === "pdf" ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <FileText className="w-4 h-4 text-red-500 group-hover:text-white transition-colors" /> PDF
                    </>
                  )}
                </button>

                {/* XLS/XLSX Button */}
                <button
                  onClick={() => handleExport(rep, "xls")}
                  disabled={downloading !== null}
                  className="bg-emerald-500/10 hover:bg-emerald-600 border border-emerald-500/30 hover:border-transparent text-emerald-600 dark:text-emerald-300 hover:text-white font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs shadow-sm disabled:opacity-40 group"
                >
                  {downloading?.id === rep.id && downloading?.format === "xls" ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Table className="w-4 h-4 text-emerald-500 group-hover:text-white transition-colors" /> XLSX
                    </>
                  )}
                </button>

                {/* CSV Button */}
                <button
                  onClick={() => handleExport(rep, "csv")}
                  disabled={downloading !== null}
                  className="bg-blue-500/10 hover:bg-blue-600 border border-blue-500/30 hover:border-transparent text-blue-600 dark:text-blue-300 hover:text-white font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs shadow-sm disabled:opacity-40 group"
                >
                  {downloading?.id === rep.id && downloading?.format === "csv" ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-blue-500 group-hover:text-white transition-colors" /> CSV
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
