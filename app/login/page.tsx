import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden overflow-hidden bg-emerald-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200">
          Leave Management
        </div>
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Time away, made clear
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-tight">
            Plan leave without losing sight of your balance.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-emerald-100">
            Submit personal or medical leave and keep every request in one secure place.
          </p>
        </div>
        <p className="text-sm text-emerald-200">Employee workspace</p>
      </section>
      <section className="flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-950/10 sm:p-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl font-bold text-emerald-800">
            L
          </div>
          <h2 className="mt-7 text-3xl font-semibold tracking-tight text-slate-950">
            Welcome back
          </h2>
          <p className="mt-2 text-slate-600">
            Sign in with your employee account to continue.
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
