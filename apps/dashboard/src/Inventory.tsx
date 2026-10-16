import { useCallback, useEffect, useMemo, useState } from "react";
import type { Item } from "@kitcheckout/contract";
import { listItems, subscribeToItems } from "./lib/items";

const STATUS_LABEL = { available: "Available", out: "Out", maintenance: "In maintenance" } as const;

export default function Inventory({ overdue }: { overdue: number }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");

  const load = useCallback(async () => {
    try {
      setItems(await listItems());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return subscribeToItems(load);
  }, [load]);

  const categories = useMemo(() => [...new Set(items.map((i) => i.category))].sort(), [items]);
  const count = (s: Item["status"]) => items.filter((i) => i.status === s).length;

  const shown = items.filter(
    (i) =>
      (category === "all" || i.category === category) &&
      (status === "all" || i.status === status) &&
      i.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p>Loading items…</p>;
  if (error) return <p role="alert">Could not load items: {error}</p>;

  return (
    <>
      <div className="metrics">
        <div><small>Total items</small><b>{items.length}</b></div>
        <div><small>Available</small><b>{count("available")}</b></div>
        <div><small>Out now</small><b>{count("out")}</b></div>
        <div><small>Overdue</small><b className={overdue > 0 ? "danger" : ""}>{overdue}</b></div>
      </div>

      <section className="card">
        <h2>Inventory ({shown.length})</h2>
        <div className="filters">
          <input placeholder="Search by name" aria-label="Search by name"
                 value={search} onChange={(e) => setSearch(e.target.value)} />
          <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="available">Available</option>
            <option value="out">Out</option>
            <option value="maintenance">In maintenance</option>
          </select>
        </div>

        {shown.length === 0 ? (
          <p className="empty">No items match. Try clearing the search or filters.</p>
        ) : (
          <div className="tablewrap">
            <table>
              <thead><tr><th>Name</th><th>Category</th><th>Code</th><th>Status</th></tr></thead>
              <tbody>
                {shown.map((i) => (
                  <tr key={i.id}>
                    <td>{i.name}</td>
                    <td>{i.category}</td>
                    <td><span className="code">{i.qrCode}</span></td>
                    <td><span className={`status ${i.status}`}>{STATUS_LABEL[i.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}