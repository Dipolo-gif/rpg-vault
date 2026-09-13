/**
 * Gera src/lib/talents.ts a partir dos guias em PDF da mesa.
 *
 * Rodar: node scripts/gera-talentos.mjs "<compendio.pdf>"
 *
 * O compêndio traz a lista padrão de D&D 5e em português. O que dá para ligar
 * sozinho (aumento de atributo e proficiência em perícia) é detectado aqui e
 * vira efeito pronto. O resto fica na descrição, que o app mostra inteira.
 */
import fs from "node:fs";
import path from "node:path";

const ATRIBUTOS = {
  força: "for",
  forca: "for",
  destreza: "des",
  constituição: "con",
  constituicao: "con",
  inteligência: "int",
  inteligencia: "int",
  sabedoria: "sab",
  carisma: "car",
  sanidade: "san",
};

/** Nome que aparece no texto -> chave da perícia no app. */
const PERICIAS = {
  acrobacia: "acrobacia",
  arcanismo: "arcanismo",
  atletismo: "atletismo",
  atuação: "atuacao",
  atuacao: "atuacao",
  autocontrole: "autocontrole",
  blefar: "blefar",
  enganação: "blefar",
  enganacao: "blefar",
  ciências: "ciencias",
  ciencias: "ciencias",
  cyberarcanismo: "cyberarcanismo",
  engenharia: "engenharia",
  esquiva: "esquiva",
  furtividade: "furtividade",
  hacking: "hacking",
  história: "historia",
  historia: "historia",
  intimidação: "intimidacao",
  intimidacao: "intimidacao",
  intuição: "intuicao",
  intuicao: "intuicao",
  investigação: "investigacao",
  investigacao: "investigacao",
  "lidar com animais": "lidar_animais",
  "adestrar animais": "lidar_animais",
  malandragem: "malandragem",
  medicina: "medicina",
  metabolismo: "metabolismo",
  natureza: "natureza",
  percepção: "percepcao",
  percepcao: "percepcao",
  persuasão: "persuasao",
  persuasao: "persuasao",
  pilotagem: "pilotagem",
  prestidigitação: "prestidigitacao",
  prestidigitacao: "prestidigitacao",
  religião: "religiao",
  religiao: "religiao",
  sobrevivência: "sobrevivencia",
  sobrevivencia: "sobrevivencia",
};

async function extraiTexto(caminho) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(fs.readFileSync(caminho));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const linhas = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    let ultimo = null;
    let linha = "";
    for (const item of content.items) {
      const y = Math.round(item.transform[5]);
      if (ultimo !== null && Math.abs(y - ultimo) > 3) {
        linhas.push(linha.trim());
        linha = "";
      }
      linha += item.str;
      ultimo = y;
    }
    if (linha.trim()) linhas.push(linha.trim());
  }
  return linhas;
}

/** Junta as linhas do PDF desfazendo a hifenização de fim de linha. */
function juntaParagrafo(linhas) {
  // O marcador de lista do PDF vem como caractere de uso privado (U+F0B7) ou
  // como bala comum. Vira espa\u00E7o duplo, que o app quebra em par\u00E1grafo.
  const marcador = /[\uF0B7\u2022]\s*/g;
  return linhas
    .join("\n")
    .replace(/-\n/g, "")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(marcador, "  ")
    // Travess\u00E3o e meia-risca do PDF n\u00E3o entram no app: antes de n\u00FAmero
    // \u00E9 sinal de menos, no meio da frase vira v\u00EDrgula.
    .replace(/[\u2013\u2014](?=\s*\d)/g, "-")
    .replace(/\s*[\u2013\u2014]\s*/g, ", ")
    .replace(/^\s+/, "")
    .trim();
}

