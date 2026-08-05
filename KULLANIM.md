# Kullanım ve Kurulum Rehberi

Bu proje, bir yazarın kitaplarını ve blog yazılarını yayımlayabildiği; okurların eserleri okuyup bölüm bazında yorum yapabildiği ve eserlerden bağımsız olarak Panoda konuşabildiği bir web sitesidir.

## Sitede neler var?

- Ana sayfada en yeni eser, kitaplar ve blog yazıları ayrı alanlarda gösterilir.
- Kitaplar bölüm bölüm okunur; blog yazıları da eser kütüphanesinden yönetilir.
- Her bölümde yorumlar ile beğenme, sevme ve kaydetme tepkileri bulunur.
- Pano, belirli bir kitaba bağlı olmadan okurların sohbet edebildiği ortak alandır ve en yeni 100 mesajı gösterir.
- `Ben Kimim?`, etkinlik takvimi ve yazarla iletişim sayfaları bulunur.
- Eski sitedeki dört video, ana sayfada gizlilik geliştirilmiş ve tembel yüklenen YouTube oynatıcılarıyla korunur.
- Misafirler hesap açmadan isim yazarak yorum veya Pano mesajı bırakabilir.
- Kayıtlı okurlar profil ve avatar oluşturabilir; yorumlarında profil adı görünür.
- Yöneticiler eserleri, bölümleri, etkinlikleri, iletişim kutusunu, kullanıcıları ve topluluk içeriklerini yönetebilir.

## Kullanıcı türleri

| Kullanıcı | Yapabildikleri | Görünen etiket |
| --- | --- | --- |
| Misafir | Yayımlanmış eserleri okur, isim girerek yorum/Pano mesajı yazar ve tepki bırakır | `Misafir` |
| Kayıtlı kullanıcı | Misafir yetkilerine ek olarak profil adı ve avatar kullanır | `Okur` |
| Yönetici/yazar | Eser ve bölüm yönetir; kullanıcı, yorum ve Pano moderasyonu yapar | Yalnızca mavi doğrulama rozeti |

Askıya alınmış kullanıcılar siteyi okuyabilir ancak yorum veya Pano mesajı gönderemez.

## Sayfalar

| Adres | İçerik |
| --- | --- |
| `/` | En Son Eklenen, Kitaplarım, Blog Yazılarım ve Pano bağlantısı |
| `/books/{eser-slug}` | Eser özeti ve bölüm listesi |
| `/books/{eser-slug}/{bolum-slug}` | Okuma sayfası, tepkiler ve yorumlar |
| `/pano` | Eserlerden bağımsız topluluk konuşmaları |
| `/ben-kimim` | Yazarın biyografisi ve yazı dünyası |
| `/etkinlikler` | Yaklaşan ve geçmiş etkinlikler |
| `/iletisim` | Spam korumalı iletişim formu |
| `/auth/signup` | Yeni okur hesabı oluşturma |
| `/auth/login` | Hesaba giriş |
| `/profile` | Ad, soyad, görünen ad ve avatar düzenleme |
| `/admin` | Yazarın içerik kütüphanesi |
| `/admin/comments` | Yorum moderasyonu |
| `/admin/events` | Etkinlik oluşturma, yayımlama ve arşivleme |
| `/admin/messages` | İletişim formundan gelen özel mesajlar |
| `/admin/users` | Kullanıcı, ban ve yönetici rolü yönetimi |
| `/admin/stats` | Eser, bölüm, kullanıcı ve yorum istatistikleri |

## Okur olarak kullanım

1. Ana sayfadan bir kitap veya blog yazısı seçin.
2. Kitaplarda bir bölümü açın; blog yazılarında içerik bağlantısını açın.
3. Okuma sayfasında önceki/sonraki bölüm bağlantılarını kullanın; sayfanın altında tepki bırakın veya yorum yazın.
4. Hesabınız yoksa yorum formuna bir isim girin. Mesajınız `Misafir` etiketiyle görünür.
5. Hesabınız varsa yorum profil adınızla ve `Okur` etiketiyle görünür. Yönetici hesaplarında `Okur` etiketi yerine yalnızca mavi doğrulama rozeti gösterilir.
6. Eserlerden bağımsız konuşmak için üst menüdeki `Pano` bağlantısını kullanın.

