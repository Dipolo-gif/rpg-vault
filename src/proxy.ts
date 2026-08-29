import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * No Next.js 16 o antigo `middleware.ts` passou a se chamar `proxy.ts`,
 * e a funcao exportada virou `proxy`. Ele roda no runtime Node.
 *
 * Duas responsabilidades:
 *  1. renovar o token do Supabase antes de qualquer render;
 *  2. barrar rota privada para quem nao esta logado.
 */

const PUBLIC_ROUTES = ["/login", "/auth"];

function isPublic(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function proxy(request: NextRequest) {
  // Sem env configurado o app ainda precisa subir para mostrar a tela de erro.
  if (!SUPABASE_URL || !SUPABASE_KEY) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Precisa ser chamado cedo: e o que dispara o refresh do token e grava os
  // cookies novos na resposta antes dela ser enviada.
  const { data } = await supabase.auth.getClaims();
  const isLogged = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  if (!isLogged && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isLogged && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Tudo, menos assets estaticos e arquivos de imagem.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
