import { notFound } from "next/navigation";

import { CharacterWorkspace } from "@/components/character/character-workspace";
import type {
  AssetWithUrl,
  CharacterStatsRow,
  MagicItemWithUrl,
} from "@/lib/database.types";
import { signPaths } from "@/lib/storage";
import { requireUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("characters")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  return { title: data ? `${data.name} | RPG Vault` : "RPG Vault" };
}

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const { data: character } = await supabase
    .from("characters")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // A RLS devolve vazio para ficha de outro usuario, o que vira 404 aqui.
  if (!character) notFound();

  const [{ data: stats }, { data: items }, { data: assets }, { data: abilities }] =
    await Promise.all([
      supabase
        .from("character_stats")
        .select("*")
        .eq("character_id", id)
        .maybeSingle(),
      supabase
        .from("magic_items")
        .select("*")
        .eq("character_id", id)
        .order("sort_order")
        .order("created_at"),
      supabase
        .from("assets")
        .select("*")
        .eq("character_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("abilities")
        .select("*")
        .eq("character_id", id)
        .order("sort_order")
        .order("created_at"),
    ]);

  const urls = await signPaths(supabase, [
    character.avatar_path,
    ...(items ?? []).map((item) => item.image_path),
    ...(assets ?? []).map((asset) => asset.file_path),
  ]);

  const itemsWithUrl: MagicItemWithUrl[] = (items ?? []).map((item) => ({
    ...item,
    image_url: item.image_path ? (urls.get(item.image_path) ?? null) : null,
  }));

  const assetsWithUrl: AssetWithUrl[] = (assets ?? []).map((asset) => ({
    ...asset,
    url: urls.get(asset.file_path) ?? null,
  }));

  const emptyStats: CharacterStatsRow = {
    id: "",
    character_id: id,
    user_id: character.user_id,
    attributes: {},
    vitals: {},
    combat: {},
    skills: {},
    custom: {},
    notes: null,
    created_at: character.created_at,
    updated_at: character.updated_at,
  };

  return (
    <CharacterWorkspace
      initialCharacter={{
        ...character,
        avatar_url: character.avatar_path
          ? (urls.get(character.avatar_path) ?? null)
          : null,
      }}
      initialStats={stats ?? emptyStats}
      initialItems={itemsWithUrl}
      initialAssets={assetsWithUrl}
      initialAbilities={abilities ?? []}
    />
  );
}
