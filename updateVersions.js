const fs = require('fs');
const path = require('path');

// Paths to the files
const androidBuildGradlePath = path.join(__dirname, 'android', 'app', 'build.gradle');
const iosInfoPlistPath = path.join(__dirname, 'ios', 'yolista', 'Info.plist');

const BUMP_TYPES = ['patch', 'minor', 'major'];

// Function to get current Android version and build number
function getCurrentAndroidVersion() {
    const buildGradleContent = fs.readFileSync(androidBuildGradlePath, 'utf-8');
    const versionCodeMatch = buildGradleContent.match(/versionCode (\d+)/);
    const versionNameMatch = buildGradleContent.match(/versionName "([^"]+)"/);

    const currentVersionCode = versionCodeMatch ? parseInt(versionCodeMatch[1], 10) : 0;
    const currentVersionName = versionNameMatch ? versionNameMatch[1] : '';

    return { currentVersionCode, currentVersionName };
}

// Function to get current iOS version and build number
function getCurrentIOSVersion() {
    const infoPlistContent = fs.readFileSync(iosInfoPlistPath, 'utf-8');
    const iosVersionMatch = infoPlistContent.match(/<key>CFBundleShortVersionString<\/key>\s*<string>(.*?)<\/string>/);
    const iosBuildNumberMatch = infoPlistContent.match(/<key>CFBundleVersion<\/key>\s*<string>(.*?)<\/string>/);

    const currentVersionName = iosVersionMatch ? iosVersionMatch[1] : '';
    const currentBuildNumber = iosBuildNumberMatch ? parseInt(iosBuildNumberMatch[1], 10) : 0;

    return { currentVersionName, currentBuildNumber };
}

function printCurrentVersions() {
    const { currentVersionCode, currentVersionName } = getCurrentAndroidVersion();
    const { currentVersionName: iosVersion, currentBuildNumber } = getCurrentIOSVersion();

    console.info('Current Android version and Build Number:'.padEnd(45, ' '), currentVersionName, currentVersionCode);
    console.info('Current iOS version and Build Number:'.padEnd(45, ' '), iosVersion, currentBuildNumber);
}

function bumpVersion(version, type) {
    const parts = version.split('.').map(Number);
    if (parts.length < 3 || parts.some(Number.isNaN)) {
        throw new Error(`Invalid semver: ${version}`);
    }

    const [major, minor, patch] = parts;

    switch (type) {
        case 'major':
            return `${major + 1}.0.0`;
        case 'minor':
            return `${major}.${minor + 1}.0`;
        case 'patch':
            return `${major}.${minor}.${patch + 1}`;
        default:
            throw new Error(`Unknown bump type: ${type}`);
    }
}

function resolveUpdateArgs() {
    const arg1 = process.argv[2];
    const arg2 = process.argv[3];

    if (!arg1) {
        return null;
    }

    const { currentVersionCode, currentVersionName } = getCurrentAndroidVersion();
    const parsedBuildNumber = arg2 !== undefined ? parseInt(arg2, 10) : null;
    const newBuildNumber = parsedBuildNumber !== null && !Number.isNaN(parsedBuildNumber)
        ? parsedBuildNumber
        : currentVersionCode + 1;

    if (BUMP_TYPES.includes(arg1)) {
        return {
            newVersionName: bumpVersion(currentVersionName, arg1),
            newBuildNumber,
        };
    }

    return {
        newVersionName: arg1,
        newBuildNumber,
    };
}

function updateAndroidVersion(newVersionName, newBuildNumber) {
    let buildGradleContent = fs.readFileSync(androidBuildGradlePath, 'utf-8');

    buildGradleContent = buildGradleContent
        .replace(/versionName ".*?"/, `versionName "${newVersionName}"`)
        .replace(/versionCode \d+/, `versionCode ${newBuildNumber}`);

    fs.writeFileSync(androidBuildGradlePath, buildGradleContent);
    console.info('Updated Android version and build number to'.padEnd(45, ' '), newVersionName, newBuildNumber);
}

function updateIOSVersion(newVersionName, newBuildNumber) {
    let infoPlistContent = fs.readFileSync(iosInfoPlistPath, 'utf-8');
    infoPlistContent = infoPlistContent
        .replace(
            /<key>CFBundleShortVersionString<\/key>\s*<string>.*?<\/string>/,
            `<key>CFBundleShortVersionString</key>\n\t<string>${newVersionName}</string>`,
        )
        .replace(
            /<key>CFBundleVersion<\/key>\s*<string>.*?<\/string>/,
            `<key>CFBundleVersion</key>\n\t<string>${newBuildNumber}</string>`,
        );

    fs.writeFileSync(iosInfoPlistPath, infoPlistContent);
    console.info('Updated iOS version and build number to'.padEnd(45, ' '), newVersionName, newBuildNumber);
}

const updateArgs = resolveUpdateArgs();

if (!updateArgs) {
    console.info('No arguments provided. Fetching current versions...');
    printCurrentVersions();
} else {
    const { newVersionName, newBuildNumber } = updateArgs;
    updateAndroidVersion(newVersionName, newBuildNumber);
    updateIOSVersion(newVersionName, newBuildNumber);
    console.info('');
    console.info('Reminder: Admin panelde sürüm politikasını güncelleyin:');
    console.info('  /admin/app-versions → latest_version =', newVersionName);
    console.info('  (min_supported_version gerekirse ayrıca ayarlayın)');
}
