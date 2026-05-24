# React Native Yükseltme Rehberi

Bu doküman, yolista-mobil'de uygulanan **0.78 → 0.80** yükseltme sürecinden
çıkarılan pratik adımları içerir. Diğer React Native projelerinde tekrar
kullanılabilir.

---

## 1. Ortam gereksinimleri (minimum)

| Araç | Minimum | Not |
|---|---|---|
| Node.js | **22+** | `node --version` |
| JDK | **17** | Android build için zorunlu |
| Xcode | **16.1+** | iOS build (0.81+ için kesin) |
| Android compileSdk / targetSdk | **35** | Play Store gereksinimi |
| Kotlin | **2.0+** | RN 0.80+ |
| Gradle | **8.10+** | RN 0.80+ (yolista: 8.12) |
| AGP (Android Gradle Plugin) | **8.7+** | RN 0.80+ |

Kontrol komutları:

```bash
node --version
java -version          # 17 olmalı
xcodebuild -version
cd android && ./gradlew --version && cd ..
```

---

## 2. Mevcut durumu öğrenme

### package.json

```bash
node -p "require('./package.json').dependencies['react-native']"
node -p "require('./package.json').dependencies.react"
```

### Hedef sürümü bulma

```bash
# En son patch'leri listele
npm view react-native versions --json | node -e "
  const v=JSON.parse(require('fs').readFileSync(0,'utf8'));
  console.log(v.filter(x=>x.startsWith('0.80.')).slice(-5).join('\n'));
"

# Peer dependency (React sürümü)
npm view react-native@0.80.3 peerDependencies

# CLI sürümü (genelde major RN ile uyumlu)
npm view @react-native-community/cli versions --json | node -e "
  const v=JSON.parse(require('fs').readFileSync(0,'utf8'));
  console.log(v.filter(x=>x.startsWith('19.')).slice(-5).join('\n'));
"
```

### Upgrade Helper (native template diff)

Her minor atlama için diff'i incele:

https://react-native-community.github.io/upgrade-helper/

Örnek: `from=0.78.1&to=0.80.3`

---

## 3. Önerilen strateji: kademeli atlama

Tek seferde 0.78 → 0.82 **yapma**. Her minor sürüm ayrı commit:

```
0.78 → 0.79 → 0.80 → 0.81 → 0.82
```

Her adımda:
1. JS paketlerini güncelle
2. `yarn install`
3. Native build dene
4. Commit at
5. Sonraki minor'a geç

---

## 4. Faz 1 — Ölü paketleri temizle

Yükseltmeden **önce** kullanılmayan native/JS paketlerini kaldır. Her build
hatasında sorun kaynağını daraltmak için kritik.

### Kullanım taraması

```bash
# Tek paket
rg "react-native-snap-carousel" src App.tsx

# Birden fazla şüpheli paket
rg "snap-carousel|pager-view|tab-view|drawer|dropdown-picker|content-loader" src
```

### Kaldırma

```bash
yarn remove paket-adi
yarn install
yarn type-check
```

### Dikkat: script'e körü körüne güvenme

`clean-unused` gibi script'lerde **aktif kullanılan** paketler olabilir.
Kaldırmadan önce `rg` ile doğrula.

yolista'da korunanlar:
- `@gorhom/bottom-sheet` — bottom sheet bileşenleri
- `react-native-url-polyfill` — Supabase için gerekli

---

## 5. Faz 2/3 — package.json güncelleme şablonu

Her RN minor atlama için şu paketler **aynı sürüme** gelmeli:

```json
{
  "dependencies": {
    "react": "19.1.0",
    "react-native": "0.80.3"
  },
  "devDependencies": {
    "@react-native-community/cli": "19.1.2",
    "@react-native-community/cli-platform-android": "19.1.2",
    "@react-native-community/cli-platform-ios": "19.1.2",
    "@react-native/babel-preset": "0.80.3",
    "@react-native/eslint-config": "0.80.3",
    "@react-native/metro-config": "0.80.3",
    "@react-native/typescript-config": "0.80.3",
    "@types/react": "^19.1.0",
    "react-test-renderer": "19.1.0"
  }
}
```

Sürüm eşleştirme tablosu (Mayıs 2026):

| RN | React | CLI |
|---|---|---|
| 0.78.x | 19.0.0 | 15.x |
| 0.79.x | 19.0.0 | 18.x |
| 0.80.x | 19.1.0 | 19.x |
| 0.81.x | 19.1.x | (RN release notes) |
| 0.82.x | 19.1.x | (RN release notes) |

---

## 6. Standart komut sırası (her faz sonrası)

```bash
# 1. Bağımlılıkları kur
yarn install

# 2. TypeScript
yarn type-check

# 3. iOS — RN core değiştiyse mecburi
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# 4. Android cache temizle (native modül değiştiyse)
rm -rf android/app/.cxx android/app/build android/build

# 5. Build test
yarn android
yarn ios

# 6. Metro cache (garip runtime hatalarında)
yarn start --reset-cache
```

---

## 7. Bilinen tuzaklar ve çözümleri

### 7.1 react-native-maps + CMake hatası

