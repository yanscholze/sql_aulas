# 08 · Validação

## Comandos

`npm run build`, `npm run lint`, `npm test`, `npm run test:core`, `npm run test:e2e`.

Testes de domínio: 566 cenários preservados. Testes novos: 21 cenários de receita, crédito, fatura, transferência, projeção, fechamento, parcelas, recorrência, edição/exclusão, exclusão por categoria, captura, importação, moeda estrangeira, filtros, atomicidade e geometria.

## Navegador

Playwright contra build de produção em 4174. Rotas, formulários, persistência após reload, filtros, pagamento, importação, chat, axe, tema e navegação mobile. Capturas de 1440, 1280, 1054, 768, 390 e 320 px. Teste adicional verifica que os blocos inferiores do dashboard aparecem na visão inicial em 1920×930 e 1440×900.

O teste usa dados isolados por contexto; não toca no navegador real nem no projeto oficial. Artefatos em `test-results/`.

## Limites

Axe automatizado não substitui avaliação humana com leitor de tela. Os testes cobrem a demonstração, não uma API ou banco remoto. Não foi validado em celular físico. A comparação visual com o vídeo considera linguagem e proporções, não igualdade de pixels entre produtos distintos.

Metas LCP ≤2,5 s, CLS ≤0,1 e fluidez de 60 fps permanecem critérios de evolução. O tamanho do bundle é medido pelo build; isso não comprova essas métricas. Não há alegação de INP em produção.

Os resultados finais desta execução são registrados abaixo após a última rodada.

## Resultado final · 11/11/2026

- Build de produção e TypeScript: passaram.
- ESLint: passou sem erros.
- Domínio preservado: 566 testes passaram.
- Integração local e geometria: 21 testes passaram.
- Playwright: 6 testes passaram (40,3 s), cobrindo 38 rotas e os fluxos descritos acima.
- Axe: nenhuma violação crítica ou séria no Painel claro em desktop e mobile.
- Responsividade: sem transbordamento da página nas seis larguras verificadas.
- Desktop: a borda inferior dos cards de resumo cabe em 1920×930 e 1440×900. O teste verifica o card completo, não apenas o título.
- React Doctor: nenhum erro; permanecem avisos de tamanho/complexidade de componentes e recomendações de organização.
- Bundle principal: aproximadamente 209,8 KB gzip; CSS aproximadamente 13,2 KB gzip. Há aviso do Vite sobre chunk descomprimido acima de 500 KB. Rotas e parsers são divididos em chunks.
- Projeto oficial: `git status --porcelain` vazio após o trabalho; revisão 8a321f9001fe preservada.

Capturas estáveis em `outputs/`: desktop, desktop 1440, mobile e mobile escuro. A revisão manual também exercitou salvamento local, alternância de tema e restauração dos exemplos pelo navegador integrado.

## Revisão azul e movimento expressivo · 11/11/2026

- Build de produção e ESLint passaram após a alteração de paleta e movimento.
- Playwright: 8 testes passaram (39,1 s), incluindo os seis cenários anteriores.
- O teste com movimento habilitado verifica deslocamento da bolha, expansão circular, remoção da camada ao terminar, preenchimentos e cancelamento ao navegar rapidamente.
- “Rever animações” conserva os valores e o período selecionado; movimento reduzido apresenta os dados sem bolha nem atraso.
- React Doctor: nenhum erro; permanecem recomendações de organização, complexidade, desempenho e acessibilidade para revisão futura.
- Bundle principal: aproximadamente 211,7 KB gzip. Essa medição não comprova as metas de fluidez ou Web Vitals.
- Revisão manual no navegador integrado confirmou a paleta azul, a seleção ativa e a recuperação da prévia local após reiniciar o servidor.

Gravação real do cenário com movimento: `outputs/fluxo-animacoes-azuis.mp4` (9,12 s). As capturas estáveis em `outputs/` também foram atualizadas. Os 566 testes de domínio e 21 testes locais passaram na validação anterior; esta revisão alterou a apresentação, sem mudar os cálculos.

## Origem da explosão no acionamento · 11/11/2026

A expansão e a abertura circular agora usam o ponto exato do clique, em vez de um destino fixo no conteúdo. Acionamento pelo teclado usa o centro do item. A bolha mantém um pequeno salto local.

- Build e ESLint passaram; React Doctor não apresentou novos erros.
- Playwright: 9 testes passaram (46,8 s).
- A regressão compara a posição real da máscara com um clique fora do centro do item, o centro por Enter, um clique em “Rever animações” e um clique na gaveta mobile, com tolerância de 1 px.
- Gravação atualizada do cenário: `outputs/fluxo-animacoes-no-clique.mp4`.

## Cobertura rápida e tema escuro · 11/11/2026

Revisão: expansão imediata de 160 ms antes da navegação, espera pelo conteúdo pronto e abertura de 200 ms. A cobertura escura usa três azuis profundos próprios. Não há atraso preparatório nem fade tardio da página inteira.

- Build, TypeScript e ESLint passaram.
- Playwright: 10 testes passaram (aproximadamente 1 min), incluindo as 38 rotas e os cenários anteriores.
- Amostras por requestAnimationFrame confirmaram que, enquanto a janela está parcialmente coberta, a rota e o título anteriores permanecem. A primeira mudança de rota ocorre com o raio já cobrindo toda a janela.
- Um chunk de rota foi retido por 750 ms no teste. A camada permaneceu opaca até o destino estar montado, e só então abriu.
- O teste também verifica as cores reais da cobertura escura e conserva a origem do clique em desktop, teclado, repetição e gaveta mobile.
- React Doctor: nenhum erro. O novo aviso de ajuste de estado após mudança de preferência foi revisado: corresponde ao cancelamento de uma transição em andamento quando a preferência de movimento reduzido muda, uma sincronização intencional com o dispositivo.
- Bundle principal: aproximadamente 212,1 KB gzip. As metas de desempenho em dispositivo físico continuam sem medição.

