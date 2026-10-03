import catalogo from "@/lib/spell-catalog.json";

/**
 * Catálogo de magias, gerado de dnd5e.wikidot.com/spells.
 *
 * São 574 entradas, umas 180 KB, então ele fica só no servidor: a aba Magias
 * pede a lista pela API em vez de carregar tudo no navegador. Para atualizar:
 *
 *   node scripts/gera-magias.mjs
 *
 * O texto das magias não vem junto, só os dados que a ficha mostra, mais o
 * link da página. A descrição de cada magia adicionada fica livre para você
 * escrever ou colar o que a sua mesa usa.
 */

export type MagiaCatalogo = {
  slug: string;
  /** Nome em ingles, como esta no guia. */
  nome: string;
  /** Nome em portugues, que e o que aparece na ficha. */
  nome_pt: string;
  /** 0 é truque. */
  nivel: number;
  escola: string;
  tempo: string;
  alcance: string;
  duracao: string;
  componentes: string;
  concentracao: boolean;
  link: string;
};

export const CATALOGO_MAGIAS = catalogo as MagiaCatalogo[];

export function buscaMagia(slug: string): MagiaCatalogo | undefined {
  return CATALOGO_MAGIAS.find((magia) => magia.slug === slug);
}
