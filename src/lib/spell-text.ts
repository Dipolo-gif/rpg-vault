/**
 * Leitura do texto de uma magia.
 *
 * A página do guia vem em inglês e corrido. Aqui ela vira parágrafos limpos
 * e, por cima, uma lista de destaques: dano, teste de resistência, tipo de
 * ataque, área e o que muda ao usar um espaço maior. É o que você olha no
 * meio do turno sem ler o texto inteiro.
 */

const TIPOS_DANO: Record<string, string> = {
  acid: "ácido",
  bludgeoning: "concussão",
  cold: "frio",
  fire: "fogo",
  force: "energia",
  lightning: "elétrico",
  necrotic: "necrótico",
  piercing: "perfurante",
  poison: "veneno",
  psychic: "psíquico",
  radiant: "radiante",
  slashing: "cortante",
  thunder: "trovejante",
};

const ATRIBUTOS: Record<string, string> = {
  strength: "Força",
  dexterity: "Destreza",
  constitution: "Constituição",
  intelligence: "Inteligência",
  wisdom: "Sabedoria",
  charisma: "Carisma",
};

const FORMAS: Record<string, string> = {
  radius: "raio",
  cone: "cone",
  cube: "cubo",
  line: "linha",
  sphere: "esfera",
  square: "quadrado",
  cylinder: "cilindro",
  wall: "muralha",
};

/** Pés viram metros como nos livros em português: 5 pés = 1,5 m. */
function metros(pes: number): string {
  const valor = pes * 0.3;
  return Number.isInteger(valor)
    ? `${valor} m`
    : `${valor.toFixed(1).replace(".", ",")} m`;
}

/** Tira as tags da página e devolve os parágrafos. */
export function extraiTexto(html: string): string {
  const conteudo = html.match(
    /<div id="page-content">([\s\S]*?)<div class="page-tags"/,
  );
  if (!conteudo) return "";

  return conteudo[1]
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(p|div|li|tr|h\d)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&mdash;|&ndash;/g, ", ")
    .replace(/&[a-z]+;/g, " ")
    .split("\n")
    .map((linha) => linha.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .filter(semCabecalho())
    .join("\n\n")
    .trim();
}

/**
 * A página repete escola, tempo, alcance e duração antes do texto, e a tela
 * já mostra tudo isso em cima. Então as linhas de cabeçalho saem fora, mas só
 * enquanto elas vierem no começo: "Duration" no meio da regra fica.
 */
function semCabecalho() {
  let noComeco = true;

  return (linha: string) => {
    if (!noComeco) return true;

    const cabecalho =
      /^(source|casting time|range|components|duration|classes|level)\s*:/i.test(
        linha,
      ) ||
      /^\d+(st|nd|rd|th)[-\s]level\s+\w+$/i.test(linha) ||
      /^\w+\s+cantrip$/i.test(linha);

    if (cabecalho) return false;
    noComeco = false;
    return true;
  };
}

/* ------------------------------------------------------------------ */
/* Tradução                                                             */
/* ------------------------------------------------------------------ */

/**
 * O guia é em inglês, então o texto passa por tradução antes de chegar na
 * tela. Dois passos: o serviço gratuito MyMemory faz o grosso, e um glossário
 * conserta o vocabulário de D&D, que tradutor automático sempre erra
 * ("saving throw" vira "jogada de salvamento", e na mesa é teste de
 * resistência).
 */

/** O MyMemory recusa pedaço grande, então o texto vai em fatias. */
const LIMITE_FATIA = 480;

/** Corta em frases inteiras, sem passar do limite. */
function fatia(texto: string): string[] {
  const frases = texto.split(/(?<=\.)\s+/);
  const partes: string[] = [];
  let atual = "";

  for (const frase of frases) {
    if (atual && atual.length + frase.length + 1 > LIMITE_FATIA) {
      partes.push(atual);
      atual = frase;
    } else {
      atual = atual ? `${atual} ${frase}` : frase;
    }
  }
  if (atual) partes.push(atual);

  return partes.flatMap((parte) =>
    parte.length <= LIMITE_FATIA
      ? [parte]
      : (parte.match(new RegExp(`[\\s\\S]{1,${LIMITE_FATIA}}`, "g")) ?? []),
  );
}

