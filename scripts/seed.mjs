import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding books...');
  const { error: bookError } = await supabase.from('books').upsert([
    {
      id: 'b1111111-1111-1111-1111-111111111111',
      title: 'Sessiz Fırtına',
      slug: 'sessiz-firtina',
      description: 'Kıyı kasabasının sarp kayalıklarında geçen, geçmişin gölgeleriyle yüzleşen karanlık bir edebiyat anlatısı.',
      cover_url: '/samples/sessiz-firtina.jpg',
      type: 'book',
      status: 'published',
      published_at: new Date().toISOString(),
    },
    {
      id: 'b2222222-2222-2222-2222-222222222222',
      title: 'Yıldız Tozu',
      slug: 'yildiz-tozu',
      description: 'Geceye, yalnızlığa ve insan ruhunun derinliklerine dokunan duygusal bir şiir koleksiyonu.',
      cover_url: '/samples/yildiz-tozu.jpg',
      type: 'book',
      status: 'published',
      published_at: new Date().toISOString(),
    },
    {
      id: 'b3333333-3333-3333-3333-333333333333',
      title: 'Gece Notları',
      slug: 'gece-notlari',
      description: 'Yazarın gece yarısı kaleme aldığı kişisel denemeler, sanat üzerine düşünceler ve günlük izlenimler.',
      cover_url: '/samples/gece-notlari.jpg',
      type: 'post',
      status: 'published',
      published_at: new Date().toISOString(),
    }
  ]);

  if (bookError) console.error('Book error:', bookError);

  console.log('Seeding chapters...');
  const { error: chapterError } = await supabase.from('chapters').upsert([
    {
      id: 'c1111111-1111-1111-1111-111111111111',
      book_id: 'b1111111-1111-1111-1111-111111111111',
      title: 'Bölüm 1: Kayalıklar ve Rüzgar',
      slug: 'bolum-1-kayaliklar-ve-ruzgar',
      content: 'Deniz, karanlığın ortasında çalkalanıyordu. Rüzgar, sarp kayalıklara çarptıkça eski bir şarkının son dizelerini fısıldar gibiydi.\n\n> "Fırtına yaklaştığında, en sessiz olanlar ilk duyarlar."\n\nEski deniz fenerinin kırık camından süzülen ışık huzmesi, dalgaların üzerinde anlık parıltılar yaratıyordu. Kasaba halkı kepenklerini çoktan kapatmıştı. Oysa o, kıyının tam kenarında durmuş, yaklaşan gürültüyü dinliyordu.\n\nHaritanın üzerinde işaretlenmemiş bu küçük koy, yıllardır saklanan bir sırrın muhafızıydı. Gökyüzündeki şimşekler çaktığında, karanlığın arkasındaki siluetler bir anlığına belirip tekrar kayboluyordu.',
      chapter_order: 1,
      status: 'published',
      published_at: new Date().toISOString(),
    },
    {
      id: 'c1111111-1111-1111-1111-222222222222',
      book_id: 'b1111111-1111-1111-1111-111111111111',
      title: 'Bölüm 2: Unutulan Mektup',
      slug: 'bolum-2-unutulan-mektup',
      content: 'Ahşap masanın üzerindeki gaz lambası titrek bir ışık yayıyordu. Çekmecenin gizli bölmesinde yıllardır el sürülmemiş duran sararmış zarfı çıkardı.\n\nMektup şöyle başlıyordu:\n\n*Sayfaların arasında kaybolan zamanı geri getiremeyiz. Fakat unutulan sözler, en beklenmedik anda yankılanır.*\n\nSarı kağıdın üzerindeki mürekkep yer yer silinmişti, ama cümlenin anlamı ilk günkü kadar tazeydi.',
      chapter_order: 2,
      status: 'published',
      published_at: new Date().toISOString(),
    },
    {
      id: 'c2222222-2222-2222-2222-111111111111',
      book_id: 'b2222222-2222-2222-2222-222222222222',
      title: 'Karakalem Gökyüzü',
      slug: 'karakalem-gokyuzu',
      content: 'Gece çökerken kente,\nBir yıldız düşer sessizce.\nNe ses kalır ne fısıltı,\nSadece içimdeki o eski yankı.\n\nZaman akar parmaklarımızın arasından,\nBir avuç toz kalır geriye aşklarımızın ardından.',
      chapter_order: 1,
      status: 'published',
      published_at: new Date().toISOString(),
    },
    {
      id: 'c3333333-3333-3333-3333-111111111111',
      book_id: 'b3333333-3333-3333-3333-333333333333',
      title: 'Yazmak Üzerine Bir Gece Yarısı Düşüncesi',
      slug: 'yazmak-uzerine-bir-gece-yarisi-dusuncesi',
      content: 'Saat 02:30. Masamda ılık bir kahve ve önümde boş bir sayfa var.\n\nYazmak, aslında söylenmemiş kelimeleri bulup onları bir düzene sokma çabasıdır. Çoğu zaman ilk taslak mükemmel olmaz; ancak en önemli şey o ilk adımı atmaktır.\n\nYaratıcılık ilham beklemekle gelmez, masaya oturup çalışmakla ortaya çıkar.',
      chapter_order: 1,
      status: 'published',
      published_at: new Date().toISOString(),
    }
  ]);

  if (chapterError) console.error('Chapter error:', chapterError);

  console.log('Seeding comments...');
  const { error: commentError } = await supabase.from('comments').upsert([
    {
      id: 'd1111111-1111-1111-1111-111111111111',
      chapter_id: 'c1111111-1111-1111-1111-111111111111',
      guest_name: 'Selin Yılmaz',
      content: 'Betimlemeler o kadar canlı ki sanki ben de o kıyıda durup rüzgarı hissediyorum. Harika bir başlangıç!',
    },
    {
      id: 'd2222222-2222-2222-2222-222222222222',
      chapter_id: 'c1111111-1111-1111-1111-111111111111',
      guest_name: 'Ahmet Demir',
      content: 'İkinci bölüm ne zaman gelecek? Merakla bekliyorum!',
    },
    {
      id: 'd3333333-3333-3333-3333-333333333333',
      chapter_id: 'c2222222-2222-2222-2222-111111111111',
      guest_name: 'Elif Kaya',
      content: 'Dizeler çok derin ve anlamlı. Yüreğinize sağlık Övgü Hanım.',
    }
  ]);

  if (commentError) console.error('Comment error:', commentError);

  console.log('Seeding complete!');
}

seed().catch(console.error);
