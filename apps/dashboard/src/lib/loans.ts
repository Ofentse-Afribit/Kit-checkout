import { useCallback, useEffect, useState } from "react";
import {
  OpenLoanSchema,
  UtilisationRowSchema,
  type OpenLoan,
  type UtilisationRow,
} from "@kitcheckout/contract";
import { supabase } from "./supabase";

type LoanRow = {
  id: string;
  due_at: string;
  items: { name: string } | null;
  borrowers: { name: string } | null;
};

export async function listOpenLoans(): Promise<OpenLoan[]> {
  const { data, error } = await supabase
    .from("loans")
    .select("id, due_at, items(name), borrowers(name)")
    .is("returned_at", null)
    .order("due_at");
  if (error) throw error;
  return (data as unknown as LoanRow[]).map((r) =>
    OpenLoanSchema.parse({
      id: r.id,
      itemName: r.items?.name ?? "Unknown item",
      borrowerName: r.borrowers?.name ?? "Unknown borrower",
      dueAt: r.due_at,
    })
  );
}

export async function listUtilisation(): Promise<UtilisationRow[]> {
  const { data, error } = await supabase.rpc("utilisation_30d");
  if (error) throw error;
  return (data as any[]).map((r) =>
    UtilisationRowSchema.parse({
      itemId: r.item_id,
      name: r.name,
      category: r.category,
      loans30d: Number(r.loans_30d),
    })
  );
}

// Open loans, kept fresh by realtime.
export function useOpenLoans() {
  const [loans, setLoans] = useState<OpenLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoans(await listOpenLoans());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("loans-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "loans" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  return { loans, loading, error };
}

// Re-renders every minute so overdue rows update without a refresh.
export function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}