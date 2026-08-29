# RPG Vault

Cofre pessoal de personagens de RPG de mesa. Cada usuário entra na própria conta
e encontra só as fichas dele.

A tela do personagem tem oito abas:

| Aba | O que faz |
| --- | --- |
| **Ficha** | atributos, proficiência, CA, iniciativa, deslocamento, medidores, testes de resistência e perícias. É aqui que você preenche |
| **Combate** | acerto, CD e o dano montado sozinho, uma expressão para cada arma |
| **Inventário** | itens com efeitos passivos, cargas, e as habilidades ativas e passivas de cada um |
| **Classe** | habilidades que a classe dá em cada nível |
| **Fluxo** | habilidades que o personagem tem por si, sem depender de item |
| **Talentos** | talentos adquiridos, com catálogo dos guias da mesa e efeito automático |
| **Galeria** | tokens, retratos, mapas e handouts, com a opção de promover qualquer imagem a avatar |
| **Lore** | história e anotações longas do personagem |

Os medidores rápidos (vida, sanidade, mana, conforme o sistema) ficam no botão
**Status** do cabeçalho, em um painel lateral, para ajustar dano e cura no meio
da sessão sem sair da tela.

## Como o dano é montado

O dano nunca é digitado inteiro, e **cada arma tem a sua própria expressão**,
porque o atributo e o dado base mudam de uma para outra. Cada uma soma:

```
dano da arma = dado base da arma
             + <modificador do atributo de ataque>d2   regra da casa: mod +5 vira 5d2
             + maior bônus mágico entre os itens ativados
             + efeitos passivos dos itens ativados
             + habilidades passivas desses itens
             + habilidades ativas que estiverem ligadas
             + classe, fluxos e talentos valendo
```

Você digita o **valor** do atributo, e o app tira o modificador pela regra do
D&D (valor menos 10, dividido por dois, arredondado para baixo). O modificador
é o que entra no dano.

O **bônus mágico do item não soma**: entre dois itens ativados vale só o maior,
e ele entra tanto no acerto quanto no dano. Um martelo +3 e um rifle +2 dão +3,
não +5. Já os campos de acerto, CD e CA somam normalmente, inclusive entre
itens, e é neles que entram os bônus de classe, talento e fluxo.

Desligar o item tira ele, os efeitos passivos dele e as habilidades dele da
conta, tudo de uma vez. Ligar uma habilidade ativa desconta as cargas do item
(ou um uso próprio) e o dano muda na hora. Um item pode ainda **trocar o
atributo de ataque**: o martelo que ataca com Inteligência usa o modificador de
Inteligência, enquanto o rifle na mesma ficha usa o de Destreza.

Exemplo real, com Inteligência 20 (mod +5) e Destreza 18 (mod +4):

```
Felix, o Martelo   2d8 + 5d2 + 3      2d8 de concussão, ataca com INT
Rifle Fantasma     1d10 + 4d2 + 3     1d10 perfurante, ataca com DES
```

O `+3` é o mesmo nos dois: é o maior bônus mágico entre os itens ligados.

## Como as perícias se atualizam sozinhas

O total de uma perícia é `modificador do atributo + proficiência + ajuste`, e os
testes de resistência seguem a mesma conta.

**A proficiência empilha.** Ela entra uma vez por fonte:

- **você marca na mão**, clicando no nome da perícia (nada, proficiente que vale
  uma, dobrada que vale duas);
- **cada habilidade que concede** soma mais uma, e sai da conta sozinha quando a
  fonte desliga. Item, classe, fluxo e talento contam separado, e a linha mostra
  quem somou o quê.

Uma perícia marcada na mão, com um talento e a Especialização do ladino por
cima, fica com o bônus três vezes: a linha mostra `+15 (×3)` e, do lado, cada
fonte com o seu `+5`. A fonte que diz "dobrada" garante pelo menos duas
proficiências, mesmo quando é a única.

O botão manual **nunca trava**, mesmo com uma habilidade concedendo, porque a
sua marca é uma das parcelas da soma.

Se a habilidade que concede for **ativa**, a perícia só sobe enquanto ela
estiver ligada. Um talento que dobra Percepção por 1 minuto sai da conta assim
que você desliga.

A lista de perícias e o atributo de cada uma vêm do preset do sistema, em
[`src/lib/systems.ts`](src/lib/systems.ts). Existe a lista padrão de D&D 5e e a
da ficha **Chamas da Guerra**, com 27 perícias e o atributo Sanidade, extraída
dos nomes de campo do PDF e do Guia de Perícias da campanha.

