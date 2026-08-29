import type { Effects } from "@/lib/effects";

/**
 * Engenhocas do Engenheiro, do D&D Wiki.
 *
 * Elas não são habilidades de nível: são uma lista de onde você escolhe. No
 * nível 1 você tem 3, e ganha mais 3 a cada tier que liberar. Enquanto
 * estiverem com você, as passivas estão sempre valendo, então cada engenhoca
 * escolhida vira uma habilidade sua, com os efeitos que dá para calcular já
 * ligados.
 *
 * As descrições são resumos do efeito em jogo, não o texto da página. O que
 * depende do seu modificador na hora (somar INT em Furtividade, por exemplo) o
 * app não tem como cravar, então vira aviso.
 */

export type Engenhoca = {
  key: string;
  nome: string;
  tier: number;
  kind: "active" | "passive";
  texto: string;
  effects: Effects;
  avisos: string[];
};

/** Cada tier libera num nível de engenheiro, e custa para construir. */
export const TIERS = [
  { tier: 1, nivel: 1, custo: "25 po / 2 horas" },
  { tier: 2, nivel: 3, custo: "40 po / 4 horas" },
  { tier: 3, nivel: 6, custo: "75 po / 6 horas" },
  { tier: 4, nivel: 10, custo: "150 po / 8 horas" },
  { tier: 5, nivel: 14, custo: "500 po / 12 horas" },
  { tier: 6, nivel: 18, custo: "1000 po / 24 horas" },
] as const;

export function nivelDoTier(tier: number): number {
  return TIERS.find((entrada) => entrada.tier === tier)?.nivel ?? 1;
}

const nada: Effects = {};

type Bruta = Omit<Engenhoca, "key" | "effects" | "avisos"> & {
  effects?: Effects;
  avisos?: string[];
};

