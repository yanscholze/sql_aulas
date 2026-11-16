# 03 · Movimento expressivo

Revisão solicitada pelo usuário em 11/11/2026: os três movimentos devem ser bem visíveis. Paleta principal azul. Esta decisão substitui a restrição anterior à revelação circular na aplicação.

## Sequência de cor

`useColorNavigation` coordena a cobertura antes da navegação; `ColorTransition` conserva o escopo visual enquanto o destino é preparado:

1. No clique, um disco de 44 px começa a expandir imediatamente; não espera um salto preparatório. No teclado, usa o centro do item acionado.
2. A cor cobre a janela em 220 ms, a partir desse mesmo ponto. A página anterior, inclusive a seleção do menu, permanece até a cobertura estar completa.
3. Só então a rota muda. A camada permanece opaca se o conteúdo ainda estiver carregando. `PageReady`, dentro de Suspense, sinaliza quando o destino está montado.
4. A máscara radial revela a nova tela em 420 ms e remove a camada. Sem espera por carregamento, o ciclo dura cerca de 640 ms. A curva distribui o crescimento por tamanhos intermediários, preservando o contorno circular visível da referência.
5. Os cards começam 40 ms após a montagem; gráficos e números surgem durante e após a abertura. Não há fade atrasado da página inteira.

A camada não recebe eventos de ponteiro nem altera o layout. Navegação rápida mantém o pedido mais recente; se a janela já estiver coberta, continua opaca ao preparar o novo destino. Filtros e atualização de dados não repetem a transição inteira. Formulários com proteção de descarte conservam o fluxo próprio de navegação.

## Paleta da cobertura

Claro: destaque `#6BA8F4`, azul `#3678EC` e profundidade `#2353B7`. Escuro: destaque `#234C79`, azul `#17345A` e profundidade `#101D34`. O escuro tem luminosidade e saturação menores. O centro do gradiente acompanha a origem do clique.

## Destaque de navegação

LayoutGroup com layoutId compartilhado por menu. A cápsula azul viaja entre posições com mola: stiffness 460, damping 27, mass 0,8. O menu compacto e a gaveta têm grupos separados. O texto selecionado mantém contraste com a cápsula.

## Cards e indicadores

- Entrada dos cards com mola, deslocamento de 18 px e escala inicial 0,975; stiffness 320, damping 22, mass 0,8.
- Stagger de 55 ms, limitado a 275 ms.
- Um preenchimento circular azul passa pelo fundo do card e desaparece, durante 1,1 s.
- Ícones coloridos fazem um pequeno salto de escala e rotação.
- Contagens duram 1,1 s na entrada, 350 ms ao atualizar. Valores finais acessíveis não são anunciados por frame.

## Gráficos

Linhas são reveladas por máscara em 1,05 s. Áreas crescem com acomodação em 1,15 s. Barras crescem em 1,05 s, com stagger e leve acomodação de escala. Roscas preenchem seus segmentos em 1,15 s com entrada de escala e rotação. Barras de progresso seguem o mesmo vocabulário.

O salto é apenas apresentação transitória. Os dados de origem, tooltips e tabelas mantêm os valores finais exatos. A curva de linha continua sem criar máximos ou mínimos inexistentes nos dados.

## Repetição e acessibilidade

O botão **Rever animações** atualiza o epoch do escopo visual, preservando o estado da página, filtros na URL, período local e dados persistidos. Não recarrega o banco da demonstração.

Cliques e toques conservam as coordenadas na janela, inclusive na gaveta mobile e nos limites da tela. A expansão e a abertura radial compartilham a origem do acionamento; o raio alcança o canto mais distante.

Com `prefers-reduced-motion`, bolha, máscara, saltos e stagger são omitidos e o conteúdo aparece completo. O controle não ignora a preferência do dispositivo.

## Implementação

Motion for React, LazyMotion/domMax, CSS e SVG. Dois valores de movimento controlam os raios externo e interno. O raio externo usa recorte circular; o interno é um furo em um único caminho SVG com preenchimento even-odd. Isso substitui a máscara alfa CSS que ocupava a janela inteira. O gradiente usa os mesmos tokens e o centro permanece fixo no acionamento. A conclusão da cobertura dispara a navegação e o compromisso do conteúdo dispara a abertura; não há timers fixos simulando carregamento. Uma fonte de contexto coordena delay e repetição, sem renders React a cada frame.

Referências técnicas: [layout e elementos compartilhados](https://motion.dev/docs/react-layout-animations), [transições, springs e keyframes](https://motion.dev/docs/react-transitions). Tempos e curvas são decisões de implementação inspiradas no vídeo, não medições exatas do código original.