Kayıt olmak zorunlu değildir. Profil ve avatar kullanmak, yorumlarda sürekli aynı kimlikle görünmek için kayıt olunabilir.

Yorum ve Pano mesajları en fazla 2.000 karakter ve 2 bağlantı içerebilir. Misafir adı 2-50 karakter arasında olmalıdır.

## Yazar/yönetici olarak kullanım

### Yeni eser ekleme

1. Giriş yaptıktan sonra `/admin` sayfasını açın.
2. `Yeni Eser Ekle` düğmesine basın.
3. Eser türü olarak `Kitap` veya `Blog Yazısı` seçin.
4. Başlık, açıklama, kapak, yayın durumu ve gerekiyorsa yayın tarihini girin.
5. Eseri oluşturduktan sonra düzenleme sayfasından bölüm veya yazı içeriği ekleyin.

Kitap çok sayıda bölüm içerebilir. Blog yazısı da teknik olarak tek bir içerik/bölüm üzerinden yayımlanır.

### Bölüm veya blog içeriği ekleme

1. Yönetim panelinde eserin adına veya `Düzenle` bağlantısına basın.
2. Kitap için `Yeni Bölüm Ekle`, blog için `İçerik Ekle` seçeneğini kullanın.
3. Başlık ve sıralama bilgisini girin.
4. Açılan editörde içeriği Markdown biçiminde yazın.
5. Bölümün yayın durumunu ve tarihini ayarlayıp kaydedin.

Bir içeriğin herkese görünmesi için hem ana eser hem de ilgili bölüm görünür durumda olmalıdır.

Sık kullanılan Markdown örnekleri:

```markdown
# Başlık
## Alt başlık

**Kalın metin** ve *italik metin*

- Liste maddesi
- Başka bir madde

> Alıntı

[Bağlantı adı](https://example.com)
![Görsel açıklaması](https://example.com/gorsel.jpg)
```

Ham HTML güvenlik amacıyla doğrudan çalıştırılmaz; metin olarak etkisizleştirilir.

### Yayın durumları

| Durum | Davranış |
| --- | --- |
| `Taslak` | Yalnızca yönetim panelinde görünür |
| `Planlı` | Belirlenen tarih geldiğinde otomatik görünür |
| `Yayında` | Yayın tarihi gelmişse herkese görünür |
| `Arşivde` | Kamusal sayfalardan kaldırılır, yönetim panelinde korunur |

Ana sayfadaki `En Son Eklenen`, görünür eserler arasından en yeni kaydı gösterir. Aynı eser türüne göre `Kitaplarım` veya `Blog Yazılarım` alanında da yer alır.

### Moderasyon

- `/admin/comments`: Bölüm yorumlarını inceleyip silebilirsiniz.
- `/pano`: Yönetici olarak görüntülerken Pano mesajlarını silebilirsiniz.
- `/admin/users`: Kullanıcıyı askıya alabilir, yasağı kaldırabilir veya yönetici rolünü değiştirebilirsiniz.
- `/admin/stats`: Temel kullanım sayılarını görebilirsiniz.

### Etkinlik ve iletişim yönetimi

- `/admin/events`: Bir etkinliği taslak olarak hazırlayabilir, yayımlayabilir, güncelleyebilir veya arşivleyebilirsiniz. Yaklaşan ve geçmiş etkinlikler kamusal sayfada tarihe göre ayrılır.
- `/admin/messages`: İletişim formundan gelen mesajları okuyabilir, okunmadı olarak işaretleyebilir veya silebilirsiniz. E-posta adresleri tarayıcı Supabase istemcisine açılmaz; yalnızca yetkili sunucu işlemleriyle okunur.

