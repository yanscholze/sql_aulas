# Fluxo · laboratório de interface

Frontend independente para experimentar a nova interface do Fluxo. Criado em **UI_Fluxo**; o projeto oficial na pasta irmã não foi alterado.

## Abrir

Requer Node.js 22.22.2+ e npm.

```sh
./INICIAR-FLUXO.sh
```

Abra **http://127.0.0.1:5174**. O iniciador instala dependências ausentes, gera o build otimizado e serve a interface localmente. Com as dependências já instaladas, também pode executar `npm run testar`.

Para editar o código com atualização automática, use `npm run dev` ou `./INICIAR-FLUXO.sh --dev`. Encerre o servidor anterior antes de trocar de modo; ambos usam a mesma porta e conservam os dados locais da demonstração.

## O que pode testar

- Painel com KPIs, gráficos SVG, folga do ciclo, vencimentos, cartões e tarefas.
- Lançamentos com filtros na URL, edição, exclusão e exportação CSV.
- Contas, transferências, conferência de saldo, cartões, faturas e pontos.
- Compromissos, assinaturas, parcelamentos e antecipação sem juros.
- Orçamentos, patrimônio, investimentos, metas, saúde financeira e viagens.
- Relatórios por período; projetos, tarefas, agenda, horas, propostas e documentos.
- Revisão de capturas e importações CSV/OFX locais.
- Conversas demonstrativas, aparência, configurações, aparelhos e entrada simulada.
- Paleta azul clara/escura, menu mobile e movimento reduzido.
- Quadro ajustado à janela, com cabeçalho e menu parados e rolagem do conteúdo por dentro.
- Explosão de cor imediata no clique: cobre antes de trocar a página e revela o destino pronto, com paleta própria no escuro. Destaque do menu com mola, preenchimentos dos gráficos e botão **Rever animações**.

São **dados fictícios**. A data de referência é 11/11/2026. Alterações são guardadas somente no armazenamento do navegador (IndexedDB), sem servidor de API ou banco remoto. Cada origem/porta tem sua demonstração independente.

Em **Configurações → Sessão e dados → Restaurar demonstração**, é possível voltar ao conjunto inicial. Essa ação só atinge esta demonstração. Anexos locais são limitados a 10 MB.

IA, OCR, GitHub, login e pareamento Android são simulações identificadas. Não cadastre credenciais reais. O leitor de comprovantes abre um exemplo; não processa fotos. Não há cotação de investimento ou câmbio em tempo real.

## Estrutura

- `src/features`: telas e interações.
- `src/design-system`: componentes e tokens.
- `src/charts` e `src/motion`: gráficos e movimento.
- `src/data/contracts`: contratos da interface.
- `src/data/demo`: adaptador local, seed e operações simuladas.
- `packages/core`: domínio puro copiado do Fluxo, origem registrada em `ORIGIN.md`.

Para conectar um backend futuramente, substitua a implementação dos serviços locais mantendo os modelos consumidos pelas páginas. Componentes visuais não acessam diretamente o armazenamento.

## Validação

```sh
npm run build
npm run lint
npm test
npm run test:core
npx playwright install chromium --only-shell
npm run test:e2e
```

Os testes de navegador usam o build de produção servido na porta 4174. Relatórios e capturas ficam em `test-results`, ignorado pelo Git. Execute `npm run build` antes deles.

Leia os nove documentos em `docs/`. Os resultados efetivamente medidos ficam em `docs/08_VALIDATION_STRATEGY.md`.
