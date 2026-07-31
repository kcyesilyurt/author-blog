'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { slugify, formatDate } from '@/lib/utils';
import { Book } from '@/lib/types';
import { createBook, deleteBook, uploadCoverImage } from './actions';

export default function AdminDashboardPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'book' | 'post'>('book');
  const [coverUrl, setCoverUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const supabase = createClient();

  const fetchBooks = async () => {
    const { data, error } = await supabase
      .from('books')
      .select(`
        *,
        chapters (count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching books:', error);
      return;
    }
    
    // Transform the chapters count from [{ count: N }] to N if needed based on postgrest behavior
    const formattedData = (data || []).map((book: any) => ({
      ...book,
      chapterCount: book.chapters && book.chapters[0] ? book.chapters[0].count : 0
    }));

    setBooks(formattedData as any);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const url = await uploadCoverImage(formData);
      setCoverUrl(url);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('slug', slugify(title));
      formData.append('description', description);
      formData.append('cover_url', coverUrl);
      formData.append('type', type);

      await createBook(formData);
      
      setTitle('');
      setDescription('');
      setCoverUrl('');
      setType('book');
      setShowCreateForm(false);
      await fetchBooks();
    } catch (err) {
      console.error(err);
      alert('Failed to create book');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this book? This cannot be undone.')) return;
    try {
      await deleteBook(id);
      await fetchBooks();
    } catch (err) {
      console.error(err);
      alert('Failed to delete book');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-neutral-200">Content Library</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-pink-400 hover:bg-pink-300 text-black font-medium rounded-lg px-4 py-2 text-sm transition"
        >
          {showCreateForm ? 'Cancel' : 'Create New'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleSubmit} className="bg-neutral-900 rounded-xl p-6 border border-neutral-800 mb-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-400"
            />
          </div>

          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-neutral-400 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'book' | 'post')}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-400"
              >
                <option value="book">Book</option>
                <option value="post">Post</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Cover Image</label>
            <div className="flex gap-4 items-center">
              <input
                type="text"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="Image URL..."
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-400"
              />
              <span className="text-neutral-500 text-sm">OR</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-neutral-800 file:text-neutral-300 hover:file:bg-neutral-700"
              />
              {uploading && <span className="text-sm text-pink-400">Uploading...</span>}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={creating || uploading}
              className="bg-pink-400 hover:bg-pink-300 disabled:opacity-50 text-black font-medium rounded-lg px-6 py-2 text-sm transition"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-800/50 text-xs text-neutral-400 uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium w-32">Type</th>
                <th className="px-6 py-4 font-medium w-48">Created</th>
                <th className="px-6 py-4 font-medium w-32">Chapters</th>
                <th className="px-6 py-4 font-medium w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {books.map((book) => (
                <tr key={book.id} className="hover:bg-neutral-800/30 transition group">
                  <td className="px-6 py-4">
                    <Link href={`/admin/books/${book.id}`} className="font-medium text-neutral-200 hover:text-pink-400 transition">
                      {book.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${book.type === 'post' ? 'bg-pink-400/10 text-pink-400' : 'bg-neutral-700 text-neutral-300'}`}>
                      {book.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-400">
                    {formatDate(book.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-400">
                    {book.type === 'book' ? (book as any).chapterCount || '0' : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition">
                      <Link href={`/admin/books/${book.id}`} className="text-sm text-neutral-400 hover:text-pink-400">
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(book.id)} className="text-sm text-neutral-400 hover:text-red-400">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {books.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500 text-sm">
                    No content found. Create your first book or post!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex flex-col divide-y divide-neutral-800">
          {books.map((book) => (
            <div key={book.id} className="p-4 space-y-3 bg-neutral-900 border border-neutral-800 m-2 rounded-lg">
              <div className="flex justify-between items-start">
                <Link href={`/admin/books/${book.id}`} className="font-medium text-neutral-200 hover:text-pink-400 transition">
                  {book.title}
                </Link>
                <span className={`text-xs px-2 py-0.5 rounded-full ${book.type === 'post' ? 'bg-pink-400/10 text-pink-400' : 'bg-neutral-700 text-neutral-300'}`}>
                  {book.type}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-neutral-400">
                <span>{formatDate(book.created_at)}</span>
                <span>{book.type === 'book' ? `${(book as any).chapterCount || '0'} Chapters` : ''}</span>
              </div>
              <div className="flex gap-4 pt-2 border-t border-neutral-800/50">
                <Link href={`/admin/books/${book.id}`} className="text-sm text-neutral-400 hover:text-pink-400">
                  Edit
                </Link>
                <button onClick={() => handleDelete(book.id)} className="text-sm text-neutral-400 hover:text-red-400">
                  Delete
                </button>
              </div>
            </div>
          ))}
          {books.length === 0 && (
            <div className="p-8 text-center text-neutral-500 text-sm">
              No content found. Create your first book or post!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
