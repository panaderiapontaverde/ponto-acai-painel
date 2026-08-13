import { createClient } from "@/lib/supabase/server";

export interface BrainEntry {
  id: string;
  type: string;
  title: string;
  content: string;
  origin: string;
  confidence: string;
  version: number;
  active: boolean;
  created_at: string;
}

/** Entradas ativas do Cérebro (`brain_entries`) — conhecimento operacional, nunca dado transacional. */
export async function getActiveBrainEntries(): Promise<BrainEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("brain_entries")
    .select("id, type, title, content, origin, confidence, version, active, created_at")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getActiveBrainEntries] erro ao consultar brain_entries", error);
    return [];
  }
  return (data ?? []) as BrainEntry[];
}
