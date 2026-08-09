"use client";

import { useActionState } from "react";

import { initialAuthActionState } from "@/features/auth/types";
import { signIn } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    signIn,
    initialAuthActionState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label className="text-sm font-semibold text-slate-700" htmlFor="email">
          Work email
        </label>
        <input
          autoComplete="email"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          id="email"
          name="email"
          placeholder="employee@company.com"
          required
          type="email"
        />
      </div>
      <div>
        <label
          className="text-sm font-semibold text-slate-700"
          htmlFor="password"
        >
          Password
        </label>
        <input
          autoComplete="current-password"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          id="password"
          minLength={6}
          name="password"
          required
          type="password"
        />
      </div>
      {state.error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
