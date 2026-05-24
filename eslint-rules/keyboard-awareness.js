/**
 * ESLint custom rule: keyboard-awareness
 * Uygulama genelinde KeyboardAvoidingView kullanımını zorunlu kılar
 */

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Form içeren ekranlarda KeyboardAwareContainer kullanımını zorunlu kılar',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      missingKeyboardAware: 'TextInput içeren bileşenlerde KeyboardAwareContainer kullanılmalı',
      importMissing: 'KeyboardAwareContainer import edilmeli',
    },
  },

  create(context) {
    let hasTextInput = false;
    let hasKeyboardAware = false;
    let hasKeyboardAwareImport = false;

    const sourceText = context.getSourceCode().getText();
    const hasIgnoreDirective = /\/\/\s*keyboard-aware-ignore/.test(sourceText);

    if (hasIgnoreDirective) {
      return {};
    }

    return {
      // Import kontrolü
      ImportDeclaration(node) {
        if (
          node.source.value === '../../components/common/KeyboardAwareContainer' ||
          node.source.value === '../components/common/KeyboardAwareContainer'
        ) {
          hasKeyboardAwareImport = true;
        }
      },

      // TextInput kullanımı kontrolü
      JSXElement(node) {
        if (node.openingElement.name.name === 'TextInput') {
          hasTextInput = true;
        }
        if (node.openingElement.name.name === 'KeyboardAwareContainer') {
          hasKeyboardAware = true;
        }
      },

      // Program sonunda kontrol
      'Program:exit'() {
        const filename = context.getFilename();

        // Sadece screen dosyalarını kontrol et
        if (!filename.includes('/screens/') && !filename.includes('/components/')) {
          return;
        }

        // TextInput varsa KeyboardAware olmalı
        if (hasTextInput && !hasKeyboardAware) {
          context.report({
            node: context.getSourceCode().ast,
            messageId: 'missingKeyboardAware',
          });
        }

        // KeyboardAware kullanılıyorsa import olmalı
        if (hasKeyboardAware && !hasKeyboardAwareImport) {
          context.report({
            node: context.getSourceCode().ast,
            messageId: 'importMissing',
          });
        }
      },
    };
  },
};

module.exports = rule;
