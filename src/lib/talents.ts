/**
 * Catálogo de talentos, gerado a partir dos guias da mesa.
 *
 * NÃO EDITE À MÃO: rode `node scripts/gera-talentos.mjs "<compendio.pdf>"`.
 *
 * O que dá para ligar sozinho vira `effects`, e o app aplica na hora que o
 * talento entra na ficha. O resto do texto fica em `texto`, mostrado inteiro
 * na aba Talentos. `avisos` guarda o que depende de escolha sua, como um
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

export const TALENTOS: TalentoCatalogo[] = [
  {
    "key": "acrobata",
    "nome": "Acrobata",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você se torna mais ágil, ganhando os seguintes benefícios:   Aumente seu valor de Destreza em 1, até um máximo de 20.   Você ganha proficiência na Perícia Acrobacia. Se você já for proficiente na Perícia, você adiciona o dobro do seu bônus de proficiência aos testes que você faz com ela.   Com uma ação bônus, você pode fazer um teste de Destreza de CD 15 (Acrobacia). Se você conseguir, terreno difícil não lhe custa deslocamento extra até o final do turno atual.",
    "effects": {
      "atributos": {
        "des": 1
      },
      "pericias": {
        "acrobacia": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "adepto_elemental",
    "nome": "Adepto elemental",
    "fonte": "compendio",
    "requisito": "Capacidade de conjurar pelo menos uma magia",
    "texto": "Quando você ganha esse talento, escolha um dos tipos de dano a seguir: ácido, elétrico, fogo, frio ou trovão. As magias que você conjurar ignoram resistência a dano do tipo escolhido. Além disso, quando você rola o dano para uma magia que você conjurar que causar dano desse tipo, você pode tratar qualquer 1 num dado de dano como um 2. Você pode escolher esse talento diversas vezes. A cada vez que o fizer, você deve escolher um tipo diferente de dano.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "adepto_marcial",
    "nome": "Adepto marcial",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você tem treinamento marcial que permite a você realizar manobras de combate especiais. Você ganha os seguintes benefícios:   Você aprende duas manobras, à sua escolha, das que estão disponíveis ao arquétipo Mestre de Batalha na classe guerreiro. Se a manobra que você usar obrigar um alvo a realizar um teste de resistência, a CD do teste de resistência será igual a 8 + seu bônus de proficiência + seu modificador de Força ou Destreza (à sua escolha).   Se você já tiver dados de superioridade, você ganha um adicional; do contrário, você terá um dado de superioridade, que é um d6. Esse dado é usado para abastecer suas manobras. Um dado de superioridade é gasto quando você o usa. Você recupera seus dados de superioridade gastos quando termina um descanso curto ou longo.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "agilidade_rasteira",
    "nome": "Agilidade rasteira",
    "fonte": "compendio",
    "requisito": "Anão, Gnomo ou Halfling",
    "texto": "Você é excepcionalmente ágil para sua raça. Você ganha os seguintes benefícios:   Aumente seu valor de Força ou Destreza em 1, até um máximo de 20.   Aumente seu deslocamento para 1,5 metros.   Você ganha proficiência na perícia Acrobacia ou Atletismo. Se você já for proficiente, seu bônus de proficiência é dobrado para qualquer teste que você fizer com ela.",
    "effects": {},
    "avisos": [
      "Aumento de atributo à escolha: Força ou Destreza",
      "Perícia à escolha: Acrobacia ou Atletismo"
    ]
  },
  {
    "key": "agressao_orc",
    "nome": "Agressão orc",
    "fonte": "compendio",
    "requisito": "Meio-Orc",
    "texto": "Com uma ação bônus, você pode mover seu deslocamento em direção a um inimigo de sua escolha que você possa ver ou ouvir. Você deve terminar este movimento mais perto do inimigo do que começou.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "alerta",
    "nome": "Alerta",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Sempre a espera de perigo, você ganha os seguintes benefícios:   Você recebe +5 de bônus em iniciativa.   Você não pode ser surpreso enquanto estiver consciente.   Outras criaturas não ganham vantagem nas jogadas de ataque contra você por estarem escondidas de você.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "alquimista",
    "nome": "Alquimista",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você tem estudado os segredos da alquimia, tornando-se um mestre em sua prática, ganhando os seguintes benefícios:   Aumente seu valor de Inteligência em 1, para no máximo 20.   Você ganha proficiência com os suprimentos de alquimista. Se você já for proficiente, dobre o seu bônus de proficiência nos testes que você fizer com estes suprimentos.   Como uma ação, você pode identificar uma poção a até 1,5 metros de você, como se você a tivesse provado. Você deve poder ver o líquido para este benefício funcionar.   Durante o seu descanso curto, você pode aprimorar temporariamente a potência de uma poção de cura de qualquer raridade. Para usar este benefício, você deve ter os suprimentos de alquimista com você, e uma poção ao seu alcance. Se a poção for utilizada a até 1 hora após o término do descanso curto, a criatura que bebeu a poção pode desistir de jogar os dados da poção e recuperar o número máximo de pontos de vida que a poção pode restaurar.",
    "effects": {
      "atributos": {
        "int": 1
      }
    },
    "avisos": []
  },
  {
    "key": "alta_magia_drow",
    "nome": "Alta magia drow",
    "fonte": "compendio",
    "requisito": "Elfo (drow)",
    "texto": "Você aprende mais magias típicas do seu povo. Você aprende detectar magia e pode conjurá-la à vontade, sem gastar espaços de magia. Você também aprende levitar e dissipar magia, cada um dos qual você pode conjurar uma vez sem gastar um espaço de magia. Você recupera a habilidade de conjurar a magia desta forma quando você terminar um descanso longo. Carisma é sua habilidade de conjuração para essas magias.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "ambidestro",
    "nome": "Ambidestro",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você dominou o estilo de luta com duas armas, ganhando os seguintes benefícios:   Você ganha +1 de bônus na CA enquanto estiver empunhando uma arma corpo-a-corpo em cada mão.   Você pode usar combater com duas armas mesmo que a arma de uma mão que você está empunhando não seja leve.   Você pode sacar ou guardar duas armas de uma mão quando você, normalmente, seria capaz de sacar ou guardar apenas uma.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "ameacador",
    "nome": "Ameaçador",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você se torna temível para os outros, ganhando os seguintes benefícios:   Aumente seu valor de Carisma em 1, até um máximo de 20.   Você ganha proficiência na Perícia Intimidação. Se você já for proficiente na Perícia, você adiciona o dobro do seu bônus de proficiência aos testes que você faz com ela.   Quando você usa a ação de ataque em seu turno, você pode substituir um ataquepor uma tentativa de desmoralizar um humanoide que você possa ver a até 9 metros de você que possa ver e ouvilo. Faça um teste de Carisma (Intimidação) contestado por um teste de Sabedoria (Intuição) do alvo. Se o seu teste for bem-sucedido, o alvo fica assustado até o final do seu próximo turno. Se o seu teste falhar, o alvo não pode ser assustado por você desta maneira por 1 hora.",
    "effects": {
      "atributos": {
        "car": 1
      },
      "pericias": {
        "intimidacao": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "amigo_animal",
    "nome": "Amigo animal",
    "fonte": "compendio",
    "requisito": "Gnomo (floresta)",
    "texto": "Sua amizade com os animais se aprofunda misticamente. Você ganha os seguintes benefícios:   Você ganha proficiência na perícia Lidar com Animais. Se você já for proficiente, seu bônus de proficiência é dobrado para qualquer teste que você fizer com ela.   Você aprende a magia falar com animais e pode conjurar ela à vontade, sem gastar um espaço de magia. Você também aprende a magia amizade animal, e você pode conjurar ela uma vez com este feito, sem gastar um espaço de magia. Você recupera a capacidade de conjurá-la desta maneira quando você terminar um descanso longo. A inteligência é sua habilidade de conjuração para essas magias.",
    "effects": {
      "pericias": {
        "lidar_animais": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "amigo_de_todos",
    "nome": "Amigo de todos",
    "fonte": "compendio",
    "requisito": "Meio-Elfo",
    "texto": "Você desenvolve sua personalidade magnética para facilitar seu caminho através do mundo. Você ganha os seguintes benefícios:   Aumente seu valor de Carisma em 1, até um máximo de 20.   Você ganha proficiência nas perícias Enganação e Persuasão. Se você já for proficiente em qualquer uma delas, seu bônus de proficiência é dobrado para qualquer teste que você fizer com essa perícia.",
    "effects": {
      "atributos": {
        "car": 1
      },
      "pericias": {
        "blefar": "dobra_se_ja_tiver",
        "persuasao": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "arcanista",
    "nome": "Arcanista",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você estuda as artes arcanas, ganhando os seguintes benefícios:   Aumente seu valor de Inteligência em 1, até um máximo de 20.   Você ganha proficiência na Perícia Arcanismo. Se você já for proficiente na Perícia, você adiciona o dobro do seu bônus de proficiência aos testes que você fizer com ela.   Você aprende as magias prestidigitação e detectar magia. Você pode conjurar detectar magia uma vez sem gastar um espaço de magia, e você recupera a capacidade de fazê-lo quando você terminar um descanso longo.",
    "effects": {
      "atributos": {
        "int": 1
      },
      "pericias": {
        "arcanismo": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "arrombador",
    "nome": "Arrombador",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você se orgulha de sua velocidade e estudos minuciosos de certas atividades clandestinas. Você ganha os seguintes benefícios:   Aumente seu valor de Destreza em 1, para no máximo 20.   Você ganha proficiência com as ferramentas de ladrão. Se você já é proficiente, dobre o seu bônus de proficiência nos testes feitos com estas ferramentas.",
    "effects": {
      "atributos": {
        "des": 1
      }
    },
    "avisos": []
  },
  {
    "key": "artista",
    "nome": "Artista",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você domina a atuação de modo que você pode comandar qualquer palco. Você ganha os seguintes benefícios:   Aumente seu valor de Carisma em 1, até um máximo de 20.   Você ganha proficiência na Perícia atuação. Se você já for proficiente na Perícia, você adiciona o dobro do seu bônus de proficiência aos testes que você faz com ela.   Durante a atuação, você pode tentar distrair um humanoide que você possa ver e que pode ver e ouvi-lo. Faça um teste de Carisma (Atuação) contestado por um teste de Sabedoria (Intuição) do humanoide. Se o seu teste for bem sucedido, você pega a atenção do humanoide o suficiente para fazer com que a Sabedoria (Percepção) e a Inteligência (Investigação) sejam feitos com desvantagem até que você pare de se apresentar.",
    "effects": {
      "atributos": {
        "car": 1
      },
      "pericias": {
        "atuacao": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "as_da_pilotagem",
    "nome": "Ás da Pilotagem",
    "fonte": "campanha",
    "requisito": "Perícia Pilotagem",
    "texto": "Você nasceu atrás de um volante ou guidão. Aumente seu valor de destreza em 1, até um máximo de 20. Você ganha proficiência nessa perícia. Se já tiver, o seu bônus de proficiência é dobrado nos testes dela. Drift de Combate: pilotando um veículo, você pode usar uma Ação Bônus para uma manobra arriscada. A CA do veículo aumenta em +5 até o início do seu próximo turno, mas você tem desvantagem em ataques feitos de dentro dele.",
    "effects": {
      "atributos": {
        "des": 1
      },
      "pericias": {
        "pilotagem": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "asas_de_dragao",
    "nome": "Asas de dragão",
    "fonte": "compendio",
    "requisito": "Draconato",
    "texto": "Você cria asas dracônicas. Com suas asas, você tem um deslocamento de vôo de 6 metros se você não estiver usando armadura pesada e não estiver excedendo sua capacidade de carga.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "atacante_bestial",
    "nome": "Atacante bestial",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Uma vez por turno, quando você rolar o dano para um ataque corpo-a-corpo com arma, você pode jogar novamente o dado de dano da arma e usar qualquer dos valores.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "atirador_agucado",
    "nome": "Atirador aguçado",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você dominou o uso de armas à distância e pode realizar tiros que seriam impossíveis para outros. Você ganha os seguintes benefícios:   Atacar um alvo além da distância normal não impõe desvantagem nas suas jogadas de ataque com armas à distância.   Seus ataques com armas à distância ignoram meia cobertura e três-quartos de cobertura.   Antes de realizar um ataque com uma arma à distância na qual você seja proficiente, você pode escolher sofrer -5 de penalidade na jogada de ataque. Se o ataque atingir, você adiciona +10 no dano do ataque.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "atirador_de_magia",
    "nome": "Atirador de magia",
    "fonte": "compendio",
    "requisito": "Capacidade de conjurar pelo menos uma magia",
    "texto": "Você aprendeu técnicas para aprimorar seus ataques com certos tipos de magia, ganhando os seguintes benefícios:   Quando você conjura uma magia que requer que você realize uma jogada de ataque, o alcance da magia é dobrado.   Seus ataques à distância com magia ignoram meia cobertura ou três-quartos de cobertura.   Você aprende um truque que requer uma jogada de ataque. Escolha o truque da lista de magias do bardo, bruxo, clérigo, druida, feiticeiro ou mago. Sua habilidade de conjuração para esse truque depende da lista de magia a qual você escolheu o truque: Carisma para bardo, bruxo ou feiticeiro; Sabedoria para clérigo ou druida; ou Inteligência para mago.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "atleta",
    "nome": "Atleta",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você passou por extenso treinamento físico para ganhar os seguintes benefícios:   Aumente seu valor de Força ou Destreza em 1, até o máximo de 20.   Quando você estiver caído, se levantar requer apenas 1,5 m do seu deslocamento.   Escalar não custa movimento adicional a você.   Você pode realizar um salto em distância correndo ou um salto em altura correndo se movendo apenas um passo de ajuste de 1,5 m, ao invés de 3 m.",
    "effects": {},
    "avisos": [
      "Aumento de atributo à escolha: Força ou Destreza"
    ]
  },
  {
    "key": "ator",
    "nome": "Ator",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Perito em mimica e dramaturgia, você recebe os seguintes benefícios:   Aumente seu valor de Carisma em 1, até o máximo de 20.   Você tem vantagem em testes de Carisma (Atuação) e Carisma (Enganação) quando você estiver tentando se passar por uma pessoa diferente.   Você pode imitar a articulação de outra pessoa ou os sons feitos por outras criaturas. Você deve ter ouvido a pessoa falando ou ouvido a criatura fazendo o som por, pelo menos, 1 minuto. Um sucesso num teste de Sabedoria (Intuição) resistido pelo seu teste de Carisma (Enganação) permite que um ouvinte determine que o efeito é falso.",
    "effects": {
      "atributos": {
        "car": 1
      }
    },
    "avisos": []
  },
  {
    "key": "chamas_de_phlegethos",
    "nome": "Chamas de phlegethos",
    "fonte": "compendio",
    "requisito": "Tiefling",
    "texto": "Você aprende a invocar o fogo do inferno para servir seus comandos. Você ganha os seguintes benefícios:   Aumente seu valor de Inteligência ou Carisma em 1, até um máximo de 20.   Quando você rolar dano de fogo para uma magia que você conjurar, você pode rolar novamente qualquer rolagem de 1 no dado de dano de fogo, mas você deve usar a nova rolagem, mesmo que seja outro 1.   Sempre que você conjurar um feitiço que inflige dano de fogo, você pode fazer com que as chamas o envolvam até o final do próximo turno. As chamas não prejudicam você ou seus pertences, e eles lançam luz brilhante a ate 9 metros e luz fraca por mais 9 metros. Enquanto as chamas estão presentes, qualquer criatura a até 1,5 metros de você que ataque com um ataque corpo a corpo leva 1d4 de dano de fogo.",
    "effects": {},
    "avisos": [
      "Aumento de atributo à escolha: Inteligência ou Carisma"
    ]
  },
  {
    "key": "combatente_montado",
    "nome": "Combatente montado",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você é um oponente perigoso de se enfrentar quando está montado. Enquanto estiver montado e não estiver incapacitado, você ganha os seguintes benefícios:   Você tem vantagem nas jogadas de ataque corpoa-corpo contra qualquer criatura desmontada que seja menor que a sua montaria.   Você pode forçar que um ataque direcionado a sua montaria seja direcionado a você, em seu lugar.   Se sua montaria for alvo de um efeito que permita a ela realizar um teste de resistência de Destreza para reduzir o dano à metade, ao invés disso, ela não sofre qualquer dano se for bem sucedida no teste de resistência, e apenas metade se falhar.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "conjurador_de_guerra",
    "nome": "Conjurador de guerra",
    "fonte": "compendio",
    "requisito": "Capacidade de conjurar pelo menos uma magia",
    "texto": "Você praticou a conjuração de magias no meio do combate, aprendendo técnicas que lhe concedem os seguintes benefícios:   Você tem vantagem em testes de resistência de Constituição para manter sua concentração em uma magia quando você sofrer dano.   Você pode realizar os componentes somáticos de uma magia mesmo quando está com armas ou um escudo em uma ou ambas as mãos.   Quando o movimento de uma criatura hostil provocar um ataque de oportunidade para você, você pode usar sua reação para conjurar uma magia na criatura, ao invés de realizar o ataque de oportunidade. A magia deve ter um tempo de conjuração de 1 ação e deve ter apenas uma criatura como alvo.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "conjurador_de_ritual",
    "nome": "Conjurador de ritual",
    "fonte": "compendio",
    "requisito": "Inteligência ou Sabedoria 13 ou maior",
    "texto": "Você aprendeu um número de magias que você pode conjurar como rituais. Essas magias são escritas em um livro de rituais, o qual deve estar em suas mãos enquanto você conjura uma dessas magias. Quando você escolhe esse talento, você adquire um livro de rituais que contem duas magias de 1° nível, à sua escolha. Escolha uma das seguintes classes: bardo, bruxo, clérigo, druida, feiticeiro ou mago. Você deve escolher suas magias da lista de magias dessa classe e as magias escolhidas devem ter o descritor ritual. A classe que você escolheu também determina a habilidade de conjuração dessas magias: Carisma para bardo, bruxo ou feiticeiro; Sabedoria para clérigo ou druida; ou Inteligência para mago. Se você encontrar uma magia na forma escrita, como a contida em um pergaminho de magia ou o grimório de um mago, você é capaz de adicioná-la ao seu livro de rituais. A magia deve estar na lista de magias da classe escolhida, o nível da magia não pode ser maior que metade do seu nível (arredondado para cima) e deve conter o descritor ritual. O processo para copiar a magia no seu livro de rituais leva 2 horas por nível da magia e custa 50 po por nível. O custo representa os componentes materiais que você gasta para experimentar a magia até dominá-la, bem como as finas tintas utilizadas para escrevê-la.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "constituicao_infernal",
    "nome": "Constituição infernal",
    "fonte": "compendio",
    "requisito": "Tiefling",
    "texto": "O sangue diabólico corre forte em você. Você ganha os seguintes benefícios:   Aumente seu valor de Constituição em 1, até um máximo de 20.   Você tem resistência a dano de frio e venenoso.   Você tem vantagem em teste de resistência contra ser envenenado.",
    "effects": {
      "atributos": {
        "con": 1
      }
    },
    "avisos": []
  },
  {
    "key": "criador_de_maravilhas",
    "nome": "Criador de maravilhas",
    "fonte": "compendio",
    "requisito": "Gnomo (rochas)",
    "texto": "Você domina as técnicas do seu povo. Você ganha os seguintes benefícios:   Aumente seu valor de Destreza ou Inteligência em 1, até um máximo de 20.   Quando você faz um teste usando sua proficiência com as ferramentas de artesão, você adiciona o dobro do seu bônus de proficiência ao teste.   Quando você faz um dispositivo com suas ferramentas de artesão, você tem as seguintes opções adicionais para o que você faz: Alarme. Este dispositivo detecta quando uma criatura se move para dentro de 4,5 metros dele sem falar em voz alta uma senha escolhida quando você o cria. Um turno depois que uma criatura se move em alcance, o alarme faz um toque estridente que dura 1 minuto e pode ser ouvido a até 90 metros de distância. Calculadora. Este dispositivo torna fácil fazer somas. Elevador. Este dispositivo pode ser usado como um bloco e roldana, permitindo seu usuário içar cinco vezes o peso que o usuário normalmente pode levantar. Cronometrista. Este relógio de bolso mantém o tempo exato. Sensor Climático. Quando usado como uma ação, este dispositivo prevê condições meteorológicas em um raio de 1,6 km durante as próximas 4 horas, mostrando um símbolo (nuvens, sol/lua, chuva ou neve) para cada hora.",
    "effects": {},
    "avisos": [
      "Aumento de atributo à escolha: Destreza ou Inteligência"
    ]
  },
  {
    "key": "curandeiro",
    "nome": "Curandeiro",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você é um cirurgião capacitado, permitindo que você trate de ferimentos rapidamente, trazendo seus aliados de volta à luta. Você adquire os seguintes benefícios:   Quando você usar um kit de primeiros-socorros para estabilizar uma criatura morrendo, a criatura recupera 1 ponto de vida, ao invés disso.   Com uma ação, você pode gastar um uso do kit de primeiros-socorros para tratar de uma criatura e restaurar 1d6 + 4 pontos de vida mais uma quantidade de pontos de vida adicionais igual ao número total de Dados de Vida da criatura. A criatura não pode recuperar pontos de vida através desse talento novamente até ter terminado um descanso curto ou longo.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "dedos_rapidos",
    "nome": "Dedos rápidos",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Seus dedos ágeis e agilidade permitem que você execute truques de mão. Você ganha os seguintes benefícios:   Aumente seu valor de Destreza em 1, até um máximo de 20.   Você ganha proficiência na Perícia prestidigitação. Se você já for proficiente na Perícia, você adiciona o dobro do seu bônus de proficiência aos testes que você faz com ela.   Como uma ação bônus, você pode fazer um teste de Destreza (Prestidigitação) para plantar algo em outra pessoa, ocultar um objeto em uma criatura, roubar uma bolsa ou tirar algo de um bolso.",
    "effects": {
      "atributos": {
        "des": 1
      },
      "pericias": {
        "prestidigitacao": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "desaparecer",
    "nome": "Desaparecer",
    "fonte": "compendio",
    "requisito": "Gnomo",
    "texto": "Você pode extrair sua herança mágica para escapar do perigo. Você ganha os seguintes benefícios:   Aumente seu valor de Inteligência em 1, até um máximo de 20.   Quando você recebe dano, você pode usar uma reação para tornar-se magicamente invisível até o final de seu próximo turno ou até você atacar, causar dano, ou forçar alguém a fazer um teste de resistência. Depois de usar essa habilidade, você não pode fazer isso novamente até que você termine um descanso curto ou longo.",
    "effects": {
      "atributos": {
        "int": 1
      }
    },
    "avisos": []
  },
  {
    "key": "determinacao_humana",
    "nome": "Determinação humana",
    "fonte": "compendio",
    "requisito": "Humano",
    "texto": "Você está cheio de uma determinação que pode trazer o inacessível ao seu alcance. Você ganha os seguintes benefícios:   Aumente seu valor de uma habilidade em 1, até um máximo de 20.   Quando você faz um ataque, um teste de habilidade ou um teste de resistência, você pode fazer isso com vantagem. Depois de usar essa habilidade, você não pode usá-la novamente até que você termine um descanso curto ou longo.",
    "effects": {},
    "avisos": [
      "Aumento de atributo não reconhecido: uma habilidade"
    ]
  },
  {
    "key": "diplomata",
    "nome": "Diplomata",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você domina as artes da diplomacia, obtendo os seguintes benefícios:   Aumente seu valor de Carisma em 1, até um máximo de 20.   Você ganha proficiência na Perícia Persuasão. e você já for proficiente nesta Perícia, você adiciona o dobro do seu bônus de proficiência aos testes feitos com ela.   Se você gastar 1 minuto falando com alguém que possa entender o que você diz, você pode fazer um teste de Carisma (Persuasão) contestado por um teste de Sabedoria (Intuição) da criatura. Se você ou seus companheiros estão lutando contra a criatura, seu teste falha automaticamente. Se o teste for bem-sucedido, o alvo é encantado por você enquanto permanecer a até 18 metros de você e por 1 minuto depois disso.",
    "effects": {
      "atributos": {
        "car": 1
      },
      "pericias": {
        "persuasao": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "domador_de_animais",
    "nome": "Domador de animais",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você dominou as técnicas necessárias para treinar e lidar com animais. Você ganha os seguintes benefícios.   Aumente seu valor de Sabedoria em 1, até um máximo de 20.   Você ganha proficiência na Perícia Adestrar Animais. Se você já for proficiente na Perícia, você adiciona o dobro do seu bônus de proficiência aos testes que você fizer com ela.   Você pode usar uma ação bônus em seu turno para comandar uma besta amigável a até 18 metros de você que possa ouvi-lo e que não está atualmente seguindo o comando de outra pessoa. Você decide que ação a besta tomará e para onde se moverá durante seu próximo turno, ou emitirá um comando geral que durará 1 minuto, como para proteger uma determinada área.",
    "effects": {
      "atributos": {
        "sab": 1
      },
      "pericias": {
        "lidar_animais": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "duelista_defensivo",
    "nome": "Duelista defensivo",
    "fonte": "compendio",
    "requisito": "Destreza 13 ou maior",
    "texto": "Quando você estiver empunhando uma arma de acuidade com a qual você seja proficiente e outra criatura atingir você com um ataque corpo-a-corpo, você pode usar sua reação para adicionar seu bônus de proficiência a sua CA para esse ataque, potencialmente fazendo o ataque errar.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "eloquente",
    "nome": "Eloquente",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você desenvolveu sua habilidade de conversação para enganar melhor os outros. Você ganha os seguintes benefícios:   Aumente seu valor de Carisma em 1, até um máximo de 20.   Você ganha proficiência na Perícia enganação. Se você já for proficiente na Perícia, você adiciona o dobro do seu bônus de proficiência aos testes que você faz com ela.   Quando você usa a ação de Ataque em seu turno, você pode substituir um ataque com uma tentativa de enganar um humanoide que você possa ver a até 9 metros de você que possa ver e ouvir você. Faça um teste de Carisma (Enganação) contestado por um teste de Sabedoria (Intuição) do alvo. Se o seu teste for bem-sucedido, seu movimento não provocará ataques de oportunidade do alvo e seus ataques contra ele terão vantagem. Ambos os benefícios duram até o final do seu róximo turno ou até que você use essa habilidade em um alvo diferente. Se o seu teste falhar, o alvo não pode ser enganado por você desta maneira por 1 hora.",
    "effects": {
      "atributos": {
        "car": 1
      },
      "pericias": {
        "blefar": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "empatico",
    "nome": "Empático",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você possui perspicácia afiada em como as outras pessoas pensam e sentem. Você ganha os seguintes benefícios:   Aumente seu valor de Sabedoria em 1, até um máximo de 20.   Você ganha proficiência na Perícia Intuição. Se você já for proficiente na Perícia, você adiciona o dobro do seu bônus de proficiência aos testes que fizer com ela.   Você pode usar sua ação para tentar obter uma visão misteriosa sobre um humanoide que você possa ver a até 1,5 metros de você. Faça um teste de Sabedoria (Intuição) contestado por um teste de Carisma (Enganação) do alvo. Se o seu teste for bem-sucedido, você terá vantagem nas rolagens de de ataque e nos testes de habilidade contra o alvo até o final de seu próximo turno.",
    "effects": {
      "atributos": {
        "sab": 1
      },
      "pericias": {
        "intuicao": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "erudito_pratico",
    "nome": "Erudito Prático",
    "fonte": "campanha",
    "requisito": "Perícia Ciências",
    "texto": "Teoria é bom, mas aplicação prática é melhor. Aumente seu valor de inteligência em 1, até um máximo de 20. Você ganha proficiência nessa perícia. Se já tiver, o seu bônus de proficiência é dobrado nos testes dela. Escolha uma especialização científica (Química, Física, Biologia). Improvisação Científica: uma vez por descanso curto, você ganha Vantagem em um teste de outra perícia, desde que justifique cientificamente ao Mestre como o seu conhecimento se aplica.",
    "effects": {
      "atributos": {
        "int": 1
      },
      "pericias": {
        "ciencias": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "especialista_em_besta",
    "nome": "Especialista em besta",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Graças a sua pratica extensiva com bestas, você ganha os seguintes benefícios:   Você ignora a qualidade de recarga de bestas nas quais você é proficiente.   Estar a 1,5 m de uma criatura hostil não impõe desvantagem nas suas jogadas de ataque à distância.   Quando você usa a ação de Ataque e ataca com uma arma de uma mão, você pode usar sua ação bônus para atacar com uma besta de mão carregada que você esteja empunhando.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "especialista_em_briga",
    "nome": "Especialista em briga",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Acostumado a brigas de bar usando qualquer coisa como armas, e na falta, os punhos, você ganha os seguintes benefícios:   Aumente o valor de Força ou Constituição em 1, até o máximo de 20.   Seus ataques desarmados causam 1d4 de dano.   Quando você atinge uma criatura com um ataque desarmado ou com uma arma improvisada, no seu turno, você pode usar uma ação bônus para tentar agarrar o alvo.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "explorador_de_cavernas",
    "nome": "Explorador de cavernas",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Alerta às armadilhas escondidas e portas secretas encontradas em muitas masmorras, você ganha os seguintes benefícios:   Você tem vantagem em testes de Sabedoria (Percepção) e de Inteligência (Investigação) feitos para detectar a presença de portas secretas.   Você tem vantagem em testes de resistência feitos para evitar ou resistir a armadilhas.   Você tem resistência ao dano causado por armadilhas.   Você pode procurar armadilhas enquanto viaja a um ritmo normal, ao invés de metade do ritmo.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "fantasma_da_rede",
    "nome": "Fantasma da Rede",
    "fonte": "campanha",
    "requisito": "Perícia Hacking",
    "texto": "Não existe firewall que segure você. Aumente seu valor de inteligência em 1, até um máximo de 20. Você ganha proficiência nessa perícia. Se já tiver, o seu bônus de proficiência é dobrado nos testes dela. Backdoor: quando você falha em um teste de Hacking para invadir um sistema, o alarme não dispara na hora. O sistema só percebe a invasão no início do seu próximo turno, o que te dá uma última chance de tentar de novo ou desconectar em segurança.",
    "effects": {
      "atributos": {
        "int": 1
      },
      "pericias": {
        "hacking": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "furia_orc",
    "nome": "Fúria orc",
    "fonte": "compendio",
    "requisito": "Meio-Orc",
    "texto": "Sua fúria queima incansavelmente. Você ganha os seguintes benefícios:   Aumente seu valor de Força ou Constituição em 1, até um máximo de 20.   Quando você ataca com um ataque feito com uma arma simples ou marcial, você pode rolar um dado de dano da arma adicional e adicioná-lo como dano extra do tipo de dano da arma. Depois de usar essa habilidade, você não pode usá-la novamente até que você termine um descanso curto ou longo.   Imediatamente após você usar sua característica de resistência implacável, você pode usar sua reação para fazer um ataque com arma.",
    "effects": {},
    "avisos": [
      "Aumento de atributo à escolha: Força ou Constituição"
    ]
  },
  {
    "key": "furtivo",
    "nome": "Furtivo",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você sabe como se esconder melhor. Você ganha os seguintes benefícios:   Aumente seu valor de Destreza em 1, até um máximo de 20.   Você ganha proficiência na Perícia furtividade. Se você já for proficiente na Perícia, você adiciona o dobro do seu bônus de proficiência aos testes que você faz com ela.   Se você estiver escondido, você pode moverse até 3 metros no aberto sem revelar-se, se você terminar o deslocamento em uma posição onde você não está claramente visível.",
    "effects": {
      "atributos": {
        "des": 1
      },
      "pericias": {
        "furtividade": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "gourmand",
    "nome": "Gourmand",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você dominou uma variedade de receitas especiais, permitindo que você prepare pratos exóticos com diversos efeitos úteis. Você ganha os seguintes benefícios:   Aumente seu valor de Constituição em 1, para no máximo 20.   Você ganha proficiência com os utensílios de cozinheiro. Se você já for proficiente, dobre o seu bônus de proficiência nos testes realizados com estes utensílios.   Como uma ação, você pode inspecionar uma bebida ou um prato de comida a até 1,5 metros de você e determinar se algum deles está envenenado, desde que você possa ver e cheirar.   Durante um descanso longo, você pode preparar e servir uma refeição que ajuda você e seus aliados a recuperarem-se das mazelas de suas aventuras, desde que você possua comida adequada, os utensílios de cozinheiros e outros suprimentos à mão. A refeição alimenta até 6 pessoas e cada uma delas recupera 2 Dados de Vida adicionais ao final de seus respectivos descansos longo. Além disso, aqueles que partilharam da refeição possuem vantagem nos testes de resistência de Constituição realizados contra doenças pelas próximas 24 horas.",
    "effects": {
      "atributos": {
        "con": 1
      }
    },
    "avisos": []
  },
  {
    "key": "hacker_de_combate",
    "nome": "Hacker de Combate",
    "fonte": "campanha",
    "requisito": "Perícia Hacking",
    "texto": "O campo de batalha é digital, e você tem as chaves de acesso. Aumente seu valor de inteligência em 1, até um máximo de 20. Protocolo de Interrupção: como Ação Bônus, você tenta hackear um implante ou gadget de um inimigo visível a até 9 metros. O alvo faz um Teste de Resistência de Inteligência ou um teste de Metabolismo (CD 8 + seu bônus de proficiência + seu modificador de Inteligência). Se falhar, o equipamento sofre curto-circuito e para de funcionar até o final do próximo turno dele.",
    "effects": {
      "atributos": {
        "int": 1
      }
    },
    "avisos": []
  },
  {
    "key": "historiador",
    "nome": "Historiador",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Seu estudo da história recompensa você com os seguintes benefícios:   Aumente seu valor de Inteligência em 1, até um máximo de 20.   Você ganha proficiência na Perícia História. Se você já for proficiente na Perícia, você adiciona o dobro do seu bônus de proficiência aos testes que você faz com ela.   Quando você usa a ação de Ajuda para ajudar o teste de habilidade de outra criatura, você pode fazer um teste de CD 15 Inteligência (História). Em um sucesso, o teste da criatura ganha um bônus igual ao seu bônus de proficiência, à medida que compartilhar conselhos pertinentes e exemplos históricos. Para receber esse bônus, a criatura deve ser capaz de entender o que você está dizendo.",
    "effects": {
      "atributos": {
        "int": 1
      },
      "pericias": {
        "historia": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "imobilizador",
    "nome": "Imobilizador",
    "fonte": "compendio",
    "requisito": "Força 13 ou maior",
    "texto": "Você desenvolveu a perícia necessária para se prender a alguém em um combate engajado. Você recebe os seguintes benefícios:   Você tem vantagem nas jogadas de ataque contra uma criatura agarrada.   Você pode usar sua ação para tentar imobilizar uma criatura agarrada por você. Para tanto, realize outro teste de agarrar. Se você for bem sucedido, você e a criatura estarão ambos impedidos até o agarre terminar.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "iniciado_em_magia",
    "nome": "Iniciado em magia",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Escolha uma classe: bardo, bruxo, clérigo, druida, feiticeiro ou mago. Você aprende dois truques da lista de magias da classe escolhida. Além disso, escolha uma magia de 1° nível da mesma lista. Você aprende essa magia e pode conjura-la com o menor nível possível. Uma vez que a conjure, você precisa terminar um descanso longo para poder conjura-la novamente. Essa restrição aplica-se apenas à magia adquirida através desse talento. Sua habilidade de conjuração depende da classe que você escolher: Carisma para bardo, bruxo ou feiticeiro; Sabedoria para clérigo ou druida; ou Inteligência para mago.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "investida_poderosa",
    "nome": "Investida poderosa",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Quando você usa a ação de Disparada, você pode usar sua ação bônus para realizar um ataque corpo-acorpo com arma ou para empurrar uma criatura. Se você se mover, pelo menos, 3 metros em linha reta, imediatamente antes de realizar essa ação bônus, você pode tanto ganhar +5 de bônus na jogada de dano do ataque (se você escolher realizar um ataque corpo-a-corpo e atingir) ou empurrar o alvo até 3 metros de você (se você escolher empurrar e for bem sucedido).",
    "effects": {},
    "avisos": []
  },
  {
    "key": "investigador",
    "nome": "Investigador",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você tem um olho para o detalhe e pode pegar as pistas menores. Você ganha os seguintes benefícios:   Aumente seu valor de Inteligência em 1, até um máximo de 20.   Você ganha proficiência na Perícia investigação. Se você já for proficiente na Perícia, você adiciona o dobro do seu bônus de proficiência aos testes que você faz com ela.   Você pode usar a ação de procurar como uma ação bônus.",
    "effects": {
      "atributos": {
        "int": 1
      },
      "pericias": {
        "investigacao": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "lider_inspirador",
    "nome": "Líder inspirador",
    "fonte": "compendio",
    "requisito": "Carisma 13 ou maior",
    "texto": "Você pode gastar 10 minutos inspirando seus companheiros, suportando a vontade deles de lutar. Quando fizer isso, escolha até seis criaturas amigáveis (que pode incluir você) a até 9 metros de você que possam ver ou ouvir você e possam te compreender. Cada criatura ganha pontos de vida temporários igual ao seu nível + seu modificador de Carisma. Uma criatura não pode ganhar pontos de vida temporários desse talento novamente até terminar um descanso curto ou longo.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "maestria_com_lanca",
    "nome": "Maestria com lança",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Embora a lança seja uma arma simples de se aprender, ela recompensa todo o tempo que você leva para dominá-la. Você ganha os seguintes benefícios:   Você ganha +1 de bônus nas jogadas de ataque realizados com a lança.   Quando você usar uma lança, o dado de dano da lança muda de d6 para d8 e de d8 para d10 quando você a estiver empunhando com as duas mãos. (Este benefício não possui efeito se outra característica já tiver aprimorado o dado de dano da arma).   Você pode ajustar sua lança para receber uma investida. Como uma ação bônus, escolha uma criatura que você possa ver a até 6 m de você. Se esta criatura se mover para dentro do alcance de sua lança em seu próximo turno, você pode fazer um ataque corpo-a-corpo com sua lança como uma reação. Se o ataque acertar, o alvo sofre um dano adicional de 1d8 perfurante, ou um dano adicional de 1d10 perfurante se você estiver empunhando a lança com as duas mãos. Você não pode usar esta habilidade se a criatura usar a ação Desengajar antes de se mover.   Como uma ação bônus no seu turno, você pode aumentar seu alcance com a lança em 1,5 m pelo resto do seu turno.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "maestria_em_arma_de_haste",
    "nome": "Maestria em arma de haste",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você consegue manter seus inimigos afastados utilizando armas de haste. Você ganha os seguintes benefícios:   Quando você realiza a ação de Ataque e ataca com uma glaive, alabarda ou bordão, você pode usar uma ação bônus para realizar um ataque corpo-a-corpo com a outra extremidade da arma. Esse ataque usa o mesmo modificador de habilidade do ataque primário. O dado de dano da arma para esse ataque é um d4 e o ataque causa dano de concussão.   Enquanto você estiver empunhando uma glaive, alabarda, lança longa ou bastão, as outras criaturas provocam um ataque de oportunidade a você quando entrarem no seu alcance.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "maestria_em_armadura_media",
    "nome": "Maestria em armadura média",
    "fonte": "compendio",
    "requisito": "Proficiência em armadura média",
    "texto": "Você praticou seus movimentos usando armaduras pesadas para ganhar os seguintes benefícios:   Vestir uma armadura média não lhe impõe desvantagem em testes de Destreza (Furtividade).   Quando você estiver vestindo uma armadura média, você pode adicionar 3, ao invés de 2, à sua CA, se você tiver Destreza 16 ou maior.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "maestria_em_armadura_pesada",
    "nome": "Maestria em armadura pesada",
    "fonte": "compendio",
    "requisito": "Proficiência em armadura pesada",
    "texto": "Você pode usar sua armadura para defletir ataques potencialmente fatais a outros. Você ganha os seguintes benefícios:   Aumente seu valor de Força em 1, até o máximo de 20.   Quando você estiver vestindo uma armadura pesada, dano de concussão, cortante e perfurante que você receba de ataques não-mágicos será reduzido em 3.",
    "effects": {
      "atributos": {
        "for": 1
      }
    },
    "avisos": []
  },
  {
    "key": "magia_do_elfo_da_floresta",
    "nome": "Magia do elfo da floresta",
    "fonte": "compendio",
    "requisito": "Elfo (floresta)",
    "texto": "Você aprende a magia primitiva da floresta. Você aprende um truque de Druida a sua escolha. Você também aprende passos longos e passos sem pegadas, cada um do qual você pode conjurar uma vez sem gastar um espaço de magia. Você recupera a habilidade de conjurar estas magias desta forma quando você terminar um descanso longo. Sabedoria é sua habilidade de conjuração para essas magias.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "magia_svirfneblin",
    "nome": "Magia svirfneblin",
    "fonte": "compendio",
    "requisito": "Gnomo (gnomo das profundezas)",
    "texto": "Você herdou a habilidade de conjuração inata dos seus ancestrais. Esta habilidade permite você conjurar não detecção em si mesmo sem limite e sem precisar de componente material. Você também pode lançar cada uma das seguintes magias com esta habilidade: cegueira/surdez, borrão e disfarce. Você recupera a habilidade de lançar estas magias novamente quando terminar um descanso longo. Inteligência é sua habilidade de conjuração para estas magias.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "maos_destruidoras",
    "nome": "Mãos destruidoras",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você se tornou um mestre da machadinha, machado de batalha, machado grande, martelo de guerra e malho. Você ganha os seguintes benefícios quando estiver usando uma destas armas:   Você ganha +1 de bônus nas jogadas de ataque que fizer com a arma.   Toda vez que você tiver vantagem nas jogadas de ataque corpo-a-corpo feitas com a arma e acertar, você pode derrubar o oponente se o resultado menor dentre os dois d20 ainda acertar o oponente.   Toda vez que você sofrer desvantagem em uma jogada de ataque corpo-a-corpo feita com a arma, o alvo sofre dano de concussão igual ao seu modificador de Força (mínimo de 0) se o ataque errar, mas se o maior resultado de um dos d20 acertar o oponente.   Se você usar a ação Ajudar para prestar auxílio a um ataque corpo-a-corpo de um aliado, enquanto você estiver empunhando a arma, você pode empurrar o escudo do oponente momentaneamente. Além de o aliado ganhar vantagem na jogada de ataque, o aliado também ganha +2 de bônus na jogada de ataque se o alvo estiver usando um escudo.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "marca_do_dragao",
    "nome": "Marca do dragão",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você possui uma marca mágica que indica que você é um membro de uma das casas de marcas de dragão. Selecione uma das opções da tabela de Marcas de Dragão. Você possui a habilidade de conjurar magias inatas e cânticos, conforme descrito na tabela de Benefícios de Marcas do Dragão. Usando a habilidade de conjurar magias listada na coluna Habilidade, você pode conjurar a magia no seu nível mais baixo. Quando você conjurar a magia dessa forma, deve terminar um descanso longo antes de poder conjurar da mesma forma novamente. Você ainda precisa dispor de quaisquer componentes materiais. Sua marca do dragão concede os seguintes benefícios:   Quando você adquire esse talento pela primeira vez, você ganha acesso a marca do dragão mínima. Você aprende a magia listada na coluna Mínima.   A partir do 5° nível, sua marca se torna mais potente, evoluindo para marca do dragão menor. Você também aprende a magia listada na coluna Menor.   A partir do 9° nível, o poder da sua marca cresce novamente, se tornando uma marca do dragão maior. Você também aprende a magia listada na coluna Maior. Benefícios da Marca do Dragão Marca Hab. Mínima Menor Maior Detecção SAB detectar magia, mãos mágicas detectar pensamentos clarividência Descoberta SAB identificação, mãos mágicas localizar objeto clarividência Controle SAB druidismo, falar com animais sentido bestial conjurar animais Cura SAB curar ferimentos, estabilizar restauração menor revivificar Hospitabilidade CAR amizade, servo invisível truque de corda pequena cabana de leomund Criação INT identificação, consertar arma mágica fabricar Passagem INT passos longos, luz passos sem pegadas círculo de teletransporte Escrita INT compreender idiomas, mensagem enviar mensagem idiomas Sentinela SAB proteção contra lâminas, duelo compelido nublar proteção contra energia Sombra CAR globos de luz, disfarçar-se escuridão dificultar detecção Tempestade INT névoa obscurecente, toque chocante lufada de vento nevasca Proteção INT alarme, resistência tranca arcana círculo mágico",
    "effects": {},
    "avisos": []
  },
  {
    "key": "matador_de_conjuradores",
    "nome": "Matador de conjuradores",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você praticou técnicas úteis em combate corpo-acorpo contra conjuradores, ganhando os seguintes benefícios:   Quando uma criatura a até 1,5 m de você conjurar uma magia, você pode usar sua reação para realizar um ataque corpo-a-corpo contra ela.   Quando você causa dano em uma criatura que está se concentrando em uma magia, a criatura terá desvantagem no teste de resistência que ela fizer para manter a concentração.   Você tem vantagem em testes de resistência contra magias conjuradas por criaturas a até 1,5 m de você.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "medico",
    "nome": "Médico",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você domina as artes médicas, obtendo os seguintes benefícios:   Aumente seu valor de Sabedoria em 1, até um máximo de 20.   Você ganha proficiência na Perícia medicina. Se você já for proficiente na Perícia, você adiciona o dobro do seu bônus de proficiência aos testes que você faz com ela.   Durante um descanso curto, você pode limpar e dar pontos nas feridas de até seis animais e humanoides dispostos. Faça um teste de Sabedoria CD 15 (Medicina) para cada criatura. Em um sucesso, se uma criatura gastar um Dado de Vida durante este descanso, essa criatura pode renunciar a rolagem e em vez disso recuperar o número máximo de pontos de vida que o dado pode restaurar. Uma criatura pode fazê-lo apenas uma vez por descanso, independentemente de quantos dados de vida ela gaste.",
    "effects": {
      "atributos": {
        "sab": 1
      },
      "pericias": {
        "medicina": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "medo_de_dragao",
    "nome": "Medo de dragão",
    "fonte": "compendio",
    "requisito": "Draconato",
    "texto": "Quando irritado, você irradia ameaça. Você ganha os seguintes benefícios:   Aumente seu valor de Força ou Carisma em 1, até um máximo de 20.   Em vez de exalar energia destrutiva, você pode rugir e gastar um uso de seu ataque de sopro para forçar cada criatura de sua escolha a até 9 metros de fazer um teste de resistência de Sabedoria (CD 8 + seu bônus de proficiência + seu modificador Carisma). Um alvo é bem sucedido automaticamente se ele não puder ouvi-lo ou vê-lo. Em um fracasso, um alvo fica assustado por 1 minuto. Se o alvo assustado tomar qualquer dano, ele pode repetir o teste de resistência, terminando o efeito sobre si mesmo em um sucesso.",
    "effects": {},
    "avisos": [
      "Aumento de atributo à escolha: Força ou Carisma"
    ]
  },
  {
    "key": "mente_afiada",
    "nome": "Mente afiada",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você tem uma mente que pode cronometrar o tempo e memorizar direção e detalhes com precisão absurda. Você ganha os seguintes benefícios:   Aumente seu valor de Inteligência em 1, até o máximo de 20.   Você sempre sabe qual a direção do norte.   Você sempre sabe o número de horas restantes para o próximo nascer ou pôr do sol.   Você pode relembrar, com precisão, qualquer coisa que você tenha visto ou ouvido no último mês.",
    "effects": {
      "atributos": {
        "int": 1
      }
    },
    "avisos": []
  },
  {
    "key": "mestre_da_lamina",
    "nome": "Mestre da lâmina",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você se tornou um mestre da espada curta, espada longa, cimitarra, rapieira e espada larga. Você ganha os seguintes benefícios quando estiver empunhando alguma destas armas:   Você ganha +1 nas jogadas de ataque que fizer com a arma.   No seu turno, você pode usar sua reação para assumir uma postura de aparar, desde que você esteja empunhando a arma. Ao fazê-lo, você ganha +1 de bônus na sua CA até o começo do seu próximo turno ou até você não estiver mais empunhando a arma.   Quando fizer um ataque de oportunidade com a arma, você possui vantagem nas jogadas de ataque.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "mestre_da_sucata",
    "nome": "Mestre da Sucata",
    "fonte": "campanha",
    "requisito": "Perícia Engenharia",
    "texto": "Se dá para quebrar, dá para consertar. Ou transformar em bomba. Aumente seu valor de inteligência em 1, até um máximo de 20. Você ganha proficiência nessa perícia. Se já tiver, o seu bônus de proficiência é dobrado nos testes dela. Sabotagem Estrutural: seus ataques causam o dobro de dano a objetos e estruturas. Você também pode gastar 10 minutos para consertar um item de artífice quebrado, restaurando 1d8 pontos de vida do objeto ou recuperando uma carga gasta.",
    "effects": {
      "atributos": {
        "int": 1
      },
      "pericias": {
        "engenharia": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "mestre_de_armas",
    "nome": "Mestre de armas",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você tem praticado extensamente com uma variedade de armas, ganhando os seguintes benefícios:   Aumente o valor de Força ou Destreza em 1, até o máximo de 20.   Você ganha proficiência com quatro armas simples ou marciais, à sua escolha.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "mestre_de_armas_grandes",
    "nome": "Mestre de armas grandes",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você aprendeu a usar o peso em sua vantagem, deixando o balanço potencializar seus golpes. Você recebe os seguintes benefícios:   No seu turno, quando você atingir um acerto crítico com uma arma corpo-a-corpo ou reduzir os pontos de vida de uma criatura a 0, você pode realizar um ataque corpo-a-corpo com arma, com uma ação bônus.   Antes de você realizar um ataque corpo-a-corpo com uma arma pesada na qual você seja proficiente, você pode escolher sofrer -5 de penalidade em sua jogada de ataque. Se o ataque atingir, você adiciona +10 ao dano do ataque.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "mestre_de_escudo",
    "nome": "Mestre de escudo",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você não usa escudos apenas para proteção, mas também de forma ofensiva. Você ganha os seguintes benefícios enquanto estiver empunhando um escudo:   Se você realizar a ação de Ataque no seu turno, você pode usar uma ação bônus para tentar empurrar uma criatura, a até 1,5 m de você, com seu escudo.   Se você não estiver incapacitado, você pode adicionar seu bônus de CA do escudo a qualquer teste de resistência de Destreza que você fizer contra uma magia ou outro efeito nocivo que tenha você como alvo.   Se você for alvo de um efeito que permita realizar um teste de resistência de Destreza para sofrer apenas metade do dano, você pode usar sua reação para não sofrer dano se passar no teste de resistência, interpondo seu escudo entre você e a fonte do efeito.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "mestre_do_disfarce",
    "nome": "Mestre do disfarce",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você tem aperfeiçoado sua habilidade em moldar sua personalidade e ler a personalidade dos outros. Você ganha os seguintes benefícios:   Aumente o seu valor de Carisma em 1, para no máximo 20.   Você ganha proficiência com o kit de disfarce. Se você já for proficiente, dobre o seu bônus de proficiência nos testes realizados com este kit.   Se você gastar 1 hora observando uma criatura, você pode, então, dedicar 8 horas de seu tempo para criar um disfarce que você possa rapidamente vestir e imitar aquela criatura. Fazer o disfarce requer um kit de disfarce. Você deve realizar um teste normalmente para disfarçar-se, mas pode assumir o disfarce como uma ação.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "mestre_do_mangual",
    "nome": "Mestre do mangual",
    "fonte": "compendio",
    "requisito": null,
    "texto": "O mangual é uma arma capciosa, a qual você deve gastar incontáveis horas para dominá-la. Você ganha os seguintes benefícios:   Você ganha +1 de bônus nas jogadas de ataques realizados com um mangual.   Como uma ação bônus em seu turno, você pode se preparar para estender seu mangual e sobrepujar o escudo do alvo. Até o final de seu próximo turno, suas jogadas de ataque com o mangual ganham +2 de bônus contra qualquer alvo que estiver usando um escudo.   Quando você acertar um ataque de oportunidade usando um mangual, o alvo deve passar em um teste de resistência de Força (CD 8 + seu bônus de proficiência + seu modificador de Força) ou será derrubado.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "mobilidade",
    "nome": "Mobilidade",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você é excepcionalmente rápido e ágil. Você ganha os seguintes benefícios:   Seu deslocamento aumenta em 3 metros.   Quando você usa a ação de Disparada, mover-se através de terreno difícil não lhe custa qualquer movimento adicional neste turno.   Quando você realiza um ataque corpo-a-corpo contra uma criatura, você não provoca ataques de oportunidade para essa criatura pelo resto do turno, independentemente de ter atingido ou não.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "musculoso",
    "nome": "Musculoso",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você se torna mais forte, ganhando os seguintes benefícios:   Aumente seu valor de Força em 1, até um máximo de 20.   Você ganha proficiência na Perícia Atletismo. Se você já for proficiente na Perícia, você adiciona o dobro do seu bônus de proficiência aos testes que você fizer com ela.   Você conta como se você fosse de um tamanho maior para determinar sua capacidade de carga.",
    "effects": {
      "atributos": {
        "for": 1
      },
      "pericias": {
        "atletismo": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "naturalista",
    "nome": "Naturalista",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Seu extenso estudo da natureza recompensa você com os seguintes benefícios:   Aumente seu valor de Inteligência em 1, até um máximo de 20.   Você ganha proficiência na Perícia Natureza. Se você já for proficiente na Perícia, você adiciona o dobro do seu bônus de proficiência aos testes que você faz com ela.   Você aprende as magias druidismo e detectar veneno e doença. Você pode conjurar detectar veneno e doença uma vez sem gastar um espaço de magia, e você recupera a capacidade de fazê-lo quando você terminar um descanso longo.",
    "effects": {
      "atributos": {
        "int": 1
      },
      "pericias": {
        "natureza": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "observador",
    "nome": "Observador",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Rápido em perceber os detalhes do ambiente, você ganha os seguintes benefícios:   Aumente seu valor de Inteligência ou Sabedoria em 1, até o máximo de 20.   Se você puder ver a boca de uma criatura enquanto ela fala um idioma que você compreende, você pode interpretar o que ela está dizendo ao ler os seus lábios.   Você tem +5 de bônus nos seus valores passivos de Sabedoria (Percepção) e Inteligência (Investigação).",
    "effects": {},
    "avisos": [
      "Aumento de atributo à escolha: Inteligência ou Sabedoria"
    ]
  },
  {
    "key": "ocultar_o_dragao",
    "nome": "Ocultar o dragão",
    "fonte": "compendio",
    "requisito": "Draconato",
    "texto": "Você herdou o poder e a majestade de seus antepassados dragões. Você ganha os seguintes benefícios:   Aumente seu valor de Força ou Carisma em 1, até um máximo de 20.   Você cria garras retráteis nas pontas de seus dedos. Estender ou retrair as garras não requer ação. As garras são armas naturais, que você pode usar para fazer ataques desarmados. Se você atacar com eles, você causa dano cortante igual a 1d4 + seu modificador de Força, em vez do dano de golpear normal para um ataque desarmado.   Suas escamas endurecem; Você ganha um bônus de +1 na CA enquanto não estiver usando armadura.",
    "effects": {},
    "avisos": [
      "Aumento de atributo à escolha: Força ou Carisma"
    ]
  },
  {
    "key": "ocultar_o_farpado",
    "nome": "Ocultar o farpado",
    "fonte": "compendio",
    "requisito": "Tiefling",
    "texto": "Um de seus antepassados era um demônio farpado ou outro demônio espinhoso. Protrusões de barba saem da sua cabeça. Você ganha os seguintes benefícios:   Aumente seu valor de Constituição ou Carisma em 1, até um máximo de 20.   Com uma ação bônus, você pode fazer com que pequenas farpas sobressaiam por todo o corpo ou fazer com que elas se retraiam. No início de cada um de seus turnos, enquanto as farpas estão para fora, você causa 1d6 de dano perfurante a qualquer criatura lutando contra você ou qualquer criatura agarrada por você.   Você ganha proficiência na perícia Intimidação. Se você já for proficiente, seu bônus de proficiência é dobrado para qualquer teste que você fizer com ela.",
    "effects": {
      "pericias": {
        "intimidacao": "dobra_se_ja_tiver"
      }
    },
    "avisos": [
      "Aumento de atributo à escolha: Constituição ou Carisma"
    ]
  },
  {
    "key": "perceptivo",
    "nome": "Perceptivo",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você aprimora seus sentidos até que se tornem afiados. Você ganha os seguintes benefícios:   Aumente seu valor de Sabedoria em 1, até um máximo de 20.   Você ganha proficiência na Perícia percepção. Se você já for proficiente na Perícia, você adiciona o dobro do seu bônus de proficiência aos testes que você faz com ela.   Estar em uma área levemente obscurecida não impõe desvantagem em seus testes de Sabedoria (Percepção) se você puder ver e ouvir.",
    "effects": {
      "atributos": {
        "sab": 1
      },
      "pericias": {
        "percepcao": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "perito",
    "nome": "Perito",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você ganha proficiência em qualquer combinação de três perícias ou ferramentas, à sua escolha.",
    "effects": {},
    "avisos": [
      "Perícia à escolha: qualquer combinação de três perícias ou ferramentas, à sua escolha"
    ]
  },
  {
    "key": "poliglota",
    "nome": "Poliglota",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você estudou línguas e códigos, ganhando os seguintes benefícios:   Aumente seu valor de Inteligência em 1, até o máximo de 20.   Você aprende três idiomas, à sua escolha.   Você é capaz de criar criptogramas escritos. Outros não podem decifrar um código criado por você a não ser que você os ensine, elas sejam bem sucedidas num teste de inteligência (CD igual ao seu valor de Inteligência + seu bônus de proficiência) ou usem mágica para decifrá-lo.",
    "effects": {
      "atributos": {
        "int": 1
      }
    },
    "avisos": []
  },
  {
    "key": "portador_do_rancor",
    "nome": "Portador do rancor",
    "fonte": "compendio",
    "requisito": "Anão",
    "texto": "Você tem um ódio profundo por um tipo particular de criatura. Escolha um tipo de criatura para serem seus inimigos, para suportar a carga de sua ira: aberrações, bestas, celestiais, constructos, dragões, elementais, demonios, gigantes, monstruosidades, limos, plantas, ou mortos-vivos. Alternativamente, você pode escolher duas raças de humanoide (como gnolls e orcs). Você ganha os seguintes benefícios:   Aumente seu valor de Força, Constituição ou Sabedoria em 1, até um máximo de 20.   Durante a primeira rodada de qualquer combate contra os inimigos escolhidos, as suas rolagens de ataque contra qualquer um deles têm vantagem. Quando qualquer um de seus inimigos escolhidos faz um ataque de oportunidade contra você, ele faz o ataque com desvantagem.   Sempre que você fizer um teste de Inteligência (Arcanismo, História, Natureza ou Religião) para recuperar informações sobre seus inimigos escolhidos, você adicionará o dobro do seu bônus de proficiência ao teste, mesmo que você não seja normalmente proficiente.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "precisao_elfica",
    "nome": "Precisão élfica",
    "fonte": "compendio",
    "requisito": "Elfo ou Meio-Elfo",
    "texto": "Você tem uma pontaria misteriosa. Você ganha os seguintes benefícios:   Aumente seu valor de Destreza em 1, até um máximo de 20.   Sempre que você tiver vantagem em um teste de ataque, você pode rolar novamente um dos dados uma vez.",
    "effects": {
      "atributos": {
        "des": 1
      }
    },
    "avisos": []
  },
  {
    "key": "prodigio",
    "nome": "Prodígio",
    "fonte": "compendio",
    "requisito": "Meio-Elfo ou Humano",
    "texto": "Você tem um dom para aprender coisas novas. Você ganha os seguintes benefícios:   Aumente seu valor de uma habilidade em 1, até um máximo de 20.   Você ganha proficiência em uma perícia de sua escolha, proficiência em uma ferramenta de sua escolha, e fluência em uma língua de sua escolha.",
    "effects": {},
    "avisos": [
      "Aumento de atributo não reconhecido: uma habilidade"
    ]
  },
  {
    "key": "protecao_leve",
    "nome": "Proteção leve",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você treinou até dominar o uso de armaduras leves, ganhando os seguintes benefícios:   Aumente seu valor de Força em 1, até o máximo de 20.   Você ganha proficiência com armadura leves.",
    "effects": {
      "atributos": {
        "for": 1
      }
    },
    "avisos": []
  },
  {
    "key": "protecao_moderada",
    "nome": "Proteção moderada",
    "fonte": "compendio",
    "requisito": "Proficiência em armadura leve",
    "texto": "Você treinou até dominar o uso de armaduras médias e escudos, ganhando os seguintes benefícios:   Aumente seu valor de Força em 1, até o máximo de 20.   Você ganha proficiência com armadura média e escudos.",
    "effects": {
      "atributos": {
        "for": 1
      }
    },
    "avisos": []
  },
  {
    "key": "protecao_pesada",
    "nome": "Proteção pesada",
    "fonte": "compendio",
    "requisito": "Proficiência em armadura média",
    "texto": "Você treinou até dominar o uso de armaduras pesadas, ganhando os seguintes benefícios:   Aumente seu valor de Força em 1, até o máximo de 20.   Você ganha proficiência com armadura pesada.",
    "effects": {
      "atributos": {
        "for": 1
      }
    },
    "avisos": []
  },
  {
    "key": "psicologo_de_campo",
    "nome": "Psicólogo de Campo",
    "fonte": "campanha",
    "requisito": "Perícia Autocontrole",
    "texto": "Nesse mundo de loucura, você é a âncora que impede seus aliados de afundarem. Aumente seu valor de sanidade em 1, até um máximo de 20. Você ganha proficiência nessa perícia. Se já tiver, o seu bônus de proficiência é dobrado nos testes dela. Intervenção Terapêutica: quando você usa a ação de Ajuda para auxiliar um aliado em um teste de Sanidade ou Autocontrole, além da Vantagem normal ele soma o seu modificador de Sabedoria (ou Sanidade) ao resultado. O aumento de atributo pode ser em Sanidade ou Sabedoria, à sua escolha.",
    "effects": {
      "atributos": {
        "san": 1
      },
      "pericias": {
        "autocontrole": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "rei_da_rua",
    "nome": "Rei da Rua",
    "fonte": "campanha",
    "requisito": "Perícia Malandragem",
    "texto": "A cidade fala com você, e você sabe ouvir. Aumente seu valor de sabedoria em 1, até um máximo de 20. Você ganha proficiência nessa perícia. Se já tiver, o seu bônus de proficiência é dobrado nos testes dela. Sentido de Perigo: você não pode ser surpreendido em ambiente urbano enquanto estiver consciente. Ao observar um grupo social, você identifica na hora quem é a pessoa mais perigosa ou a figura de autoridade do local.",
    "effects": {
      "atributos": {
        "sab": 1
      },
      "pericias": {
        "malandragem": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "resiliencia_ana",
    "nome": "Resiliência anã",
    "fonte": "compendio",
    "requisito": "Anão",
    "texto": "Você tem o sangue dos heróis anões fluindo através de suas veias. Você ganha os seguintes benefícios:   Aumente seu valor de Constituição em 1, até um máximo de 20.   Sempre que você usar a ação Esquiva em combate, você pode gastar um Dado de Vida para curar a si mesmo. Role o dado, adicione seu modificador Constituição, e recupere um número de pontos de vida igual ao total (mínimo de 1).",
    "effects": {
      "atributos": {
        "con": 1
      }
    },
    "avisos": []
  },
  {
    "key": "resiliente",
    "nome": "Resiliente",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Escolha um valor de habilidade. Você ganha os seguintes benefícios:   Aumente o valor de habilidade escolhido em 1, até o máximo de 20.   Você ganha proficiência em testes de resistência usando a habilidade escolhida.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "resistente",
    "nome": "Resistente",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Duro e resistente, você ganha os seguintes benefícios:   Aumente seu valor de Constituição em 1, até o máximo de 20.   Quando você rolar um Dado de Vida para recuperar pontos de vida, o valor mínimo de pontos de vida que você recupera dessa rolagem será igual a duas vezes seu modificador de Constituição (mínimo de 2).",
    "effects": {
      "atributos": {
        "con": 1
      }
    },
    "avisos": []
  },
  {
    "key": "robusto",
    "nome": "Robusto",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Seu máximo de pontos de vida aumenta em um valor igual a duas vezes seu nível quando você adquire esse talento. Toda vez que você ganhar um nível, após isso, seu máximo de pontos de vida aumenta em 2 pontos de vida adicionais.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "segunda_chance",
    "nome": "Segunda chance",
    "fonte": "compendio",
    "requisito": "Halfling",
    "texto": "A sorte o favorece. Você ganha os seguintes benefícios:   Aumente seu valor de Destreza, Constituição ou Carisma em 1, até um máximo de 20.   Quando uma criatura que você possa ver o acerta com uma rolagem de ataque, você pode usar sua reação para forçar essa criatura rolar novamente o ataque. Depois de usar essa habilidade, você não pode fazer isso novamente até que você termine um descanso curto ou longo.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "sentinela",
    "nome": "Sentinela",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você domina técnicas para obter vantagem a cada vez que qualquer inimigo baixar a guarda, ganhando os seguintes benefícios:   Quando você atinge uma criatura com um ataque de oportunidade, o deslocamento da criatura se torna 0 pelo resto do turno.   As criaturas provocam ataques de oportunidade de você mesmo se realizarem a ação de Desengajar antes de saírem do seu alcance.   Quando uma criatura a até 1,5 m de você realizar um ataque contra um alvo diferente de você (e o alvo não possuir esse talento), você pode usar sua reação para realizar um ataque corpo-a-corpo com arma contra a criatura atacante.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "sistema_blindado",
    "nome": "Sistema Blindado",
    "fonte": "campanha",
    "requisito": "Perícia Metabolismo",
    "texto": "Seu corpo processa toxinas e traumas como uma fornalha. Aumente seu valor de constituição em 1, até um máximo de 20. Você ganha proficiência nessa perícia. Se já tiver, o seu bônus de proficiência é dobrado nos testes dela. Sobrecarga Química: você consome droga, estimulante ou poção como Ação Bônus em vez de Ação. Tem Vantagem em testes de Metabolismo para resistir aos efeitos negativos das próprias modificações cibernéticas e a overdose ou vício de drogas sintéticas.",
    "effects": {
      "atributos": {
        "con": 1
      },
      "pericias": {
        "metabolismo": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "sobrevivente",
    "nome": "Sobrevivente",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você domina a sabedoria dos lugares selvagens, obtendo os seguintes benefícios:   Aumente seu valor de Sabedoria em 1, até um máximo de 20.   Você ganha proficiência na Perícia sobrevivência. Se você já for proficiente na Perícia, você adiciona o dobro do seu bônus de proficiência aos testes que você faz com ela.   Você aprende a magia alarme. Você pode conjurar alarme uma vez sem gastar um espaço de magia, e você recupera a capacidade de fazê-lo quando você termina um descanso longo.",
    "effects": {
      "atributos": {
        "sab": 1
      },
      "pericias": {
        "sobrevivencia": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "sorrateiro",
    "nome": "Sorrateiro",
    "fonte": "compendio",
    "requisito": "Destreza 13 ou maior",
    "texto": "Você é especialista em espreitar através das sombras. Você ganha os seguintes benefícios:   Você pode tentar se esconder quando estiver levemente obscurecido para a criatura de quem você está tentando se esconder.   Quando você estiver escondido de uma criatura e errar um ataque à distância contra ela, realizar esse ataque não revelará sua posição.   Penumbra não impõem desvantagem nos seus testes de Sabedoria (Percepção) relacionados a visão.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "sorte_abundante",
    "nome": "Sorte abundante",
    "fonte": "compendio",
    "requisito": "Halfling",
    "texto": "Sempre que um aliado que você possa ver a até 9 metros de você rolar um 1 no d20 em uma rolagem de ataque, teste de habilidade, ou um teste de resistência, você pode usar sua reação para deixar o aliado rolar novamente o dado. O aliado deve usar a nova rolagem.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "sortudo",
    "nome": "Sortudo",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Você tem uma sorte inexplicável que parece surgir nos momentos exatos. Você tem 3 pontos de sorte. A qualquer momento que você realizar uma jogada de ataque, teste de habilidade ou teste de resistência, você pode gastar um ponto de sorte para rolar um d20 adicional. Você pode escolher gastar um dos seus pontos de sorte depois de rolar o dado, mas antes de saber o resultado da jogada. Você escolhe qual dos d20s irá usar para a jogada de ataque, teste de habilidade ou teste de resistência. Você também pode gastar um ponto de sorte quando uma jogada de ataque for feita contra você. Role um d20, e então escolha se o ataque irá usar a jogada do atacante ou a sua. Se mais de uma criatura gastar um ponto de sorte para influenciar uma mesma jogada, os pontos se cancelam mutuamente; nenhum dado adicional é rolado. Você recupera seus pontos de sorte gastos após terminar um descanso longo.",
    "effects": {},
    "avisos": []
  },
  {
    "key": "tecnomancer_intuitivo",
    "nome": "Tecnomancer Intuitivo",
    "fonte": "campanha",
    "requisito": "Perícia Cyberarcanismo",
    "texto": "Você não apenas usa a tecnologia, você a entende como uma extensão da alma. Aumente seu valor de inteligência em 1, até um máximo de 20. Você ganha proficiência nessa perícia. Se já tiver, o seu bônus de proficiência é dobrado nos testes dela. Diagnóstico de Campo: com 1 minuto de análise em um dispositivo tecnológico ou mágico, você descobre as propriedades exatas dele, como a magia Identificar, sem gastar slot nem componentes.",
    "effects": {
      "atributos": {
        "int": 1
      },
      "pericias": {
        "cyberarcanismo": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  },
  {
    "key": "teleportacao_feerica",
    "nome": "Teleportação feérica",
    "fonte": "compendio",
    "requisito": "Elfo (alto)",
    "texto": "Extraindo sua ascendência feérica, você aprendeu como teletransportar. Você ganha os seguintes benefícios:   Aumente seu valor de Inteligência em 1, até um máximo de 20.   Você aprende a magia passo nebuloso e pode conjurá-la uma vez sem gastar espaço de magia. Você recupera a capacidade de conjurá-la desta forma quando você terminar um descanso curto ou longo. Inteligência é a sua habilidade de conjuração para este feitiço.",
    "effects": {
      "atributos": {
        "int": 1
      }
    },
    "avisos": []
  },
  {
    "key": "teologo",
    "nome": "Teólogo",
    "fonte": "compendio",
    "requisito": null,
    "texto": "Seu extenso estudo da religião recompensa você com os seguintes benefícios:   Aumente seu valor de Inteligência em 1, até um máximo de 20.   Você ganha proficiência na Perícia religião. Se você já for proficiente na Perícia, você adiciona o dobro do seu bônus de proficiência aos testes que você faz com ela.   Você aprende a magia taumaturgia e detectar o bem e mal. Você pode conjurar detectar o bem e mal uma vez sem gastar um espaço de magia, e você recupera a capacidade de fazê-lo quando você terminar um descanso longo.",
    "effects": {
      "atributos": {
        "int": 1
      },
      "pericias": {
        "religiao": "dobra_se_ja_tiver"
      }
    },
    "avisos": []
  }
];

export function buscaTalentos(termo: string): TalentoCatalogo[] {
  const busca = termo.trim().toLowerCase();
  if (!busca) return TALENTOS;
  return TALENTOS.filter(
    (t) =>
      t.nome.toLowerCase().includes(busca) ||
      t.texto.toLowerCase().includes(busca),
  );
}
