'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { slugify, formatDate } from '@/lib/utils';
import { Book } from '@/lib/types';
import type { PublicationStatus } from '@/lib/validation';
import {
  COVER_IMAGE_MAX_BYTES,
  formatUploadLimit,
} from '@/lib/upload-limits';
import {
  createBook,
  createCoverUploadTicket,
  deleteBook,
  finalizeCoverUpload,
} from './actions';

type BookWithCount = Book & { chapterCount: number };

export default function AdminDashboardPage() {
  const [books, setBooks] = useState<BookWithCount[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'book' | 'post'>('book');
  const [coverUrl, setCoverUrl] = useState('');
  const [status, setStatus] = useState<PublicationStatus>('draft');
  const [publishedAt, setPublishedAt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const fetchBooks = useCallback(async () => {
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
    
    const rawBooks = (data ?? []) as Array<Book & { chapters?: Array<{ count: number }> }>;
    const formattedData: BookWithCount[] = rawBooks.map((book) => ({
      ...book,
      chapterCount: book.chapters && book.chapters[0] ? book.chapters[0].count : 0
    }));

    setBooks(formattedData);
  }, [supabase]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void fetchBooks(), 0);
    return () => window.clearTimeout(timeout);
  }, [fetchBooks]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > COVER_IMAGE_MAX_BYTES) {
      alert(`Kapak görseli en fazla ${formatUploadLimit(COVER_IMAGE_MAX_BYTES)} olabilir.`);
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const ticket = await createCoverUploadTicket({ mime: file.type, size: file.size });
      const { error } = await supabase.storage
        .from('covers')
        .uploadToSignedUrl(ticket.path, ticket.token, file, {
          contentType: file.type,
          cacheControl: '31536000',
        });
      if (error) throw new Error('Kapak görseli Storage alanına yüklenemedi');

      const url = await finalizeCoverUpload(ticket.path);
      setCoverUrl(url);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Yükleme başarısız');
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
      formData.append('status', status);
      formData.append('published_at', publishedAt);

      await createBook(formData);
      
      setTitle('');
      setDescription('');
      setCoverUrl('');
      setType('book');
      setStatus('draft');
      setPublishedAt('');
      setShowCreateForm(false);
      await fetchBooks();
    } catch (err) {
      console.error(err);
      alert('Eser oluşturulamadı');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu eseri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return;
    try {
      await deleteBook(id);
      await fetchBooks();
    } catch (err) {
      console.error(err);
      alert('Eser silinemedi');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-neutral-200">İçerik Kütüphanesi</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-pink-400 hover:bg-pink-300 text-black font-medium rounded-lg px-4 py-2 text-sm transition"
        >
          {showCreateForm ? 'İptal' : '+ Yeni Eser Ekle'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleSubmit} className="glass-card bg-neutral-900/60 rounded-xl p-6 border border-neutral-800 mb-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Başlık</label>
            <input
              type="text"
              required
              placeholder="Eserin başlığı"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-100 focus:outline-none focus:border-pink-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Açıklama</label>
            <textarea
              value={description}
              placeholder="Eser özeti veya açıklaması"
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-100 focus:outline-none focus:border-pink-400 text-sm"
            />
          </div>

          <div className="flex gap-4">
            <div className="w-full sm:w-1/2">
              <label className="block text-sm font-medium text-neutral-400 mb-1">Tür</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'book' | 'post')}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-100 focus:outline-none focus:border-pink-400 text-sm"
              >
                <option value="book">Kitap (Çok Bölümlü)</option>
                <option value="post">Blog Yazısı (Tek Metin)</option>
              </select>
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block text-sm font-medium text-neutral-400 mb-1">Yayın Durumu</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PublicationStatus)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-100 focus:outline-none focus:border-pink-400 text-sm"
              >
                <option value="draft">Taslak</option>
                <option value="published">Şimdi Yayınla</option>
                <option value="scheduled">Planla</option>
                <option value="archived">Arşivle</option>
              </select>
            </div>
          </div>

          {(status === 'scheduled' || status === 'published') && (
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">
                {status === 'scheduled' ? 'Planlanan Yayın Tarihi' : 'Yayın Tarihi (boşsa şimdi)'}
              </label>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                required={status === 'scheduled'}
                className="w-full sm:w-72 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-100 focus:outline-none focus:border-pink-400 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Kapak Görseli</label>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <input
                type="text"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="Görsel URL adresi..."
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-100 focus:outline-none focus:border-pink-400 text-sm"
              />
              <span className="text-neutral-500 text-xs text-center">VEYA</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-neutral-800 file:text-neutral-300 hover:file:bg-neutral-700"
              />
              {uploading && <span className="text-sm text-pink-400 animate-pulse">Yükleniyor...</span>}
            </div>
            <p className="mt-1.5 text-xs text-neutral-500">
              JPEG, PNG veya WebP · en fazla {formatUploadLimit(COVER_IMAGE_MAX_BYTES)}
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={creating || uploading}
              className="bg-pink-400 hover:bg-pink-300 disabled:opacity-50 text-black font-medium rounded-lg px-6 py-2.5 text-sm transition"
            >
              {creating ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
          </div>
        </form>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block bg-neutral-900/60 rounded-xl border border-neutral-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-800/50 text-xs text-neutral-400 uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Başlık</th>
              <th className="px-6 py-4 font-medium w-32">Tür</th>
              <th className="px-6 py-4 font-medium w-48">Tarih</th>
              <th className="px-6 py-4 font-medium w-32">Bölüm Sayısı</th>
              <th className="px-6 py-4 font-medium w-32 text-right">İşlemler</th>
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
                  <span className={`text-xs px-2.5 py-1 rounded-full ${book.type === 'post' ? 'bg-pink-400/10 text-pink-300 border border-pink-400/30' : 'bg-neutral-800 text-neutral-300 border border-neutral-700'}`}>
                    {book.type === 'post' ? 'Blog Yazısı' : 'Kitap'}
                  </span>
                  <span className="ml-2 text-xs text-neutral-500">
                    {book.status === 'published' ? 'Yayında' : book.status === 'scheduled' ? 'Planlı' : book.status === 'archived' ? 'Arşivde' : 'Taslak'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-neutral-400">
                  {formatDate(book.created_at)}
                </td>
                <td className="px-6 py-4 text-sm text-neutral-400">
                  {book.type === 'book' ? book.chapterCount || '0' : 'N/A'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition">
                    <Link href={`/admin/books/${book.id}`} className="text-sm text-neutral-400 hover:text-pink-400">
                      Düzenle
                    </Link>
                    <button onClick={() => handleDelete(book.id)} className="text-sm text-neutral-400 hover:text-red-400">
                      Sil
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {books.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-neutral-500 text-sm">
                  Henüz bir içerik bulunmuyor. İlk kitabınızı veya yazınızı ekleyin!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {books.map((book) => (
          <div key={book.id} className="bg-neutral-900/60 rounded-xl p-4 border border-neutral-800 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <Link href={`/admin/books/${book.id}`} className="font-semibold text-white hover:text-pink-400 transition text-base">
                  {book.title}
                </Link>
                <p className="text-xs text-neutral-500 mt-1">{formatDate(book.created_at)}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${book.type === 'post' ? 'bg-pink-400/10 text-pink-300' : 'bg-neutral-800 text-neutral-300'}`}>
                {book.type === 'post' ? 'Yazı' : 'Kitap'}
              </span>
            </div>
            
            {book.type === 'book' && (
              <p className="text-xs text-neutral-400">
                Bölüm sayısı: {book.chapterCount || '0'}
              </p>
            )}
            <p className="text-xs text-[#F8D794]/70">
              {book.status === 'published' ? 'Yayında' : book.status === 'scheduled' ? 'Planlı yayın' : book.status === 'archived' ? 'Arşivde' : 'Taslak'}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800/60">
              <Link href={`/admin/books/${book.id}`} className="text-sm text-pink-400 font-medium px-3 py-1 bg-pink-400/10 rounded-lg">
                Düzenle
              </Link>
              <button onClick={() => handleDelete(book.id)} className="text-sm text-red-400 font-medium px-3 py-1 bg-red-400/10 rounded-lg">
                Sil
              </button>
            </div>
          </div>
        ))}
        {books.length === 0 && (
          <div className="text-center py-8 text-neutral-500 text-sm">
            Henüz bir içerik bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
}
