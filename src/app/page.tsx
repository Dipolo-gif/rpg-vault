import { redirect } from "next/navigation";

/**
 * A raiz nao renderiza nada: o proxy ja decidiu se ha sessao. Com sessao,
 * cai no dashboard. Sem sessao, o proxy intercepta antes e manda para /login.
 */
export default function Home() {
  redirect("/dashboard");
}
