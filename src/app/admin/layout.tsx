export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Admin Dashboard</h1>
      </div>
      {children}
    </div>
  );
}
