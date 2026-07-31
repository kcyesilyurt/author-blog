import { createClient } from '@/lib/supabase/server';
import BookCard from '@/components/BookCard';
import { Book } from '@/lib/types';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <section className="py-16 sm:py-24 text-center px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-pink-300 to-pink-500 bg-clip-text text-transparent">
          {process.env.NEXT_PUBLIC_SITE_NAME || 'Author Blog'}
        </h1>
        <p className="mt-4 text-xl text-neutral-400 max-w-lg mx-auto">
          {process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Stories and thoughts'}
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-semibold text-white mb-8">Latest Works</h2>
        
        {(!books || books.length === 0) ? (
          <div className="text-center py-12">
            <p className="text-neutral-500">No books published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {books.map((book: Book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