Gravação sem atraso artificial, com claro e escuro: `outputs/fluxo-transicao-rapida.mp4`. Os vídeos anteriores documentam revisões anteriores e não representam o tempo atual.

## Expansão circular perceptível · 11/11/2026

O vídeo original foi revisto em sequências de quadros da abertura e do loop. Na revisão de 360 ms, o crescimento estava concentrado em poucos quadros e a abertura perdia a leitura de círculo. A cobertura agora dura 220 ms e a abertura 420 ms, sem espera preparatória. Os raios são animados diretamente por valores de movimento e conservam o mesmo centro.

- Build, TypeScript e ESLint passaram; React Doctor não apresentou erros ou novos avisos.
- Os quatro testes de movimento passaram (24,5 s), preservando origem, ordem da troca, espera por carregamento, paleta escura, repetição, cancelamento e movimento reduzido.
- A regressão passou a exigir vários tamanhos intermediários da abertura, incluindo raios abaixo de 35% e acima de 55% do alcance da janela, com centro invariável.
- A suíte completa de dez testes passou na revisão imediatamente anterior. Os cálculos e as demais funcionalidades não foram alterados nesta revisão visual.

Gravação vigente: `outputs/fluxo-expansao-circular.mp4`. Os tempos anteriores registrados neste documento são históricos.

## Fluidez e prévia otimizada · 11/11/2026

Medições locais compararam desenvolvimento, produção anterior e produção otimizada em cinco repetições por condição. O intervalo médio entre quadros passou de 36,99 ms no desenvolvimento para 21,77 ms no build otimizado. Comparando somente produção, passou de 26,22 para 21,77 ms. Método, dados brutos e limites em `outputs/performance/RELATORIO.md`.

O navegador de medição usou renderização por software. Os números não comprovam fluidez na GPU real, nem 60 fps. O resultado é uma melhoria medida no mesmo ensaio, sem migração de linguagem.

- Build, TypeScript, ESLint e 21 testes locais passaram.
- Os 10 testes de navegador passaram (aproximadamente 1,1 min), incluindo origem da expansão, abertura em tamanhos intermediários, paleta escura e ordem de navegação.
- React Doctor: nenhum erro; os avisos de contexto instável foram resolvidos e os demais permanecem registrados.
- O iniciador foi conferido com `bash -n` e executado para servir o build otimizado na porta 5174, mantendo a origem do armazenamento local.
- Projeto oficial: continuou limpo na revisão `8a321f9001fe`.

## Janela fluida e rolagem horizontal · 11/11/2026

A reprodução identificou uma barra horizontal no menu durante a mola do indicador ao recolher/expandir. Essa área passou a conter a animação lateralmente, mantendo sua rolagem vertical. As colunas do dashboard passaram a declarar limites mínimos de zero e a tipografia monetária acompanha a largura do próprio card. Em 1024 px foi identificado e corrigido um extravasamento dos valores de KPI.

- Build, TypeScript e ESLint passaram.
- Playwright: 12 testes passaram (aproximadamente 1,2 min), incluindo os dez cenários anteriores.
- Novo cenário mantém barras de rolagem nativas visíveis e redimensiona a mesma página em 14 janelas, de 320 a 3440 px, incluindo 20:9, 21:9 e larguras intermediárias. Verifica a largura útil com `clientWidth`, os limites do painel e o conteúdo de cada valor monetário.
- Outro cenário observa os quadros da animação de recolher/expandir e verifica que nem a página nem o menu criam uma barra horizontal.
- Tema escuro também verificado em 2560×1080. Capturas em `outputs/responsivo/`.

Não há dimensões baseadas em uma razão fixa de monitor. Esta revisão trata a largura e a rolagem para os lados; o conteúdo continua acessível verticalmente em janelas baixas.

## Quadro limitado à janela e rolagem interna · 11/11/2026

O usuário esclareceu que o problema principal era a altura do quadro externo: o quadro deve caber inteiro no navegador, e o conteúdo deve rolar dentro dele quando necessário. A estrutura passou a usar altura dinâmica da janela, linhas de grid com mínimo zero e superfície em coluna com cabeçalho fixo e área central rolável. A sidebar permanece independente. No mobile, o conteúdo termina acima da navegação inferior.

- Build, TypeScript e ESLint passaram; React Doctor permaneceu sem erros e sem novos avisos.
- Playwright: 13 testes passaram (aproximadamente 1,2 min).
- Os 14 tamanhos agora verificam também a altura do documento e a borda inferior do quadro, ambas limitadas à janela.
- Novo cenário rola até o fim do conteúdo em 1536×690 e confirma que moldura, cabeçalho e sidebar não mudam de posição e `window.scrollY` permanece zero.
- O mesmo cenário navega para Contas e volta pelo histórico, confirmando a restauração da posição na área interna.
- Verificação manual no navegador integrado confirmou a rolagem por dentro e a moldura inteira visível.

Capturas atuais em `outputs/responsivo/quadro-*.png`. Esta regra de rolagem interna prevalece sobre a rolagem externa descrita no planejamento original.