const BRUTAS: Bruta[] = [
  /* ---------------------------------------------------------------- */
  /* Tier 1                                                            */
  /* ---------------------------------------------------------------- */
  {
    nome: "Botas de Propulsão",
    tier: 1,
    kind: "passive",
    texto:
      "Deslocamento aumenta em 3 metros. Salto em altura e distância dobrado, usando Inteligência no lugar de Força. Dano de queda pela metade, e você não cai no chão.",
    avisos: ["Some os 3 metros no deslocamento, na aba Ficha"],
  },
  {
    nome: "Kit Médico",
    tier: 1,
    kind: "active",
    texto:
      "Reservatório de cura igual ao seu nível de engenheiro vezes 5, gasto tocando uma criatura por ação. Recarrega em descanso curto ou longo. Não funciona em mortos-vivos nem construtos. Por 1 de energia, estabiliza um moribundo com 1 PV.",
  },
  {
    nome: "Lente de Águia",
    tier: 1,
    kind: "active",
    texto:
      "Soma o seu modificador de Inteligência (mínimo 1) nos testes de Percepção e dá +1 nos ataques à distância. Por 1 de energia, vantagem em um ataque com arma.",
    effects: { acerto: 1 },
    avisos: [
      "O +1 vale só à distância, então ligue a engenhoca ao usar arma de longe",
      "Some o seu modificador de INT no ajuste de Percepção, na aba Ficha",
    ],
  },
  {
    nome: "Garras de Escalada",
    tier: 1,
    kind: "passive",
    texto: "Você tem os efeitos de Andar nas Paredes o tempo todo.",
  },
  {
    nome: "Infusor Sanguíneo de Sustento",
    tier: 1,
    kind: "passive",
    texto:
      "Não precisa comer nem beber. Máximo de pontos de vida aumenta em 1 por nível de engenheiro. Proficiência em testes de resistência de Constituição. Por 2 de energia, cura um veneno ou doença como ação bônus.",
    effects: { saves: { con: "proficiente" } },
    avisos: ["Some 1 PV por nível no máximo de vida, na aba Ficha"],
  },
  {
    nome: "Lente Arcana",
    tier: 1,
    kind: "active",
    texto:
      "Como ação, lança Detectar Magia sem ser magia. Por 1 de energia, lança Identificação em qualquer objeto na sua linha de visão.",
  },
  {
    nome: "Braço Mecânico Retrátil",
    tier: 1,
    kind: "active",
    texto:
      "Uma mão mecânica retrátil que alcança até 9 metros e funciona como um Mãos Mágicas sem duração.",
  },

  /* ---------------------------------------------------------------- */
  /* Tier 2, nível 3                                                   */
  /* ---------------------------------------------------------------- */
  {
    nome: "Lente de Batedor",
    tier: 2,
    kind: "passive",
    texto:
      "Enxerga no escuro, inclusive escuridão mágica, a até 18 metros, sem penalidade. Enxerga mais 18 metros como se fosse penumbra, e amplia o que olha em duas vezes.",
  },
  {
    nome: "Modulador de Voz",
    tier: 2,
    kind: "active",
    texto:
      "Depois de ouvir alguém falar por um minuto, imita a voz sem falha, e só um teste de Intuição desconfia. Muda o tom de qualquer voz que passe pelo aparelho. Por 1 de energia, aumenta o volume em dez vezes.",
  },
  {
    nome: "Equipamento de Mergulho",
    tier: 2,
    kind: "passive",
    texto:
      "Deslocamento de natação igual ao seu deslocamento normal. Por 2 de energia, respira debaixo d'água por uma hora.",
  },
  {
    nome: "Capacete Mecânico",
    tier: 2,
    kind: "passive",
    texto:
      "Soma 1 na sua CA. Por 2 de energia, solta um ruído agudo que ensurdece todos os seres vivos num raio de 4,5 metros até o começo do seu próximo turno.",
    effects: { ca: 1 },
  },
  {
    nome: "Luvas de Mestre Artesão",
    tier: 2,
    kind: "passive",
    texto:
      "Constrói itens mecânicos, engenhocas e dispositivos na metade do tempo, e tem vantagem em testes de construção e conserto. Por 1 de energia, o dedo indicador solta uma chama pequena.",
  },

  /* ---------------------------------------------------------------- */
  /* Tier 3, nível 6                                                   */
  /* ---------------------------------------------------------------- */
  {
    nome: "Cápsula de Captura",
    tier: 3,
    kind: "active",
    texto:
      "Arremessa na criatura a até 6 metros com um ataque. Acertando, ela é sugada e você faz um teste de Lidar com Animais contra CD 10 + ND dela. Vantagem no arremesso se ela estiver envenenada, contida, inconsciente, paralisada ou congelada. Capturada, ela é invocada e dispensada como ação e age a seu favor. Falhar no teste, ou a criatura morrer, destrói a cápsula. Enquanto ela estiver presa, seu máximo de energia cai em 2.",
  },
  {
    nome: "Feixe de Nanites",
    tier: 3,
    kind: "active",
    texto:
      "Por 2 de energia, cura um aliado a até 9 metros em 3d4 mais o modificador de Inteligência, com um d4 a mais no nível 11 e outro no 17. Por 2 de energia, como reação, dá vantagem numa resistência de Constituição de quem estiver a até 9 metros.",
  },
  {
    nome: "Gatilho de Sobrecarga",
    tier: 3,
    kind: "active",
    texto:
      "Por 3 de energia, ação bônus para ganhar os efeitos de Acelerar por um minuto, sem precisar de concentração.",
  },
  {
    nome: "Escudo de Grade",
    tier: 3,
    kind: "active",
    texto:
      "Por 1 de energia, ação para somar o seu modificador de Inteligência na CA por 3 rodadas. Por 2, cria um escudo de 1,5 metro à sua frente que dá cobertura parcial e dura uma hora. Por 3, um campo que deixa sua CA em 13 mais o modificador de Inteligência sem armadura, ou vira um escudo com 10 mais 6 por nível de PV por cima da armadura, por 12 horas.",
    avisos: ["Digite o bônus de CA na habilidade quando ligar, se quiser somar"],
  },
  {
    nome: "Leitor Tanático",
    tier: 3,
    kind: "passive",
    texto:
      "Detecta mortos-vivos a até 18 metros e identifica como e quando um cadáver morreu. Por 3 de energia, lança Falar com os Mortos sem ser magia.",
  },
  {
    nome: "Máscara de Disfarce",
    tier: 3,
    kind: "passive",
    texto:
      "Proficiência em testes de resistência de Carisma. Por 1 de energia, lança Disfarçar-se sem ser magia.",
    effects: { saves: { car: "proficiente" } },
  },
  {
    nome: "Leitor de Almas",
    tier: 3,
    kind: "passive",
    texto:
      "Proficiência em Intuição. Por 1 de energia, lança Detectar o Bem e o Mal. Por 2, lança Falsa Vida (1d10 mais o seu nível) em você ou num aliado.",
    effects: { pericias: { intuicao: "proficiente" } },
  },
  {
    nome: "Cantil de Energia",
    tier: 3,
    kind: "active",
    texto:
      "Ação bônus para recuperar 2d6 de energia. Enche de novo a cada descanso longo.",
  },
  {
    nome: "Dispositivo de Autorressurreição",
    tier: 3,
    kind: "active",
    texto:
      "Por 2 de energia, quando um dano fosse te levar a 0 PV sem te matar de vez, reação para ficar com 1 PV. Por 4, tenta reviver com 1 PV alguém ao seu lado que morreu no último minuto, com resistência de Constituição CD 20.",
  },

  /* ---------------------------------------------------------------- */
  /* Tier 4, nível 10                                                  */
  /* ---------------------------------------------------------------- */
  {
    nome: "Reservatório de Energia Excedente",
    tier: 4,
    kind: "passive",
    texto:
      "Soma 3 mais o modificador de Inteligência no seu máximo de energia. Ao levar 10 ou mais de dano elétrico, reação para recuperar 1 de energia, até três vezes por descanso.",
  },
  {
    nome: "Onitradutor",
    tier: 4,
    kind: "passive",
    texto:
      "Quem sabe pelo menos um idioma entende tudo que você fala, e você entende qualquer idioma falado.",
  },
  {
    nome: "Mochila a Jato",
    tier: 4,
    kind: "active",
    texto:
      "Lança Levitação à vontade. Por 4 de energia, voo de 18 metros por dez minutos. Por 4, avança 36 metros em linha reta, e quem estiver no caminho faz resistência de Destreza ou cai no chão.",
  },
  {
    nome: "Sapatos Flutuantes",
    tier: 4,
    kind: "passive",
    texto:
      "Anda e corre sobre qualquer líquido como se fosse pedra. Líquidos perigosos, como lava e ácido, ainda causam 2d6 do tipo apropriado por rodada em cima deles.",
  },
  {
    nome: "Sistema Engitech de Ataque",
    tier: 4,
    kind: "active",
    texto:
      "Por 3 de energia, ação bônus para carregar uma arma a até 9 metros com ácido, frio, fogo, elétrico, energia, veneno ou trovejante: o próximo ataque dela causa 2d8 a mais do tipo escolhido. Por 3, dispara um feixe a até 3 metros causando 2d6 mais o seu nível de dano de energia, e com 1 de energia a mais o alvo faz resistência de Força ou é arremessado 1,5 metro por nível.",
  },
  {
    nome: "Sistema Engitech de Defesa",
    tier: 4,
    kind: "passive",
    texto:
      "PV temporários iguais a um quinto do seu nível de engenheiro, recuperados no começo de cada turno. Por 3 de energia, reação para reduzir o dano de um ataque à distância em 4d8 mais o seu nível, e zerando o dano pode gastar 1 a mais para devolver o disparo.",
  },
  {
    nome: "Óculos de Espectrovisão",
    tier: 4,
    kind: "active",
    texto:
      "Por 1 de energia, enxerga o plano etéreo e criaturas invisíveis a até 9 metros por dez minutos. Por 2, enxerga através de qualquer parede ou objeto que observar por seis segundos, durante um minuto.",
  },
  {
    nome: "Manto Holográfico",
    tier: 4,
    kind: "passive",
    texto:
      "Bônus em Furtividade igual ao seu modificador de Inteligência. Por 2 de energia, ao ficar incapacitado ou ao Desengajar, fica invisível por três turnos e cria quatro cópias ilusórias. Por 5, lança Invisibilidade Superior sem ser magia.",
    avisos: ["Some o seu modificador de INT no ajuste de Furtividade, na Ficha"],
  },

  /* ---------------------------------------------------------------- */
  /* Tier 5, nível 14                                                  */
  /* ---------------------------------------------------------------- */
  {
    nome: "Manipulador de Gravidade",
    tier: 5,
    kind: "active",
    texto:
      "Por 4 de energia, lança Reverter Gravidade. Por 4, cria uma zona de gravidade pesada: peso dobrado, deslocamento e saltos pela metade, quem voa faz resistência de Força ou cai, dano de queda dobrado e sobrecarregados levam 2d6 de concussão por turno.",
  },
  {
    nome: "Escudo Arcano",
    tier: 5,
    kind: "passive",
    texto:
      "Se não sair do lugar no seu turno, vantagem em resistências contra magia até o próximo turno. Por 3 de energia, ao passar numa resistência contra magia que só mira você, ela não te afeta e volta para quem conjurou, usando os números dele.",
  },
  {
    nome: "Raio Congelante",
    tier: 5,
    kind: "active",
    texto:
      "Por 2 de energia, névoa de gelo num alvo a até 9 metros: resistência de Constituição ou 6d4 de frio e preso no gelo por 2 rodadas, quebrando se levar dano. Por 2, um icicle a até 18 metros: resistência de Destreza ou 4d6 perfurante e 3d6 de frio, com 6d6 a mais na falha crítica. Cada uso aumenta o custo em 1 até você descansar.",
  },
  {
    nome: "Desintegrador",
    tier: 5,
    kind: "active",
    texto:
      "Por 5 de energia, um alvo a até 36 metros faz resistência de Destreza ou leva 10d12 mais 40 de dano de energia, virando pó se chegar a 0 PV. Cada criatura só pode ser alvo dele uma vez por dia.",
  },
  {
    nome: "Morteiro Leve",
    tier: 5,
    kind: "active",
    texto:
      "Carregado em partes: uma rodada para montar em parte, um minuto para montar inteiro, e você não usa as mãos enquanto ele estiver montado. Montado em parte, 2 de energia repetem uma Bola de Fogo com alcance de 90 metros. Inteiro, 5 de energia repetem uma detonação de Chuva de Meteoros, com teste de Inteligência CD 18 para não errar o alvo, uma vez a cada cinco rodadas.",
  },
  {
    nome: "Capacete Neuroadaptável",
    tier: 5,
    kind: "passive",
    texto:
      "Proficiência em testes de resistência de Sabedoria e resistência a dano psíquico. Por 1 de energia, seus pensamentos ficam ilegíveis por uma hora. Por 3, lança Dominar Pessoa por até dez minutos.",
    effects: { saves: { sab: "proficiente" } },
  },

  /* ---------------------------------------------------------------- */
  /* Tier 6, nível 18                                                  */
  /* ---------------------------------------------------------------- */
  {
    nome: "Aparato de Réplicas",
    tier: 6,
    kind: "active",
    texto:
      "Cria réplicas de criaturas como o Simulacro, mas em engrenagem e carne falsa, sem ser magia e sem poder ser dissipada. Cada PV da réplica custa 1 de energia no lugar do dinheiro. Enquanto ela existir, seu máximo de energia cai em 7, e só dá para ter uma.",
  },
  {
    nome: "Implante de Aceleração Mental",
    tier: 6,
    kind: "active",
    texto:
      "Por 3 de energia, age primeiro na iniciativa, não importa a rolagem. Por 4, uma ação lendária a qualquer momento da ordem, com movimento. Por 5, repete Parar o Tempo até o fim do seu próximo turno, e por 3 a mais estica um turno. Sai com um nível de exaustão a cada dois turnos de efeito.",
  },
  {
    nome: "Olho Biônico",
    tier: 6,
    kind: "active",
    texto:
      "Por 6 de energia, a sua margem de crítico aumenta em 4 por um minuto, e os críticos causam 6d6 a mais. Enxerga através de ilusões nesse tempo. Quando acaba, você fica cego por um minuto, e nada tira essa cegueira.",
  },
  {
    nome: "Tornozeleiras de Piscar",
    tier: 6,
    kind: "active",
    texto:
      "Por 1 de energia, ação bônus para teleportar 6 metros sem provocar ataques de oportunidade. Por 2, teleporta um objeto ou pessoa a até 18 metros, com resistência de Destreza para quem não quiser. Por 2, reação para dar desvantagem no ataque de quem você está vendo.",
  },
  {
    nome: "Fonte de Energia Reserva",
    tier: 6,
    kind: "passive",
    texto: "Aumenta o seu máximo de energia em 6.",
  },
  {
    nome: "Calculadora Quântica de Possibilidades",
    tier: 6,
    kind: "active",
    texto:
      "Uma vez por minuto, ganha os efeitos de Orientação. Por 1 de energia, Encontrar Armadilhas. Por 4, Comunhão com a matriz da calculadora. Por 4, Encontrar o Caminho, sem precisar conhecer o destino. Por 7, Presciência por dez minutos.",
  },
];

export const ENGENHOCAS: Engenhoca[] = BRUTAS.map((bruta, index) => ({
  key: `${bruta.tier}_${index}_${bruta.nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "_")}`,
  nome: bruta.nome,
  tier: bruta.tier,
  kind: bruta.kind,
  texto: bruta.texto,
  effects: bruta.effects ?? nada,
  avisos: bruta.avisos ?? [],
}));
