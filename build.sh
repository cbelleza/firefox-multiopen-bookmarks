#!/usr/bin/env bash
# build.sh — Gera XPI para Firefox (AMO) — MultiOpen Bookmarks
# Uso: ./build.sh [--no-minify] [--with-sources] [--bump patch|minor|major]
# Saída: multiopen-bookmarks-v<VERSION>.xpi [+ multiopen-bookmarks-sources-v<VERSION>.zip]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

NO_MINIFY=0
WITH_SOURCES=0
BUMP=""
for arg in "$@"; do
  case "$arg" in
    --no-minify) NO_MINIFY=1 ;;
    --with-sources|--sources) WITH_SOURCES=1 ;;
    --bump) BUMP="patch" ;;
    --bump=*) BUMP="${arg#--bump=}" ;;
    --bump-patch) BUMP="patch" ;;
    --bump-minor) BUMP="minor" ;;
    --bump-major) BUMP="major" ;;
    -h|--help)
      echo "Uso: $0 [--no-minify] [--with-sources] [--bump patch|minor|major]"
      echo "  --no-minify     pula terser/cleancss"
      echo "  --with-sources  gera sources.zip para AMO (fontes não minificadas)"
      echo "  --bump          incrementa patch (ex: 1.3.0 → 1.3.1)"
      echo "  --bump=minor    incrementa minor (ex: 1.3.0 → 1.4.0)"
      echo "  --bump=major    incrementa major (ex: 1.3.0 → 2.0.0)"
      exit 0
      ;;
  esac
