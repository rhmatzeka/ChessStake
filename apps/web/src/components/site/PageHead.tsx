export function PageHead({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-10 pt-12 md:pt-16">
      <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{title}</h1>
      {lead && <p className="mt-4 max-w-xl text-lg text-muted">{lead}</p>}
    </div>
  );
}