**Hata:**
```
Unknown CMake command "target_compile_reactnative_options"
```

**Sebep:** `react-native-maps@1.26.1+` RN **0.81.1+** gerektirir.

**Çözüm (RN < 0.81.1):**
```json
"react-native-maps": "1.26.0"
```

**Çözüm (RN >= 0.81.1):**
```json
"react-native-maps": "^1.27.2"
```

Kontrol:
```bash
curl -sL "https://raw.githubusercontent.com/react-native-maps/react-native-maps/v1.26.0/android/src/main/jni/CMakeLists.txt" | grep target_compile
# 1.26.0 → target_compile_options (OK)
# 1.26.1+ → target_compile_reactnative_options (RN 0.81.1+ gerekir)
```

### 7.2 iOS fast_float pod uyumsuzluğu

**Hata:**
```
CocoaPods could not find compatible versions for pod "fast_float"
```

**Sebep:** Eski `Podfile.lock` / `Pods` cache'i yeni RN podspec'leriyle çakışıyor.

**Çözüm:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

Alternatif (daha hafif):
```bash
cd ios && pod update fast_float --no-repo-update && cd ..
```

### 7.3 Android CMake / .cxx cache

Native modül veya RN sürümü değişince eski CMake cache'i patlatır:

```bash
rm -rf android/app/.cxx android/app/build android/build
yarn android
```

### 7.4 Bakımsız / riskli paketler

Yükseltme öncesi veya sırasında gözden geçir:

| Paket | Risk | Alternatif |
|---|---|---|
| `react-native-snap-carousel` | New Arch uyumsuz, bakımsız | `react-native-reanimated-carousel` |
| `react-native-fs` | Bakımsız | `@react-native-async-storage` veya `@bam.tech/react-native-image-resizer` |
| `react-native-image-resizer` | Eski paket | `@bam.tech/react-native-image-resizer` |
| `react-native-map-clustering` | Bakımsız | `supercluster` + kendi katman |
| `react-native-dropdown-picker` | Yavaş bakım | `@react-native-picker/picker` |

Peer dependency uyarılarını kontrol et:
```bash
yarn install 2>&1 | grep -i "peer\|warning"
```

---

## 8. Legacy / uyumsuzluk tespiti

### Kodda kullanılmayan paket

```bash
rg "from ['\"]paket-adi['\"]" src App.tsx
# Sonuç yoksa → güvenle kaldır
```

### Native modül RN uyumu

```bash
npm view react-native-maps peerDependencies
npm view react-native-reanimated peerDependencies
```

GitHub Issues'da RN sürümü + paket adıyla ara:
```
site:github.com react-native-maps target_compile_reactnative_options
```

### Deprecated API kullanımı

Upgrade Helper diff'inde kaldırılan API'leri kontrol et. Özellikle:
- `PropTypes` (RN 0.80+ kaldırıldı)
- Eski bridge API'leri (0.82'de tamamen gidiyor)

### New Architecture

```bash
grep newArchEnabled android/gradle.properties
```

0.76+ varsayılan açık. Bakımsız paketler New Arch'te patlar — Faz 1'de temizle.

---

## 9. Commit stratejisi

Her faz ayrı commit; geri dönüş kolay olsun:

```bash
git checkout -b chore/rn-upgrade

# Faz 1
git add package.json yarn.lock
git commit -m "chore: remove unused dependencies"

# Faz 2
git add package.json yarn.lock ios/Podfile.lock
git commit -m "chore: upgrade react-native to 0.79.7"

# Faz 3
git add package.json yarn.lock ios/Podfile.lock
git commit -m "chore: upgrade react-native to 0.80.3"
```

Commit'e **sadece** yükseltmeyle ilgili dosyaları ekle. Alakasız WIP
değişiklikleri karıştırma.

---

## 10. Smoke test checklist

Her faz sonrası minimum:

- [ ] Uygulama açılıyor (Android + iOS)
- [ ] Auth akışı
- [ ] Navigasyon (tab/stack)
- [ ] Native modül kullanan ekranlar (harita, kamera, izinler)
- [ ] Release build: `cd android && ./gradlew assembleRelease`

---

## 11. yolista-mobil sonuç özeti (Mayıs 2026)

| Faz | Durum | Commit |
|---|---|---|
| Ölü paket temizliği | ✅ | `chore: remove unused dependencies` |
| RN 0.79.7 | ✅ | `chore: upgrade react-native to 0.79.7` |
| RN 0.80.3 | ✅ | `chore: upgrade react-native to 0.80.3` |

Önemli kararlar:
- `react-native-maps` → **1.26.0** (0.81.1'e kadar)
- Android zaten hazırdı (Kotlin 2, Gradle 8.12, SDK 35)
- iOS pod sorunu → `rm -rf Pods Podfile.lock && pod install`

---

## 12. Sonraki faz: 0.80 → 0.81

Detay: `.cursor/plans/rn-upgrade-0.80-to-0.81.md`

Ana hedefler:
- `react-native-maps` → **1.27.x**'e geri yükselt (0.81.1+ ile uyumlu)
- Android **16 KB page size** audit
- Native bağımlılık güncellemeleri
- Xcode 16.1+ doğrulama
