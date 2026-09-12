export function Placeholder({ name, owner }: { name: string; owner: number }) {
  return (
    <section className="border border-line p-8">
      <h1 className="text-2xl">{name}</h1>
      <p className="mt-3">Template slot · Student {owner} · Phase 2 implementation pending</p>
    </section>
  );
}
