# ChatGPT Sohbet Erişilebilirliği

**Sürüm 1.0.1** — ChatGPT'de yüklenmiş sohbet mesajlarının DOM'da kalmasını sağlayarak kör ve az gören ekran okuyucu kullanıcılarının gezinmesini kolaylaştıran ücretsiz ve bağımsız Chrome uzantısı.

[English documentation](README.md)

## Uzantı neden geliştirildi?

ChatGPT, uzun sohbetlerde performansı artırmak için DOM sanallaştırması (virtualization) kullanır. Mesajlar görüntülenen alanın dışına çıktığında DOM'dan ve dolayısıyla ekran okuyucunun sanal tamponundan kaldırılabilir. Bu durum uzun sohbetlerin okunmasını ve kopyalanmasını zorlaştırır.

Uzantı, tanıdığı görüntüleme kodunu değiştirerek önceden yüklenmiş mesajların DOM'da kalmasını sağlar. Orijinal kaydırma ve ölçüm mekanizmalarını korur; belirli JavaScript dosya adlarına bağlı değildir.

## Kurulum

Google Chrome 118 veya üzeri gereklidir.

1. [Kaynak ZIP dosyasını indirin](https://github.com/dogancankalinci/conversation-accessibility-for-chatgpt/archive/refs/heads/main.zip) ve ayrı bir klasöre çıkarın.
2. `chrome://extensions` adresini açın.
3. **Geliştirici modu** seçeneğini etkinleştirin.
4. **Paketlenmemiş öğe yükle** düğmesini seçin ve `manifest.json` dosyasının bulunduğu klasörü gösterin.
5. ChatGPT sayfasını yenileyin. Gerekirse uzantı menüsünde **Etkinleştir ve sayfayı yenile** düğmesini kullanın.
6. NVDA kullanıyorsanız gerekirse NVDA+F5 ile sanal tamponu yenileyin.

Klasörü silmeyin. Uzantının birden fazla sürümünü aynı anda çalıştırmayın.

## Sohbetin tamamını okuma ve kopyalama

DOM sanallaştırmasının kapatılması, isteğe bağlı yüklemenin (lazy loading) kapatılması anlamına gelmez. Uzantı sohbet ilk açıldığında bütün geçmişi otomatik olarak yüklemez. İlk açılışta yalnızca son mesajlar yüklenmiş olabilir; bu nedenle hemen Ctrl+A (Tümünü seç) ile seçip kopyalamak sohbetin tamamını içermeyebilir.

Eski mesajların yüklenmesi için sohbetin en başına kadar yukarı kaydırın. Mesajlar yüklendikten sonra aşağı kaydırırken DOM'da kalmaları beklenir. Ctrl+A ile yüklenen sohbetin tamamını, sayfadaki diğer seçilebilir içeriklerle birlikte seçebilirsiniz.

Uzantı olmadan yukarı kaydırmak yeni mesajların, aşağı kaydırmak ise eski mesajların DOM'dan kaldırılmasına yol açabilir. Uzantı tanıdığı kodda bu sanallaştırma davranışını engeller, ancak başlangıçta bütün geçmişi yüklemez.

Karşılaştırma olarak Claude.ai'nin kendi virtualization ayarı kapatıldığında da aynı isteğe bağlı yükleme davranışı gözlemlenmiştir: Eski mesajların tamamı hemen yüklenmez ve sohbet açılır açılmaz Ctrl+A bütün mesajları seçmeyebilir. Bu karşılaştırma gözlemlenen davranışa dayanır; gelecekteki Claude.ai sürümleri için garanti değildir.

## İzinler ve gizlilik

Uzantı, ChatGPT sekmelerine bağlanarak Chrome debugger API'si ile `https://chatgpt.com/cdn/assets/` adresinden gelen JavaScript yanıtlarını inceleyerek tanıdığı sanallaştırma kodunu yerel olarak değiştirir. Chrome'un hata ayıklama bildirimi göstermesi beklenen bir davranıştır.

- Debugger izni geniş kapsamlıdır; uzantı ilgili JavaScript yanıtlarını inceleyecek şekilde tasarlanmıştır.
- Sohbet API yanıtlarını, çerezleri veya kimlik bilgilerini kasıtlı olarak incelemez.
- Harici sunuculara veri göndermez.
- Tercihler ve sekme bazlı çalışma durumu Chrome'un yerel ve oturum bazlı uzantı depolamasında tutulur.
- Hata ayıklama bağlantısı açıkken önbellek devre dışıdır.

## Sınırlamalar

- ChatGPT'nin kod yapısı değişirse uzantının güncellenmesi gerekebilir. Tanınmayan kod yapıları değiştirilmez.
- Uzun sohbetler daha fazla bellek ve işlemci kullanabilir.
- Uzantı modelin bağlam penceresini artırmaz, sunucu tarafındaki özetlemeyi engellemez ve sohbet uzunluğu limitlerini kaldırmaz.
- Tüm tarayıcılar ve ekran okuyucularla uyumluluk bağımsız olarak doğrulanmamıştır.

## Geri bildirim ve lisans

Hata ve önerilerinizi [GitHub Issues](https://github.com/dogancankalinci/conversation-accessibility-for-chatgpt/issues) üzerinden bildirebilirsiniz. Tarayıcı ve ekran okuyucu sürümlerinizi belirtin; özel konuşmaları, kimlik bilgilerini veya hassas HAR dosyalarını paylaşmayın.

[MIT Lisansı](LICENSE). OpenAI, Google veya NV Access ile bağlantısı olmayan bağımsız bir projedir.
