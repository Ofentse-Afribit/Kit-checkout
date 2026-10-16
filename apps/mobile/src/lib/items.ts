// THE ONE SEAM for the phone. Screens never see snake_case rows.
import { ItemSchema, type Item } from "@kitcheckout/contract";
import { supabase } from "./supabase";

export async function fetchItems(): Promise<Item[]> {
  const { data, error } = await supabase.from("items").select("*").order("name");
  if (error) throw error;
  return data.map((r: any) =>
    ItemSchema.parse({
      id: r.id, name: r.name, category: r.category,
      qrCode: r.qr_code, status: r.status, notes: r.notes,
    })
  );
}