İletişim formu şu anda e-posta bildirimi göndermez. Başarılı gönderimler Supabase'deki özel `contact_messages` tablosuna kaydedilir ve yalnızca `/admin/messages` gelen kutusunda görünür.

### Ana sayfadaki YouTube videoları

YouTube videoları henüz yönetim panelinden düzenlenmez. Dört kayıt [`src/app/page.tsx`](./src/app/page.tsx) içindeki `videos` dizisinde `videoId` ve isteğe bağlı `startSeconds` olarak tutulur. Bu alanlar değiştirildiğinde kod değişikliğini test edip GitHub'a göndermek gerekir; Vercel yeni sürümü otomatik yayımlar.

## Görsel yükleme sınırları

- Kitap/blog kapağı: en fazla **10 MB**
- Profil avatarı: en fazla **5 MB**
- Kabul edilen biçimler: JPEG, PNG ve WebP

Görseller kısa ömürlü imzalı yükleme adresiyle doğrudan Supabase Storage'a gönderilir ve yükleme sonrasında dosya imzası doğrulanır.

## Supabase'i yalnızca web paneliyle hazırlama

Supabase CLI veya masaüstü uygulaması gerekli değildir. Mevcut Supabase projesi için Dashboard içindeki SQL Editor yeterlidir.

### Mevcut proje için gerekli migration'lar

Bu projenin mevcut veritabanında temel tablolar zaten bulunduğu için `001`-`006` dosyalarını yeniden çalıştırmayın. SQL Editor'da yalnızca aşağıdaki dosyaları belirtilen sırayla çalıştırın:

1. [`20260802003532_harden_community_and_publication.sql`](./supabase/migrations/20260802003532_harden_community_and_publication.sql)
2. [`20260802142452_increase_image_upload_limits.sql`](./supabase/migrations/20260802142452_increase_image_upload_limits.sql)
3. [`20260802180000_add_events_and_contact_messages.sql`](./supabase/migrations/20260802180000_add_events_and_contact_messages.sql)

Her dosya için:

1. Supabase Dashboard'da projenizi açın.
2. Sol menüden `SQL Editor` > `New query` seçin.
3. Yerel dosyanın bütün içeriğini kopyalayıp sorgu alanına yapıştırın.
4. `Run` düğmesine basın ve başarı mesajını bekleyin.
5. Bir sorgu başarıyla tamamlanmadan sonraki dosyaya geçmeyin.

İlk migration; yayın durumlarını, yayın tarihlerini, güvenlik kurallarını, profil erişimini ve atomik istek sınırını hazırlar. İkinci migration Storage sınırlarını uygulama koduyla aynı değere getirir. Üçüncü migration etkinlik takvimini, yalnızca yöneticinin okuyabildiği iletişim kutusunu ve iletişim formu hız sınırını ekler.

İlk iki dosyayı daha önce başarıyla çalıştırdıysanız tekrar çalıştırmanız gerekmez; yalnızca üçüncü dosyayı çalıştırın.

Migration'lardan sonra Dashboard'da şunları kontrol edin:

- `Table Editor`: `books` ve `chapters` tablolarında `status` ile `published_at` alanları bulunmalı.
- `Table Editor`: `community_rate_limits` tablosu bulunmalı.
- `Table Editor`: `events` ve `contact_messages` tabloları bulunmalı; `contact_messages` için tarayıcı rollerine policy verilmemiş olmalı.
- `Storage`: `covers` public ve 10 MB; `avatars` public ve 5 MB olmalı.
- `Storage` genel ayarları: projenin global dosya sınırı en az 10 MB olmalı. Migration bucket sınırlarını değiştirir, global proje sınırını değiştirmez.

Tamamen boş, yeni bir Supabase projesi kuruluyorsa bunun yerine `supabase/migrations` klasöründeki bütün SQL dosyaları dosya adına göre sırayla çalıştırılmalıdır.

