// Data access for the prototype.
// On GitHub Pages the data is fetched from ./data and ./img.
// In the single-file preview everything is embedded in window.__HANA_BUNDLE.
const B = typeof window !== 'undefined' ? window.__HANA_BUNDLE : null;
const IMG_RE = /img\/[0-9a-f]+\.(?:png|jpg|gif|webp|svg)/g;

function inlineImages(html) {
  if (!B || !html) return html;
  return html.replace(IMG_RE, (k) => B.img[k] || k);
}

export async function loadManifest() {
  if (B) return B.manifest;
  const r = await fetch('data/manifest.json');
  return r.json();
}

export async function loadGlyphs() {
  if (B) return B.glyphs;
  const r = await fetch('data/glyphs.svg');
  return r.text();
}

const cache = {};
export function loadScreen(file) {
  if (cache[file]) return cache[file];
  if (B) {
    const s = B.screens[file];
    cache[file] = Promise.resolve(s ? { ...s, html: inlineImages(s.html), fixed: inlineImages(s.fixed) } : null);
  } else {
    cache[file] = fetch(`data/screens/${file}.json`).then((r) => r.json());
  }
  return cache[file];
}
