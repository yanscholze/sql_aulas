# 04 · Tecnologias

React 19 + TypeScript 5.9 + Vite 8. Versões exatas no package-lock.json.

- SPA: esta entrega é somente interface. Next/vinext e Worker não são necessários.
- Tailwind 4 + tokens CSS: controle visual sem tema externo.
- Motion: único motor para React e SVG. GSAP não é necessário para as sequências adotadas.
- SVG próprio: linhas, área, barras e rosca. Recharts, Visx, Nivo e ECharts acrescentariam uma camada de configuração para poucas formas pequenas. Para volumes grandes, essa decisão deve ser reavaliada.
- Radix: diálogos com foco e teclado; estilo próprio sem tema shadcn.
- Lucide: um vocabulário de ícones com imports individuais.
- React Router: rotas, parâmetros, abas, histórico e bloqueio de formulário alterado.
- TanStack Query: consulta e mutação sobre adaptador local. Sem estado financeiro duplicado em Zustand.
- idb/IndexedDB: armazenamento local de demonstração e anexos. Não é backend nem banco remoto.
- Vitest, Node test runner, Playwright e axe: verificações complementares.

TypeScript 5.9 foi mantido pela compatibilidade declarada com typescript-eslint. Node mínimo 22.22.2. Build verificado no host com Node 22.23.4. Aviso de chunk acima de 500 kB deve ser interpretado junto ao tamanho comprimido e medições, sem apenas aumentar o limite para ocultá-lo.
