import React from 'react';
import { AlertTriangle, Server, RefreshCw } from 'lucide-react';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function DatabaseErrorAlert({ message, onRetry }: Props) {
  return (
    <div className="bg-red-500/10 border-2 border-red-500/30 rounded-3xl p-8 max-w-2xl mx-auto my-12 text-center shadow-2xl backdrop-blur-md animate-fade-in">
      <div className="w-16 h-16 bg-red-500/20 border border-red-500/40 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/20">
        <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400 animate-pulse" />
      </div>
      <h3 className="text-2xl font-black text-[var(--text-main)] mb-3">
        Conexão com Banco de Dados Real Indisponível
      </h3>
      <p className="text-sm font-semibold text-[var(--text-muted)] mb-6 leading-relaxed max-w-xl mx-auto">
        {message || "O servidor SQL Server real (192.168.3.64) não pôde ser alcançado. Verifique se você está conectado à VPN ou rede local da Distribuidora Estrela."}
      </p>
      <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-[var(--border-subtle)] inline-block text-left mb-8 text-xs font-mono text-[var(--text-muted)] shadow-inner">
        <div className="flex items-center gap-2 mb-2 font-black text-red-500 dark:text-red-400 uppercase tracking-wider">
          <Server className="w-3.5 h-3.5" /> Detalhes da Conexão Estrita:
        </div>
        <p className="font-semibold">• Servidor Alvo: 192.168.3.64:1433</p>
        <p className="font-semibold">• Banco de Dados: DistribuidoraEstrela</p>
        <p className="font-semibold text-amber-600 dark:text-amber-400 mt-1">• Status: Modo Estrito Ativo (Mocks e Fallbacks desativados)</p>
      </div>
      <div>
        <button
          onClick={onRetry || (() => window.location.reload())}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm transition-all shadow-lg shadow-red-500/30 flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" /> Tentar Reconectar
        </button>
      </div>
    </div>
  );
}
