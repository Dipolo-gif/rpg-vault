import { auth, ok, UNAUTHORIZED } from "@/lib/api";
import { CATALOGO_MAGIAS } from "@/lib/spell-catalog";

/**
 * GET /api/spells/catalog :: lista do guia, para o seletor da aba Magias.
 *
 * O catálogo tem 574 magias e umas 180 KB, então ele não vai no bundle do
 * navegador: a tela pede por aqui quando você abre o seletor.
 *
 * Aceita `?nivel=3` para trazer só um círculo.
 */
export async function GET(request: Request) {
  const { user } = await auth();
  if (!user) return UNAUTHORIZED();

  const nivel = new URL(request.url).searchParams.get("nivel");
  const filtro = nivel === null ? null : Number(nivel);

  const magias =
    filtro === null || !Number.isInteger(filtro)
      ? CATALOGO_MAGIAS
      : CATALOGO_MAGIAS.filter((magia) => magia.nivel === filtro);

  return ok({ spells: magias });
}
