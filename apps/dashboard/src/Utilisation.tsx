import { useEffect, useState } from "react";
import type { UtilisationRow } from "@kitcheckout/contract";
import { listUtilisation } from "./lib/loans";

export default function Utilisation() {
  const [rows, setRows] = useState<UtilisationRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listUtilisation()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : "Something went wrong"));
  }, []);

  if (error) return <p role="alert">Could not load utilisation: {error}</p>;
  if (!rows) return <p>Loading utilisation…</p>;
  if (rows.length === 0) {
    return <p className="empty">No utilisation data. This page is for admins only, so check your role is set to admin.</p>;
  }

  const max = Math.max(1, ...rows.map((r) => r.loans30d));
  const top = rows.filter((r) => r.loans30d > 0).slice(0, 8);
  const never = rows.filter((r) => r.loans30d === 0);

  return (
    <div className="two">
      <section className="card">
        <h2>Most borrowed, 30 days</h2>
        {top.length === 0 ? (
          <p className="empty">No loans in the last 30 days.</p>
        ) : (
          <div className="bars">
            {top.map((r) => (
              <div key={r.itemId}>
                <span>{r.name}</span>
                <span className="track"><i style={{ width: `${(r.loans30d / max) * 100}%` }} /></span>
                <em>{r.loans30d}</em>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="card">
        <h2>Never borrowed ({never.length})</h2>
        {never.length === 0 ? (
          <p className="empty">Every item has been borrowed in the last 30 days.</p>
        ) : (
          <ul className="plain">
            {never.map((r) => <li key={r.itemId}>{r.name} <span className="code">{r.category}</span></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}