export default function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      <main className="max-w-3xl mx-auto py-12 px-5 sm:px-6 md:px-8 lg:px-12 bg-black">
        {children}
      </main>
    </div>
  );
}
