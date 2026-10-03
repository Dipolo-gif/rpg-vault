"use client";

import { useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Images,
  Package,
  Sparkles,
  ScrollText,
  Swords,
  Wand2,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";

import { AbilityTab } from "@/components/character/ability-tab";
import { CharacterHero } from "@/components/character/character-hero";
import { CombatTab } from "@/components/character/combat-tab";
import { GalleryTab } from "@/components/character/gallery-tab";
import { InventoryTab } from "@/components/character/inventory-tab";
import { LoreTab } from "@/components/character/lore-tab";
import { SheetTab } from "@/components/character/sheet-tab";
import { SpellTab } from "@/components/character/spell-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch, apiJson } from "@/lib/client-api";
import type {
  AbilityRow,
  AssetWithUrl,
  CharacterStatsRow,
  CharacterWithSignedUrls,
  MagicItemRow,
  MagicItemWithUrl,
  SpellRow,
} from "@/lib/database.types";
import { getSystem, mergeSystem, readCustom } from "@/lib/systems";

// A ficha vive dentro do app: atributos, proficiência, CA, medidores, testes
// de resistência e perícias ficam na primeira aba, e as outras leem dali.
const TABS = [
  { id: "ficha", label: "Ficha", icon: ScrollText },
  { id: "combate", label: "Combate", icon: Swords },
  { id: "inventario", label: "Inventário", icon: Package },
  { id: "magias", label: "Magias", icon: WandSparkles },
  { id: "classe", label: "Classe", icon: GraduationCap },
  { id: "fluxo", label: "Fluxo", icon: Wand2 },
  { id: "talentos", label: "Talentos", icon: Sparkles },
  { id: "galeria", label: "Galeria", icon: Images },
  { id: "lore", label: "Lore", icon: BookOpen },
];

/**
 * Container da tela do personagem.
 *
 * Ele segura itens e habilidades porque o cálculo do combate depende dos dois:
 * ligar uma habilidade no inventário precisa mudar o dano na aba Combate sem
 * recarregar a página.
 */
export function CharacterWorkspace({
  initialCharacter,
  initialStats,
  initialItems,
  initialAssets,
  initialAbilities,
  initialSpells,
}: {
  initialCharacter: CharacterWithSignedUrls;
  initialStats: CharacterStatsRow;
  initialItems: MagicItemWithUrl[];
  initialAssets: AssetWithUrl[];
  initialAbilities: AbilityRow[];
  initialSpells: SpellRow[];
}) {
  const [character, setCharacter] = useState(initialCharacter);
  const [stats, setStats] = useState(initialStats);
  const [items, setItems] = useState(initialItems);
  const [assets, setAssets] = useState(initialAssets);
  const [abilities, setAbilities] = useState(initialAbilities);
  const [spells, setSpells] = useState(initialSpells);

  // Preset do sistema mais os atributos e perícias que a mesa criou.
  const system = mergeSystem(
    getSystem(character.system),
    readCustom(stats.custom),
  );

  function erro(error: unknown, padrao: string) {
    toast.error(error instanceof Error ? error.message : padrao);
  }

  function patchItem(id: string, patch: Partial<MagicItemRow>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  /* ---------------------------------------------------------------- */
  /* Itens                                                             */
  /* ---------------------------------------------------------------- */

  function itemSaved(saved: MagicItemWithUrl, created: boolean) {
    setItems((current) =>
      created
        ? [...current, saved]
        : current.map((item) => (item.id === saved.id ? saved : item)),
    );
  }

  async function itemDelete(item: MagicItemWithUrl) {
    try {
      await apiFetch(`/api/items/${item.id}`, { method: "DELETE" });
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      // O cascade do banco já apagou as habilidades desse item.
      setAbilities((current) =>
        current.filter((ability) => ability.item_id !== item.id),
      );
      toast.success("Item removido");
    } catch (error) {
      erro(error, "Falha ao remover");
    }
  }

  /** Interruptor do item: desligar tira ele e as habilidades dele da conta. */
  async function itemToggle(item: MagicItemWithUrl, next: boolean) {
    patchItem(item.id, { equipped: next });
    if (!next) {
      setAbilities((current) =>
        current.map((ability) =>
          ability.item_id === item.id
            ? { ...ability, is_active: false }
            : ability,
        ),
      );
    }

    try {
      await apiFetch(`/api/items/${item.id}`, apiJson("PATCH", { equipped: next }));
    } catch (error) {
      patchItem(item.id, { equipped: item.equipped });
      erro(error, "Falha ao trocar o estado do item");
    }
  }

  async function itemCharges(item: MagicItemWithUrl, value: number) {
    patchItem(item.id, { charges_current: value });
    try {
      await apiFetch(
        `/api/items/${item.id}`,
        apiJson("PATCH", { charges_current: value }),
      );
    } catch (error) {
      patchItem(item.id, { charges_current: item.charges_current });
      erro(error, "Falha ao ajustar as cargas");
    }
  }

  async function itemQuantity(item: MagicItemWithUrl, value: number) {
    patchItem(item.id, { quantity: value });
    try {
      await apiFetch(
        `/api/items/${item.id}`,
        apiJson("PATCH", { quantity: value }),
      );
    } catch (error) {
      patchItem(item.id, { quantity: item.quantity });
      erro(error, "Falha ao ajustar a quantidade");
    }
  }

  /* ---------------------------------------------------------------- */
  /* Habilidades                                                       */
  /* ---------------------------------------------------------------- */

  function abilitySaved(saved: AbilityRow, created: boolean) {
    setAbilities((current) =>
      created
        ? [...current, saved]
        : current.map((ability) => (ability.id === saved.id ? saved : ability)),
    );
  }

  /** Devolve todos os usos proprios da habilidade. */
  async function abilityRecharge(ability: AbilityRow) {
    if (ability.uses_max === null) return;
    try {
      const payload = await apiFetch<{ ability: AbilityRow }>(
        `/api/abilities/${ability.id}`,
        apiJson("PATCH", { uses_current: ability.uses_max }),
      );
      setAbilities((current) =>
        current.map((entry) =>
          entry.id === payload.ability.id ? payload.ability : entry,
        ),
      );
      toast.success(`${ability.name} recarregada`);
    } catch (error) {
      erro(error, "Falha ao recarregar");
    }
  }

  async function abilityDelete(ability: AbilityRow) {
    try {
      await apiFetch(`/api/abilities/${ability.id}`, { method: "DELETE" });
      setAbilities((current) =>
        current.filter((entry) => entry.id !== ability.id),
      );
      toast.success("Habilidade removida");
    } catch (error) {
      erro(error, "Falha ao remover");
    }
  }

  /**
   * Ligar consome carga do item (ou um uso próprio), então o servidor é quem
   * decide. Aqui a tela só reflete o que ele devolveu.
   */
  async function abilityToggle(ability: AbilityRow, next: boolean) {
    try {
      const payload = await apiFetch<{
        ability: AbilityRow;
        item: MagicItemRow | null;
      }>(`/api/abilities/${ability.id}`, apiJson("PATCH", { is_active: next }));

      setAbilities((current) =>
        current.map((entry) =>
          entry.id === payload.ability.id ? payload.ability : entry,
        ),
      );

      if (payload.item) {
        patchItem(payload.item.id, {
          charges_current: payload.item.charges_current,
        });
      }
    } catch (error) {
      erro(error, "Falha ao ligar a habilidade");
    }
  }

  /* ---------------------------------------------------------------- */
  /* Magias                                                            */
  /* ---------------------------------------------------------------- */

  function spellSaved(saved: SpellRow, created: boolean) {
    setSpells((current) =>
      created
        ? [...current, saved]
        : current.map((spell) => (spell.id === saved.id ? saved : spell)),
    );
  }

  async function spellDelete(spell: SpellRow) {
    try {
      await apiFetch(`/api/spells/${spell.id}`, { method: "DELETE" });
      setSpells((current) => current.filter((entry) => entry.id !== spell.id));
      toast.success("Magia removida");
    } catch (error) {
      erro(error, "Falha ao remover");
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <CharacterHero
        character={character}
        onCharacterChange={setCharacter}
        stats={stats}
        onStatsChange={setStats}
        system={system}
      />

      <Tabs defaultValue="ficha" className="mt-6">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              <tab.icon className="size-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-4">
          <TabsContent value="ficha">
            <SheetTab
              characterId={character.id}
              system={system}
              stats={stats}
              onStatsChange={setStats}
              items={items}
              abilities={abilities}
            />
          </TabsContent>

          <TabsContent value="combate">
            <CombatTab
              characterId={character.id}
              system={system}
              stats={stats}
              onStatsChange={setStats}
              items={items}
              abilities={abilities}
            />
          </TabsContent>

          <TabsContent value="inventario">
            <InventoryTab
              characterId={character.id}
              system={system}
              items={items}
              abilities={abilities}
              onItemSaved={itemSaved}
              onItemDelete={itemDelete}
              onItemToggle={itemToggle}
              onItemCharges={itemCharges}
              onItemQuantity={itemQuantity}
              onAbilityToggle={abilityToggle}
              onAbilitySaved={abilitySaved}
              onAbilityDelete={abilityDelete}
              onAbilityRecharge={abilityRecharge}
            />
          </TabsContent>

          <TabsContent value="magias">
            <SpellTab
              characterId={character.id}
              system={system}
              stats={stats}
              onStatsChange={setStats}
              spells={spells}
              items={items}
              abilities={abilities}
              onSpellSaved={spellSaved}
              onSpellDelete={spellDelete}
            />
          </TabsContent>

          <TabsContent value="classe">
            <AbilityTab
              characterId={character.id}
              source="classe"
              system={system}
              abilities={abilities}
              onToggle={abilityToggle}
              onSaved={abilitySaved}
              onDelete={abilityDelete}
              onRecharge={abilityRecharge}
            />
          </TabsContent>

          <TabsContent value="fluxo">
            <AbilityTab
              characterId={character.id}
              source="fluxo"
              system={system}
              abilities={abilities}
              onToggle={abilityToggle}
              onSaved={abilitySaved}
              onDelete={abilityDelete}
              onRecharge={abilityRecharge}
            />
          </TabsContent>

          <TabsContent value="talentos">
            <AbilityTab
              characterId={character.id}
              source="talento"
              system={system}
              abilities={abilities}
              onToggle={abilityToggle}
              onSaved={abilitySaved}
              onDelete={abilityDelete}
              onRecharge={abilityRecharge}
            />
          </TabsContent>

          <TabsContent value="galeria">
            <GalleryTab
              characterId={character.id}
              assets={assets}
              onAssetsChange={setAssets}
              onAvatarChange={setCharacter}
            />
          </TabsContent>

          <TabsContent value="lore">
            <LoreTab character={character} onCharacterChange={setCharacter} />
          </TabsContent>
        </div>
      </Tabs>
    </main>
  );
}
