// THE ONE SEAM: the only file that turns snake_case rows into contract objects (and back).
import { ItemSchema, type Item } from "@kitcheckout/contract";
import { supabase } from "./supabase";

type ItemRow = {
  id: string; name: string; category: string;
  qr_code: string; status: string; notes: string | null;
};

export const toItem = (r: ItemRow): Item =>
  ItemSchema.parse({
    id: r.id, name: r.name, category: r.category,
    qrCode: r.qr_code, status: r.status, notes: r.notes,
  });

export async function listItems(): Promise<Item[]> {
  const { data, error } = await supabase.from("items").select("*").order("name");
  if (error) throw error;
  return (data as ItemRow[]).map(toItem);
}

// Realtime: call the returned function to unsubscribe.
export function subscribeToItems(onChange: () => void) {
  const ch = supabase
    .channel("items-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "items" }, onChange)
    .subscribe();
  return () => { supabase.removeChannel(ch); };
}
