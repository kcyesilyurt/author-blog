# Yazar ve Okur Platformu

Yazarın kitaplarını, yazılarını ve bölümlerini yayınlayabildiği; okurların bölüm bazında yorum ve tepki bırakabildiği, ayrıca eserlerden bağımsız olarak Panoda konuşabildiği Next.js + Supabase uygulaması.

Site özellikleri, okur/yönetici kullanımı ve Supabase'in yalnızca web paneliyle kurulumu için [ayrıntılı kullanım rehberine](./KULLANIM.md) bakın.

## Özellikler

- Kitap, yazı ve bölüm yönetimi
- Taslak, zamanlanmış, yayında ve arşivlenmiş yayın durumları
- Markdown tabanlı okuma sayfaları
- Üyelik, profil ve avatar yönetimi
- Üye veya misafir yorumu, tepki ve Pano mesajı
- Yazar biyografisi, etkinlik takvimi ve spam korumalı iletişim formu
- Gizlilik geliştirilmiş, tembel yüklenen YouTube video alanı
- Yalnızca yöneticiye açık iletişim gelen kutusu
- Ban, yorum/Pano moderasyonu ve yönetici rol yönetimi
- Sunucu tarafında yetkilendirme, dosya doğrulama ve atomik istek sınırlama

## Gereksinimler

- Node.js 22.x
- Bir Supabase projesi
- Supabase Project URL, publishable/anon key ve yalnızca sunucuda kullanılacak secret/service-role key

## Hızlı kullanım

- `/`: En Son Eklenen, Kitaplarım ve Blog Yazılarım
- `/pano`: Eserlerden bağımsız okur konuşmaları
- `/ben-kimim`, `/etkinlikler`, `/iletisim`: Yazar, etkinlik ve iletişim sayfaları
- `/auth/signup`, `/auth/login`, `/profile`: Üyelik ve profil
- `/admin`: Yazarın eser ve bölüm yönetimi
- `/admin/comments`, `/admin/users`, `/admin/stats`: Moderasyon ve istatistikler
- `/admin/events`, `/admin/messages`: Etkinlik takvimi ve özel iletişim kutusu

Misafirler isim girerek içeriklere yorum yapabilir ve Panoya yazabilir. Kayıtlı kullanıcılar `Okur`, kayıtsız kullanıcılar `Misafir` etiketiyle görünür; yöneticilerin adının yanında mavi doğrulama rozeti bulunur.

## Yerel kurulum

```bash
npm install
```

`.env.local` henüz yoksa örnek dosyayı kopyalayın. Var olan `.env.local` dosyasını bu komutla ezmeyin.

```bash
cp .env.local.example .env.local
```

`.env.local` içindeki değerleri kendi projenizle doldurun. `NEXT_PUBLIC_SUPABASE_ANON_KEY` için güncel publishable key, `SUPABASE_SERVICE_ROLE_KEY` için güncel secret key kullanılabilir; legacy `anon` ve `service_role` anahtarları da desteklenir.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

NEXT_PUBLIC_SITE_NAME="Yazar Adı"
NEXT_PUBLIC_SITE_DESCRIPTION="Hikayeler ve Düşünceler"
NEXT_PUBLIC_SITE_URL=https://ovgudevecisafi.com
ADMIN_USER_ID=Supabase_Auth_kullanici_UUID_degeri
RATE_LIMIT_SECRET=uzun_ve_rastgele_bir_deger
```

`SUPABASE_SERVICE_ROLE_KEY` ve `RATE_LIMIT_SECRET` kesinlikle `NEXT_PUBLIC_` öneki almamalı ve tarayıcıya gönderilmemelidir. İstek sınırlama anahtarı örneğin `openssl rand -hex 32` ile üretilebilir.

Eski `ADMIN_EMAIL` ve `NEXT_PUBLIC_ADMIN_EMAIL` değişkenleri artık kullanılmaz; ilk yönetici `ADMIN_USER_ID` ile belirlenir.

İlk yönetici için önce normal bir hesap oluşturun, Supabase Dashboard > Authentication > Users bölümünden bu hesabın UUID değerini alın ve `ADMIN_USER_ID` olarak ayarlayın. Bu kullanıcı `/admin` alanına ilk kez girdiğinde profil kaydı yönetici olarak işaretlenir. E-posta adresine göre otomatik yetki verilmez.

Ardından geliştirme sunucusunu başlatıp `http://localhost:3000` adresini açın:

