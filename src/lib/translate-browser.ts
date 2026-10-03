import { preparaParaTraduzir } from "@/lib/spell-text";

/**
 * Tradução feita do lado do navegador.
 *
 * O serviço gratuito tem cota por IP. O do servidor é compartilhado com o
 * mundo inteiro na Vercel, então acaba rápido; o da sua casa é seu. Quando o
 * servidor não consegue, a tela tenta por aqui e manda o resultado de volta
 * para ficar guardado no cofre.
 */
export async function traduzNoNavegador(
  texto: string,
): Promise<string | null> {
  const paragrafos = preparaParaTraduzir(texto);
  const saida: string[] = [];

  for (const pedacos of paragrafos) {
    const partes: string[] = [];

    for (const pedaco of pedacos) {
      const url = new URL("https://api.mymemory.translated.net/get");
      url.searchParams.set("q", pedaco);
      url.searchParams.set("langpair", "en|pt-br");

      try {
        const resposta = await fetch(url);
        if (!resposta.ok) return null;

        const dados = (await resposta.json()) as {
          responseStatus?: number | string;
          responseData?: { translatedText?: string };
        };

        const traduzido = dados.responseData?.translatedText;
        if (
          Number(dados.responseStatus) !== 200 ||
          !traduzido ||
          /MYMEMORY WARNING|QUERY LENGTH/i.test(traduzido)
        ) {
          return null;
        }

        partes.push(traduzido);
      } catch {
        return null;
      }
    }

    saida.push(partes.join(" "));
  }

  return saida.join("\n\n");
}
