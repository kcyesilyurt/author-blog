-- Örnek Veriler (Seed Data) - Övgü Deveci Safi

-- Kitaplar
INSERT INTO books (id, title, slug, description, cover_url, type, created_at) VALUES
(
  'b1111111-1111-1111-1111-111111111111',
  'Sessiz Fırtına',
  'sessiz-firtina',
  'Kıyı kasabasının sarp kayalıklarında geçen, geçmişin gölgeleriyle yüzleşen karanlık bir edebiyat anlatısı.',
  '/samples/sessiz-firtina.jpg',
  'book',
  NOW() - INTERVAL '10 days'
),
(
  'b2222222-2222-2222-2222-222222222222',
  'Yıldız Tozu',
  'yildiz-tozu',
  'Geceye, yalnızlığa ve insan ruhunun derinliklerine dokunan duygusal bir şiir koleksiyonu.',
  '/samples/yildiz-tozu.jpg',
  'book',
  NOW() - INTERVAL '5 days'
),
(
  'b3333333-3333-3333-3333-333333333333',
  'Gece Notları',
  'gece-notlari',
  'Yazarın gece yarısı kaleme aldığı kişisel denemeler, sanat üzerine düşünceler ve günlük izlenimler.',
  '/samples/gece-notlari.jpg',
  'post',
  NOW() - INTERVAL '2 days'
);

-- Bölümler - Sessiz Fırtına
INSERT INTO chapters (id, book_id, title, slug, content, chapter_order, created_at) VALUES
(
  'c1111111-1111-1111-1111-111111111111',
  'b1111111-1111-1111-1111-111111111111',
  'Bölüm 1: Kayalıklar ve Rüzgar',
  'bolum-1-kayaliklar-ve-ruzgar',
  'Deniz, karanlığın ortasında çalkalanıyordu. Rüzgar, sarp kayalıklara çarptıkça eski bir şarkının son dizelerini fısıldar gibiydi.

> "Fırtına yaklaştığında, en sessiz olanlar ilk duyarlar."

Eski deniz fenerinin kırık camından süzülen ışık huzmesi, dalgaların üzerinde anlık parıltılar yaratıyordu. Kasaba halkı kepenklerini çoktan kapatmıştı. Oysa o, kıyının tam kenarında durmuş, yaklaşan gürültüyü dinliyordu.

Haritanın üzerinde işaretlenmemiş bu küçük koy, yıllardır saklanan bir sırrın muhafızıydı. Gökyüzündeki şimşekler çaktığında, karanlığın arkasındaki siluetler bir anlığına belirip tekrar kayboluyordu.',
  1,
  NOW() - INTERVAL '9 days'
),
(
  'c1111111-1111-1111-1111-222222222222',
  'b1111111-1111-1111-1111-111111111111',
  'Bölüm 2: Unutulan Mektup',
  'bolum-2-unutulan-mektup',
  'Ahşap masanın üzerindeki gaz lambası titrek bir ışık yayıyordu. Çekmecenin gizli bölmesinde yıllardır el sürülmemiş duran sararmış zarfı çıkardı.

Mektup şöyle başlıyordu:

*Sayfaların arasında kaybolan zamanı geri getiremeyiz. Fakat unutulan sözler, en beklenmedik anda yankılanır.*

Sarı kağıdın üzerindeki mürekkep yer yer silinmişti, ama cümlenin anlamı ilk günkü kadar tazeydi.',
  2,
  NOW() - INTERVAL '8 days'
);

-- Bölümler - Yıldız Tozu
INSERT INTO chapters (id, book_id, title, slug, content, chapter_order, created_at) VALUES
(
  'c2222222-2222-2222-2222-111111111111',
  'b2222222-2222-2222-2222-222222222222',
  'Karakalem Gökyüzü',
  'karakalem-gokyuzu',
  'Gece çökerken kente,
Bir yıldız düşer sessizce.
Ne ses kalır ne fısıltı,
Sadece içimdeki o eski yankı.

Zaman akar parmaklarımızın arasından,
Bir avuç toz kalır geriye aşklarımızın ardından.',
  1,
  NOW() - INTERVAL '4 days'
);

-- Bölümler - Gece Notları (Blog Post)
INSERT INTO chapters (id, book_id, title, slug, content, chapter_order, created_at) VALUES
(
  'c3333333-3333-3333-3333-111111111111',
  'b3333333-3333-3333-3333-333333333333',
  'Yazmak Üzerine Bir Gece Yarısı Düşüncesi',
  'yazmak-uzerine-bir-gece-yarisi-dusuncesi',
  'Saat 02:30. Masamda ılık bir kahve ve önümde boş bir sayfa var.

Yazmak, aslında söylenmemiş kelimeleri bulup onları bir düzene sokma çabasıdır. Çoğu zaman ilk taslak mükemmel olmaz; ancak en önemli şey o ilk adımı atmaktır.

Yaratıcılık ilham beklemekle gelmez, masaya oturup çalışmakla ortaya çıkar.',
  1,
  NOW() - INTERVAL '2 days'
);

-- Örnek Yorumlar
INSERT INTO comments (id, chapter_id, guest_name, content, created_at) VALUES
(
  'm1111111-1111-1111-1111-111111111111',
  'c1111111-1111-1111-1111-111111111111',
  'Selin Yılmaz',
  'Betimlemeler o kadar canlı ki sanki ben de o kıyıda durup rüzgarı hissediyorum. Harika bir başlangıç!',
  NOW() - INTERVAL '7 days'
),
(
  'm2222222-2222-2222-2222-222222222222',
  'c1111111-1111-1111-1111-111111111111',
  'Ahmet Demir',
  'İkinci bölüm ne zaman gelecek? Merakla bekliyorum!',
  NOW() - INTERVAL '6 days'
),
(
  'm3333333-3333-3333-3333-333333333333',
  'c2222222-2222-2222-2222-111111111111',
  'Elif Kaya',
  'Dizeler çok derin ve anlamlı. Yüreğinize sağlık Övgü Hanım.',
  NOW() - INTERVAL '3 days'
);

-- Örnek Tepkiler
INSERT INTO reactions (chapter_id, guest_identifier, type) VALUES
('c1111111-1111-1111-1111-111111111111', 'guest-demo-1', 'like'),
('c1111111-1111-1111-1111-111111111111', 'guest-demo-2', 'heart'),
('c1111111-1111-1111-1111-111111111111', 'guest-demo-3', 'bookmark'),
('c2222222-2222-2222-2222-111111111111', 'guest-demo-1', 'heart');
