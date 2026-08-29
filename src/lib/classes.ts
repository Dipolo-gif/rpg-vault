import type { Effects, SkillGrant } from "@/lib/effects";

/**
 * Guia das classes padrão de D&D 5e.
 *
 * Serve como ponto de partida, do mesmo jeito que o guia de talentos: você
 * escolhe a classe, ela mostra as habilidades por nível e você adiciona as que
 * o seu personagem já tem. O que dá para calcular entra ligado, e cada
 * habilidade vira uma linha na aba Classe, editável depois.
 *
 * As descrições são resumos do efeito em jogo, não o texto do livro. Se a sua
 * mesa mudou alguma regra, é só editar a habilidade depois de adicionar.
 */

/**
 * Habilidade que manda escolher perícias, como a Especialização do Ladino.
 *
 * A escolha é sua, mas o efeito não: você marca as perícias na própria
 * habilidade e ela passa a conceder o grau sozinha, do mesmo jeito que um item
 * ou um talento. Assim dá para dobrar quantas vezes a classe mandar, cada
 * habilidade cuidando das suas.
 */
export type EscolhaPericias = {
  quantidade: number;
  /** O que cada perícia escolhida recebe. */
  grau: SkillGrant;
  /** Vazio significa "qualquer perícia". */
  entre: string[];
  /**
   * Limita às perícias regidas por este atributo, como faz a Perícia de
   * Engenheiro ("duas perícias baseadas em Inteligência"). Pega também as
   * perícias próprias da sua mesa que usem o atributo.
   */
  atributo?: string;
  rotulo: string;
};

export type ClasseFeature = {
  key: string;
  nivel: number;
  nome: string;
  texto: string;
  /** Só ativa precisa ser ligada na hora do uso. */
  kind: "active" | "passive";
  effects: Effects;
  /** Perícias que a habilidade manda você escolher. */
  escolhas?: EscolhaPericias;
  /** O que depende de escolha sua e o app não tem como adivinhar. */
  avisos: string[];
};

export type ClasseCatalogo = {
  key: string;
  nome: string;
  dadoDeVida: string;
  /** Chaves de atributo. Viram proficiência em teste de resistência. */
  saves: string[];
  pericias: {
    escolher: number;
    /** Vazio significa "qualquer perícia". */
    entre: string[];
  };
  features: ClasseFeature[];
  /** A classe escolhe de uma lista à parte, como as engenhocas do engenheiro. */
  engenhocas?: boolean;
};

const nada: Effects = {};

/** Toda classe começa com as duas proficiências de resistência dela. */
function proficienciasIniciais(
  classe: string,
  saves: string[],
  pericias: ClasseCatalogo["pericias"],
): ClasseFeature {
  const lista =
    pericias.entre.length === 0
      ? "qualquer perícia"
      : `entre ${pericias.entre.length} opções`;

  return {
    key: `${classe}_proficiencias`,
    nivel: 1,
    nome: "Proficiências de classe",
    kind: "passive",
    texto: `Proficiência nos testes de resistência da classe. Você também escolhe ${pericias.escolher} ${pericias.escolher === 1 ? "perícia" : "perícias"} ${lista}.`,
    effects: {
      saves: Object.fromEntries(saves.map((s) => [s, "proficiente" as const])),
    },
    escolhas: {
      quantidade: pericias.escolher,
      grau: "proficiente",
      entre: pericias.entre,
      rotulo: `Escolha ${pericias.escolher} ${pericias.escolher === 1 ? "perícia" : "perícias"} da classe`,
    },
    avisos: [],
  };
}

type Bruta = Omit<ClasseFeature, "key" | "effects" | "avisos"> & {
  effects?: Effects;
  avisos?: string[];
};

