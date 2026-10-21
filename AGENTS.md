# AGENTS.md — firefox-multiopen-bookmarks

Extensão Firefox (Manifest V2) para marcar vários bookmarks e abrir juntos em abas novas.
Popup, sidebar e página de opções. Ver `README.md`.

- Responder em português, curto e direto.
- **NUNCA matar processo.** Nem por nome (`pkill -f`, laço com `pgrep -f`), nem por dono de
  porta (`ss`/`lsof` → `kill -TERM -- -$PGID`), nem "limpar a porta". Já derrubou o
  ambiente do usuário três vezes, aqui e nos outros projetos, e sempre pelo mesmo
  mecanismo: o servidor do usuário e o dos outros projetos caem no **mesmo padrão de
  nome** e na **mesma porta**, então `pkill` não distingue "meu" de "dele". O "dono da
  porta" **é** o servidor do usuário — matá-lo é matá-lo, por definição.
  - **Para medir, use o que já está rodando.** Se não houver nada no ar, **peça ao
    usuário para subir** — não suba um em paralelo "para ter o meu".
  - **Só se limpa o que eu mesmo criei**: anote o PID ao criar e, antes de matar o
    grupo, confira que aquele PID ainda é o processo que eu criei (mesmo cmdline).
  - Processo de teste meu morre sozinho.
- Commit, push e build de artefato (XPI) **só com pedido explícito** do usuário. Sem a
  ordem, tudo fica local — sem exceção.
- Ao mudar comportamento/comandos, atualizar `README.md` e este arquivo **na mesma
  rodada**. Doc não muda sem o código junto, nem código sem o doc.

## Comandos

- `npm test` — vitest (37 testes: bookmark-tree, filter-engine, open-engine,
  selection-store, helpers). `npm run test:watch` pra acompanhar.
- `npm run lint` — ESLint 9 flat config (`eslint.config.js`); `npm run lint:fix` corrige.
- `npm run check` — o que fecha antes de entregar: `lint` + `test` +
  `npx web-ext lint --source-dir=. --ignore-files="build.sh"`.
- `./build.sh` — gera **só** o XPI versionado (`multiopen-bookmarks-v<VERSION>.xpi`);
  `--with-sources` acrescenta o `sources-v<VERSION>.zip` (exigido pela AMO quando o
  pacote é minificado) e `--bump patch|minor|major` atualiza `manifest.json`,
  `package.json` e `README.md` **juntos**. O build roda `npm test` e `web-ext lint`
  (source **e** `dist/`) e **falha** se algum falhar.
- Carregar no Firefox: `about:debugging` → Carregar extensão temporária → `manifest.json`
  (ou `npx web-ext run --source-dir=.`).
- Sem dependência de runtime: só `devDependencies` (vitest, eslint, prettier, web-ext,
  terser, clean-css-cli). Não adicionar dependência de produção sem pedido.

## Mapa

- `src/core/` — lógica pura, sem DOM: `bookmark-tree.js` (árvore, caminho e validação de
  pasta raiz), `filter-engine.js` (busca), `open-engine.js` (quantas abas abrir),
  `selection-store.js` (seleção persistida). Testável em node — é aqui que a regra mora.
- `src/api/` — wrappers do browser API: `bookmarks-api.js`, `tabs-api.js`,
  `storage-api.js`.
- `src/ui/` — UI compartilhada: `bookmarks-app.js` (estado + eventos), `tree-renderer.js`
  (linhas, breadcrumb, menu de contexto), `state.js`, **`shared.css`**.
- `popup/` (720px), `sidebar/` (altura cheia) e `options/` importam o mesmo
  `shared.css`; cada um só ajusta o próprio layout em 10–20 linhas.
- `test/` — suítes vitest; `background.js`/`background.html` — página de background
  (ESM, `runtime.onInstalled` + ping).

## Regras de casa

- **Piso de 12px** em todo texto de conteúdo (rótulo, URL, meta, contador). Nada de 10px
  ou 11px: o mínimo já vale para os `.btn-icon`, para o contador de selecionados e para
  a URL da linha da árvore.
- **Todo controle clicável com `:focus-visible`** — o anel azul de 2px mora em
  `shared.css` (`:where()` para não brigar com as regras específicas). Botão novo sem
  foco é botão que o teclado não acha.
- **Alvo de toque ≥24px** em botão. Checkbox de 16px dentro de linha clicável conta: quem
  marca o item clica na linha, não no quadradinho.
- **Números em `tabular-nums`** quando formam coluna ou contador (contador de
  selecionados, campo de threshold nas opções).
- **Contraste medido, ≥4.5:1** em texto de conteúdo. O fundo real é `#f5f7fb` nas
  opções e `#ffffff` na árvore — `#64748b` reprova no primeiro, `#475569` passa nos dois.
- **Doc no mesmo commit do código**: mudou comportamento → `README.md` + este arquivo;
  mudou cor/raio/fonte → `DESIGN.md` + `.impeccable/design.json`.

## Regras do projeto

- **`src/ui/shared.css` é a fonte única do estilo** de popup, sidebar e options. Não
  duplicar regra de CSS em `popup.css`/`sidebar.css`/`options.css` — lá só vai ajuste de
  layout do contexto. **Nada de `style.cssText`**: o menu de contexto é o único lugar com
  `hidden`/`left`/`top` escritos por JS.
- **`src/core/` é puro e testado.** Mudou regra (filtro, seleção, contagem de abas) →
  muda lá e cobre em `test/`. Regra no componente = regra não testada.
- **Seleção persistida em `storage.local`**, escrita debounced (200ms) e flush em
  `pagehide`/`visibilitychange`. Item que some da árvore é expurgado da seleção.
- **A confirmação de “muitas abas” conta as abas preparadas** (`preparedUrls.length`),
  não as marcadas: pular aba já aberta e deduplicar URL acontecem **antes** do
  `window.confirm`. Caso contrário o popup pede confirmação de um número que nunca vai
  abrir.
- **A árvore é a fonte da verdade da tela**: `bookmarks.onCreated/onRemoved/onChanged/
  onMoved` e `storage.onChanged` re-renderizam; `content-visibility: auto` +
  `contain-intrinsic-size` mantêm a rolagem leve.
- **`./build.sh --bump` é a fonte da verdade da versão**: manifest + package.json +
  README andam juntos. Versão defasada no `manifest.json` = XPI com nome errado.
- **Manifest pede só o que usa**: `bookmarks`, `tabs`, `storage`. Ao adicionar API,
  conferir o código antes de entrar em `permissions`.
- **Única saída de dados para fora**: a favicon vem de `icons.duckduckgo.com` com o
  hostname do bookmark; o fallback é local. Nada de dado pessoal sai.
- **Firefox 142+** (`strict_min_version`) e Manifest V2 com `persistent: false`.
