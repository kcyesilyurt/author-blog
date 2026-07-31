'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/utils';
import { Book, Chapter } from '@/lib/types';
import { updateBook, createChapter, deleteChapter, uploadCoverImage } from '../../actions';

export default function BookEditorPage() {
  const { id } = useParams() as { id: string };
  const supabase = createClient();
  
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [type, setType] = useState<'book' | 'post'>('book');
  
  const [savingBook, setSavingBook] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [showChapterForm, setShowChapterForm] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('');
  const [creatingChapter, setCreatingChapter] = useState(false);

  const fetchData = async () => {
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();

    if (bookError) {
      console.error(bookError);
      return;
    }

    setBook(bookData);
    setTitle(bookData.title);
    setSlug(bookData.slug);
    setDescription(bookData.description || '');
    setCoverUrl(bookData.cover_url || '');
    setType(bookData.type as 'book' | 'post');

    const { data: chaptersData, error: chaptersError } = await supabase
      .from('chapters')
      .select('*')
      .eq('book_id', id)
      .order('chapter_order', { ascending: true });

    if (!chaptersError && chaptersData) {
      setChapters(chaptersData);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleBookSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBook(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('slug', slug);
      formData.append('description', description);
      formData.append('cover_url', coverUrl);
      formData.append('type', type);
      await updateBook(id, formData);
      alert('Değişiklikler başarıyla kaydedildi.');
    } catch (err) {
      console.error(err);
      alert('Eser kaydedilemedi');
    } finally {
      setSavingBook(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      const url = await uploadCoverImage(formData);
      setCoverUrl(url);
    } catch (err) {
      console.error(err);
      alert('Görsel yüklenemedi');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingChapter(true);
    try {
      const maxOrder = chapters.length > 0 ? Math.max(...chapters.map(c => c.chapter_order)) : 0;
      const formData = new FormData();
      formData.append('title', chapterTitle);
      formData.append('slug', slugify(chapterTitle));
      formData.append('chapter_order', String(maxOrder + 1));
      
      await createChapter(id, formData);
      setChapterTitle('');
      setShowChapterForm(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Bölüm eklenemedi');
    } finally {
      setCreatingChapter(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!window.confirm('Bu bölümü silmek istediğinize emin misiniz?')) return;
    try {
      await deleteChapter(chapterId, id);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Bölüm silinemedi');
    }
  };

  if (!book) return <div className="text-neutral-400 p-8">İçerik yükleniyor...</div>;

  return (
    <div className="space-y-12">
      <div>
        <Link href="/admin" className="text-sm text-neutral-500 hover:text-pink-400 mb-4 inline-block">&larr; Yönetim Paneline Dön</Link>
        <h2 className="text-2xl font-bold text-white mb-6">{type === 'post' ? 'Yazıyı' : 'Kitabı'} Düzenle: {book.title}</h2>
        
        <form onSubmit={handleBookSave} className="glass-card bg-neutral-900/60 rounded-xl p-6 border border-neutral-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Başlık</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">URL Adresi (Slug)</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-400 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-400 text-sm"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/3">
              <label className="block text-sm font-medium text-neutral-400 mb-1">Tür</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'book' | 'post')}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-400 text-sm"
              >
                <option value="book">Kitap (Çok Bölümlü)</option>
                <option value="post">Blog Yazısı</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-400 mb-1">Kapak Görseli</label>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <input
                  type="text"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="Görsel URL..."
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-400 text-sm"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-neutral-800 file:text-neutral-300 hover:file:bg-neutral-700"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={savingBook || uploading}
              className="bg-pink-400 hover:bg-pink-300 disabled:opacity-50 text-black font-medium rounded-lg px-6 py-2.5 text-sm transition"
            >
              {savingBook ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </div>

      {type === 'book' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium text-neutral-200">Bölümler</h2>
            <button
              onClick={() => setShowChapterForm(!showChapterForm)}
              className="bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg px-4 py-2 text-sm transition border border-neutral-700"
            >
              {showChapterForm ? 'İptal' : '+ Yeni Bölüm Ekle'}
            </button>
          </div>

          {showChapterForm && (
            <form onSubmit={handleCreateChapter} className="glass-card bg-neutral-900/60 rounded-xl p-6 border border-neutral-800 mb-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-400 mb-1">Bölüm Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Bölüm 1: Başlangıç"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-400 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={creatingChapter}
                className="bg-pink-400 hover:bg-pink-300 disabled:opacity-50 text-black font-medium rounded-lg px-6 py-2 transition h-10 text-sm"
              >
                {creatingChapter ? 'Ekleniyor...' : 'Ekle'}
              </button>
            </form>
          )}

          <div className="space-y-3">
            {chapters.map((chapter) => (
              <div key={chapter.id} className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="text-pink-400 font-mono text-sm w-8">{chapter.chapter_order}</div>
                  <div className="text-neutral-200 font-medium">{chapter.title}</div>
                </div>
                <div className="flex items-center gap-4">
                  <Link href={`/admin/books/${id}/chapters/${chapter.id}`} className="text-sm text-neutral-400 hover:text-pink-400">
                    İçeriği Düzenle
                  </Link>
                  <button onClick={() => handleDeleteChapter(chapter.id)} className="text-sm text-neutral-400 hover:text-red-400">
                    Sil
                  </button>
                </div>
              </div>
            ))}
            {chapters.length === 0 && !showChapterForm && (
              <div className="text-center py-8 text-neutral-500 text-sm bg-neutral-900/50 rounded-lg border border-neutral-800/50">
                Henüz bölüm yok. Başlamak için bölüm ekleyin.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
