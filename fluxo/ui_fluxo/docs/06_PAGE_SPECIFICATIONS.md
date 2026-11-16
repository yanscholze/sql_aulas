# 06 · Telas entregues

`/` abre `/painel`. Filtros, abas, competências e paginação usam URL. Filtros vazios têm estado específico; erro não apaga formulário; gravação depende da persistência local.

| Área | Rotas e comportamento |
|---|---|
| Painel | KPIs, fluxo confirmado, folga projetada, categorias, próximos compromissos, cartões, tarefas, últimos registros e metas |
| Lançamentos | Cadastro/edição/exclusão, busca com debounce, conta/categoria/competência/tipo/situação, 25/50 registros e CSV |
| Contas | Cadastro/edição, transferência, conferência e arquivamento com regras |
| Cartões | Cadastro/edição, seletor de cartão/competência, limite, histórico e pagamento simulado |
| Recompensas | Pontos e resgates, sem somar dinheiro ao patrimônio |
| Planejamento | Recorrências, confirmação por mês, pausa e projeção |
| Parcelamentos | Cronogramas e antecipação sem juros, pagamento separado |
| Assinaturas | Custos recorrentes e estados ativo/pausado |
| Orçamentos | Limites por categoria/mês e indicação de excesso |
| Patrimônio | Ativos e passivos, contas, investimentos, metas e saúde financeira |
| Viagens | Cadastro, orçamento/moeda, associação de despesas e arquivamento |
| Relatórios | Visão geral, renda, despesas, assinaturas, períodos e CSV |
| Projetos | Busca/estado, detalhes, tarefas/checklist, cobrança, horas, documentos e propostas |
| Quadro | Cinco estados e movimentação por controle de teclado/toque |
| Agenda / horas | Prazos, tarefas, cobranças e esforço por recorte |
| Automações | Revisar/editar/confirmar/ignorar captura e regras de categoria |
| Importações | Parser local CSV/OFX, seleção, duplicidades e confirmação |
| Assistente | Conversas persistentes e respostas locais para cenários financeiros conhecidos |
| Configurações | Perfil, categorias, tema, integrações/aparelhos demonstrativos, exportação e restauração |
| Entrada | Formulário demonstrativo sem autenticação real |

Aliases `/metas`, `/investimentos`, `/saude`, `/importar` e `/conectar` abrem suas abas. `/projetos/:projectId` mantém as vistas por `?aba=`. Rotas inexistentes oferecem retorno ao Painel.

Não há integração ativa de IA, OCR, GitHub, pareamento ou câmbio. A série de resultado mensal é identificada como resultado, e não como evolução patrimonial inexistente.
