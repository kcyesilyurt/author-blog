export default function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-black">
      <article className="mx-auto max-w-[680px] bg-black px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </article>
    </div>
  );
}
