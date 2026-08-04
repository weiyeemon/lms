import { lmsFoundationItems } from "@/features/lms/placeholder";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:px-8">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            LMS foundation
          </p>
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              Leave management workspace
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              A system for the employee leave workflows, backed
              by validated configuration and Supabase client scaffolding.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-6 py-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {lmsFoundationItems.map((item) => (
          <article
            className="rounded-lg border border-slate-200 bg-white p-5"
            key={item}
          >
            <p className="text-sm font-medium text-slate-500">Planned area</p>
            <h2 className="mt-3 text-xl font-semibold">{item}</h2>
          </article>
        ))}
      </section>
    </main>
  );
}