/** O vocabulário da mesa, por cima do que o tradutor devolveu. */
const GLOSSARIO: [RegExp, string][] = [
  [/jogadas? de salvamento/gi, "teste de resistência"],
  [/salvaguardas?/gi, "teste de resistência"],
  [/teste de resistência bem-sucedid[oa]/gi, "resistência bem-sucedida"],
  [/\bfeiti[çc]os?\b/gi, "magia"],
  [/\bencantamentos?\b/gi, "magia"],
  [/espa[çc]o de feiti[çc]o/gi, "espaço de magia"],
  [/slots? de (?:feiti[çc]o|magia)/gi, "espaço de magia"],
  [/n[íi]vel de slot/gi, "círculo"],
  [/\bconjurador\b/gi, "conjurador"],
  [/pontos de (?:acerto|vida|golpe)/gi, "pontos de vida"],
  [/\bjogada de ataque\b/gi, "jogada de ataque"],
  [/ataque de magia [àa] dist[âa]ncia/gi, "ataque mágico à distância"],
  [/ataque de magia corpo a corpo/gi, "ataque mágico corpo a corpo"],
  [/a[çc][ãa]o b[ôo]nus/gi, "ação bônus"],
  [/\bdano de trov[ãa]o\b/gi, "dano trovejante"],
  [/\bdano de for[çc]a\b/gi, "dano de energia"],
  [/\bdano radiante\b/gi, "dano radiante"],
  [/\bdano necrótico\b/gi, "dano necrótico"],
  [/\bcontund[ei]nte\b/gi, "concussão"],
  [/\bperfurante\b/gi, "perfurante"],
  [/\bcortante\b/gi, "cortante"],
  [/\bp[ée]s\b/gi, "metros"],
  [/\bcriatura hostil\b/gi, "criatura hostil"],
  [/\bdesvantagem\b/gi, "desvantagem"],
  [/\bvantagem\b/gi, "vantagem"],
  [/\bem n[íi]veis (?:mais )?(?:superiores|elevados|altos)\b/gi, "Em círculos maiores"],
  [/\bat higher levels\b/gi, "Em círculos maiores"],
  [/\bspell lists?\b/gi, "Listas de magia"],
];

function corrigeTermos(texto: string): string {
  return GLOSSARIO.reduce(
    (atual, [padrao, troca]) => atual.replace(padrao, troca),
    texto,
  );
}

/**
 * Pés viram metros no corpo do texto: "20-foot radius" vira "6 m radius".
 *
 * Isto roda ANTES da tradução, de propósito. Deixar para depois faz o
 * tradutor devolver "raio de 6 pés" e a conta ser feita duas vezes.
 */
function converteDistancias(texto: string): string {
  return texto
    .replace(/(\d+)[-\s]?(?:foot|feet)\b/gi, (_, pes) => metros(Number(pes)))
    .replace(/(\d+)[-\s]?mile[s]?\b/gi, (_, milhas) =>
      Number(milhas) === 1
        ? "1,5 km"
        : `${(Number(milhas) * 1.5).toString().replace(".", ",")} km`,
    );
}

/**
 * O glossário troca palavra feminina por masculina e vice-versa, então o
 * artigo fica errado. Isto arruma depois: "este magia" vira "esta magia".
 */
function ajustaGenero(texto: string): string {
  return texto
    .replace(/\b(um|est[ae]|ess[ae]|aquel[ae]|o|do|no|ao)\s+magia\b/gi, (m) => {
      const mapa: Record<string, string> = {
        um: "uma",
        este: "esta",
        esse: "essa",
        aquele: "aquela",
        o: "a",
        do: "da",
        no: "na",
        ao: "à",
      };
      const artigo = m.split(/\s+/)[0];
      const trocado = mapa[artigo.toLowerCase()] ?? artigo;
      return `${trocado} magia`;
    })
    .replace(
      /\b(uma|a|da|na|outra|essa|esta|aquela|nova|nenhuma|alguma|mesma)\s+teste de resistência\b/gi,
      (_, determinante: string) => {
        const mapa: Record<string, string> = {
          uma: "um",
          a: "o",
          da: "do",
          na: "no",
          outra: "outro",
          essa: "esse",
          esta: "este",
          aquela: "aquele",
          nova: "novo",
          nenhuma: "nenhum",
          alguma: "algum",
          mesma: "mesmo",
        };
        const trocado = mapa[determinante.toLowerCase()] ?? determinante;
        return `${trocado} teste de resistência`;
      },
    )
    .replace(/\bdano ígneo\b/gi, "dano de fogo")
    .replace(/\bsendo usados ou transportados\b/gi, "vestidos nem carregados");
}

async function traduzFatia(trecho: string): Promise<string | null> {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", trecho);
  url.searchParams.set("langpair", "en|pt-br");

  const resposta = await fetch(url, {
    headers: { "user-agent": "rpg-vault/1.0" },
    next: { revalidate: 2592000 },
  });
  if (!resposta.ok) return null;

  const dados = (await resposta.json()) as {
    responseStatus?: number | string;
    responseData?: { translatedText?: string };
  };

  if (Number(dados.responseStatus) !== 200) return null;
  const traduzido = dados.responseData?.translatedText;

  // O serviço devolve o aviso de cota dentro do próprio texto.
  if (!traduzido || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(traduzido)) {
    return null;
  }
  return traduzido;
}

export type Traducao = { texto: string; traduzido: boolean };

/**
 * Traduz o texto inteiro, parágrafo por parágrafo. Se o serviço falhar ou a
 * cota do dia acabar, devolve o original em inglês avisando, em vez de
 * entregar meia tradução.
 */
