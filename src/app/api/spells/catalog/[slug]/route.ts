import { z } from "zod";

import { auth, fail, ok, parseBody, UNAUTHORIZED } from "@/lib/api";
import { buscaMagia } from "@/lib/spell-catalog";
import { destaques, extraiTexto, poli, traduz } from "@/lib/spell-text";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * Texto completo de uma magia do guia.
 *
 * O caminho é: cache no banco, senão busca a página e traduz, e se a tradução
 * não vier (o serviço gratuito tem cota por IP, e o IP da Vercel é
 * compartilhado) devolve o inglês avisando. Nesse caso o navegador tenta pelo
 * IP de casa e manda o resultado de volta no POST aqui embaixo.
 */
export async function GET(_request: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const magia = buscaMagia(slug);
  if (!magia) return fail("Magia não encontrada no guia", 404);

  const { data: guardado } = await supabase
    .from("spell_texts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  // Inglês guardado não encerra o assunto: vale tentar traduzir de novo.
  if (guardado?.traduzido) {
    return ok({
      spell: magia,
      texto: guardado.texto,
      original: guardado.original,
      traduzido: true,
      destaques: guardado.destaques,
      deCache: true,
    });
  }

  let original = guardado?.original ?? "";

  if (!original) {
    try {
      const resposta = await fetch(magia.link, {
        headers: { "user-agent": "rpg-vault/1.0" },
        next: { revalidate: 86400 },
      });

      if (!resposta.ok) {
        return fail(`A página da magia respondeu ${resposta.status}`, 502);
      }
      original = extraiTexto(await resposta.text());
    } catch {
      return fail("Não consegui abrir a página da magia agora", 502);
    }
  }

  if (!original) return fail("Não consegui ler o texto dessa magia", 502);

  // Os destaques saem do inglês, que é previsível. A tradução é só do corpo.
  const marcas = destaques(original);
  const { texto, traduzido } = await traduz(original);

  await supabase.from("spell_texts").upsert({
    slug,
    texto,
    original,
    traduzido,
    destaques: marcas,
  });

  return ok({
    spell: magia,
    texto,
    original,
    traduzido,
    destaques: marcas,
    deCache: false,
  });
}

const traducaoSchema = z.object({
  /** O que o navegador conseguiu traduzir, ainda cru. */
  texto: z.string().trim().min(20).max(50000),
});

/**
 * POST /api/spells/catalog/[slug]
 *
 * O navegador manda a tradução que conseguiu fazer. O servidor passa o
 * glossário de D&D por cima e guarda, então a próxima pessoa a abrir essa
 * magia já pega pronto.
 */
export async function POST(request: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const { supabase, user } = await auth();
  if (!user) return UNAUTHORIZED();

  const magia = buscaMagia(slug);
  if (!magia) return fail("Magia não encontrada no guia", 404);

  const { data: body, error: badBody } = await parseBody(
    request,
    traducaoSchema,
  );
  if (badBody) return badBody;

  const { data: guardado } = await supabase
    .from("spell_texts")
    .select("original, destaques")
    .eq("slug", slug)
    .maybeSingle();

  const texto = poli(body.texto);

  const { error } = await supabase.from("spell_texts").upsert({
    slug,
    texto,
    original: guardado?.original ?? body.texto,
    traduzido: true,
    destaques: guardado?.destaques ?? [],
  });

  if (error) return fail(error.message, 500);

  return ok({ texto, traduzido: true });
}