const ehTitulo = (linha) =>
  /^[A-ZÁÂÃÀÉÊÍÓÔÕÚÇ][A-ZÁÂÃÀÉÊÍÓÔÕÚÇ ,'-]{3,}$/.test(linha) &&
  !/^(PAGINA|CAPÍTULO|=)/.test(linha) &&
  linha.length >= 4;

function detectaEfeitos(texto) {
  const effects = {};
  const avisos = [];

  // "Aumente seu valor de Destreza em 1". Com escolha, deixa para o usuario.
  const aumentos = [...texto.matchAll(/aumente seu (?:valor|atributo) de ([^,\.]+?) em 1/gi)];
  for (const [, alvo] of aumentos) {
    const limpo = alvo.toLowerCase().replace(/\(.*?\)/g, "").trim();
    if (/\bou\b/.test(limpo)) {
      avisos.push(`Aumento de atributo à escolha: ${alvo.trim()}`);
      continue;
    }
    const chave = ATRIBUTOS[limpo];
    if (chave) {
      effects.atributos = { ...(effects.atributos ?? {}), [chave]: 1 };
    } else {
      avisos.push(`Aumento de atributo não reconhecido: ${alvo.trim()}`);
    }
  }

  // "proficiência na Perícia Acrobacia" / "proficiência nas perícias X e Y"
  const profs = [...texto.matchAll(/profici[êe]ncia (?:na|nas|em) (?:per[íi]cias?\s+)?([^\.;]+)/gi)];
  for (const [, alvo] of profs) {
    const bruto = alvo.toLowerCase();
    if (/\bou\b/.test(bruto)) {
      avisos.push(`Perícia à escolha: ${alvo.trim()}`);
      continue;
    }
    for (const [nome, chave] of Object.entries(PERICIAS)) {
      if (new RegExp(`\\b${nome}\\b`, "i").test(bruto)) {
        // A regra clássica: ganha proficiência, e dobra se já tiver.
        effects.pericias = {
          ...(effects.pericias ?? {}),
          [chave]: "dobra_se_ja_tiver",
        };
      }
    }
  }

  return { effects, avisos };
}

/** Os 9 talentos do GUIA DE TALENTOS, cujo PDF tem texto em duas colunas. */
const DA_CAMPANHA = [
  {
    nome: "Ás da Pilotagem",
    requisito: "Perícia Pilotagem",
    resumo: "Você nasceu atrás de um volante ou guidão.",
    atributo: "des",
    pericia: "pilotagem",
    extra:
      "Drift de Combate: pilotando um veículo, você pode usar uma Ação Bônus para uma manobra arriscada. A CA do veículo aumenta em +5 até o início do seu próximo turno, mas você tem desvantagem em ataques feitos de dentro dele.",
  },
  {
    nome: "Sistema Blindado",
    requisito: "Perícia Metabolismo",
    resumo: "Seu corpo processa toxinas e traumas como uma fornalha.",
    atributo: "con",
    pericia: "metabolismo",
    extra:
      "Sobrecarga Química: você consome droga, estimulante ou poção como Ação Bônus em vez de Ação. Tem Vantagem em testes de Metabolismo para resistir aos efeitos negativos das próprias modificações cibernéticas e a overdose ou vício de drogas sintéticas.",
  },
  {
    nome: "Tecnomancer Intuitivo",
    requisito: "Perícia Cyberarcanismo",
    resumo:
      "Você não apenas usa a tecnologia, você a entende como uma extensão da alma.",
    atributo: "int",
    pericia: "cyberarcanismo",
    extra:
      "Diagnóstico de Campo: com 1 minuto de análise em um dispositivo tecnológico ou mágico, você descobre as propriedades exatas dele, como a magia Identificar, sem gastar slot nem componentes.",
  },
  {
    nome: "Mestre da Sucata",
    requisito: "Perícia Engenharia",
    resumo: "Se dá para quebrar, dá para consertar. Ou transformar em bomba.",
    atributo: "int",
    pericia: "engenharia",
    extra:
      "Sabotagem Estrutural: seus ataques causam o dobro de dano a objetos e estruturas. Você também pode gastar 10 minutos para consertar um item de artífice quebrado, restaurando 1d8 pontos de vida do objeto ou recuperando uma carga gasta.",
  },
  {
    nome: "Fantasma da Rede",
    requisito: "Perícia Hacking",
    resumo: "Não existe firewall que segure você.",
    atributo: "int",
    pericia: "hacking",
    extra:
      "Backdoor: quando você falha em um teste de Hacking para invadir um sistema, o alarme não dispara na hora. O sistema só percebe a invasão no início do seu próximo turno, o que te dá uma última chance de tentar de novo ou desconectar em segurança.",
  },
  {
    nome: "Hacker de Combate",
    requisito: "Perícia Hacking",
    resumo: "O campo de batalha é digital, e você tem as chaves de acesso.",
    atributo: "int",
    pericia: null,
    extra:
      "Protocolo de Interrupção: como Ação Bônus, você tenta hackear um implante ou gadget de um inimigo visível a até 9 metros. O alvo faz um Teste de Resistência de Inteligência ou um teste de Metabolismo (CD 8 + seu bônus de proficiência + seu modificador de Inteligência). Se falhar, o equipamento sofre curto-circuito e para de funcionar até o final do próximo turno dele.",
  },
  {
    nome: "Rei da Rua",
    requisito: "Perícia Malandragem",
    resumo: "A cidade fala com você, e você sabe ouvir.",
    atributo: "sab",
    pericia: "malandragem",
    extra:
      "Sentido de Perigo: você não pode ser surpreendido em ambiente urbano enquanto estiver consciente. Ao observar um grupo social, você identifica na hora quem é a pessoa mais perigosa ou a figura de autoridade do local.",
  },
  {
    nome: "Psicólogo de Campo",
    requisito: "Perícia Autocontrole",
    resumo:
      "Nesse mundo de loucura, você é a âncora que impede seus aliados de afundarem.",
    atributo: "san",
    pericia: "autocontrole",
    extra:
      "Intervenção Terapêutica: quando você usa a ação de Ajuda para auxiliar um aliado em um teste de Sanidade ou Autocontrole, além da Vantagem normal ele soma o seu modificador de Sabedoria (ou Sanidade) ao resultado. O aumento de atributo pode ser em Sanidade ou Sabedoria, à sua escolha.",
  },
  {
    nome: "Erudito Prático",
    requisito: "Perícia Ciências",
    resumo: "Teoria é bom, mas aplicação prática é melhor.",
    atributo: "int",
    pericia: "ciencias",
    extra:
      "Escolha uma especialização científica (Química, Física, Biologia). Improvisação Científica: uma vez por descanso curto, você ganha Vantagem em um teste de outra perícia, desde que justifique cientificamente ao Mestre como o seu conhecimento se aplica.",
  },
];

function montaCampanha() {
  return DA_CAMPANHA.map((t) => {
    const effects = {};
    if (t.atributo) effects.atributos = { [t.atributo]: 1 };
    if (t.pericia) effects.pericias = { [t.pericia]: "dobra_se_ja_tiver" };

    const partes = [t.resumo];
    if (t.atributo) {
      const nome = Object.entries(ATRIBUTOS).find(([, v]) => v === t.atributo)?.[0];
      partes.push(`Aumente seu valor de ${nome} em 1, até um máximo de 20.`);
    }
    if (t.pericia) {
      partes.push(
        "Você ganha proficiência nessa perícia. Se já tiver, o seu bônus de proficiência é dobrado nos testes dela.",
      );
    }
    partes.push(t.extra);

    return {
      key: t.nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_"),
      nome: t.nome,
      fonte: "campanha",
      requisito: t.requisito,
      texto: partes.join(" "),
      effects,
      avisos: [],
    };
  });
}

async function main() {
  const compendio = process.argv[2];
  const linhas = await extraiTexto(compendio);

  const inicio = linhas.findIndex((l) => /^CAPÍTULO 4: TALENTOS$/.test(l));
  if (inicio < 0) throw new Error("Capítulo de talentos não encontrado");

  const talentos = [];
  let atual = null;

  for (const linha of linhas.slice(inicio + 1)) {
    if (/^===== PAGINA|^\d{1,3}$/.test(linha)) continue;
    if (ehTitulo(linha)) {
      if (atual) talentos.push(atual);
      atual = { nome: linha, corpo: [] };
      continue;
    }
    if (atual && linha) atual.corpo.push(linha);
  }
  if (atual) talentos.push(atual);

  const doCompendio = talentos
    .filter((t) => t.corpo.length > 0)
    .map((t) => {
      // O pré-requisito é uma linha inteira no PDF. Pegar antes de juntar os
      // parágrafos evita que ele engula a frase seguinte quando não tem ponto.
      const corpo = [...t.corpo];
      let requisito = null;
      if (/^Pré-requisito:/i.test(corpo[0] ?? "")) {
        requisito = corpo.shift().replace(/^Pré-requisito:\s*/i, "").trim();
        // O requisito pode quebrar em duas linhas. A continuação começa em
        // minúscula, ao contrário da frase seguinte, que começa em maiúscula.
        while (corpo.length > 0 && /^[a-zà-ú]/.test(corpo[0])) {
          requisito += ` ${corpo.shift().trim()}`;
        }
        requisito = requisito.replace(/\.$/, "").trim();
      }

      const texto = juntaParagrafo(corpo);
      const { effects, avisos } = detectaEfeitos(texto);
      const nome = t.nome.charAt(0) + t.nome.slice(1).toLowerCase();

      return {
        key: t.nome
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9]+/g, "_"),
        nome,
        fonte: "compendio",
        requisito,
        texto,
        effects,
        avisos,
      };
    });

  const todos = [...montaCampanha(), ...doCompendio].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR"),
  );

  const saida = `/**
 * Catálogo de talentos, gerado a partir dos guias da mesa.
 *
 * NÃO EDITE À MÃO: rode \`node scripts/gera-talentos.mjs "<compendio.pdf>"\`.
 *
 * O que dá para ligar sozinho vira \`effects\`, e o app aplica na hora que o
 * talento entra na ficha. O resto do texto fica em \`texto\`, mostrado inteiro
 * na aba Talentos. \`avisos\` guarda o que depende de escolha sua, como um
 * talento que deixa você escolher entre dois atributos.
 */
import type { Effects } from "@/lib/effects";

export type TalentoCatalogo = {
  key: string;
  nome: string;
  /** "campanha" veio do Guia de Talentos da mesa, "compendio" do livro. */
  fonte: "campanha" | "compendio";
  requisito: string | null;
  texto: string;
  effects: Effects;
  /** Pontos que o app não conseguiu ligar sozinho, e você resolve na mão. */
  avisos: string[];
};

export const TALENTOS: TalentoCatalogo[] = ${JSON.stringify(todos, null, 2)};

export function buscaTalentos(termo: string): TalentoCatalogo[] {
  const busca = termo.trim().toLowerCase();
  if (!busca) return TALENTOS;
  return TALENTOS.filter(
    (t) =>
      t.nome.toLowerCase().includes(busca) ||
      t.texto.toLowerCase().includes(busca),
  );
}
`;

  const destino = path.join(process.cwd(), "src/lib/talents.ts");
  fs.writeFileSync(destino, saida);

  const comEfeito = todos.filter(
    (t) => t.effects.atributos || t.effects.pericias,
  ).length;
  console.log(
    `${todos.length} talentos (${todos.filter((t) => t.fonte === "campanha").length} da campanha, ${doCompendio.length} do compêndio)`,
  );
  console.log(`${comEfeito} com efeito ligado automaticamente`);
  console.log(`${todos.filter((t) => t.avisos.length > 0).length} com escolha manual`);
}

main().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(1);
});
