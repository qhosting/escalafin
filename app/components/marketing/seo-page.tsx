import Link from 'next/link';

export function SeoPage({
  eyebrow,
  title,
  description,
  sections,
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: Array<{ title: string; body: string }>;
}) {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <Link href="/" className="text-sm text-emerald-300 hover:text-emerald-200">EscalaFin</Link>
        <p className="mt-16 text-sm font-semibold uppercase tracking-widest text-emerald-300">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{description}</p>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {sections.map(section => (
            <article key={section.title} className="rounded-2xl border border-white/10 bg-white/5 p-7">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-3 leading-7 text-slate-300">{section.body}</p>
            </article>
          ))}
        </div>
        <Link data-track="seo_cta" href="/auth/register-tenant" className="mt-12 inline-flex rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white hover:bg-emerald-400">
          Conocer EscalaFin
        </Link>
      </div>
    </main>
  );
}
