# Fluidez do Fluxo · 11/11/2026

## Alterações entregues

- A abertura circular passou de uma máscara alfa CSS que ocupava a janela inteira para um único caminho SVG com furo circular. As cores, a origem do clique, a expansão e os tempos de 220/420 ms foram preservados.
- O contexto global da interface conserva referências estáveis, evitando propagar novamente o mesmo valor durante as fases da transição.
- O iniciador abre o build de produção na porta 5174. O modo de desenvolvimento permanece disponível explicitamente.
- React/TypeScript e o domínio financeiro foram mantidos. A comparação não indica necessidade de migração de linguagem para essas melhorias.

## Método

Chromium 158.0.8127.18 headless, 1920 × 1080, escala 1, i5-1335U com 12 processadores lógicos. O navegador de medição usa SwiftShader e informa composição/rasterização por software, sem aceleração de GPU. Estes resultados **não representam o Chrome visível do usuário nem comprovam 60 fps**.

Cada condição abriu um contexto isolado, aguardou a carga e o término das animações iniciais, e repetiu “Rever animações” cinco vezes. Sem gravação de vídeo ou capturas durante a medição. Um observador requestAnimationFrame registrou intervalos durante a cobertura e a abertura; PerformanceObserver registrou tarefas longas e o protocolo Performance registrou tempo de execução e layout. As condições foram executadas sequencialmente. Não há intervalo de confiança estatístico; os números são uma comparação local exploratória.

| Condição | Intervalo médio por quadro | Percentil 95 | Tarefas >50 ms | JS médio por repetição |
|---|---:|---:|---:|---:|
| Desenvolvimento anterior | 36,99 ms | 100,0 ms | 13 | 423,3 ms |
| Produção anterior | 26,22 ms | 50,0 ms | 0 | 132,1 ms |
| Produção otimizada | 21,77 ms | 33,4 ms | 0 | 117,3 ms |

O intervalo médio caiu cerca de 17% comparando as duas versões de produção, e 41% comparando a versão de desenvolvimento anterior com a versão otimizada que agora é servida ao usuário. Tempo entre quadros menor significa maior fluidez, mas essa medida não deve ser confundida com duração da transição, LCP ou INP.

## Diagnóstico e limites

Desativar apenas a máscara antiga, em um experimento isolado, reduziu o intervalo médio para 20,86 ms. O efeito visual ficou incompleto nesse experimento; ele serviu somente para localizar custo. O SVG preservou a abertura com intervalo de 22,29 ms antes da estabilização do contexto. Ocultar as cores dos cards trouxe ganho pequeno e não foi adotado: os efeitos aprovados permanecem.

A captura adicional `baseline-trace-trace.json` registra trabalho de JS, estilo, layout e pintura. Não houve evidência de um cálculo financeiro longo bloqueando cada quadro na versão de produção. A otimização atuou no desenho e na execução da interface. WebAssembly pode acelerar cálculo adequado a esse runtime, mas isso não substitui a renderização do navegador; ver [MDN: conceitos de WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Concepts) e [web.dev: desempenho de animações](https://web.dev/articles/animations-and-performance).

Ainda é necessária a avaliação de fluidez na janela visível do navegador e na GPU real do usuário. A gravação de navegador usada nos testes funcionais não serve de medição de FPS.

## Evidências e reprodução

Arquivos `baseline-desenvolvimento.json`, `baseline-producao.json` e `otimizado-producao.json` conservam resumo, intervalos brutos, tarefas e métricas por repetição. Os arquivos `diagnostico-*` são condições experimentais, não resultados da interface entregue.

Com a prévia otimizada aberta na porta 5174:

```sh
npm run profile:motion -- nova-medicao http://127.0.0.1:5174
```

Evitar outros testes e gravações durante a medição. O comando grava um novo JSON em `outputs/performance/`; não acessa dados do navegador pessoal.
