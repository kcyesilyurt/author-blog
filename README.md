# Yazar ve Okur Platformu

Yazarın kitaplarını, yazılarını ve bölümlerini yayınlayabildiği; okurların yorum, tepki ve moderasyonlu fan art bırakabildiği Next.js + Supabase uygulaması.

Site özellikleri, okur/yönetici kullanımı ve Supabase'in yalnızca web paneliyle kurulumu için [ayrıntılı kullanım rehberine](./KULLANIM.md) bakın.

## Özellikler

- Kitap, yazı ve bölüm yönetimi
- Taslak, zamanlanmış, yayında ve arşivlenmiş yayın durumları
- Markdown tabanlı okuma sayfaları
- Kitap ve bölüm bazında 24 saatlik tekrarları tekilleştiren görüntülenme sayaçları
- Üyelik, profil, avatar ve isteğe bağlı benzersiz `@kullaniciadi` yönetimi
- Üye veya misafir yorumu, tepki ve Pano mesajı
- İmzalanmış doğrudan yükleme, görsel temizleme ve yayın öncesi moderasyon kullanan Fan Art galerisi
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
- `/fan-art`: Onaylanmış galeri ve kayıtlı okur gönderim formu
- `/ben-kimim`, `/etkinlikler`, `/iletisim`: Yazar, etkinlik ve iletişim sayfaları
- `/auth/signup`, `/auth/login`, `/profile`: Üyelik ve profil
- `/admin`: Yazarın eser ve bölüm yönetimi
- `/admin/comments`, `/admin/users`, `/admin/stats`: Moderasyon ve istatistikler
- `/admin/events`, `/admin/messages`: Etkinlik takvimi ve özel iletişim kutusu
- `/admin/fan-art`: Fan art inceleme, onay/ret ve yayından kaldırma yönetimi

Misafirler isim girerek içeriklere yorum yapabilir ve Panoya yazabilir. Kayıtlı kullanıcı bir kullanıcı adı seçerse yorum ve Pano mesajlarında öncelikle `@kullaniciadi`, seçmezse mevcut profil adı görünür. Kayıtlı kullanıcılar `Okur`, kayıtsız kullanıcılar `Misafir` etiketiyle görünür; yöneticilerde rol etiketi yerine yalnızca adın yanındaki mavi doğrulama rozeti gösterilir.

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
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

NEXT_PUBLIC_SITE_NAME="Yazar Adı"
NEXT_PUBLIC_SITE_DESCRIPTION="Hikayeler ve Düşünceler"
NEXT_PUBLIC_SITE_URL=https://ovgudevecisafi.com
ADMIN_USER_ID=Supabase_Auth_kullanici_UUID_degeri
RATE_LIMIT_SECRET=uzun_ve_rastgele_bir_deger
CRON_SECRET=farkli_uzun_ve_rastgele_bir_deger
```

`NEXT_PUBLIC_TURNSTILE_SITE_KEY` tarayıcıda görünmesi amaçlanan Cloudflare site key'idir; Turnstile secret key değildir. Turnstile secret yalnız Supabase Auth koruma ayarına girilir. `SUPABASE_SERVICE_ROLE_KEY`, `RATE_LIMIT_SECRET` ve `CRON_SECRET` kesinlikle `NEXT_PUBLIC_` öneki almamalı ve tarayıcıya gönderilmemelidir. Son iki anahtar için `openssl rand -hex 32` komutunu ayrı ayrı çalıştırın; aynı değeri tekrar kullanmayın. `CRON_SECRET`, Vercel Production ortamına da deployment'tan önce eklenmelidir.

Eski `ADMIN_EMAIL` ve `NEXT_PUBLIC_ADMIN_EMAIL` değişkenleri artık kullanılmaz; ilk yönetici `ADMIN_USER_ID` ile belirlenir.

İlk yönetici için önce normal bir hesap oluşturun, Supabase Dashboard > Authentication > Users bölümünden bu hesabın UUID değerini alın ve `ADMIN_USER_ID` olarak ayarlayın. Bu kullanıcı `/admin` alanına ilk kez girdiğinde profil kaydı yönetici olarak işaretlenir. E-posta adresine göre otomatik yetki verilmez.

Production kayıt e-postaları için Supabase'in varsayılan göndericisine güvenmeyin: bu servis yalnızca Supabase organizasyon takımındaki önceden yetkili adreslere gönderir ve proje genelindeki kayıt, parola sıfırlama ve e-posta değiştirme istekleri aynı düşük kotayı paylaşır. [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) bağlayın, sağlayıcıdaki link tracking'i kapatın ve Auth e-posta limitini beklenen trafiğe göre ayarlayın. SMTP parolası uygulama ortam değişkenlerine değil Supabase'in güvenli ayarına girilir. Signup ve login formları `NEXT_PUBLIC_TURNSTILE_SITE_KEY` bulunduğunda CAPTCHA token'ı gönderir; kod deploy edilmeden Supabase CAPTCHA korumasını açmayın.

Ardından geliştirme sunucusunu başlatıp `http://localhost:3000` adresini açın:

```bash
npm run dev
```

## Veritabanı migration'ları

SQL Editor ve Supabase CLI birbirinin devamı değil, iki alternatif migration akışıdır. Bu mevcut veritabanı daha önce web panelinden hazırlandığı için önerilen yol Supabase Dashboard > `SQL Editor` > `New query` alanında şu dosyaların bütün içeriğini sırayla çalıştırmaktır:

