# 09 · Handoff

A aplicação nesta pasta é um laboratório de UI independente, conforme reforçado pelo usuário. O projeto oficial do Fluxo é somente referência de leitura e não deve ser alterado por esta entrega.

Ordem: README → 01 referência → 02 tokens → 05 arquitetura → 06 telas → 03 movimento → 08 validação. As versões efetivas estão no lockfile.

Para testar: `./INICIAR-FLUXO.sh`, abrir http://127.0.0.1:5174. Claro é o padrão; preferências e dados fictícios persistem no navegador. Restauração fica em Configurações → Sessão e dados.

O iniciador usa o build otimizado. Para desenvolver com HMR, executar `./INICIAR-FLUXO.sh --dev` ou `npm run dev`, encerrando o servidor anterior da mesma porta. Não usar números do modo de desenvolvimento como medida final de fluidez.

Preservar: separação de saldo/comprometido/patrimônio/folga/projeção; dados coerentes entre telas; tokens semânticos; acesso por teclado; tema escuro; redução de movimento; identificação das integrações simuladas.

Critério de entrega: UI navegável e demonstrativa com operações locais, sem necessidade de backend. A integração real será responsabilidade de uma etapa posterior. Não alegar que demonstração local comprova funcionamento em produção, desempenho em celular físico ou autenticação real.

## Ajuste solicitado em 16:9

A composição desktop foi compactada após a revisão do usuário: largura disponível aproveitada, alturas e espaços internos menores, resumos de listas com acesso às áreas completas, gráfico com rótulos HTML que não deformam ao reduzir a altura. O teste de regressão verifica os cards completos em 1920×930 e 1440×900.

O dimensionamento deve acompanhar a área disponível do navegador, inclusive em janelas 20:9, 21:9 e tamanhos intermediários. Não usar uma razão fixa para dimensionar a página. A verificação deve manter barras nativas visíveis e comparar a largura do documento com `documentElement.clientWidth`, que desconta a barra vertical. Também verificar a lateral durante a animação de recolher/expandir e o conteúdo dos valores monetários dentro dos cards.

Correção esclarecida pelo usuário: o quadro deve caber inteiro na altura da janela; a rolagem vertical pertence ao conteúdo dentro do quadro, não ao documento externo. Preservar cabeçalho, sidebar e moldura ao rolar. A posição do conteúdo deve ser restaurada por entrada do histórico, depois que a tela estiver pronta. Não voltar a restaurar `window.scrollY` para esse fluxo.

## Direção visual vigente

O usuário substituiu a preferência verde por azul e pediu os três movimentos bem visíveis: bolha que salta e revela a página em círculo, seleção do menu com mola e preenchimentos dos gráficos. Essa decisão prevalece sobre os limites visuais do planejamento original. A sequência pode ser repetida pelo botão “Rever animações”, sem restaurar dados ou filtros. Preservar o respeito à preferência de movimento reduzido.

A explosão deve nascer no ponto exato do clique; pelo teclado, no centro do item acionado. Expansão e abertura circular compartilham essa origem, inclusive na gaveta mobile. Não reintroduzir o destino fixo no miolo da página.

A cor começa imediatamente, cobre em 220 ms e só então a página muda. A abertura dura 420 ms e aguarda o destino estar pronto. O círculo deve passar visivelmente por tamanhos intermediários em torno da mesma origem, conforme a referência; não concentrar todo o crescimento nos primeiros quadros. Não antecipar a troca da rota nem acrescentar espera antes da expansão. No tema escuro, usar os tokens próprios da cobertura profunda, sem o azul luminoso do tema claro.