SQL Editor ile çalıştırılan dosyalar Supabase CLI migration geçmişine otomatik kaydolmaz. İleride CLI tabanlı yönetime geçilecekse migration geçmişi ayrıca eşitlenmelidir.

### API anahtarlarını alma

Supabase Dashboard'da `Connect` penceresinden veya `Project Settings` > `API Keys` sayfasından şu değerleri alın:

| `.env.local` değişkeni | Supabase değeri |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key (`sb_publishable_...`) veya legacy `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key (`sb_secret_...`) veya legacy `service_role` key |

Secret/service-role anahtarını asla `NEXT_PUBLIC_` adlı bir değişkene koymayın, Git'e eklemeyin veya tarayıcı kodunda kullanmayın.

### Auth ayarı

Supabase Dashboard > `Authentication` > `URL Configuration` bölümünde yerel geliştirme için:

- Site URL: `http://localhost:3000`
- Redirect URLs listesine: `http://localhost:3000/auth/callback`

Üretime geçerken Site URL'yi gerçek alan adınızla değiştirin ve aynı alan adının izin verilen yönlendirme adresini ekleyin.

## Ortam değişkenleri

İlk kurulumda, yalnızca `.env.local` dosyası henüz yoksa örnek dosyayı kopyalayın:

```bash
cp .env.local.example .env.local
```

Ardından `.env.local` dosyasını doldurun:

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

Rastgele istek-sınırlama anahtarı üretmek için:

```bash
openssl rand -hex 32
```

Eski `ADMIN_EMAIL` ve `NEXT_PUBLIC_ADMIN_EMAIL` değişkenleri artık kullanılmaz. İlk yönetici yalnızca `ADMIN_USER_ID` ile belirlenir.

## `ovgudevecisafi.com` alan adına geçiş

Domain WordPress.com hesabında kalabilir; transfer zorunlu değildir. DNS değişikliğini ancak yeni sürüm Vercel önizleme adresinde doğrulandıktan ve gerçek kitap kayıtları taşındıktan sonra yapın.

1. Güncel kodu GitHub'a gönderin ve Vercel'de projeyi bu repodan oluşturun.
2. Yukarıdaki ortam değişkenlerinin tamamını Vercel `Production` ortamına ekleyin ve yeniden deploy edin.
3. Vercel `Domains` alanına önce `ovgudevecisafi.com`, sonra `www.ovgudevecisafi.com` ekleyin; apex adresi birincil yapın.
4. Vercel'in gösterdiği güncel DNS kayıtlarını WordPress.com `Domains > ovgudevecisafi.com > DNS records` ekranına girin. Vercel'in gösterdiği değerleri esas alın; ezbere IP kullanmayın.
5. Supabase `Authentication > URL Configuration` içinde Site URL'yi `https://ovgudevecisafi.com`, Redirect URL'yi `https://ovgudevecisafi.com/auth/callback` yapın. Yerel geliştirme için `http://localhost:3000/auth/callback` adresini de redirect listesinde tutabilirsiniz.
6. `/`, `/ben-kimim`, `/etkinlikler`, `/iletisim`, `/pano`, `/robots.txt` ve `/sitemap.xml` adreslerini kontrol edin.

Eski `/kayip-liman` ve `/tanri-kuyusunun-kemikleri` adresleri ancak aynı slug'lı gerçek kitaplar Supabase'e taşındığında kalıcı olarak yeni kitap rotalarına yönlendirilmelidir. Şu anda örnek kitaplara yönlendirme yapılmaz.

## Yayından sonra güncelleme

- Kitap, bölüm, blog, etkinlik, kullanıcı ve mesaj işlemleri yönetim panelinden yapılır. Bunlar Supabase'e kaydedildiği için Git commit'i veya Vercel dağıtımı gerekmez.
- Tasarım, sayfa düzeni, uygulama davranışı ve mevcut YouTube listesi kodun parçasıdır. Güvenli akış: ayrı Git dalına değişikliği gönderin, Vercel Preview adresinde deneyin, sonra `main` dalına birleştirin. `main` güncellenince Vercel üretim alan adını otomatik olarak yeni sürüme geçirir.
- Hatalı bir kod sürümü yayımlanırsa Vercel'deki önceki production deployment'a rollback yapılabilir. Bu işlem Supabase verilerini veya migration'ları geri almaz.