export async function traduz(texto: string): Promise<Traducao> {
  // As distâncias viram metros antes de ir para o tradutor.
  const paragrafos = converteDistancias(texto).split("\n\n");
  const saida: string[] = [];

  for (const paragrafo of paragrafos) {
    const partes: string[] = [];

    for (const trecho of fatia(paragrafo)) {
      const traduzido = await traduzFatia(trecho);
      if (traduzido === null) {
        return { texto, traduzido: false };
      }
      partes.push(traduzido);
    }

    saida.push(partes.join(" "));
  }

  return { texto: poli(saida.join("\n\n")), traduzido: true };
}

/**
 * O acabamento de uma tradução crua: glossário de D&D e concordância.
 *
 * Fica exportado porque a tradução também pode vir do navegador, quando a
 * cota do servidor acaba, e o acabamento tem que ser o mesmo nos dois casos.
 */
export function poli(texto: string): string {
  return ajustaGenero(corrigeTermos(texto));
}

/**
 * O texto pronto para traduzir fora daqui: distâncias já em metros, dividido
 * em parágrafos e, dentro de cada um, em pedaços que o serviço aceita.
 */
export function preparaParaTraduzir(texto: string): string[][] {
  return converteDistancias(texto)
    .split("\n\n")
    .map((paragrafo) => fatia(paragrafo));
}

export type Destaque = { rotulo: string; valor: string };

function unicos(valores: string[]): string[] {
  return [...new Set(valores)];
}

/** O que importa na hora de usar a magia, tirado do texto. */
export function destaques(texto: string): Destaque[] {
  const lista: Destaque[] = [];
  const add = (rotulo: string, valores: string[]) => {
    const limpos = unicos(valores.filter(Boolean));
    if (limpos.length > 0) {
      lista.push({ rotulo, valor: limpos.slice(0, 4).join(", ") });
    }
  };

  // 8d6 fire damage
  add(
    "Dano",
    [...texto.matchAll(/(\d+d\d+)(?:\s*\+\s*[^.,]{1,30}?)?\s+([a-z]+)\s+damage/gi)]
      .map(([, dados, tipo]) => {
        const nome = TIPOS_DANO[tipo.toLowerCase()];
        return nome ? `${dados} de ${nome}` : "";
      }),
  );

  // "regains 2d8 hit points" e "regains hit points equal to 1d8 + ..."
  add("Cura", [
    ...[...texto.matchAll(/regains?[^.]*?(\d+d\d+)[^.]*?hit points/gi)].map(
      ([, dados]) => `${dados} de vida`,
    ),
    ...[...texto.matchAll(/regains?[^.]*?hit points[^.]*?(\d+d\d+)/gi)].map(
      ([, dados]) => `${dados} de vida`,
    ),
  ]);

  // Dexterity saving throw
  add(
    "Resistência",
    [
      ...texto.matchAll(
        /(strength|dexterity|constitution|intelligence|wisdom|charisma)\s+saving throw/gi,
      ),
    ].map(([, atributo]) => ATRIBUTOS[atributo.toLowerCase()] ?? atributo),
  );

  // ranged spell attack
  add(
    "Ataque",
    [...texto.matchAll(/(ranged|melee)\s+(?:weapon\s+)?spell attack/gi)].map(
      ([, tipo]) =>
        tipo.toLowerCase() === "ranged"
          ? "ataque mágico à distância"
          : "ataque mágico corpo a corpo",
    ),
  );

  // 20-foot-radius sphere, 60-foot cone
  add(
    "Área",
    [
      ...texto.matchAll(
        /(\d+)[-\s]foot[-\s]?(radius|cone|cube|line|sphere|square|cylinder|wall)/gi,
      ),
    ].map(([, pes, forma]) => {
      const nome = FORMAS[forma.toLowerCase()];
      return nome ? `${metros(Number(pes))} de ${nome}` : "";
    }),
  );

  // Metade do dano em caso de sucesso
  if (/half as much damage|half damage/i.test(texto)) {
    lista.push({ rotulo: "No sucesso", valor: "metade do dano" });
  }

  if (/you must concentrate/i.test(texto) || /concentration/i.test(texto)) {
    // A ficha já mostra a marca de concentração, então aqui fica só o aviso
    // quando o texto fala de perder a magia.
    if (/lose concentration|concentration is broken/i.test(texto)) {
      lista.push({ rotulo: "Atenção", valor: "quebra se perder a concentração" });
    }
  }

  // At Higher Levels
  const maior = texto.match(
    /At Higher Levels[.:]?\s*([\s\S]{20,260}?)(?:\n\n|$)/i,
  );
  if (maior) {
    const dado = maior[1].match(/(\d+d\d+)/);
    lista.push({
      rotulo: "Em círculo maior",
      valor: dado ? `mais ${dado[1]} por círculo acima` : "escala, veja o texto",
    });
  }

  return lista;
}
