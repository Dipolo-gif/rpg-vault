#!/usr/bin/env node
/**
 * Gera o catalogo de magias a partir do indice do dnd5e.wikidot.com.
 *
 *   node scripts/gera-magias.mjs
 *
 * A pagina https://dnd5e.wikidot.com/spells tem uma tabela por nivel, na
 * ordem truque, 1 ate 9, com nome, escola, tempo de conjuracao, alcance,
 * duracao e componentes. E exatamente o que a ficha mostra na secao de
 * magias, entao o catalogo guarda isso e o link da pagina.
 *
 * O texto completo de cada magia nao entra: sao 574 paginas de livro, que
 * nao sao material nosso para redistribuir, e o repositorio e publico. Cada
 * magia adicionada ja vem com o link, e a descricao fica livre para voce
 * escrever ou colar o que a sua mesa usa.
 *
 * Saida: src/lib/spell-catalog.json (nao edite na mao, rode o script).
 */

import { writeFileSync } from "node:fs";

const INDICE = "https://dnd5e.wikidot.com/spells";
const SAIDA = new URL("../src/lib/spell-catalog.json", import.meta.url);

const ESCOLAS = {
  abjuration: "Abjuração",
  conjuration: "Conjuração",
  divination: "Adivinhação",
  enchantment: "Encantamento",
  evocation: "Evocação",
  illusion: "Ilusão",
  necromancy: "Necromancia",
  transmutation: "Transmutação",
};

/** Tira as tags e devolve o texto da celula. */
function limpa(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Pes viram metros como nos livros em portugues: 5 pes = 1,5 m. */
function metros(pes) {
  const valor = pes * 0.3;
  return Number.isInteger(valor)
    ? `${valor} m`
    : `${valor.toFixed(1).replace(".", ",")} m`;
}

function traduzAlcance(texto) {
  const t = texto.trim();
  if (/^self$/i.test(t)) return "Pessoal";
  if (/^touch$/i.test(t)) return "Toque";
  if (/^sight$/i.test(t)) return "Até onde você vê";
  if (/^unlimited$/i.test(t)) return "Ilimitado";
  if (/^special$/i.test(t)) return "Especial";

  const self = t.match(/^self\s*\(([^)]+)\)$/i);
  if (self) return `Pessoal (${traduzAlcance(self[1])})`;

  // "5 mile radius", "1 mile"
  const milhas = t.match(/^([\d.,]+)[-\s]*miles?/i);
  if (milhas) {
    const n = Number(milhas[1].replace(",", "."));
    const resto = t.slice(milhas[0].length).trim();
    const base =
      n === 1 ? "1,5 km" : `${(n * 1.5).toString().replace(".", ",")} km`;
    return resto ? `${base} ${traduzForma(resto)}` : base;
  }

  // O hífen de "15-foot cone" entra aqui junto.
  const pes = t.match(/^([\d.,]+)[-\s]*(?:feet|foot|ft\.?)/i);
  if (pes) {
    const resto = t.slice(pes[0].length).trim();
    const base = metros(Number(pes[1].replace(/[.,]/g, "")));
    return resto ? `${base} ${traduzForma(resto)}` : base;
  }

  return t;
}

function traduzForma(texto) {
  return texto
    .replace(/\bradius\b/gi, "de raio")
    .replace(/\bcone\b/gi, "de cone")
    .replace(/\bline\b/gi, "de linha")
    .replace(/\bcube\b/gi, "de cubo")
    .replace(/\bsphere\b/gi, "de esfera")
    .replace(/\bhemisphere\b/gi, "de hemisfério");
}

function traduzTempo(texto) {
  return texto
    .replace(/\binstantaneous\b/gi, "Instantânea")
    .replace(/\bor\b/gi, "ou")
    .replace(/\bbonus action\b/gi, "ação bônus")
    .replace(/\breaction\b/gi, "reação")
    .replace(/\baction\b/gi, "ação")
    .replace(/\brounds?\b/gi, (m) => (m.endsWith("s") ? "rodadas" : "rodada"))
    .replace(/\bminutes?\b/gi, (m) => (m.endsWith("s") ? "minutos" : "minuto"))
    .replace(/\bhours?\b/gi, (m) => (m.endsWith("s") ? "horas" : "hora"))
    .replace(/\bdays?\b/gi, (m) => (m.endsWith("s") ? "dias" : "dia"))
    .replace(/\bspecial\b/gi, "especial")
    .trim();
}

function traduzDuracao(texto) {
  const t = texto.trim();
  if (/^instantaneous$/i.test(t)) return "Instantânea";
  if (/^permanent$/i.test(t)) return "Permanente";
  if (/^special$/i.test(t)) return "Especial";
  if (/^until dispelled/i.test(t)) {
    return /triggered/i.test(t)
      ? "Até ser dissipada ou disparada"
      : "Até ser dissipada";
  }

  return traduzTempo(
    t
      .replace(/^concentration,?\s*up to\s*/i, "Concentração, até ")
      .replace(/^concentration,?\s*/i, "Concentração, ")
      .replace(/^up to\s*/i, "Até "),
  );
}

/** Divide o HTML em tabelas, e cada tabela em linhas de celulas. */
function tabelas(html) {
  return [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)].map((tabela) =>
    [...tabela[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
      .map((linha) => [...linha[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)])
      .filter((celulas) => celulas.length >= 6),
  );
}

const resposta = await fetch(INDICE, {
  headers: { "user-agent": "rpg-vault/1.0 (gerador de catalogo)" },
});
if (!resposta.ok) {
  console.error(`O indice respondeu ${resposta.status}. Tente de novo.`);
  process.exit(1);
}

const html = await resposta.text();
const grupos = tabelas(html);

if (grupos.length !== 10) {
  console.error(
    `Esperava 10 tabelas (truque ate nivel 9), achei ${grupos.length}. A pagina mudou de formato.`,
  );
  process.exit(1);
}

const magias = [];
const vistos = new Set();

grupos.forEach((linhas, nivel) => {
  for (const celulas of linhas) {
    const [nomeCelula, escola, tempo, alcance, duracao, componentes] =
      celulas.map((c) => c[1]);

    const slug = (nomeCelula.match(/href="\/spell:([^"]+)"/) ?? [])[1];
    const nome = limpa(nomeCelula);
    if (!nome || !slug || vistos.has(slug)) continue;
    vistos.add(slug);

    const duracaoLimpa = limpa(duracao);
    const escolaLimpa = limpa(escola).toLowerCase();

    magias.push({
      slug,
      nome,
      nivel,
      escola: ESCOLAS[escolaLimpa] ?? limpa(escola),
      tempo: traduzTempo(limpa(tempo)),
      alcance: traduzAlcance(limpa(alcance)),
      duracao: traduzDuracao(duracaoLimpa),
      componentes: limpa(componentes),
      concentracao: /concentration/i.test(duracaoLimpa),
      link: `https://dnd5e.wikidot.com/spell:${slug}`,
    });
  }
});

magias.sort((a, b) => a.nivel - b.nivel || a.nome.localeCompare(b.nome, "en"));

writeFileSync(SAIDA, `${JSON.stringify(magias, null, 2)}\n`, "utf8");

const porNivel = magias.reduce((conta, m) => {
  conta[m.nivel] = (conta[m.nivel] ?? 0) + 1;
  return conta;
}, {});

console.log(`${magias.length} magias gravadas em src/lib/spell-catalog.json`);
console.log(
  Object.entries(porNivel)
    .map(([nivel, total]) => `${nivel === "0" ? "truque" : `nível ${nivel}`}: ${total}`)
    .join(", "),
);
