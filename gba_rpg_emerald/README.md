# GBA-Style RPG (Pokémon Emerald Grafikleri)

Bu sürüm, **Pokémon Emerald** kalitesinde görsel iyileştirmeler içerir:

## 🎮 Özellikler

- **240×160 Native GBA Çözünürlük**: 4x nearest-neighbor ölçekleme
- **15-bit BGR555 Renk Paleti**: Otantik GBA renk derinliği
- **Zengin Prosedürel Tileset**: 
  - Çoklu çimen varyantları
  - Detaylı toprak yollar
  - Animasyonlu su efektleri
  - Sallanan uzun otlar
- **Overlap Katman Sistemi**: Ağaç tepeleri oyuncunun üzerinde render edilir
- **Gelişmiş Sprite Sistemi**:
  - 4 yön x 4 frame animasyon
  - Dinamik gölgeler
  - Yürüme animasyonları
- **9-Slice Diyalog Paneli**: Emerald tarzı UI
- **Typewriter Efekti**: Otantik RPG diyalog deneyimi

## 🚀 Hızlı Başlangıç

### Yerel Çalıştırma
```bash
# index.html dosyasını modern bir tarayıcıda aç
```

### GitHub Pages Deployment
1. Tüm dosyaları GitHub reposunun köküne yükle
2. **Settings → Pages** git
3. **Build and deployment** altında:
   - Source: **Deploy from branch**
   - Branch: `main` → `/ (root)`
4. `https://<kullanıcı-adı>.github.io/<repo-adı>/` adresinden erişin

## 🎨 Özel Grafikler

`assets/` klasörüne kendi PNG dosyalarınızı ekleyebilirsiniz:

### tileset.png
- 16×16 piksel tile atlası
- İlk satır: Temel tile'lar (çimen, yol, ağaç, su, vb.)
- İkinci satır: Ek tile'lar (kayalar, vb.)

### player.png
- 4 satır (Aşağı, Yukarı, Sol, Sağ)
- 4 sütun (4 animasyon frame'i)
- Her frame: 16×24 piksel

### panel9.png
- 9-slice panel için
- 3×3 grid, her dilim 8×8 piksel

PNG dosyaları yoksa, oyun otomatik olarak yüksek kaliteli prosedürel grafikler oluşturur.

## 📝 Lisans

Bu bir scaffold/template projesidir. Kendi projelerinizde özgürce kullanabilirsiniz.

> **Not**: Orijinal veya lisanslı asset'ler kullanın. Nintendo/Pokémon telif haklı materyalleri kullanmayın.
