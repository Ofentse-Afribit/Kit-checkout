import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import { useNow, useOpenLoans } from "./lib/loans";
import Inventory from "./Inventory";
import WhoHasWhat from "./WhoHasWhat";
import Utilisation from "./Utilisation";

function useRoute() {
  const [route, setRoute] = useState(window.location.hash || "#/");
  useEffect(() => {
    const onChange = () => setRoute(window.location.hash || "#/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (checking) return <main><p>Loading…</p></main>;
  if (!session) return <SignIn />;
  return <Dashboard />;
}

function Dashboard() {
  const route = useRoute();
  const now = useNow();
  const { loans, loading, error } = useOpenLoans();
  const overdue = loans.filter((l) => new Date(l.dueAt).getTime() < now).length;

  useEffect(() => {
    document.title = overdue > 0 ? `(${overdue} overdue) KitCheckout` : "KitCheckout";
  }, [overdue]);

  const link = (href: string, label: string) => (
    <a href={href} aria-current={route === href ? "page" : undefined}>{label}</a>
  );

  return (
    <>
      <header className="topbar">
        <strong>KitCheckout</strong>
        <nav aria-label="Main">
          {link("#/", "Inventory")}
          {link("#/loans", `Who has what (${loans.length})`)}
          {link("#/utilisation", "Utilisation")}
        </nav>
        <button className="ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </header>
      <main>
        {route === "#/loans" ? (
          <WhoHasWhat loans={loans} loading={loading} error={error} now={now} />
        ) : route === "#/utilisation" ? (
          <Utilisation />
        ) : (
          <Inventory overdue={overdue} />
        )}
      </main>
    </>
  );
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  }

  return (
    <main>
      <h1>Sign in</h1>
      <form onSubmit={submit}>
        <label>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit">Sign in</button>
        {error && <p role="alert">Could not sign in: {error}</p>}
      </form>
    </main>
  );
}