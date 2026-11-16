# 02 · Design System

Fonte Inter auto-hospedada. Tokens em `src/design-system/styles.css`, aplicados pelos dois temas. Escala 4/8/12/16/20/24/32/40; cards de raio 14 px; superfície principal de raio 24 px; controls de raio 8 px. Cor nunca é o único indicador de estado.

| Papel | Claro | Escuro |
|---|---|---|
| Canvas | #F3F4F9 | #111D19 |
| Card | #FFFFFF | #192923 |
| Texto | #20282D | #F0F5F2 |
| Secundário | #5F6973 | #A8B8AF |
| Borda | #E3E8EC | #34483D |
| Ação | #356E7E | #91C9D3 |
| Positivo | #287044 | #8BD49C |
| Negativo | #B63F50 | #FF9AAA |
| Sidebar | #81D170 → #56AE58 | #203F2D → #173026 |

Componentes: Button/IconButton, Card, Metric, Badge, Progress, Field, Empty, Notice, Modal, Confirm, Loading; filtros e navegação de área compartilhados. Radix controla foco, Escape, sobreposição e semântica dos diálogos.

## Identidade azul · revisão de 11/11/2026

Por solicitação do usuário, azul passa a ser a identidade principal. Tokens anteriores verdes acima registram a referência original, não a configuração ativa.

| Papel atual | Claro | Escuro |
|---|---|---|
| Canvas | #F2F5FB | #0E182B |
| Card | #FFFFFF | #16243B |
| Texto | #1C2940 | #EDF3FF |
| Secundário | #5B6B82 | #A4B5CF |
| Ação | #2563EB | #80B5FF |
| Sidebar | #76B4F5 → #4883DE | #163466 → #10254B |
| Cápsula ativa | #245BC4, texto branco | #9DC6FF, texto #10254B |
| Cor do salto | #3479ED / #7BB8FF | #3473DB / #78ADFF |
| Cobertura de navegação | #6BA8F4 → #3678EC → #2353B7 | #234C79 → #17345A → #101D34 |

Verde e vermelho continuam disponíveis para sinais financeiros; as cores cadastradas de categorias não são dados de marca e permanecem distinguíveis.

## Responsividade

- ≥1280: sidebar 200 px, quatro KPIs, grid assimétrico e densidade compacta adaptada à altura.
- 1024–1279: sidebar 176 px, painéis podem se reorganizar.
- 768–1023: rail 72 px e conteúdo em duas colunas.
- <768: gaveta e barra inferior; ordem prioriza Livre para gastar.
- <480: indicadores em uma coluna.

A largura da superfície desktop acompanha a janela. Tabelas e quadro usam rolagem localizada. Formulários extensos viram folha inferior no mobile. O tema é aplicado antes da primeira pintura e salvo em localStorage.

O dashboard não depende de uma proporção fixa de monitor: 16:9, 20:9 e 21:9 são cenários de verificação, não condições de layout. As colunas usam limites mínimos de zero para redistribuir o espaço disponível. KPIs e Livre para gastar ajustam a tipografia à largura de seus próprios cards, com limites de legibilidade. O menu conserva rolagem vertical; a cápsula animada é contida lateralmente para não criar uma barra horizontal ao recolher ou expandir.

O quadro externo ocupa a altura útil da janela (`100dvh`) e permanece parado. O cabeçalho fica fora da área rolável; somente o conteúdo dentro da superfície arredondada rola quando necessário. A sidebar conserva sua própria rolagem de menu. No celular, a área do conteúdo termina acima da barra inferior e respeita a área segura. Essa decisão substitui a rolagem da página inteira prevista no planejamento original.
