# 01 · Análise da referência

Vídeo: `WhatsApp Video 2026-11-11 at 11.09.23 AM.mp4`, 1054×612, aproximadamente 6,45 s, 120 fps nominais. Taxa nominal não comprova quadros únicos. Análise por amostragem em memória e inspeção das transições; incerteza temporal de aproximadamente ±150 ms.

## Telas observadas

| Tela | Composição | Adaptação |
|---|---|---|
| Dashboard | Três colunas, linhas, área, rosca, tarefas e listas | Painel financeiro |
| Insights | Quatro KPIs, barras, rosca e rankings | Relatórios e patrimônio |
| Loan files | Cards, busca, filtros e coluna de resumo | Contas e projetos |
| Tokenization | KPIs, etapas, linhas e progresso | Compromissos e metas |

Os demais itens de menu não tiveram páginas demonstradas. Empréstimos e tokenização não foram acrescentados ao produto.

## Timeline observada

- 0,00–0,40: abertura circular e exposição do dashboard.
- 0,25–1,05: números e gráficos progridem simultaneamente.
- 1,00–1,30: conteúdo desaparece, sidebar permanece, Insights começa.
- 1,20–1,75: cards entram em sequência.
- 1,40–2,65: crescimento desacelerado de indicadores e gráficos.
- 2,65–3,00: transição para Loan files.
- 2,85–3,60: revelação de cards e resumos.
- 3,65–4,05: transição para Tokenization.
- 3,95–5,35: contagens, linhas e indicadores completam.
- 5,35–6,45: apresentação da marca e reinício do loop.

A existência dessas mudanças é observada. Easing, mecanismo e separação exata entre edição e navegação são inferidos. Abertura circular, curtidas, comentários e encerramento foram excluídos da UI.

## Linguagem visual

Sidebar em gradiente verde, conteúdo cinza muito claro, cards brancos arredondados, ação petróleo, gráficos verde/petróleo/violeta/âmbar. Pixel amostrado no vídeo não equivale a token original. Tipografia original não foi identificada.

## Correção após revisão

O usuário identificou excesso de altura em 16:9. A composição desktop passa a usar a largura disponível e cards compactos; os blocos inferiores devem aparecer na visão inicial em 1920×930 e 1440×900, sem zoom CSS. Em telas menores, a página continua rolável.

## Revisão de prioridade de movimento

O usuário esclareceu que deseja os três efeitos bem visíveis: bolha circular, destaque do menu e preenchimentos dos gráficos. A abertura circular, inicialmente classificada como recurso de apresentação, agora integra intencionalmente a UI, conforme essa orientação. A marca passa ao azul por solicitação do usuário.
