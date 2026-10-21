---
name: MultiOpen Bookmarks
description: Extensão Firefox que marca vários bookmarks e abre juntos — lista densa, um contador violeta e um botão vermelho de expedição.
colors:
  bg: "#f5f7fb"
  surface: "#ffffff"
  surface-soft: "#f2f2f2"
  surface-border: "#dce3ee"
  surface-hover: "#eef4ff"
  ink: "#1f2937"
  ink-muted: "#475569"
  ink-faint: "#6b7280"
  blue: "#2563eb"
  blue-soft: "#eef3ff"
  violet: "#7c3aed"
  violet-soft: "#e5e7eb"
  red: "#ef4444"
  red-deep: "#dc2626"
  amber: "#ffc857"
  highlight: "#fef08a"
  highlight-ink: "#854d0e"
  menu-bg: "#f8faff"
  menu-fg: "#162031"
typography:
  title:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: "16px"
    fontWeight: 400
  label:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: "13px"
    fontWeight: 600
  meta:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: "12px"
    fontWeight: 400
  button:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1
rounded:
  sm: "4px"
  md: "5px"
  lg: "8px"
  xl: "10px"
  panel: "12px"
spacing:
  xs: "2px"
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "16px"
components:
  button:
    backgroundColor: "linear-gradient(to bottom, #ffffff, #f8f9fa)"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: "6px 14px"
    height: "32px"
  button-open:
    backgroundColor: "{colors.red}"
    textColor: "#ffffff"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: "6px 14px"
    height: "32px"
  counter:
    backgroundColor: "{colors.violet-soft}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.meta}"
    rounded: "{rounded.lg}"
    padding: "3px 10px"
  counter-active:
    backgroundColor: "{colors.violet}"
    textColor: "#ffffff"
    typography: "{typography.meta}"
    rounded: "{rounded.lg}"
    padding: "3px 10px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    borderColor: "{colors.surface-border}"
    padding: "16px"
  tree-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "7px 8px"
  feedback:
    backgroundColor: "{colors.blue-soft}"
    textColor: "#1f3f82"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "6px 8px"
  context-menu:
    backgroundColor: "{colors.menu-bg}"
    textColor: "{colors.menu-fg}"
    rounded: "{rounded.xl}"
    padding: "6px"
---

# Design System: MultiOpen Bookmarks

## Overview

**Creative North Star: "O Balcão de Expedição"**

A extensão é um balcão de remessa: uma gaveta densa de etiquetas (os bookmarks) que você
marca e despacha de uma vez. A tela é lista, não página — a árvore de linhas brancas
ocupa quase tudo, e o chrome é deliberadamente magro: uma barra de busca, uma fita de
ações e um contador. Duas cores contam o resto: o **violeta** do contador de
selecionados (o número que muda sozinho enquanto você marca) e o **vermelho** do botão
que efetivamente abre as abas. Tudo o mais é cinza-azulado, hairline de 1px e nada de
sombra — o peso visual fica nas linhas, não nas caixas.

A página de opções é a contra-cena: uma folha branca larga (640px) com cartões de
papel, títulos em caixa alta e um rodapé que diz que tudo é salvo sozinho. O menu de
contexto é o único elemento que escurece no modo escuro (`prefers-color-scheme`).

**Key Characteristics:**
- Lista densa de linhas: a linha inteira é o alvo, o checkbox é só indicador.
- Uma cor de estado (violeta no contador) e uma cor de ação (vermelho em Abrir).
- Superfície branca sobre cinza-azulado, divisória de 1px, sombra só no que flutua.
- Modo escuro cobre apenas o menu de contexto.
- Piso de 12px em todo texto de conteúdo; contador e threshold em tabular-nums.

## Colors

Paleta de papel administrativo: cinza-azulado de fundo, branco de superfície, ardósia
de tinta, e duas cores saturadas com função única.

