import { NextResponse } from "next/server";

import { fail } from "@/lib/api";
import { BUCKET, MAX_UPLOAD_BYTES } from "@/lib/storage";
import type { SupabaseServerClient } from "@/lib/supabase/server";

type ReadResult =
  | { file: File; form: FormData; error: null }
  | { file: null; form: FormData | null; error: NextResponse };

/** Le um multipart/form-data, valida tamanho e mime, e devolve o File. */
export async function readUpload(
  request: Request,
  allowedMime: string[],
  field = "file",
): Promise<ReadResult> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return {
      file: null,
      form: null,
      error: fail("Envie o arquivo como multipart/form-data"),
    };
  }

  const file = form.get(field);

  if (!(file instanceof File) || file.size === 0) {
    return { file: null, form, error: fail(`Campo "${field}" vazio`) };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      file: null,
      form,
      error: fail("Arquivo acima de 25 MB", 413),
    };
  }

  if (!allowedMime.includes(file.type)) {
    return {
      file: null,
      form,
      error: fail(
        `Tipo de arquivo nao aceito: ${file.type || "desconhecido"}`,
        415,
      ),
    };
  }

  return { file, form, error: null };
}

/** Sobe o arquivo para o bucket privado respeitando a RLS do usuario logado. */
export async function putObject(
  supabase: SupabaseServerClient,
  path: string,
  file: File,
  { upsert = false } = {},
) {
  const bytes = await file.arrayBuffer();
  return supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type,
    upsert,
  });
}

export async function removeObjects(
  supabase: SupabaseServerClient,
  paths: (string | null | undefined)[],
) {
  const valid = paths.filter(Boolean) as string[];
  if (valid.length === 0) return;
  await supabase.storage.from(BUCKET).remove(valid);
}