done
# suporte a --bump <tipo> separado por espaço
if [[ " $* " == *" --bump "* ]]; then
  # pega próximo argumento após --bump se for patch/minor/major
  args=("$@")
  for idx in "${!args[@]}"; do
    if [[ "${args[$idx]}" == "--bump" && $((idx+1)) -lt ${#args[@]} ]]; then
      nxt="${args[$((idx+1))]}"
      if [[ "$nxt" == "patch" || "$nxt" == "minor" || "$nxt" == "major" ]]; then
        BUMP="$nxt"
      fi
    fi
  done
fi

if ! command -v node >/dev/null 2>&1; then echo "ERRO: node não encontrado" >&2; exit 1; fi
if ! command -v zip >/dev/null 2>&1; then echo "ERRO: zip não encontrado" >&2; exit 1; fi

if [[ -n "$BUMP" ]]; then
  if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
    echo "ERRO: --bump espera patch|minor|major, recebido: $BUMP" >&2
    exit 1
  fi
  OLD_VERSION="$(node -p "require('./manifest.json').version")"
  NEW_VERSION="$(node -e "
    const fs=require('fs');
    let v=require('./manifest.json').version.split('.').map(Number);
    const t='$BUMP';
    if(t==='major'){ v[0]++; v[1]=0; v[2]=0; }
    else if(t==='minor'){ v[1]++; v[2]=0; }
    else { v[2]++; }
    const nv=v.join('.');
    const m=JSON.parse(fs.readFileSync('manifest.json','utf8'));
    m.version=nv;
    fs.writeFileSync('manifest.json', JSON.stringify(m,null,2)+'\\n');
    if(fs.existsSync('package.json')){
      const p=JSON.parse(fs.readFileSync('package.json','utf8'));
      p.version=nv;
      fs.writeFileSync('package.json', JSON.stringify(p,null,2)+'\\n');
    }
    // atualiza README ## Version se existir
    if(fs.existsSync('README.md')){
      let r=fs.readFileSync('README.md','utf8');
      r=r.replace(/## Version\\n[0-9]+\\.[0-9]+\\.[0-9]+/, '## Version\\n'+nv);
      r=r.replace(/multiopen-bookmarks(-sources)?-v[0-9]+\\.[0-9]+\\.[0-9]+/g, (m)=> m.replace(/v[0-9]+\\.[0-9]+\\.[0-9]+/, 'v'+nv));
      fs.writeFileSync('README.md', r);
    }
    console.log(nv);
  ")"
  echo "==> Bump $BUMP: $OLD_VERSION → $NEW_VERSION"
  VERSION="$NEW_VERSION"
else
  VERSION="$(node -p "require('./manifest.json').version")"
fi
echo "==> MultiOpen Bookmarks v$VERSION — build Store"

# 1. Limpeza
rm -rf dist build
mkdir -p dist/src/api dist/src/core dist/src/ui dist/src/utils dist/popup dist/sidebar dist/options dist/icons

# 2. Validação
if [[ -f package.json ]] && grep -q '"test"' package.json 2>/dev/null; then
  if command -v npm >/dev/null 2>&1; then
    echo "==> npm test"
    npm test --silent || { echo "Testes falharam" >&2; exit 1; }
  fi
else
  echo "==> Sem testes (package.json ausente ou sem script test) — pulando npm test"
fi

if command -v npx >/dev/null 2>&1 && npx --yes web-ext lint --help >/dev/null 2>&1; then
  echo "==> web-ext lint (source)"
  npx --yes web-ext lint --source-dir=. --ignore-files="build.sh" || true
fi

# Helpers
copy_or_minify_js() {
  local src="$1" dst="$2"
  mkdir -p "$(dirname "$dst")"
  if [[ $NO_MINIFY -eq 1 ]]; then cp "$src" "$dst"; return; fi
  if npx --yes terser --version >/dev/null 2>&1; then
    # tenta minificar preservando ESM; se falhar, copia original
    npx --yes terser "$src" --compress --mangle --module --output "$dst" 2>/dev/null \
      || npx --yes terser "$src" --compress --mangle --output "$dst" 2>/dev/null \
      || cp "$src" "$dst"
  else
    cp "$src" "$dst"
  fi
}

copy_or_minify_css() {
  local src="$1" dst="$2"
  mkdir -p "$(dirname "$dst")"
  if [[ $NO_MINIFY -eq 1 ]]; then cp "$src" "$dst"; return; fi
  if npx --yes -p clean-css-cli cleancss --version >/dev/null 2>&1; then
    npx --yes -p clean-css-cli cleancss -o "$dst" "$src" 2>/dev/null || cp "$src" "$dst"
  else
    cp "$src" "$dst"
  fi
}

echo "==> Copiando / minificando (use --no-minify para pular)"

# manifest & html (não minifica)
cp manifest.json dist/manifest.json
cp background.html dist/background.html
cp background.js dist/background.js
# tenta minificar background.js separadamente mas preserva original se falhar
if [[ $NO_MINIFY -eq 0 ]]; then
  copy_or_minify_js "background.js" "dist/background.js"
fi

cp popup/popup.html dist/popup/popup.html
cp sidebar/sidebar.html dist/sidebar/sidebar.html
cp options/options.html dist/options/options.html

copy_or_minify_js "popup/popup.js" "dist/popup/popup.js"
copy_or_minify_js "sidebar/sidebar.js" "dist/sidebar/sidebar.js"
copy_or_minify_js "options/options.js" "dist/options/options.js"

copy_or_minify_css "src/ui/shared.css" "dist/src/ui/shared.css"
copy_or_minify_css "popup/popup.css" "dist/popup/popup.css"
copy_or_minify_css "sidebar/sidebar.css" "dist/sidebar/sidebar.css"
copy_or_minify_css "options/options.css" "dist/options/options.css"

# src js — preserva estrutura para imports ESM
for f in src/api/*.js src/core/*.js src/ui/*.js src/utils/*.js; do
  [[ -f "$f" ]] || continue
  copy_or_minify_js "$f" "dist/$f"
done

# icons
cp -r icons/* dist/icons/ 2>/dev/null || true

# README opcional no XPI? não, só fontes
# 4. Gera XPI (reproduzível) — apenas versionado
echo "==> Gerando XPI"
rm -f multiopen-bookmarks.xpi multiopen-bookmarks-v*.xpi
(
  cd dist
  zip -r -X -FS "../multiopen-bookmarks-v${VERSION}.xpi" \
    manifest.json background.html background.js \
    popup sidebar options src icons \
    -x '*.DS_Store' -x '*/.DS_Store' >/dev/null
)

if command -v npx >/dev/null 2>&1 && npx --yes web-ext lint --help >/dev/null 2>&1; then
  echo "==> web-ext lint (dist)"
  npx --yes web-ext lint --source-dir=dist || true
fi

# 5. Pacote de fontes para AMO
if [[ $WITH_SOURCES -eq 1 ]]; then
  echo "==> Gerando sources.zip para AMO (--with-sources)"
  rm -f "multiopen-bookmarks-sources-v${VERSION}.zip"
  zip -r -X -FS "multiopen-bookmarks-sources-v${VERSION}.zip" \
    manifest.json background.html background.js \
    popup sidebar options src icons README.md build.sh \
    -x '*.DS_Store' -x '*/.DS_Store' \
    -x 'dist/*' -x 'build/*' -x '*.xpi' -x 'multiopen-bookmarks-sources*.zip' \
    -x '.git/*' -x 'node_modules/*' -x 'web-ext-artifacts/*' >/dev/null || true
else
  rm -f multiopen-bookmarks-sources-*.zip
fi

echo ""
echo "==> OK"
if [[ $WITH_SOURCES -eq 1 ]]; then
  ls -lh "multiopen-bookmarks-v${VERSION}.xpi" "multiopen-bookmarks-sources-v${VERSION}.zip" 2>/dev/null | awk '{print $9, "(" $5 ")"}'
else
  ls -lh "multiopen-bookmarks-v${VERSION}.xpi" 2>/dev/null | awk '{print $9, "(" $5 ")"}'
fi
# garante que não sobrou cópia não-versionada de builds antigos
rm -f multiopen-bookmarks.xpi
echo ""
echo "Pronto para upload em https://addons.mozilla.org/developers/"
echo "  - Envie multiopen-bookmarks-v${VERSION}.xpi"
if [[ $WITH_SOURCES -eq 1 ]]; then
  echo "  - Anexe multiopen-bookmarks-sources-v${VERSION}.zip em 'Source code' quando solicitar (AMO exige fontes se minificado)"
else
  echo "  - Para AMO com minificado, gere com: ./build.sh --with-sources"
fi
if [[ $NO_MINIFY -eq 0 ]]; then
  echo "  - Dica: valide local com: npx --yes web-ext lint --source-dir=dist"
  echo "  - Dica: teste temporário com: npx --yes web-ext run --source-dir=dist"
fi
