---
type: project
created: 2026-05-18T08:05:00-03:00
updated: 2026-05-18T08:05:00-03:00
---

# Diretrizes de Segurança do Banco de Dados SQL Server

## 🔴 POLÍTICA DE TOLERÂNCIA ZERO (READ-ONLY)
O banco de dados SQL Server da Distribuidora Estrela é o coração operacional do negócio. Sob nenhuma circunstância a inteligência artificial ou qualquer subagente deve propor ou executar comandos de modificação, escrita, deleção ou alteração de esquema no banco de dados real.

## ⚠️ PROTOCOLO DE ALERTA OBRIGATÓRIO
Se em qualquer momento futuro o desenvolvimento de uma funcionalidade exigir a modificação de dados no SQL Server real, o agente **DEVE OBRIGATORIAMENTE PARAR** antes de escrever qualquer código ou executar qualquer ferramenta e emitir múltiplos alertas em destaque para o usuário:

```markdown
> [!CAUTION]
> 🚨 ALERTA CRÍTICO DE SEGURANÇA: OPERAÇÃO DE ESCRITA NO BANCO DE DADOS REAL 🚨
> A solicitação atual envolve a modificação ou inserção de dados diretamente no banco de dados SQL Server do ERP Estrela.

> [!WARNING]
> Risco de impacto em produção. Solicitando autorização expressa do administrador antes de prosseguir.
```

Nenhum comando SQL de escrita (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `EXEC`) pode ser incluído no código sem a confirmação explícita e irrevogável do usuário após estes alertas.