### Quando a mesa inventa um campo

Nenhum preset dá conta de toda mesa, então o personagem carrega os próprios
campos: **atributo próprio** (na aba Combate) e **perícia própria** (na aba
Perícias). Eles entram na mesma lista do preset e no mesmo cálculo, e ficam
salvos em `character_stats.custom`. Uma perícia criada assim aceita
proficiência concedida por habilidade igual às outras.

## Catálogo de talentos

A aba Talentos tem o botão **Do guia**, que abre os 102 talentos dos guias da
mesa: 9 do *Guia de Talentos* da campanha e 93 do compêndio de D&D 5e. Cada um
mostra o texto inteiro, o requisito e o que ele faz de automático.

Ao adicionar, o que dá para calcular já entra ligado:

- **aumento de atributo** (`+1 Destreza`) mexe no valor, então o modificador
  sobe e o dano e todas as perícias daquele atributo mudam junto;
- **proficiência em perícia** entra com a regra clássica dos talentos, "você
  ganha proficiência, e se já tiver, o bônus é dobrado". No app isso é o grau
  `dobra_se_ja_tiver`, que soma mais uma proficiência: quem não tinha nada fica
  proficiente, quem já era proficiente passa a somar duas vezes.

47 dos 102 talentos têm efeito automático. Os 12 que dependem de escolha sua
(um talento que deixa escolher entre dois atributos, por exemplo) avisam na
hora de adicionar, em amarelo, e você ajusta na mão.

O catálogo é gerado a partir dos PDFs, não digitado:

```bash
node scripts/gera-talentos.mjs "caminho/para/Compendio de Racas e Talentos.pdf"
```

O script está em [`scripts/gera-talentos.mjs`](scripts/gera-talentos.mjs) e
reescreve `src/lib/talents.ts`. Se o guia da mesa mudar, rode de novo.


## Guia das classes

A aba Classe tem o mesmo botão **Do guia**, com as 12 classes padrão de D&D 5e
e mais o **Engenheiro**, que é homebrew do [D&D Wiki](https://www.dandwiki.com/wiki/Engineer_(5e_Class)).
Escolhe a classe e ela mostra as habilidades por nível, com o dado de vida, as
duas resistências e a lista de perícias que a classe deixa escolher.

Dá para adicionar uma por uma ou usar **Adicionar tudo até o nível X**, que é o
caminho normal para um personagem que já está no meio da campanha.

O que entra automático:

- **proficiência nos dois testes de resistência da classe**, que aparecem
  marcados em verde na aba Ficha, dizendo de onde vieram;
- **aumentos de atributo** de capacidades como o Campeão Primitivo do bárbaro;
- **as perícias que a habilidade manda escolher**, marcadas nela mesma.

Habilidade que diz "escolha duas perícias" traz as opções ali no card: as
perícias iniciais da classe, a Especialização do ladino e do bardo e a Perícia
de Engenheiro, que só oferece as perícias de Inteligência, inclusive as próprias
da sua mesa. O que você marca vira efeito daquela habilidade, então cada uma
soma nas suas próprias perícias, sem uma atrapalhar a outra, e a ficha recalcula
sozinha. Se a habilidade já foi adicionada, marcar e desmarcar grava direto
nela.

**A proficiência empilha**, que é a regra da mesa: cada fonte que dá a perícia
soma mais um bônus de proficiência por cima do que já valia. Marcada na mão,
mais um talento, mais a Especialização do ladino dá o bônus três vezes. A fonte
que diz "dobrada" garante pelo menos dois, mesmo quando é a única. Na Ficha a
linha mostra a conta: o total com o `(×3)` do lado e, em seguida, cada fonte com
o que ela somou.

### Engenhocas

O engenheiro escolhe de uma lista à parte, então o guia dele tem o botão **Ver
as 41 engenhocas**: a lista inteira, separada por tier, dizendo em que nível
cada tier libera e quanto custa construir. Cada engenhoca adicionada vira uma
habilidade de classe chamada `Engenhoca: nome`, e o que dá para calcular entra
sozinho, como o +1 de CA do Capacete Mecânico e as proficiências de resistência
do Infusor Sanguíneo, da Máscara de Disfarce e do Capacete Neuroadaptável. O que
depende do seu modificador na hora, como somar Inteligência em Furtividade, vira
aviso amarelo. O catálogo está em [`src/lib/gadgets.ts`](src/lib/gadgets.ts).

O que depende de escolha sua aparece em amarelo: qual subclasse você pegou e
quais habilidades dela entram. As descrições são resumos do efeito em jogo, e
cada habilidade vira uma linha editável depois de adicionada, então regra de
casa é só ajustar.

O catálogo está em [`src/lib/classes.ts`](src/lib/classes.ts).

---

## 1. Arquitetura

| Camada | Escolha | Por quê |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router, Turbopack) | Server Components para carregar a ficha inteira em uma renderização, e Route Handlers para o CRUD |
| Linguagem | TypeScript | tipos do banco escritos à mão em `src/lib/database.types.ts` |
| Estilo | **Tailwind CSS v4** + **shadcn/ui** (base-nova, sobre Base UI) | dark mode nativo e componentes copiados para dentro do projeto, fáceis de repintar |
| Banco / Auth / Storage | **Supabase** | Postgres relacional de verdade, RLS por linha, Auth com senha e Storage privado, tudo no mesmo projeto |
| Texto formatado | **Tiptap 3** | descrição dos itens mágicos em HTML controlado |
| PDF | **pdf-lib** + viewer nativo do navegador | lê os campos AcroForm, preenche e devolve uma nova versão para o Storage |