### Primary
- **Azul de ação** (#2563eb): anel de foco de todo controle e realce de busca.
- **Azul de realce** (#1f3f82): texto do feedback informativo, sobre fundo azul-claro.

### Secondary
- **Violeta do contador** (#7c3aed): fundo do contador quando há seleção (branco por
  cima, 5,7:1). Em repouso o contador é cinza — o violeta só existe com o que foi marcado.
- **Vermelho de expedição** (#ef4444): botão "Open" e botão de reset da visão. É a
  única ação que dispara lots de abas, então é a única que grita.
- **Âmbar da pasta raiz** (#ffc857): o pino 📌 da pasta definida como raiz, em
  `color-mix` de 60% (borda) e 20% (fundo).

### Neutral
- **Fundo** (#f5f7fb): o chão do popup, da sidebar e das opções.
- **Superfície** (#ffffff): a árvore, os cartões das opções, os botões.
- **Superfície suave** (#f2f2f2): a faixa de ferramentas e a de ações.
- **Borda** (#dce3ee): hairline de 1px em painéis, árvore e cartões.
- **Tinta** (#1f2937): títulos de item e texto da árvore.
- **Tinta suave** (#475569): rótulos, descrições e a URL da linha (7:1).
- **Realce de busca** (#fef08a com tinta #854d0e): a ocorrência achada.

### Named Rules
**A Regra do Contador Violeta.** Violeta é o contador de selecionados e nada mais. Ele é
o único número que muda sozinho, então é o único que ganha cor — em repouso é cinza.

**A Regra do Vermelho Reservado.** Vermelho só na ação que abre abas em lote ("Open") e
no reset da visão. Nenhum estado passivo é vermelho.

**A Regra da Linha-Alvo.** Na árvore, o alvo do clique é a linha inteira; o checkbox é
indicador de estado (16px, `accent-color` azul). Nenhum item tem botão próprio.

## Typography

**Display Font:** sem display próprio — system-ui manda.
**Body Font:** system-ui (fallback -apple-system, "Segoe UI", Roboto).
**Label/Mono Font:** sem família mono; números tabulares via `tabular-nums`.

**Character:** o system-ui do sistema, usado sem invenção. A hierarquia vem do peso
(700 no título do item, 600 no rótulo, 400 no resto) e do tamanho (16 no item da
árvore, 13 nos rótulos das opções, 12 em tudo que é meta).

### Hierarchy
- **Title** (700, 22px): "MultiOpen Bookmarks" na página de opções.
- **Body** (400, 16px): título do bookmark na árvore (comprido, corta com reticências).
- **Label** (600, 13px): rótulos das opções e subtítulos em caixa alta (0.05em).
- **Meta** (400, 12px): URL da linha, rótulo do separador, contador, feedback, rodapé.
- **Button** (600, 12px, line-height 1): rótulo dos botões, com ícone de 13px ao lado.

### Named Rules
**A Regra do Piso de 12px.** Texto de conteúdo nunca abaixo de 12px — URL, contador,
rótulo de separador, feedback, rodapé. Números que formam coluna ou contador usam
`tabular-nums` para não dançar quando mudam.

## Layout

Três superfícies, um só esqueleto. **Popup** (720px): coluna única — barra de busca,
fita de ações, árvore com teto de 600px (`contain-intrinsic-size: 1px 500px`).
**Sidebar**: o mesmo esqueleto, mas a árvore cresce (`flex: 1`,
`contain-intrinsic-size: 1px 1000px`) e a URL da linha encolhe para 160px.
**Opções**: folha de 640px, centralizada, com padding de 24px 16px e cartões de 16px
de padding.

A árvore é uma coluna de linhas (`.tree-row`: flex, gap 6px, padding 7px 8px, raio 8px,
margem 3px 6px); a linha do bookmark recua 28px para alinhar com o nome da pasta, a
pasta recua 8px. O breadcrumb é uma fita colada no topo (`position: sticky`,
`backdrop-filter: blur(12px)`) com os dois botões de ação à esquerda e o caminho em
14px.

## Elevation & Depth

Plano, com exceção de três coisas: o breadcrumb (sombra `0 4px 6px -1px rgba(0,0,0,.05)`
porque flutua sobre a lista), o menu de contexto (`0 10px 24px rgba(16,24,40,.18)`,
porque é popover) e os botões (elevação mínima `0 1px 2px rgba(0,0,0,.05)`, que some ao
pressionar). A profundidade da lista vem de **hairline e hover** (`#eef4ff`), não de
sombra.

### Shadow Vocabulary
- **Sombra de botão** (`box-shadow: 0 1px 2px rgba(0,0,0,.05)`): botões em repouso;
  some no `:active`.
- **Sombra de breadcrumb** (`box-shadow: 0 4px 6px -1px rgba(0,0,0,.05)`): a fita de
  caminho grudada no topo da lista.
- **Sombra de popover** (`--menu-shadow: 0 10px 24px rgba(16,24,40,.18)`): menu de
  contexto; no modo escuro vira `0 12px 26px rgba(0,0,0,.45)`.
- **Realce de ação** (`box-shadow: 0 4px 12px rgba(124,58,237,.3)`): contador com
  seleção; e `0 4px 12px rgba(220,38,38,.35)` no hover do "Open".

### Named Rules
**A Regra da Sombra só no Flutuante.** Sombra marca o que está acima da lista (breadcrumb,
menu, contador) ou o que é pressionável (botão). A árvore, os cartões e os campos são
planos, separados por hairline.

## Shapes

Raio curto e repetido: **8px** nas linhas da árvore, nos botões, nos cartões pequenos, no
contador e nos itens do menu; **10px** no menu de contexto e nos cartões das opções;
**12px** no breadcrumb; **5px** no botão de pasta raiz; **4px** no realce de busca e nos
chips pequenos; **6px** no contador (pill curto, sem ser círculo). O botão de pasta raiz
mantém `min-width: 24px` e `height: 24px` — alvo de toque.

## Components

### Botões (Clean All Items / Open)
- **Shape:** raio 8px, altura mínima 32px, padding 6px 14px, 12px/600, gradiente
  vertical `#ffffff → #f8f9fa`, borda `#bfd0ea`, `box-shadow` de 1px.
- **Hover:** sobe 1px e ganha sombra maior (`0 3px 8px rgba(0,0,0,.12)`).
- **Secondary (Clean All Items):** tom azulado, `#eef2f8 → #e3e9f3`, borda `#c5cfdf`,
  tinta `#3f4c61`.
- **Primary (Open):** fundo `#ef4444`, borda `#dc2626`, texto branco; hover vai a
  `#dc2626`. **Desabilitado:** `#e0e0e0` / `#cccccc` / `#9e9e9e`, sem sombra, cursor
  travado.
- Ícone à esquerda (`☒`, `↗`, 13px) com `aria-hidden="true"` e o rótulo em texto.

### Contador de selecionados
- **Shape:** raio 6px, pill curto, padding 3px 10px, 12px/800 em caixa alta com
  tracking 0.05em, `tabular-nums`.
- **Estado:** em repouso é cinza (`#4b5563` sobre `#e5e7eb`); com seleção vira violeta
  (`#7c3aed`, texto branco) com halo de 12px.

### Barra de ferramentas e fita de ações
- **Shape:** raio 8px, borda `#dce3ee`, fundo `#f2f2f2`, padding 8px.
- Busca: campo de largura cheia com 34px de respiro à direita para o botão de limpar
  (círculo de 24px, `#d9dfeb`, `×` de 14px); o campo é o único elemento com `input`
  puro — o navegador desenha o resto.

### Árvore
- **Linha:** flex, gap 6px, margin 3px 6px, padding 7px 8px, raio 8px; hover
  `#eef4ff` e o título ganha peso 600.
- **Bookmark:** checkbox 16px (`accent-color: #4a7bff`), favicon 16px com raio 4px
  (fallback local 🔖), título com reticências, URL à direita em 12px `#475569`.
- **Pasta:** ícone 📁, título, botão 📌 (24×24) que define a pasta raiz — ativo fica
  âmbar (`color-mix` de `#ffc857`).
- **Separador:** linha de 1px `#d5deec` com rótulo opcional ao lado, em 12px.
- **Realce de busca:** a ocorrência vira `<mark>` com fundo `#fef08a` e tinta `#854d0e`.

### Breadcrumb
- **Fita:** `position: sticky` no topo, `backdrop-filter: blur(12px)`, fundo
  `rgba(255,255,255,.95)`, borda inferior de 2px `#f1f5f9`, raio 12px no topo, 14px.
- **Reset (↺):** 28×28, cinza; hover fica vermelho (`#ef4444`).
- **Selecionar visíveis (☐/☒):** 30×30, cinza; hover fica ciano (`#0ea5e9`).
- Desabilitado (nada visível): opacidade 0.4, sem hover.

### Menu de contexto
- **Popover:** `position: fixed`, z-index 9999, largura mínima 196px, padding 6px, raio
  10px, borda `#dce3ee`, fundo `#f8faff`, sombra de popover.
- **Itens:** botões de largura total, alinhados à esquerda, 12px, padding 8px 10px,
  raio 8px, hover `#e8f0ff`; separador de 1px em `color-mix(currentColor 18%)`.
- **Modo escuro:** só o menu troca (`prefers-color-scheme`): fundo `#202734`, texto
  `#f3f7ff`, sombra mais forte.

### Feedback
- Faixa de 6px 8px com raio 8px, 12px/600, cor por tipo: info `#1f3f82` sobre `#eef3ff`,
  erro `#8d1d1d` sobre `#ffe8e8`, sucesso `#1f6a3d` sobre `#e5f7ea`, aviso `#8a5a08`
  sobre `#fff4e4`. A mensagem some sozinha depois de 3s.

### Página de opções
- **Folha:** 640px, padding 24px 16px, fundo `#f5f7fb`.
- **Cartão:** branco, borda `#dce3ee`, raio 10px, padding 16px, gap 10px; título em
  14px caixa alta com tracking 0.05em (`#475569`).
- **Linha de opção:** rótulo de 160px (13px/600) + controle + dica de 12px.
- **Botão secundário** ("Reset to All Bookmarks"): borda `#cbd5e1`, fundo `#f8fafc`,
  tinta `#334155`, raio 6px, 12px/600.
- **Rodapé:** 12px, `#475569`, centralizado — "Changes are saved automatically."

## Do's and Don'ts

### Do:
- **Do** manter 12px como piso de texto de conteúdo e `tabular-nums` em contador e
  threshold.
- **Do** deixar a linha da árvore inteira clicável e o checkbox só como indicador.
- **Do** dar foco visível a todo controle (anel azul de 2px em `shared.css`).
- **Do** manter alvo de toque ≥24px nos botões.
- **Do** deixar o `shared.css` como fonte única do estilo das três telas.

### Don't:
- **Don't** usar violeta fora do contador de selecionados.
- **Don't** usar vermelho fora do "Open" e do reset da visão.
- **Don't** usar opacidade para texto secundário: cor explícita e medida (≥4.5:1).
- **Don't** duplicar regra de CSS em `popup.css`, `sidebar.css` ou `options.css` — lá
  só vai ajuste de layout.
- **Don't** usar `style.cssText` para estilo (só `hidden`/`left`/`top` do menu).
