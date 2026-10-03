import { auth, fail, ok, UNAUTHORIZED } from "@/lib/api";
import { buscaMagia } from "@/lib/spell-catalog";
import { destaques, extraiTexto, traduz } from "@/lib/spell-text";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * GET /api/spells/catalog/[slug] :: texto completo de uma magia.
 *
 * O catálogo guarda só os dados da ficha. O texto inteiro é buscado na hora,
 * na página da magia, junto com os destaques (dano, resistência, área). Fica
 * em memória enquanto o servidor estiver de pé, e quem quiser offline usa o
 * botão de guardar na descrição, que grava no próprio cofre.
 */
type Guardado = {
  texto: string;
  original: string;
  traduzido: boolean;
  destaques: ReturnType<typeof destaques>;
};

const cache = new Map<string, Guardado>();

export async function GET(_request: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const { user } = await auth();
  if (!user) return UNAUTHORIZED();

  const magia = buscaMagia(slug);
  if (!magia) return fail("Magia não encontrada no guia", 404);

  const guardado = cache.get(slug);
  if (guardado) {
    return ok({ spell: magia, ...guardado, deCache: true });
  }

  try {
    const resposta = await fetch(magia.link, {
      headers: { "user-agent": "rpg-vault/1.0" },
      // A página não muda quase nunca; um dia de cache já evita ida e volta.
      next: { revalidate: 86400 },
    });

    if (!resposta.ok) {
      return fail(`A página da magia respondeu ${resposta.status}`, 502);
    }

    const original = extraiTexto(await resposta.text());
    if (!original) return fail("Não consegui ler o texto dessa magia", 502);

    // Os destaques saem do inglês, que é previsível. A tradução é só do corpo.
    const marcas = destaques(original);
    const { texto, traduzido } = await traduz(original);

    const resultado = { texto, original, traduzido, destaques: marcas };
    cache.set(slug, resultado);

    return ok({ spell: magia, ...resultado, deCache: false });
  } catch {
    return fail("Não consegui abrir a página da magia agora", 502);
  }
}