Fluxo de uma requisição autenticada:

```
navegador → src/proxy.ts (renova o token, barra rota privada)
          → Server Component ou Route Handler
          → createClient() com os cookies daquele usuário
          → Postgres aplica a RLS usando auth.uid()
```

O cliente do servidor nunca usa `service_role`. Toda query passa pela RLS, então
mesmo um bug de filtro no código não vaza ficha de outra pessoa.

---

## 2. Setup

### 2.0 Este projeto já está ligado

O Supabase deste repositório já foi criado e migrado:

- projeto **rpg-vault**, região `sa-east-1` (São Paulo), plano gratuito
- as duas migrations já rodaram (tabelas, RLS, triggers e o bucket `vault`)
- `.env.local` já está preenchido e fora do Git

Ou seja, `npm run dev` já sobe funcionando. As instruções abaixo servem para
recriar tudo em outro projeto Supabase.

**Dois detalhes ao criar sua conta pela primeira vez:**

1. O projeto vem com *Confirm email* ligado. Ou você cadastra com o email dono
   da conta Supabase (que recebe o link), ou desliga a confirmação em
   **Authentication > Sign In / Providers > Email**.
2. Existe uma conta de teste criada durante a validação:
   `mestre@rpgvault.com.br`, com um personagem de exemplo. Para apagar:

   ```sql
   delete from auth.users where email = 'mestre@rpgvault.com.br';
   ```

   O cascade limpa personagem, itens e assets. Os binários no Storage saem pela
   tela do app ou pelo painel de Storage.

### 2.1 Criar o projeto no Supabase

