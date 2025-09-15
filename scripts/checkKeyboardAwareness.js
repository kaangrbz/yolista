#!/usr/bin/env node

/**
 * Keyboard Awareness Checker
 * Uygulama genelinde TextInput içeren dosyalarda KeyboardAwareContainer kullanımını kontrol eder
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class KeyboardAwarenessChecker {
  constructor() {
    this.issues = [];
    this.checkedFiles = 0;
    this.totalFiles = 0;
  }

  log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
  }

  checkFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);

      this.checkedFiles++;

      // TextInput kullanımını kontrol et
      const hasTextInput = /\<TextInput/g.test(content);
      if (!hasTextInput) {return;}

      // KeyboardAwareContainer veya KeyboardAvoidingView kullanımını kontrol et (comment'leri hariç tut)
      const hasKeyboardAware = /(?<!\/\/.*)\<(KeyboardAwareContainer|KeyboardAvoidingView)/g.test(content);

      if (!hasKeyboardAware) {
        this.issues.push({
          file: relativePath,
          type: 'missing-keyboard-aware',
          message: 'TextInput kullanıyor ancak KeyboardAwareContainer yok',
          severity: 'warning',
        });
      }

      // Import kontrolü (comment'leri hariç tut)
      if (hasKeyboardAware) {
        const hasImport = /import.*KeyboardAware/g.test(content);
        if (!hasImport) {
          this.issues.push({
            file: relativePath,
            type: 'missing-import',
            message: 'KeyboardAware kullanılıyor ancak import edilmemiş',
            severity: 'error',
          });
        }
      }

      // Deprecated KeyboardAvoidingView kontrolü (sadece uyarı, comment'leri hariç tut)
      const hasOldKeyboard = /(?<!\/\/.*)\<KeyboardAvoidingView/g.test(content) &&
                            !/(?<!\/\/.*)\<KeyboardAwareContainer/g.test(content);
      if (hasOldKeyboard) {
        this.issues.push({
          file: relativePath,
          type: 'deprecated-keyboard',
          message: 'KeyboardAvoidingView yerine KeyboardAwareContainer kullanın',
          severity: 'info',
        });
      }

    } catch (error) {
      this.issues.push({
        file: filePath,
        type: 'file-error',
        message: `Dosya okunamadı: ${error.message}`,
        severity: 'error',
      });
    }
  }

  async run() {
    this.log('🔍 Keyboard Awareness Kontrolü Başlatılıyor...', 'cyan');
    this.log('', 'reset');

    // Dosyaları bul
    const patterns = [
      'src/screens/**/*.tsx',
      'src/components/**/*.tsx',
    ];

    let allFiles = [];
    for (const pattern of patterns) {
      const files = glob.sync(pattern);
      allFiles = allFiles.concat(files);
    }

    this.totalFiles = allFiles.length;
    this.log(`📁 ${this.totalFiles} dosya kontrol edilecek`, 'blue');
    this.log('', 'reset');

    // Her dosyayı kontrol et
    for (const file of allFiles) {
      this.checkFile(file);
    }

    // Sonuçları göster
    this.showResults();
  }

  showResults() {
    this.log('📊 SONUÇLAR', 'cyan');
    this.log('=' .repeat(50), 'cyan');

    if (this.issues.length === 0) {
      this.log('✅ Tüm dosyalar keyboard awareness kurallarına uygun!', 'green');
      this.log(`📁 ${this.checkedFiles} dosya kontrol edildi`, 'green');
      return;
    }

    // Issue'ları kategorilere ayır
    const errors = this.issues.filter(i => i.severity === 'error');
    const warnings = this.issues.filter(i => i.severity === 'warning');
    const infos = this.issues.filter(i => i.severity === 'info');

    // Özet
    this.log(`📁 Kontrol edilen dosyalar: ${this.checkedFiles}`, 'blue');
    this.log(`❌ Hatalar: ${errors.length}`, 'red');
    this.log(`⚠️  Uyarılar: ${warnings.length}`, 'yellow');
    this.log(`ℹ️  Bilgiler: ${infos.length}`, 'cyan');
    this.log('', 'reset');

    // Detayları göster
    if (errors.length > 0) {
      this.log('❌ HATALAR:', 'red');
      errors.forEach(issue => {
        this.log(`  ${issue.file}: ${issue.message}`, 'red');
      });
      this.log('', 'reset');
    }

    if (warnings.length > 0) {
      this.log('⚠️  UYARILAR:', 'yellow');
      warnings.forEach(issue => {
        this.log(`  ${issue.file}: ${issue.message}`, 'yellow');
      });
      this.log('', 'reset');
    }

    if (infos.length > 0) {
      this.log('ℹ️  BİLGİLER:', 'cyan');
      infos.forEach(issue => {
        this.log(`  ${issue.file}: ${issue.message}`, 'cyan');
      });
      this.log('', 'reset');
    }

    // Öneriler
    this.log('💡 ÖNERİLER:', 'green');
    this.log('  1. TextInput içeren ekranlarda KeyboardAwareContainer kullanın', 'green');
    this.log('  2. KeyboardAvoidingView yerine KeyboardAwareContainer tercih edin', 'green');
    this.log('  3. Import\'ları kontrol edin', 'green');
    this.log('', 'reset');

    // Exit code
    if (errors.length > 0) {
      process.exit(1);
    }
  }
}

// Script çalıştır
if (require.main === module) {
  const checker = new KeyboardAwarenessChecker();
  checker.run().catch(error => {
    console.error('Hata:', error);
    process.exit(1);
  });
}

module.exports = KeyboardAwarenessChecker;
