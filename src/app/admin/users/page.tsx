"use client";

import { useEffect, useState } from "react";

type UserRow = {
  id: string;
  email: string;
  role: "ADMIN" | "SALES" | "SUPPORT";
  isActive: boolean;
  name: string;
};

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRow["role"]>("SALES");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string>("");

  async function load() {
    const r = await fetch("/api/users", { cache: "no-store" });
    const data = await r.json();
    setUsers(Array.isArray(data) ? data : []);
  }

  useEffect(() => { load(); }, []);

  async function addUser() {
    setMsg("");
    const r = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role, name: name || email })
    });

    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      setMsg(e?.error || "Kunne ikke opprette bruker");
      return;
    }

    setEmail(""); setPassword(""); setName("");
    await load();
  }

  async function resetPassword(u: UserRow) {
    const p = prompt(`Nytt passord for ${u.email}:`);
    if (!p) return;

    const r = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: p })
    });

    if (!r.ok) {
      setMsg("Passord kunne ikke oppdateres");
      return;
    }

    setMsg("Passord oppdatert");
    setTimeout(() => setMsg(""), 1500);
  }

  async function deactivate(u: UserRow) {
    if (!confirm(`Deaktivere ${u.email}?`)) return;

    const r = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    if (!r.ok) {
      setMsg("Kunne ikke deaktivere bruker");
      return;
    }

    await load();
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Brukere</h1>
        {msg ? <div className="text-sm text-gray-600">{msg}</div> : null}
      </div>

      <div className="border rounded p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="border rounded p-2" placeholder="Navn" value={name} onChange={(e)=>setName(e.target.value)} />
          <input className="border rounded p-2" placeholder="E-post" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="border rounded p-2" placeholder="Passord" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <select className="border rounded p-2" value={role} onChange={(e)=>setRole(e.target.value as UserRow["role"])}>
            <option value="ADMIN">ADMIN</option>
            <option value="SALES">SALES</option>
            <option value="SUPPORT">SUPPORT</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button onClick={addUser} className="px-4 py-2 rounded bg-black text-white">Legg til</button>
        </div>
      </div>

      <div className="border rounded overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600">{users.length} totalt</div>
        <table className="w-full">
          <thead>
            <tr className="border-t bg-white">
              <th className="p-3 text-left">Navn</th>
              <th className="p-3 text-left">E-post</th>
              <th className="p-3">Rolle</th>
              <th className="p-3">Aktiv</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3 text-center">{u.role}</td>
                <td className="p-3 text-center">{u.isActive ? "✓" : "–"}</td>
                <td className="p-3">
                  <div className="flex gap-3 justify-end">
                    <button onClick={()=>resetPassword(u)} className="text-blue-600">Endre passord</button>
                    <button onClick={()=>deactivate(u)} className="text-red-600">Slett</button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 ? (
              <tr><td className="p-6 text-center text-gray-500" colSpan={5}>Ingen brukere</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-500">
        «Slett» = deaktiver (soft delete). Dette er kun brukeradmin – resten av CRM endres ikke.
      </div>
    </div>
  );
}
