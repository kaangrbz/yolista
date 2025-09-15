const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Bundle size analysis script
class BundleAnalyzer {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.packageJsonPath = path.join(this.rootDir, 'package.json');
  }

  // Analyze package.json dependencies
  analyzeDependencies() {
    console.log('📦 Analyzing dependencies...\n');

    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    const dependencies = packageJson.dependencies || {};

    // Large packages that should be reviewed
    const heavyPackages = [
      '@react-navigation',
      'react-native-reanimated',
      'react-native-svg',
      'react-native-vector-icons',
      'react-native-image-picker',
      'react-native-fs',
      'date-fns',
      'zustand',
      'supabase',
    ];

    const installedHeavyPackages = [];

    Object.keys(dependencies).forEach(pkg => {
      const isHeavy = heavyPackages.some(heavy => pkg.includes(heavy));
      if (isHeavy) {
        installedHeavyPackages.push(pkg);
      }
    });

    console.log('🔍 Heavy packages found:');
    installedHeavyPackages.forEach(pkg => {
      console.log(`  - ${pkg}: ${dependencies[pkg]}`);
    });

    return installedHeavyPackages;
  }

  // Find unused dependencies
  findUnusedDependencies() {
    console.log('\n🔍 Searching for unused dependencies...\n');

    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    const dependencies = Object.keys(packageJson.dependencies || {});

    const srcDir = path.join(this.rootDir, 'src');
    const unusedDeps = [];

    dependencies.forEach(dep => {
      try {
        // Search for import/require statements
        const result = execSync(
          `grep -r "from ['\\"]${dep}" ${srcDir} || grep -r "require(['\\"]${dep}" ${srcDir} || echo "NOT_FOUND"`,
          { encoding: 'utf8' }
        );

        if (result.trim() === 'NOT_FOUND') {
          unusedDeps.push(dep);
        }
      } catch (error) {
        // If grep fails, consider it unused
        unusedDeps.push(dep);
      }
    });

    if (unusedDeps.length > 0) {
      console.log('❌ Potentially unused dependencies:');
      unusedDeps.forEach(dep => console.log(`  - ${dep}`));

      console.log('\n💡 To remove unused dependencies:');
      console.log(`yarn remove ${unusedDeps.join(' ')}`);
    } else {
      console.log('✅ No obviously unused dependencies found');
    }

    return unusedDeps;
  }

  // Analyze import patterns
  analyzeImports() {
    console.log('\n📋 Analyzing import patterns...\n');

    const srcDir = path.join(this.rootDir, 'src');
    const issues = [];

    try {
      // Find default imports that could be tree-shaken
      const defaultImports = execSync(
        `find ${srcDir} -name "*.tsx" -o -name "*.ts" | xargs grep -h "import.*from" | grep -E "(lodash|date-fns|react-native-vector-icons)"`,
        { encoding: 'utf8' }
      ).split('\n').filter(line => line.trim());

      if (defaultImports.length > 0) {
        console.log('⚠️  Default imports found (consider named imports for tree-shaking):');
        defaultImports.forEach(imp => console.log(`  ${imp.trim()}`));
        issues.push('default-imports');
      }

      // Find large barrel imports
      const barrelImports = execSync(
        `find ${srcDir} -name "*.tsx" -o -name "*.ts" | xargs grep -h "import.*from.*react-native" | grep -v "react-native-"`,
        { encoding: 'utf8' }
      ).split('\n').filter(line => line.trim());

      if (barrelImports.length > 0) {
        console.log('\n📦 React Native barrel imports:');
        const uniqueImports = [...new Set(barrelImports)];
        uniqueImports.slice(0, 5).forEach(imp => console.log(`  ${imp.trim()}`));
        if (uniqueImports.length > 5) {
          console.log(`  ... and ${uniqueImports.length - 5} more`);
        }
      }

    } catch (error) {
      console.log('Could not analyze imports:', error.message);
    }

    return issues;
  }

  // Generate optimization recommendations
  generateRecommendations() {
    console.log('\n🚀 Bundle Size Optimization Recommendations:\n');

    const recommendations = [
      {
        title: '1. Enable Hermes Engine',
        description: 'Hermes reduces bundle size and improves startup time',
        action: 'Already configured in android/app/build.gradle',
      },
      {
        title: '2. Optimize Image Assets',
        description: 'Use WebP format and appropriate resolutions',
        action: 'Convert PNG/JPG to WebP, use @2x/@3x variants',
      },
      {
        title: '3. Code Splitting',
        description: 'Lazy load screens and components',
        action: 'Implement React.lazy() for heavy screens',
      },
      {
        title: '4. Remove Console Logs',
        description: 'Console logs increase bundle size in production',
        action: 'Use babel-plugin-transform-remove-console',
      },
      {
        title: '5. Optimize Vector Icons',
        description: 'Only include used icon sets',
        action: 'Configure react-native-vector-icons to include only needed fonts',
      },
      {
        title: '6. Tree Shaking',
        description: 'Remove unused code with proper imports',
        action: 'Use named imports instead of default imports where possible',
      },
    ];

    recommendations.forEach((rec, index) => {
      console.log(`${rec.title}`);
      console.log(`   ${rec.description}`);
      console.log(`   💡 ${rec.action}\n`);
    });
  }

  // Main analysis function
  run() {
    console.log('🔍 React Native Bundle Size Analyzer\n');
    console.log('=====================================\n');

    const heavyPackages = this.analyzeDependencies();
    const unusedDeps = this.findUnusedDependencies();
    const importIssues = this.analyzeImports();

    this.generateRecommendations();

    // Summary
    console.log('📊 Analysis Summary:');
    console.log(`   Heavy packages: ${heavyPackages.length}`);
    console.log(`   Unused dependencies: ${unusedDeps.length}`);
    console.log(`   Import issues: ${importIssues.length}`);

    if (unusedDeps.length > 0 || importIssues.length > 0) {
      console.log('\n⚠️  Issues found that could reduce bundle size');
    } else {
      console.log('\n✅ Bundle structure looks good!');
    }
  }
}

// Run the analyzer
const analyzer = new BundleAnalyzer();
analyzer.run();
