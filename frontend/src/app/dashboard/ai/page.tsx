"use client";

import { useState } from "react";
import { ArrowRight, Bot, Database, Sparkles, User, AlertCircle } from "lucide-react";
import axios from "axios";
import { useTheme } from "@/components/ThemeProvider";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Olá, gestor! Sou a Inteligência Artificial do Estrela BI. Estou conectada diretamente ao nosso SQL Server interno para fornecer análises financeiras e de vendas instantâneas. O que você gostaria de analisar nas movimentações recentes?",
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  const handleSubmit = async (e?: React.FormEvent, suggestionText?: string) => {
    if (e) e.preventDefault();
    const queryText = suggestionText || input;
    if (!queryText.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: queryText };
    setMessages((prev) => [...prev, userMessage]);
    if (!suggestionText) setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post<{ response: string }>("http://localhost:3000/ai/ask", {
        question: queryText,
      });
      
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: response.data.response,
      }]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("Não foi possível conectar ao banco SQL Server ou processar a pergunta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] pb-6 transition-colors duration-300">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs text-blue-600 dark:text-blue-400 font-bold">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-sm">
              <Database className="w-3.5 h-3.5" /> Conexão SQL Server Ativa
            </span>
            <span className="text-[var(--text-muted)] font-semibold">Distribuidora Estrela BI</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-[var(--text-main)] flex items-center gap-2.5">
            <Sparkles className="h-7 w-7 text-blue-600 dark:text-blue-500" />
            IA Assistente de Gestão
          </h2>
          <p className="text-sm font-medium text-[var(--text-muted)] mt-1">Consultas em linguagem natural integradas aos pedidos, notas e estoque em tempo real.</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-3xl flex flex-col overflow-hidden shadow-[var(--shadow-card)] transition-colors duration-300">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 max-w-[85%] sm:max-w-[75%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
              {msg.role === "assistant" && (
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              )}
              {msg.role === "user" && (
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                  <User className="h-5 w-5 text-white" />
                </div>
              )}
              <div className={`p-5 rounded-3xl shadow-md text-sm leading-relaxed ${
                msg.role === "user" 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none font-semibold" 
                  : `bg-black/5 dark:bg-[#1B1B1B] border border-[var(--border-subtle)] text-[var(--text-main)] rounded-tl-none font-medium`
              }`}>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border-subtle)] text-xs text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider">
                    <Database className="h-3.5 w-3.5 text-blue-500" />
                    Base Transacional SQL
                  </div>
                )}
                <div className="whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 max-w-[85%]">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="p-5 rounded-3xl bg-black/5 dark:bg-[#1B1B1B] border border-[var(--border-subtle)] text-[var(--text-main)] flex items-center gap-3">
                <div className="h-2.5 w-2.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" />
                <div className="h-2.5 w-2.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="h-2.5 w-2.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-[var(--text-muted)] font-bold ml-2">Consultando e cruzando tabelas do SQL Server...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-[var(--border-subtle)] bg-black/5 dark:bg-[#161616] transition-colors duration-300">
          <form onSubmit={(e) => handleSubmit(e)} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte à IA (Ex: Quem foi o vendedor destaque? ou Quais foram os produtos mais vendidos?)"
              className={`flex-1 bg-white dark:bg-[#0A0A0A] border border-[var(--border-subtle)] rounded-2xl px-5 py-4 text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm shadow-sm ${theme === "dark" ? "[color-scheme:dark]" : "[color-scheme:light]"}`}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center shrink-0 font-bold"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
          <div className="flex items-center gap-2.5 mt-4 overflow-x-auto pb-1 hide-scrollbar">
            <span className="text-xs text-[var(--text-muted)] uppercase font-black tracking-wider shrink-0">Consultas Rápidas:</span>
            {[
              "Quem foi o melhor vendedor?",
              "Quais foram os produtos mais vendidos?",
              "Qual o faturamento acumulado no mês?",
              "Quantos clientes foram atendidos?",
              "Por que o faturamento caiu esta semana?",
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setInput(suggestion);
                  handleSubmit(undefined, suggestion);
                }}
                disabled={isLoading}
                className="whitespace-nowrap text-xs bg-white dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15 border border-[var(--border-subtle)] px-4 py-2 rounded-full text-[var(--text-main)] transition-all font-bold disabled:opacity-50 shadow-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
