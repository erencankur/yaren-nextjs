# Yaren için bir oyun köşesi ♥

Bu projeyi sevgilim **Yaren** için yaptım. Birlikte vakit geçirebileceğimiz, sevdiğimiz şarkıları dinleyip oyun oynayabileceğimiz kişisel bir alan hazırlamak istedim. Karakterler, özel kart çizimleri ve küçük tasarım detayları Yaren ile benim hikâyemizden ilham alıyor.

**[Oyun köşesine git →](https://seniseviyorum.vibesofters.com/)**

## Projede neler var?

| Bölüm | Özellikler |
| --- | --- |
| **Solitaire** | Klondike, özel J/Q/K kartları, kart sürükleme, geri alma, skor ve oyun ayarları. |
| **Tavla** | Aynı cihazda iki kişilik oyun, Yaren için beyaz/siyah seçimi, zar atma, geçerli hamleleri gösterme ve tur yönetimi. |
| **Giydirmece** | Piksel karakter üzerinde altı kategoriden kıyafet ve aksesuar seçimi; seçili parçaya yeniden dokunarak çıkarma. |
| **Giydirmece düzenleyicisi** | Görsellerin konumunu, boyutunu, katmanını ve görünürlüğünü ayarlama; not tutma ve JSON içe/dışa aktarma. |
| **Ortak deneyim** | Dört renk teması, yumuşak tema geçişleri, playlist ve oynatma/duraklatma kontrolleri. |

Oyun arayüzleri mobil ve masaüstü ekranlara uyarlanır. Giydirmece düzenleyicisi ayrıntılı asset çalışmaları için masaüstü kullanımına odaklanır. Ana sayfadaki **Ateş ve Su** bölümü henüz oynanabilir değildir.

## Teknolojiler ve mimari

- **Next.js 16** ve App Router
- **React 19**, **TypeScript** ve **Tailwind CSS 4**
- TypeScript ile yazılmış Solitaire ve Tavla oyun mantığı
- Katmanlı PNG görselleriyle oluşturulan Giydirmece karakteri
- Tarayıcı ses API’leri üzerinden ortak müzik oynatıcısı
- Docker için Next.js `standalone` çıktısı

Proje ayrı bir veritabanı veya kullanıcı hesabı gerektirmez. Tema, Giydirmece kıyafet seçimleri ve düzenleyici taslakları tarayıcının `localStorage` alanında saklanır; cihazlar arasında otomatik eşitlenmez.

## Yerelde çalıştırma

**Gereksinimler:** Node.js **20.9 veya üzeri** ve npm.

```bash
git clone https://github.com/erencankur/yaren-nextjs.git
cd yaren-nextjs
npm ci
cp .env.example .env.local
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde açılır.

### Ortam değişkeni

| Değişken | Açıklama |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Sayfa metadata’sı ve Open Graph bağlantıları için sitenin tam adresi. Yerelde `http://localhost:3000`, yayında kendi alan adınız kullanılmalıdır. |

Bu değer derleme sırasında okunur. Yayın adresini değiştirdiğinizde uygulamayı yeniden derleyin. `.env.local` Git’e eklenmez; `.env.example` yalnızca örnek yapılandırmadır.

### Kontrol komutları

```bash
npm run lint
npm run typecheck
npm run build
```

`npm run dev` geliştirme sunucusunu başlatır. `npm run build` üretim çıktısını oluşturur. Üretimde aşağıdaki Docker akışı, projenin `standalone` yapılandırmasını kullanır.

## Sayfalar

| Adres | İçerik |
| --- | --- |
| `/` | Ana sayfa, oyun seçimi, tema ve playlist. |
| `/solitaire` | Solitaire oyunu. |
| `/tavla` | Tavla oyunu. |
| `/giydirmece` | Oyna/Düzenle seçimi ve Giydirmece oyunu. |
| `/giydirmece/duzenle` | Giydirmece asset düzenleyicisi. |

## Oyunların kullanımı

### Solitaire

Desteye dokunarak kart çekebilir, kartları sürükleyerek taşıyabilir veya uygun bir kartı çift tıklayarak hedef yığına gönderebilirsiniz. Alt çubuktan hamleyi geri alabilir, yeni el başlatabilir ve ayarları açabilirsiniz.

### Tavla

Her yeni elde Yaren’in beyaz mı siyah mı oynayacağı seçilir; diğer taraf Eren olur. Ekranda sırası gelen oyuncu gösterilir. Zarı attıktan sonra bir taşa dokunarak geçerli hamleleri görebilirsiniz. Oynanabilecek zar hakları tamamlanınca **Turu bitir** ile sıra diğer oyuncuya geçer.

### Giydirmece

**Oyna** bölümünde şapka, gözlük, üst, alt, çorap ve ayakkabı kategorilerinden birer parça seçebilirsiniz. Seçili parçaya tekrar dokunmak onu çıkarır. Kıyafet seçimleri aynı tarayıcıda korunur.

**Düzenle** bölümünde her assetin konumunu, boyutunu, katman sırasını ve görünürlüğünü değiştirebilirsiniz. Ayarlar anlık olarak tarayıcıya kaydedilir; JSON indirerek yedekleyebilir veya başka bir tarayıcıya aktarabilirsiniz.

Oyunun ortak konum ve katman ayarları `src/games/dressup/preset.json` dosyasından gelir. Düzenleyicideki yerel taslaklar oyunun bu ayarlarını değiştirmez. Yeni bir düzenlemeyi tüm cihazlara yayınlamak için dışa aktarılan JSON’u bu dosyaya aktarın ve projeyi yeniden derleyin.

## Dizin yapısı

```text
src/
├── app/                   # Sayfalar, genel stil ve metadata
├── components/            # Ortak üst menü ve müzik oynatıcısı
└── games/
    ├── solitaire/         # Oyun motoru, bileşenler ve ses yönetimi
    ├── backgammon/        # Tavla kuralları, durum yönetimi ve bileşenler
    └── dressup/           # Katalog, kayıtlı asset ayarları ve düzenleyici
public/
├── backgrounds/           # Oyun arka planları
├── cards/                 # Kart görselleri
├── dressup/               # Karakter, kıyafetler ve küçük önizlemeler
└── sounds/                # Müzik ve oyun sesleri
```

Yerel ekran görüntüleri, tarayıcı kontrol çıktıları ve kullanılmayan dosya arşivleri sırasıyla `local-screenshots/`, `.playwright-cli/` ve `local-asset-archive/` dizinlerinde tutulur. Bu dizinler Git’e ve Docker derleme bağlamına dahil edilmez.

## Docker ile yayınlama

```bash
docker build \
  --build-arg NEXT_PUBLIC_SITE_URL=https://seniseviyorum.vibesofters.com \
  -t yaren-games .
docker run --rm -p 3000:3000 yaren-games
```

Dockerfile bağımlılıkları yükler, üretim derlemesini oluşturur ve uygulamayı ayrı bir çalışma imajında yetkisiz kullanıcıyla başlatır. Coolify gibi Dockerfile destekleyen bir platformda depo dalını `main`, uygulama portunu **3000** olarak ayarlayın. Kendi yayın adresinizi `NEXT_PUBLIC_SITE_URL` derleme argümanına verin.

## Görseller, müzik ve kullanım hakları

Bu depo kişisel bir proje olarak paylaşılmaktadır; genel bir açık kaynak lisansı henüz tanımlanmamıştır. Depoyu public olarak görüntüleyebilmek, içeriklerin yeniden kullanımına otomatik izin vermez. Üçüncü taraf müzikler ve diğer içeriklerin hakları ilgili hak sahiplerine aittir.

**Yaren & Eren · Sevgiyle hazırlandı.**
