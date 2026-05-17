import Link from "next/link";
import { ArrowRight, BarChart3, Database, MessageSquare, ShieldCheck, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0A0A0A] text-white selection:bg-blue-500/30">
      <header className="px-6 lg:px-14 h-20 flex items-center border-b border-white/10 sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-md z-50">
        <Link className="flex items-center justify-center gap-3" href="#">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight text-white leading-none">Estrela BI</span>
            <span className="text-[10px] uppercase font-semibold tracking-widest text-blue-400 mt-1">Portal Interno</span>
          </div>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-8 items-center">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Rede Segura Distribuidora Estrela
          </span>
          <Link
            className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-full hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            href="/login"
          >
            Acesso Corporativo
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-24 md:py-32 lg:py-40 flex justify-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/15 rounded-full blur-[130px] -z-10 pointer-events-none" />
          <div className="container px-4 md:px-6 text-center max-w-[950px]">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-semibold text-gray-300 mb-8 shadow-sm">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              Conectado ao Banco SQL Server da Distribuidora
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 leading-[1.1]">
              Inteligência Comercial da <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Distribuidora Estrela</span>
            </h1>
            <p className="mx-auto max-w-[750px] text-gray-400 md:text-xl mb-12 leading-relaxed font-normal">
              Portal corporativo restrito à liderança e gestores. Acompanhe faturamento bruto em tempo real, desempenho de vendas por equipe, giro de produtos e projeções impulsionadas por IA.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 text-base font-bold text-white shadow-xl shadow-blue-500/25 transition-all hover:scale-105 active:scale-95"
                href="/login"
              >
                Acessar Dashboard <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
        <section className="w-full py-20 bg-[#121212] border-t border-white/5 flex justify-center">
          <div className="container px-4 md:px-6 max-w-[1200px]">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-start space-y-4 p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all shadow-xl group">
                <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                  <Database className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-white">Dados Transacionais Locais</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Leitura nativa e instantânea das notas fiscais, pedidos de venda, cadastro de clientes e catálogo de produtos no SQL Server interno.</p>
              </div>
              <div className="flex flex-col items-start space-y-4 p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all shadow-xl group">
                <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-white">IA de Apoio aos Gestores</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Pergunte em português natural sobre comissões, desempenho por rota, produtos parados no estoque e receba análises precisas em segundos.</p>
              </div>
              <div className="flex flex-col items-start space-y-4 p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all shadow-xl group">
                <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-white">Indicadores de Crescimento</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Visão consolidada do faturamento por período, evolução do ticket médio geral e metas comerciais integradas para tomada de decisão.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="py-8 w-full shrink-0 border-t border-white/5 bg-[#0A0A0A] flex flex-col md:flex-row justify-center items-center px-6 lg:px-14">
        <div className="container max-w-[1200px] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">Distribuidora Estrela Comercial Ltda.</span>
            <span className="text-xs text-gray-500 mt-1">Sistema de Uso Interno e Exclusivo dos Colaboradores Autorizados</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-xs text-gray-500">TI Interno e Infraestrutura</span>
            <span className="text-xs text-gray-500">Versão 2.5 (SQL Express)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
