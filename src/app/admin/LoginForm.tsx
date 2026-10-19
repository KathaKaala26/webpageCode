"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="card mx-auto mt-10 max-w-sm space-y-4 p-6">
      <div>
        <label htmlFor="password" className="label">Admin password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
      </div>
      {state?.error && <p role="alert" className="text-sm font-semibold text-sindoor">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