```bash
npm run dev
```

## Veritabanı migration'ları

Supabase CLI veya masaüstü uygulaması zorunlu değildir. Mevcut proje için Supabase Dashboard > `SQL Editor` > `New query` alanında şu dosyaların bütün içeriğini sırayla çalıştırın:

1. [`20260802003532_harden_community_and_publication.sql`](./supabase/migrations/20260802003532_harden_community_and_publication.sql)
2. [`20260802142452_increase_image_upload_limits.sql`](./supabase/migrations/20260802142452_increase_image_upload_limits.sql)
3. [`20260802180000_add_events_and_contact_messages.sql`](./supabase/migrations/20260802180000_add_events_and_contact_messages.sql)

Mevcut veritabanında temel şema zaten bulunduğu için `001`-`006` migration'larını tekrar çalıştırmayın. İlk iki güncel migration'ı zaten başarıyla çalıştırdıysanız yalnızca üçüncü dosyayı çalıştırın. Tamamen boş yeni bir Supabase projesinde ise bütün migration'ları dosya adına göre sırayla uygulayın. İlk güvenlik migration'ı yayın durumlarını, RLS/grant kurallarını ve istek sınırlama fonksiyonunu oluşturur; son migration etkinlikleri ve özel iletişim kutusunu ekler.

İstenirse bağlı Supabase CLI projesiyle şu akış da kullanılabilir:

```bash
npx --yes supabase@latest init
npx --yes supabase@latest link --project-ref PROJECT_REF
npx --yes supabase@latest db push --dry-run
npx --yes supabase@latest db push
```

Repo daha önce `supabase init` ile hazırlanmışsa ilk komutu atlayın. Üretim veritabanında migration öncesi yedek alın ve `--dry-run` çıktısını kontrol edin. Web paneliyle adım adım kurulum için [KULLANIM.md](./KULLANIM.md) dosyasını izleyin.

Örnek içerik isteğe bağlıdır:

```bash
node --env-file=.env.local scripts/seed.mjs
```

Seed komutu service-role key kullandığı için yalnızca güvenilen yerel/CI ortamında çalıştırılmalıdır.

Kapak görselleri en fazla 10 MB, profil görselleri en fazla 5 MB olabilir. Dosya gövdesi kısa ömürlü imzalı adresle doğrudan Supabase Storage'a gönderilir; sunucu yükleme öncesinde yetki/limit, yükleme sonrasında dosya imzası kontrolü yapar. Supabase Dashboard > Storage ayarlarındaki global dosya sınırı en az 10 MB olmalıdır; global sınır bucket sınırlarından önce uygulanır.

## Doğrulama

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## Yayın akışı

- `draft`: yalnızca yönetim panelinde görünür.
- `scheduled`: yayın tarihi geldiğinde otomatik olarak görünür.
- `published`: yayın tarihi geçmişse herkese görünür.
- `archived`: kamusal sayfalardan kaldırılır, yönetim panelinde korunur.

Bir bölümün görünmesi için hem eserin hem bölümün kamusal olarak görünür durumda olması gerekir. Yorum ve tepkiler de yalnızca bu bölümlere eklenebilir.

## Güvenlik notları

- Tüm yönetim mutasyonları sunucuda yeniden yönetici kontrolü yapar.
- Profil güncellemeleri de sunucudan geçer; tarayıcı rolleri profil tablosuna doğrudan yazamaz.
- Topluluk yazma işlemleri doğrudan tarayıcıdan veritabanına gitmez; ban, içerik ve istek sınırı kontrollerinden geçer.
- Misafir kimliği imzalı `HttpOnly` cookie ve tek yönlü hash ile tutulur; ham IP veritabanına yazılmaz.
- Avatar ve kapaklarda boyut, MIME türü ve dosya imzası doğrulanır; rastgele dosya adları kullanılır.
- Yayın görünürlüğü hem sorgularda hem RLS politikalarında uygulanır.
