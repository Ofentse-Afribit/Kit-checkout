import type { OpenLoan } from "@kitcheckout/contract";

type Props = { loans: OpenLoan[]; loading: boolean; error: string | null; now: number };

const DAY = 86_400_000;

export default function WhoHasWhat({ loans, loading, error, now }: Props) {
  if (loading) return <p>Loading open loans…</p>;
  if (error) return <p role="alert">Could not load loans: {error}</p>;

  return (
    <section className="card">
      <h2>Who has what ({loans.length})</h2>
      {loans.length === 0 ? (
        <p className="empty">Nothing is out right now. Items checked out on the phone app appear here.</p>
      ) : (
        <div className="tablewrap">
          <table>
            <thead><tr><th>Item</th><th>Borrower</th><th>Due</th></tr></thead>
            <tbody>
              {loans.map((l) => {
                const due = new Date(l.dueAt).getTime();
                const late = due < now;
                const days = Math.floor((now - due) / DAY);
                return (
                  <tr key={l.id} className={late ? "overdue" : ""}>
                    <td>{l.itemName}</td>
                    <td>{l.borrowerName}</td>
                    <td>
                      {late && (
                        <strong className="late">
                          ⚠ {days >= 1 ? `Overdue ${days} ${days === 1 ? "day" : "days"}` : "Overdue today"}
                          {" · "}
                        </strong>
                      )}
                      {new Date(l.dueAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}