1. Crie um projeto novo em [supabase.com/dashboard](https://supabase.com/dashboard).
2. Abra **SQL Editor** e rode o conteúdo de
   [`supabase/migrations/20260828120000_init.sql`](supabase/migrations/20260828120000_init.sql)
   inteiro, de uma vez.
3. Em **Authentication > Providers**, confirme que **Email** está ligado.
   Para testar sem caixa de entrada, desligue *Confirm email* em
   **Authentication > Sign In / Providers > Email**.

O script cria as tabelas, os índices, os triggers, todas as policies de RLS e o
bucket privado `vault`.

> Se a criação das policies de `storage.objects` falhar por permissão, crie as
> quatro policies pela tela **Storage > Policies** usando a mesma condição:
> `bucket_id = 'vault' and (storage.foldername(name))[1] = auth.uid()::text`.

### 2.2 Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha com **Project Settings > API**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (projetos novos) **ou**
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (projetos antigos). Basta uma das duas.

### 2.3 Rodar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`, crie a conta e o cofre está de pé.

---

## 3. Modelo de dados

```
auth.users (Supabase)         profiles
   id, email, password_hash ──── id, email, display_name
        │
        └──< characters ──┬──< character_stats   (1 para 1, JSONB)
                          ├──< magic_items ──< abilities  (source = 'item')
                          ├──< abilities                  (classe, fluxo, talento)
                          └──< assets
```

| Tabela | Papel |
| --- | --- |
| `profiles` | espelho público de `auth.users`, criado por trigger no cadastro |
| `characters` | ficha: nome, sistema, nível/ocupação, lore, avatar, PDF |
| `character_stats` | `attributes`, `vitals`, `combat`, `skills` e `custom` em **JSONB**, um registro por personagem |
| `magic_items` | nome, tipo, raridade, arte, cargas, efeitos passivos e o interruptor `equipped` |
| `abilities` | habilidades de item, classe, fluxo e talento, na mesma tabela |
| `assets` | imagens da galeria, classificadas por `asset_kind` |

### Por que uma tabela só de habilidades

Habilidade de item, classe, fluxo e talento se comportam igual na hora de somar:
a passiva vale enquanto a fonte valer, a ativa precisa ser ligada. Separar em
quatro tabelas significaria quatro consultas, quatro rotas e quatro vezes o
mesmo cálculo. A coluna `source` distingue as quatro, e um `check` garante que
`item_id` existe se, e somente se, `source = 'item'`.

Dois triggers cuidam da coerência: um copia o dono a partir do personagem e
recusa habilidade apontando para item de outra ficha, e o outro **desliga as
habilidades ativas quando o item é desativado**, para o dano não continuar
contando uma fonte que acabou de sair de cena.

Descontar carga é feito pela função `consome_cargas`, em uma instrução só. Ler o
saldo, subtrair e gravar em passos separados abre corrida quando o jogador liga
duas habilidades seguidas: as duas leem o mesmo saldo e uma delas sai de graça.

### Três decisões que fogem do óbvio

**1. Não existe tabela `Users` com `password_hash`.** O Supabase já guarda o hash
em `auth.users`, com rotação de token e recuperação de senha. Recriar isso seria
guardar senha em dois lugares. `profiles` é o espelho público, ligado por
`id → auth.users.id`.

**2. Os campos de arquivo guardam *caminho*, não URL.** O bucket é privado, então
uma URL fixa não funcionaria. Ficam salvos `avatar_path`, `pdf_path`,
`image_path` e `file_path`, e o servidor assina uma URL temporária (1 hora) a
cada renderização.

**3. As tabelas filhas repetem `user_id`.** Um trigger `BEFORE INSERT` copia o
dono a partir do personagem. Com isso a policy é `user_id = auth.uid()` direto,
sem subconsulta em `characters` a cada linha lida. Como a checagem da policy roda
*depois* do trigger, ninguém consegue pendurar um item na ficha de outra pessoa:
o trigger preenche o dono verdadeiro e o `WITH CHECK` recusa.

### Atributos dinâmicos

`character_stats.attributes` e `.vitals` são JSONB porque cada sistema pede um
conjunto diferente:

```jsonc
// D&D 5e
{ "attributes": { "for": 16, "des": 12 },
  "vitals": { "hp": { "current": 22, "max": 30 } } }

// Call of Cthulhu 7e
{ "attributes": { "pow": 60, "edu": 75 },
  "vitals": { "sanity": { "current": 48, "max": 60 } } }
```

Os presets de cada sistema ficam em [`src/lib/systems.ts`](src/lib/systems.ts).
Adicionar um sistema novo é editar esse arquivo, sem migration.

`vitals` alimenta o painel **Status** do cabeçalho, e `attributes` alimenta o
dano na aba **Combate** (é o valor que vira `Nd2`). Como o PDF é a ficha oficial,
os atributos aparecem numa linha compacta dentro do Combate, e não em uma aba de
ficha própria.

`combat` guarda o resto do bloco de combate:

```jsonc
{
  "acerto_base": 7, "cd_base": 15, "ca_base": 16,
  "atributo_ataque": "for",          // chave do preset; a arma pode trocar
  "armas": [...],                     // armas que não são itens do inventário
  "arma_ativa": "item:<uuid>"
}
```

Próximo passo natural, se um dia fizer sentido: preencher os campos do PDF a
partir de `attributes`, já que a sua ficha nomeia os campos de forma previsível
(`ATR_FOR`, `MOD_FOR`, `SK_PERCEPCAO`).

---

## 4. Segurança

- **RLS ligada nas cinco tabelas**, com policy separada para select, insert,
  update e delete. Todas comparam `(select auth.uid())` com `user_id`. O
  `select` em volta faz o planner avaliar a função uma vez por query, e não uma
  vez por linha.
- **Storage privado.** O caminho é `<user_id>/<character_id>/<pasta>/<arquivo>`, e
  a policy confere `(storage.foldername(name))[1] = auth.uid()::text`. Um usuário
  não consegue nem listar a pasta de outro.
- **URLs assinadas** de 1 hora, geradas no servidor. Nada de link público
  permanente para retrato de personagem.
- **Rotas de API** conferem a sessão e a posse do personagem antes de escrever,
  então a resposta é 401 ou 404 em vez de uma lista vazia silenciosa.
- **HTML dos itens** passa por uma limpeza no servidor antes de gravar
  (`scrubHtml` em `src/lib/validation.ts`): tira `script`, `iframe`, handlers
  inline e `javascript:`. O conteúdo é sempre do próprio dono, mas a rota aceita
  POST direto, então vale a rede de proteção.

---

## 5. Rotas de API

| Método | Rota | O que faz |
| --- | --- | --- |
| GET | `/api/characters` | lista os personagens do usuário |
| POST | `/api/characters` | cria personagem (trigger cria os stats) |
| GET | `/api/characters/[id]` | ficha completa com URLs assinadas |
| PATCH | `/api/characters/[id]` | nome, sistema, nível, lore, favorito |
| DELETE | `/api/characters/[id]` | apaga a ficha e limpa o Storage |
| PUT | `/api/characters/[id]/stats` | grava `attributes` e `vitals` (usada pelo painel Status) |
| GET / POST | `/api/characters/[id]/items` | lista e cria itens mágicos |
| PATCH / DELETE | `/api/items/[id]` | edita e remove item, liga e desliga, ajusta cargas |
| GET / POST | `/api/characters/[id]/abilities` | habilidades de item, fluxo e talento |
| PATCH / DELETE | `/api/abilities/[id]` | edita, e é por onde a habilidade ativa liga e desliga |
| POST | `/api/items/[id]/image` | arte do item (multipart, campo `file`) |
| GET / POST | `/api/characters/[id]/assets` | galeria: lista e faz upload |
| PATCH / DELETE | `/api/assets/[id]` | renomeia, reclassifica e remove |
| POST | `/api/characters/[id]/avatar` | sobe um avatar novo |
| PUT | `/api/characters/[id]/avatar` | promove um asset da galeria a avatar |
| GET / POST / DELETE | `/api/characters/[id]/sheet` | PDF da ficha |
| GET | `/auth/callback` | troca o código de confirmação por sessão |
| POST | `/auth/signout` | encerra a sessão |

Uploads vão como `multipart/form-data` com o arquivo no campo `file`. Limite de
25 MB, checado no servidor e também no bucket.

---

## 6. Estrutura de pastas

```
src/
  proxy.ts                    renovação de sessão + guarda de rota (era middleware.ts)
  app/
    login/                    tela pública de entrar e cadastrar
    auth/callback|signout/    handlers de sessão
    (app)/                    área privada, com cabeçalho e usuário
      dashboard/              grid de personagens
      characters/[id]/        tela do personagem
    api/                      route handlers do CRUD e dos uploads
  components/
    ui/                       shadcn
    auth/ dashboard/ character/
  lib/
    supabase/                 clients de browser e servidor
    systems.ts                presets por sistema de RPG
    storage.ts upload.ts      caminhos, URLs assinadas e uploads
    validation.ts             schemas Zod das rotas
supabase/migrations/          o schema
```

---

## 7. Notas de produção

- **Vercel** limita o corpo de uma requisição serverless a ~4,5 MB. Como o upload
  passa pelo servidor, arquivos maiores que isso falham lá (localmente e em
  Node/Docker vale o limite de 25 MB). Se precisar de arquivos grandes, troque o
  upload por URL assinada de escrita
  (`supabase.storage.from('vault').createSignedUploadUrl(path)`) e mande o
  binário direto do navegador para o Storage, guardando só a linha pela API.
- **Tipos do banco**: depois de linkar o projeto, dá para regenerar com
  `npx supabase gen types typescript --project-id SEU_ID > src/lib/database.types.ts`.
- **PDF preenchível**: só PDFs com AcroForm têm campos para editar. Ficha
  escaneada ou exportada como imagem abre e baixa normalmente, mas não tem campo
  para preencher. Ao salvar, o arquivo antigo é substituído pela versão
  preenchida. Testado com a ficha *Chamas da Guerra* (4 páginas, 401 campos:
  260 de texto e 139 checkboxes), que carrega e salva sem problema. Como listas
  grandes assim são a regra em D&D 5e, o painel tem busca por nome de campo.
- **Modo escuro** é fixo: a classe `dark` fica no `<html>` e não há alternador.
  A paleta está no fim de `src/app/globals.css`.