function monta(
  key: string,
  nome: string,
  dadoDeVida: string,
  saves: string[],
  pericias: ClasseCatalogo["pericias"],
  brutas: Bruta[],
): ClasseCatalogo {
  return {
    key,
    nome,
    dadoDeVida,
    saves,
    pericias,
    features: [
      proficienciasIniciais(key, saves, pericias),
      ...brutas.map((f, i) => ({
        key: `${key}_${i}_${f.nome.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
        nivel: f.nivel,
        nome: f.nome,
        kind: f.kind,
        texto: f.texto,
        effects: f.effects ?? nada,
        escolhas: f.escolhas,
        avisos: f.avisos ?? [],
      })),
    ].sort((a, b) => a.nivel - b.nivel),
  };
}

/**
 * "Escolha X perícias e ganhe proficiência dobrada nelas."
 *
 * Cada habilidade dessas dobra as suas próprias perícias, então Ladino 1 e
 * Ladino 6 dobram duas cada uma, sem uma atrapalhar a outra.
 */
const expertise = (quantas: number): EscolhaPericias => ({
  quantidade: quantas,
  grau: "especialista",
  entre: [],
  rotulo: `Escolha ${quantas} perícias em que já é proficiente para dobrar`,
});

export const CLASSES: ClasseCatalogo[] = [
  monta(
    "barbaro",
    "Bárbaro",
    "d12",
    ["for", "con"],
    {
      escolher: 2,
      entre: [
        "lidar_animais",
        "atletismo",
        "intimidacao",
        "natureza",
        "percepcao",
        "sobrevivencia",
      ],
    },
    [
      {
        nivel: 1,
        nome: "Fúria",
        kind: "active",
        texto:
          "Como ação bônus, entra em fúria: vantagem em testes e resistências de Força, bônus no dano corpo a corpo e resistência a dano de concussão, cortante e perfurante. Dura 1 minuto.",
      },
      {
        nivel: 1,
        nome: "Defesa sem Armadura",
        kind: "passive",
        texto:
          "Sem armadura, sua CA é 10 + modificador de Destreza + modificador de Constituição.",
        avisos: ["Calcule a CA e digite na aba Ficha"],
      },
      {
        nivel: 2,
        nome: "Ataque Descuidado",
        kind: "active",
        texto:
          "No primeiro ataque do turno, troca defesa por ofensiva: vantagem no ataque, mas ataques contra você têm vantagem até o próximo turno.",
      },
      {
        nivel: 2,
        nome: "Sentido de Perigo",
        kind: "passive",
        texto:
          "Vantagem em resistências de Destreza contra efeitos que você possa ver, como armadilhas e magias.",
      },
      { nivel: 3, nome: "Caminho Primitivo", kind: "passive", texto: "Escolha o seu caminho de bárbaro.", avisos: ["Adicione as habilidades do caminho escolhido"] },
      { nivel: 5, nome: "Ataque Extra", kind: "passive", texto: "Ataca duas vezes ao usar a ação de Ataque." },
      { nivel: 5, nome: "Movimento Rápido", kind: "passive", texto: "Deslocamento aumenta em 3 metros sem armadura pesada." },
      { nivel: 7, nome: "Instinto Selvagem", kind: "passive", texto: "Vantagem em iniciativa, e pode agir mesmo surpreso se entrar em fúria." },
      { nivel: 9, nome: "Crítico Brutal", kind: "passive", texto: "Rola dados de dano extras em acertos críticos corpo a corpo." },
      { nivel: 11, nome: "Fúria Implacável", kind: "passive", texto: "Ao cair a 0 PV em fúria, pode ficar com 1 PV em vez de cair." },
      { nivel: 15, nome: "Fúria Persistente", kind: "passive", texto: "A fúria só acaba se você ficar inconsciente ou decidir encerrá-la." },
      { nivel: 18, nome: "Força Indômita", kind: "passive", texto: "Testes de Força abaixo do seu valor de Força usam o valor de Força." },
      { nivel: 20, nome: "Campeão Primitivo", kind: "passive", texto: "+4 em Força e Constituição, com máximo de 24.", effects: { atributos: { for: 4, con: 4 } } },
    ],
  ),

  monta(
    "bardo",
    "Bardo",
    "d8",
    ["des", "car"],
    { escolher: 3, entre: [] },
    [
      { nivel: 1, nome: "Conjuração", kind: "passive", texto: "Conjura magias de bardo usando Carisma. A CD é 8 + proficiência + modificador de Carisma." },
      {
        nivel: 1,
        nome: "Inspiração de Bardo",
        kind: "active",
        texto:
          "Ação bônus para dar um dado de inspiração a um aliado, que ele soma a um teste, ataque ou resistência.",
      },
      { nivel: 2, nome: "Aprendiz de Tudo", kind: "passive", texto: "Soma metade do bônus de proficiência (arredondado para baixo) em qualquer teste que já não use proficiência." },
      { nivel: 2, nome: "Canção de Descanso", kind: "passive", texto: "Aliados que descansam ouvindo você recuperam vida extra." },
      { nivel: 3, nome: "Colégio de Bardo", kind: "passive", texto: "Escolha o seu colégio.", avisos: ["Adicione as habilidades do colégio escolhido"] },
      {
        nivel: 3,
        nome: "Especialização",
        kind: "passive",
        texto: "Escolha duas perícias em que é proficiente: o bônus de proficiência é dobrado nelas.",
        escolhas: expertise(2),
      },
      { nivel: 5, nome: "Fonte de Inspiração", kind: "passive", texto: "Recupera os usos de Inspiração em descanso curto." },
      { nivel: 6, nome: "Contra-Encanto", kind: "active", texto: "Ação para dar vantagem contra medo e encantamento a quem ouvir você." },
      {
        nivel: 10,
        nome: "Especialização (segunda)",
        kind: "passive",
        texto: "Mais duas perícias com proficiência dobrada.",
        escolhas: expertise(2),
      },
      { nivel: 10, nome: "Segredos Mágicos", kind: "passive", texto: "Aprende magias de qualquer classe." },
      { nivel: 20, nome: "Inspiração Superior", kind: "passive", texto: "Recupera um uso de Inspiração ao rolar iniciativa, se estiver sem." },
    ],
  ),

  monta(
    "bruxo",
    "Bruxo",
    "d8",
    ["sab", "car"],
    {
      escolher: 2,
      entre: ["arcanismo", "blefar", "historia", "intimidacao", "investigacao", "natureza", "religiao"],
    },
    [
      { nivel: 1, nome: "Patrono Transcendental", kind: "passive", texto: "Escolha o seu patrono.", avisos: ["Adicione as habilidades do patrono escolhido"] },
      { nivel: 1, nome: "Magia de Pacto", kind: "passive", texto: "Poucos espaços de magia, sempre no nível mais alto, recuperados em descanso curto. Usa Carisma." },
      { nivel: 2, nome: "Invocações Místicas", kind: "passive", texto: "Aprende invocações que dão poderes permanentes.", avisos: ["Adicione cada invocação como uma habilidade"] },
      { nivel: 3, nome: "Dádiva do Pacto", kind: "passive", texto: "Escolha entre lâmina, corrente ou tomo." },
      { nivel: 11, nome: "Arcano Místico", kind: "active", texto: "Uma magia de nível 6 por descanso longo." },
      { nivel: 20, nome: "Mestre Místico", kind: "active", texto: "Recupera todos os espaços de pacto uma vez por descanso longo." },
    ],
  ),

  monta(
    "clerigo",
    "Clérigo",
    "d8",
    ["sab", "car"],
    { escolher: 2, entre: ["historia", "intuicao", "medicina", "persuasao", "religiao"] },
    [
      { nivel: 1, nome: "Conjuração", kind: "passive", texto: "Conjura magias de clérigo usando Sabedoria. A CD é 8 + proficiência + modificador de Sabedoria." },
      { nivel: 1, nome: "Domínio Divino", kind: "passive", texto: "Escolha o seu domínio.", avisos: ["Adicione as habilidades do domínio escolhido"] },
      { nivel: 2, nome: "Canalizar Divindade", kind: "active", texto: "Efeito divino recuperado em descanso curto, com opções vindas do domínio." },
      { nivel: 5, nome: "Destruir Mortos-Vivos", kind: "passive", texto: "Mortos-vivos fracos são destruídos em vez de expulsos." },
      { nivel: 10, nome: "Intervenção Divina", kind: "active", texto: "Pede ajuda direta à sua divindade, uma vez por semana." },
    ],
  ),

  monta(
    "druida",
    "Druida",
    "d8",
    ["int", "sab"],
    {
      escolher: 2,
      entre: ["arcanismo", "lidar_animais", "intuicao", "medicina", "natureza", "percepcao", "religiao", "sobrevivencia"],
    },
    [
      { nivel: 1, nome: "Druídico", kind: "passive", texto: "Fala a língua secreta dos druidas e deixa mensagens ocultas." },
      { nivel: 1, nome: "Conjuração", kind: "passive", texto: "Conjura magias de druida usando Sabedoria." },
      { nivel: 2, nome: "Forma Selvagem", kind: "active", texto: "Assume a forma de uma besta que já viu, mantendo mente e proficiências." },
      { nivel: 2, nome: "Círculo Druídico", kind: "passive", texto: "Escolha o seu círculo.", avisos: ["Adicione as habilidades do círculo escolhido"] },
      { nivel: 18, nome: "Corpo Atemporal", kind: "passive", texto: "Envelhece muito mais devagar." },
      { nivel: 18, nome: "Bestas Arcanas", kind: "passive", texto: "Conjura magias mesmo em forma selvagem." },
      { nivel: 20, nome: "Arquidruida", kind: "passive", texto: "Forma Selvagem ilimitada e dispensa componentes verbais e somáticos." },
    ],
  ),

  monta(
    "feiticeiro",
    "Feiticeiro",
    "d6",
    ["con", "car"],
    { escolher: 2, entre: ["arcanismo", "blefar", "intuicao", "intimidacao", "persuasao", "religiao"] },
    [
      { nivel: 1, nome: "Conjuração", kind: "passive", texto: "Conjura magias usando Carisma. A CD é 8 + proficiência + modificador de Carisma." },
      { nivel: 1, nome: "Origem de Feiticeiro", kind: "passive", texto: "Escolha a sua origem.", avisos: ["Adicione as habilidades da origem escolhida"] },
      { nivel: 2, nome: "Fonte de Magia", kind: "passive", texto: "Pontos de feitiçaria, que viram espaços de magia e vice-versa." },
      { nivel: 3, nome: "Metamagia", kind: "active", texto: "Modifica magias gastando pontos de feitiçaria.", avisos: ["Adicione cada metamagia escolhida como habilidade"] },
      { nivel: 20, nome: "Restauração Feiticeira", kind: "active", texto: "Recupera 4 pontos de feitiçaria em descanso curto." },
    ],
  ),

  monta(
    "guardiao",
    "Guardião",
    "d10",
    ["for", "des"],
    {
      escolher: 3,
      entre: ["lidar_animais", "atletismo", "furtividade", "intuicao", "investigacao", "natureza", "percepcao", "sobrevivencia"],
    },
    [
      { nivel: 1, nome: "Inimigo Favorito", kind: "passive", texto: "Vantagem para rastrear e lembrar de um tipo de criatura escolhido." },
      { nivel: 1, nome: "Explorador Naturalista", kind: "passive", texto: "Viaja e rastreia com facilidade no terreno escolhido." },
      { nivel: 2, nome: "Estilo de Luta", kind: "passive", texto: "Escolha um estilo de combate.", avisos: ["Adicione o estilo escolhido como habilidade"] },
      { nivel: 2, nome: "Conjuração", kind: "passive", texto: "Conjura magias de patrulheiro usando Sabedoria." },
      { nivel: 3, nome: "Arquétipo de Patrulheiro", kind: "passive", texto: "Escolha o seu arquétipo.", avisos: ["Adicione as habilidades do arquétipo escolhido"] },
      { nivel: 3, nome: "Consciência Primeva", kind: "active", texto: "Gasta um espaço de magia para sentir tipos de criatura por perto." },
      { nivel: 5, nome: "Ataque Extra", kind: "passive", texto: "Ataca duas vezes ao usar a ação de Ataque." },
      { nivel: 8, nome: "Andarilho", kind: "passive", texto: "Ignora terreno difícil e tem vantagem contra plantas que atrapalhem." },
      { nivel: 10, nome: "Esconder-se à Vista", kind: "active", texto: "Gasta 1 minuto para se camuflar e ganhar bônus alto em Furtividade parado." },
      { nivel: 14, nome: "Sumir", kind: "active", texto: "Esconde-se como ação bônus e não pode ser rastreado por meios não mágicos." },
      { nivel: 18, nome: "Sentidos Selvagens", kind: "passive", texto: "Percebe criaturas invisíveis por perto." },
      { nivel: 20, nome: "Matador de Presas", kind: "passive", texto: "Dano extra contra o seu inimigo favorito uma vez por turno." },
    ],
  ),

  monta(
    "guerreiro",
    "Guerreiro",
    "d10",
    ["for", "con"],
    {
      escolher: 2,
      entre: ["acrobacia", "lidar_animais", "atletismo", "historia", "intuicao", "intimidacao", "percepcao", "sobrevivencia"],
    },
    [
      { nivel: 1, nome: "Estilo de Luta", kind: "passive", texto: "Escolha um estilo de combate, como Defesa, Duelismo ou Arquearia.", avisos: ["Adicione o estilo escolhido como habilidade, com o bônus dele"] },
      { nivel: 1, nome: "Retomar o Fôlego", kind: "active", texto: "Ação bônus para recuperar 1d10 + nível de PV, uma vez por descanso." },
      { nivel: 2, nome: "Surto de Ação", kind: "active", texto: "Uma ação adicional no turno, recuperada em descanso curto." },
      { nivel: 3, nome: "Arquétipo Marcial", kind: "passive", texto: "Escolha o seu arquétipo.", avisos: ["Adicione as habilidades do arquétipo escolhido"] },
      { nivel: 5, nome: "Ataque Extra", kind: "passive", texto: "Ataca duas vezes ao usar a ação de Ataque. Vira três no 11 e quatro no 20." },
      { nivel: 9, nome: "Indomável", kind: "active", texto: "Repete um teste de resistência falhado, uma vez por descanso longo." },
    ],
  ),

  monta(
    "ladino",
    "Ladino",
    "d8",
    ["des", "int"],
    {
      escolher: 4,
      entre: [
        "acrobacia", "atletismo", "atuacao", "blefar", "furtividade", "intimidacao",
        "intuicao", "investigacao", "percepcao", "persuasao", "prestidigitacao",
      ],
    },
    [
      {
        nivel: 1,
        nome: "Especialização",
        kind: "passive",
        texto: "Escolha duas perícias em que é proficiente: o bônus de proficiência é dobrado nelas.",
        escolhas: expertise(2),
      },
      { nivel: 1, nome: "Ataque Furtivo", kind: "passive", texto: "Dano extra uma vez por turno quando tem vantagem ou um aliado está adjacente ao alvo." },
      { nivel: 1, nome: "Gíria de Ladrão", kind: "passive", texto: "Fala o código secreto do submundo." },
      { nivel: 2, nome: "Ação Ardilosa", kind: "passive", texto: "Corrida, Desengajar ou Esconder-se como ação bônus." },
      { nivel: 3, nome: "Arquétipo de Ladino", kind: "passive", texto: "Escolha o seu arquétipo.", avisos: ["Adicione as habilidades do arquétipo escolhido"] },
      { nivel: 5, nome: "Esquiva Sobrenatural", kind: "active", texto: "Reação para reduzir à metade o dano de um ataque que você vê." },
      {
        nivel: 6,
        nome: "Especialização (segunda)",
        kind: "passive",
        texto: "Mais duas perícias com proficiência dobrada.",
        escolhas: expertise(2),
      },
      { nivel: 7, nome: "Evasão", kind: "passive", texto: "Resistências de Destreza bem-sucedidas anulam o dano em vez de reduzir pela metade." },
      { nivel: 11, nome: "Talento Confiável", kind: "passive", texto: "Em perícias com proficiência, qualquer rolagem abaixo de 10 conta como 10." },
      { nivel: 14, nome: "Percepção Às Cegas", kind: "passive", texto: "Percebe criaturas invisíveis a até 3 metros." },
      { nivel: 15, nome: "Mente Escorregadia", kind: "passive", texto: "Proficiência em resistências de Sabedoria.", effects: { saves: { sab: "proficiente" } } },
      { nivel: 18, nome: "Escapista", kind: "passive", texto: "Ataques contra você não têm vantagem se você puder ver o atacante." },
      { nivel: 20, nome: "Golpe de Sorte", kind: "active", texto: "Transforma uma falha em acerto, uma vez por descanso longo." },
    ],
  ),

  monta(
    "mago",
    "Mago",
    "d6",
    ["int", "sab"],
    { escolher: 2, entre: ["arcanismo", "historia", "intuicao", "investigacao", "medicina", "religiao"] },
    [
      { nivel: 1, nome: "Conjuração", kind: "passive", texto: "Conjura magias do grimório usando Inteligência. A CD é 8 + proficiência + modificador de Inteligência." },
      { nivel: 1, nome: "Recuperação Arcana", kind: "active", texto: "Recupera espaços de magia em descanso curto, uma vez por dia." },
      { nivel: 2, nome: "Tradição Arcana", kind: "passive", texto: "Escolha a sua escola.", avisos: ["Adicione as habilidades da escola escolhida"] },
      { nivel: 18, nome: "Domínio de Magia", kind: "passive", texto: "Conjura uma magia de nível 1 e uma de nível 2 à vontade." },
      { nivel: 20, nome: "Magias Assinatura", kind: "passive", texto: "Duas magias de nível 3 sempre preparadas, uma vez cada por descanso curto." },
    ],
  ),

  monta(
    "monge",
    "Monge",
    "d8",
    ["for", "des"],
    { escolher: 2, entre: ["acrobacia", "atletismo", "furtividade", "historia", "intuicao", "religiao"] },
    [
      {
        nivel: 1,
        nome: "Defesa sem Armadura",
        kind: "passive",
        texto: "Sem armadura e sem escudo, sua CA é 10 + modificador de Destreza + modificador de Sabedoria.",
        avisos: ["Calcule a CA e digite na aba Ficha"],
      },
      { nivel: 1, nome: "Artes Marciais", kind: "passive", texto: "Usa Destreza com armas de monge, e ganha um ataque desarmado como ação bônus." },
      { nivel: 2, nome: "Ki", kind: "active", texto: "Pontos de ki que alimentam Rajada de Golpes, Defesa Paciente e Passo do Vento." },
      { nivel: 2, nome: "Movimento sem Armadura", kind: "passive", texto: "Deslocamento aumenta, e mais ainda conforme o nível." },
      { nivel: 3, nome: "Tradição Monástica", kind: "passive", texto: "Escolha a sua tradição.", avisos: ["Adicione as habilidades da tradição escolhida"] },
      { nivel: 3, nome: "Defletir Projéteis", kind: "active", texto: "Reação para reduzir o dano de um ataque à distância, e às vezes devolvê-lo." },
      { nivel: 4, nome: "Queda Lenta", kind: "active", texto: "Reação para reduzir o dano de queda." },
      { nivel: 5, nome: "Ataque Extra", kind: "passive", texto: "Ataca duas vezes ao usar a ação de Ataque." },
      { nivel: 5, nome: "Golpe Atordoante", kind: "active", texto: "Gasta ki para atordoar o alvo que falhar na resistência de Constituição." },
      { nivel: 6, nome: "Golpes com Ki", kind: "passive", texto: "Ataques desarmados contam como mágicos." },
      { nivel: 7, nome: "Evasão", kind: "passive", texto: "Resistências de Destreza bem-sucedidas anulam o dano." },
      { nivel: 7, nome: "Quietude Mental", kind: "active", texto: "Ação para se livrar de estar encantado ou amedrontado." },
      { nivel: 10, nome: "Pureza Corporal", kind: "passive", texto: "Imune a doença e veneno." },
      { nivel: 13, nome: "Língua do Sol e da Lua", kind: "passive", texto: "Entende e é entendido em qualquer idioma." },
      { nivel: 14, nome: "Alma de Diamante", kind: "passive", texto: "Proficiência em todos os testes de resistência." },
      { nivel: 15, nome: "Corpo Atemporal", kind: "passive", texto: "Não envelhece nem precisa de comida ou água." },
      { nivel: 18, nome: "Corpo Vazio", kind: "active", texto: "Fica invisível e resistente a quase todo dano por um tempo." },
      { nivel: 20, nome: "Ser Perfeito", kind: "passive", texto: "Recupera 4 pontos de ki ao rolar iniciativa sem nenhum." },
    ],
  ),

  monta(
    "paladino",
    "Paladino",
    "d10",
    ["sab", "car"],
    { escolher: 2, entre: ["atletismo", "intimidacao", "intuicao", "medicina", "persuasao", "religiao"] },
    [
      { nivel: 1, nome: "Sentido Divino", kind: "active", texto: "Ação para detectar celestiais, corruptores e mortos-vivos por perto." },
      { nivel: 1, nome: "Cura pelas Mãos", kind: "active", texto: "Reservatório de cura igual a 5 vezes o seu nível, gasto em pontos." },
      { nivel: 2, nome: "Estilo de Luta", kind: "passive", texto: "Escolha um estilo de combate.", avisos: ["Adicione o estilo escolhido como habilidade"] },
      { nivel: 2, nome: "Conjuração", kind: "passive", texto: "Conjura magias de paladino usando Carisma." },
      { nivel: 2, nome: "Castigo Divino", kind: "active", texto: "Gasta um espaço de magia ao acertar para causar dano radiante extra." },
      { nivel: 3, nome: "Saúde Divina", kind: "passive", texto: "Imune a doenças." },
      { nivel: 3, nome: "Juramento Sagrado", kind: "passive", texto: "Escolha o seu juramento.", avisos: ["Adicione as habilidades do juramento escolhido"] },
      { nivel: 5, nome: "Ataque Extra", kind: "passive", texto: "Ataca duas vezes ao usar a ação de Ataque." },
      { nivel: 6, nome: "Aura de Proteção", kind: "passive", texto: "Você e aliados por perto somam o seu modificador de Carisma nas resistências." },
      { nivel: 10, nome: "Aura de Coragem", kind: "passive", texto: "Você e aliados por perto não podem ser amedrontados." },
      { nivel: 11, nome: "Castigo Divino Aprimorado", kind: "passive", texto: "Todo ataque corpo a corpo causa 1d8 de dano radiante extra." },
      { nivel: 14, nome: "Toque Purificador", kind: "active", texto: "Ação para encerrar uma magia em você ou em quem tocar." },
    ],
  ),

  // Homebrew do D&D Wiki (dandwiki.com/wiki/Engineer_(5e_Class)), não é SRD.
  // As engenhocas são uma lista à parte, com 6 tiers: cada uma que você tiver
  // vira uma habilidade sua, com os efeitos dela.
  {
    ...monta(
    "engenheiro",
    "Engenheiro",
    "d8",
    ["des", "int"],
    {
      escolher: 3,
      entre: [
        "prestidigitacao",
        "arcanismo",
        "historia",
        "investigacao",
        "intuicao",
        "medicina",
        "percepcao",
        "atuacao",
        "furtividade",
      ],
    },
    [
      {
        nivel: 1,
        nome: "Engenhocas",
        kind: "passive",
        texto:
          "Você tem 3 engenhocas da lista, e mais 3 a cada tier que liberar (tier 2 no nível 3, tier 3 no 6, tier 4 no 10). Enquanto estiverem com você, estão sempre valendo. Ao subir de nível dá para trocar uma por outra que você já possa construir.",
        avisos: [
          "Adicione cada engenhoca como uma habilidade, com o efeito dela",
        ],
      },
      {
        nivel: 1,
        nome: "CD de Engenheiro",
        kind: "passive",
        texto:
          "A CD das suas capacidades é 8 + bônus de proficiência + modificador de Inteligência.",
        avisos: ["Digite a CD na aba Combate"],
      },
      {
        nivel: 2,
        nome: "Energia",
        kind: "passive",
        texto:
          "Você tem pontos de energia iguais ao seu nível de engenheiro. Recupera 1d6 no descanso curto e todos no longo. É o que paga as engenhocas e o dispositivo.",
        avisos: ["Controle os pontos na aba Ficha, em Medidores"],
      },
      {
        nivel: 2,
        nome: "Dispositivo Assinatura",
        kind: "passive",
        texto:
          "Escolha um entre lança-chamas, kit de granadas, arma de elixir, torreta, drone, omnimanopla mágica ou omnicajado mágico. Ele custa 25 po por nível e 4 horas para construir.",
        avisos: [
          "Adicione o dispositivo escolhido como item, e cada modo de uso dele como habilidade",
        ],
      },
      {
        nivel: 3,
        nome: "Especialização de Engenheiro",
        kind: "passive",
        texto:
          "Escolha o seu caminho: Battletech, Gadgeteer, Technotheurge ou Alquimista. Ele dá habilidades no 6, 11, 15 e 20.",
        avisos: ["Adicione as habilidades da especialização escolhida"],
      },
      {
        nivel: 5,
        nome: "Dispositivo Aprimorado",
        kind: "passive",
        texto:
          "Escolha uma melhoria para o seu dispositivo assinatura.",
        avisos: ["Adicione a melhoria escolhida como habilidade"],
      },
      {
        nivel: 6,
        nome: "Habilidade de Especialização (6)",
        kind: "passive",
        texto: "A capacidade que o seu caminho dá neste nível.",
        avisos: ["Adicione a habilidade do caminho escolhido"],
      },
      {
        nivel: 7,
        nome: "Perícia de Engenheiro",
        kind: "passive",
        texto:
          "Escolha duas perícias baseadas em Inteligência, ou uma perícia e ferramentas de artesão, ou duas ferramentas: você soma o dobro do bônus de proficiência nelas. Além disso, guardar e sacar uma arma ou objeto passa a ser ação bônus.",
        escolhas: {
          quantidade: 2,
          grau: "especialista",
          entre: [],
          atributo: "int",
          rotulo: "Escolha 2 perícias de Inteligência para dobrar",
        },
        avisos: [
          "Se você trocou uma perícia por ferramentas, marque só a que sobrou",
        ],
      },
      {
        nivel: 11,
        nome: "Habilidade de Especialização (11)",
        kind: "passive",
        texto: "A capacidade que o seu caminho dá neste nível.",
        avisos: ["Adicione a habilidade do caminho escolhido"],
      },
      {
        nivel: 13,
        nome: "Dispositivo Avançado",
        kind: "passive",
        texto: "Mais uma melhoria para o seu dispositivo assinatura.",
        avisos: ["Adicione a melhoria escolhida como habilidade"],
      },
      {
        nivel: 14,
        nome: "Mente Indomável",
        kind: "active",
        texto:
          "Uma vez por dia, se o total de um teste de Inteligência ficar abaixo do seu valor de Inteligência, você usa o valor no lugar do total. Ganha mais um uso no 17 e outro no 20.",
      },
      {
        nivel: 15,
        nome: "Habilidade de Especialização (15)",
        kind: "passive",
        texto: "A capacidade que o seu caminho dá neste nível.",
        avisos: ["Adicione a habilidade do caminho escolhido"],
      },
      {
        nivel: 17,
        nome: "Dispositivo Supremo",
        kind: "passive",
        texto: "A última melhoria do seu dispositivo assinatura.",
        avisos: ["Adicione a melhoria escolhida como habilidade"],
      },
      {
        nivel: 18,
        nome: "Canibalização",
        kind: "active",
        texto:
          "Você tira energia de uma engenhoca sua, ganhando energia igual ao tier dela. A engenhoca para de funcionar até o próximo descanso longo.",
      },
      {
        nivel: 20,
        nome: "Habilidade de Especialização (20)",
        kind: "passive",
        texto: "A capacidade final do seu caminho.",
        avisos: ["Adicione a habilidade do caminho escolhido"],
      },
    ],
    ),
    engenhocas: true,
  },
];

export function getClasse(key: string): ClasseCatalogo | undefined {
  return CLASSES.find((c) => c.key === key);
}