1. [`20260802003532_harden_community_and_publication.sql`](./supabase/migrations/20260802003532_harden_community_and_publication.sql)
2. [`20260802142452_increase_image_upload_limits.sql`](./supabase/migrations/20260802142452_increase_image_upload_limits.sql)
3. [`20260802180000_add_events_and_contact_messages.sql`](./supabase/migrations/20260802180000_add_events_and_contact_messages.sql)
4. [`20260820110356_add_publication_views.sql`](./supabase/migrations/20260820110356_add_publication_views.sql)
5. [`20260820110402_add_fan_art.sql`](./supabase/migrations/20260820110402_add_fan_art.sql)
6. [`20260910141005_add_optional_usernames.sql`](./supabase/migrations/20260910141005_add_optional_usernames.sql)

Mevcut veritabanında temel şema zaten bulunduğu için `001`-`006` migration'larını tekrar çalıştırmayın. Daha önce başarıyla uyguladığınız güncel dosyaları da tekrarlamayın; sayaç ve Fan Art migration'ları tamamlandıysa bu sürüm için yalnızca 6 numaralı kullanıcı adı dosyasını çalıştırın. Tamamen boş yeni bir Supabase projesinde ise bütün migration'ları dosya adına göre sırayla uygulayın. SQL Editor ile çalıştırdıktan sonra aynı proje üzerinde doğrudan `db push` çalıştırmayın; manuel SQL, CLI migration geçmişine otomatik yazılmaz.

**Production sırası bir yayın kapısıdır:** önce geri yüklenebilir veritabanı yedeğini doğrulayın; eksik migration'ları, bu sürümde özellikle 6 numaralı kullanıcı adı migration'ını çalıştırıp kontrolleri tamamlayın; ancak sonra yeni uygulama kodunu dağıtın. Yeni kod `profiles.username` alanını doğrudan seçtiği için kodu migration'dan önce yayımlamak profil ve topluluk sorgularını bozabilir. Migration geriye uyumlu olduğundan DB-first dağıtım mevcut sürümü bozmaz; kod rollback'i ise Supabase migration'larını veya verileri geri almaz. Önceki Fan Art kurulumu yapılmamış bir ortamda `CRON_SECRET` ve 4-5 numaralı migration kontrolleri de hâlâ gereklidir.

Pro, Team ve Enterprise projelerinde Dashboard > `Database > Backups` altında yakın tarihli restore point'i doğrulayın; migration'ın hemen öncesine dönme gereksinimi varsa PITR veya ayrıca mantıksal dump kullanın. Free planda indirilebilir Dashboard backup'ı bulunmadığından en azından Supabase CLI ile şema ve veriyi repo dışında yedekleyin. Veritabanı backup'ı Storage nesnelerinin byte'larını içermez; gerekliyse `covers`, `avatars` ve fan art bucket'larını ayrı koruyun. Ayrıntılı, plan-bazlı komutlar [KULLANIM.md](./KULLANIM.md) içindedir. [Supabase Database Backups](https://supabase.com/docs/guides/platform/backups)

CLI yalnızca baştan beri CLI migration geçmişiyle yönetilen bir proje için alternatif olarak kullanılabilir:

```bash
npx --yes supabase@latest init
npx --yes supabase@latest login
npx --yes supabase@latest link --project-ref PROJECT_REF
npx --yes supabase@latest migration list
npx --yes supabase@latest db push --dry-run
npx --yes supabase@latest db push
```

Repo daha önce `supabase init` ile hazırlanmışsa ilk komutu atlayın. `migration list` veya `--dry-run` daha önce uygulanmış herhangi bir dosyayı yeniden çalıştırmak istiyorsa durun; `migration repair` komutunu şemayı doğrulamadan kullanmayın. Manuel SQL geçmişinden CLI'ye güvenli `migration list` / `db pull` / dikkatli `migration repair` geçişi, sayaç Cron'u, günlük Vercel cleanup fallback'i ve Fan Art Storage kontrolleri [KULLANIM.md](./KULLANIM.md) içinde açıklanmıştır. Production projesinde `db reset --linked` çalıştırmayın. [Supabase migration rehberi](https://supabase.com/docs/guides/deployment/database-migrations)

[`vercel.json`](./vercel.json), Fan Art Storage outbox'ı için korumalı endpoint'i günde bir kez `03:17 UTC` zamanlar. Vercel `CRON_SECRET` değerini Bearer token olarak otomatik yollar. Günlük ifade Hobby planıyla uyumludur; Pro ve üzeri planda backlog/temizleme gecikmesi gerektiriyorsa rehberdeki saatlik alternatif kullanılabilir. [Vercel Cron yönetimi](https://vercel.com/docs/cron-jobs/manage-cron-jobs)

Örnek içerik isteğe bağlıdır:

```bash
node --env-file=.env.local scripts/seed.mjs
```

Seed komutu service-role key kullandığı için yalnızca güvenilen yerel/CI ortamında çalıştırılmalıdır.

Kapak görselleri en fazla 10 MB, profil görselleri en fazla 5 MB, fan art kaynakları en fazla 6 MB olabilir. Dosya gövdesi kısa ömürlü imzalı adresle doğrudan Supabase Storage'a gönderilir; sunucu yükleme öncesinde yetki/limit, yükleme sonrasında içerik kontrolü yapar. Fan art ayrıca EXIF bilgisinden arındırılıp WebP'ye dönüştürülür ve onaylanana kadar private bucket'ta kalır. Supabase Dashboard > Storage ayarlarındaki global dosya sınırı en az 10 MB olmalıdır; global sınır bucket sınırlarından önce uygulanır.

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
