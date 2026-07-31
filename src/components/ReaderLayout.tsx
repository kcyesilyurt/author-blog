export default function ReaderLayout({ children }: { children: React.ReactNode }) {
  return (
    <article className="max-w-[680px] mx-auto px-4 sm:px-6 py-8 font-serif text-lg leading-relaxed text-zinc-200">
      {children}
    </article>
  );
}