## Yayındaki siteyi geçici kapatma

Alan adı Vercel'e bağlandıktan sonra site bilgisayarınız ve `npm run dev` kapalıyken de barındırılmaya devam eder.

- Okura düzgün bir açıklama göstermek için önerilen yöntem, açılıp kapatılabilen bir bakım sayfasıdır.
- Vercel'in sert proje duraklatma işlemi REST API üzerinden yapılır ve ziyaretçilere `503 DEPLOYMENT_PAUSED` gösterir. Proje daha sonra Vercel Project Settings içindeki `Resume Service` ile, yeniden deploy gerekmeden açılabilir. Erişim belirteci kesinlikle repoya veya ekran görüntüsüne konmamalıdır.
- DNS kayıtlarını silmek veya Vercel projesini silmek geçici kapatma yöntemi olarak kullanılmamalıdır.

Vercel Hobby planı yalnızca kişisel ve ticari olmayan kullanıma izin verir. Bu site bir yazarın kitaplarını tanıtıyor ve müşteri için hazırlanıyorsa Vercel'in [ticari kullanım tanımına](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage) büyük olasılıkla girer; canlıya geçmeden önce Pro planı değerlendirin.

## İlk yöneticiyi oluşturma

1. Uygulamayı çalıştırın ve `/auth/signup` sayfasından yazar hesabını oluşturun.
2. E-posta doğrulaması açıksa gelen bağlantıyı onaylayın.
3. Supabase Dashboard > `Authentication` > `Users` sayfasını açın.
4. Yazar hesabının `User UID`/UUID değerini kopyalayın.
5. Bu değeri `.env.local` içindeki `ADMIN_USER_ID` alanına yazın.
6. Geliştirme sunucusunu durdurup yeniden başlatın.
7. Yazar hesabıyla giriş yapıp `/admin` sayfasını açın.

Bu ilk ziyarette ilgili profil yönetici olarak işaretlenir. E-posta adresine göre otomatik yönetici yetkisi verilmez.

## Siteyi yerelde açma

Proje üretimle aynı çalışma ortamını kullanmak için Node.js 22.x sürümüne sabitlenmiştir.

```bash
cd /Users/kcyesilyurt/.codex/author-blog
npm install
npm run dev
```

Ardından tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın. `3000` portu doluysa Next.js terminalde kullandığı diğer adresi gösterir; isterseniz `npm run dev -- -p 3001` komutuyla sabit başka bir port seçebilirsiniz.

## Sorun giderme

- Ana sayfada eserler görünmüyorsa eser ve bölümün yayın durumunu/tarihini kontrol edin.
- `column ... status does not exist` hatası varsa güvenlik/yayın migration'ı çalıştırılmamıştır.
- Yorum veya Pano gönderilemiyorsa `community_rate_limits` tablosu ve RPC fonksiyonu için ilk migration'ı çalıştırın.
- Etkinlikler görünmüyor veya iletişim formu çalışmıyorsa üçüncü migration'ın tamamını çalıştırıp `events` ile `contact_messages` tablolarını kontrol edin.
- Kapak/avatar yüklenemiyorsa Storage'da `covers` ve `avatars` bucket'larını ve boyut sınırlarını kontrol edin.
- Yönetim paneli açılmıyorsa giriş yaptığınız hesabın UUID değeri ile `ADMIN_USER_ID` değerinin aynı olduğunu kontrol edip sunucuyu yeniden başlatın.
- E-posta doğrulama bağlantısı yanlış adrese gidiyorsa Supabase Auth `Site URL` ve `Redirect URLs` ayarlarını kontrol edin.

## Teknik doğrulama

Değişikliklerden sonra aşağıdaki komutlar kullanılabilir:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```
