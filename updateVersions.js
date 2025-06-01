const fs = require('fs');
const path = require('path');

// Paths to the files
const androidBuildGradlePath = path.join(__dirname, 'android', 'app', 'build.gradle');
const iosInfoPlistPath = path.join(__dirname, 'ios', 'yolista', 'Info.plist');

// Function to get current Android version and build number
function getCurrentAndroidVersion() {
    const buildGradleContent = fs.readFileSync(androidBuildGradlePath, 'utf-8');
    const versionCodeMatch = buildGradleContent.match(/versionCode (\d+)/);
    const versionNameMatch = buildGradleContent.match(/versionName "([^"]+)"/);
    
    const currentVersionCode = versionCodeMatch ? parseInt(versionCodeMatch[1], 10) : 0;
    const currentVersionName = versionNameMatch ? versionNameMatch[1] : '';

    console.info('Current Android version and Build Number:'.padEnd(45, ' '), currentVersionName, currentVersionCode);
    return { currentVersionCode, currentVersionName };
}

// Function to get current iOS version and build number
function getCurrentIOSVersion() {
    const infoPlistContent = fs.readFileSync(iosInfoPlistPath, 'utf-8');
    const iosVersionMatch = infoPlistContent.match(/<key>CFBundleShortVersionString<\/key>\s*<string>(.*?)<\/string>/);
    const iosBuildNumberMatch = infoPlistContent.match(/<key>CFBundleVersion<\/key>\s*<string>(.*?)<\/string>/);
    
    const currentVersionName = iosVersionMatch ? iosVersionMatch[1] : '';
    const currentBuildNumber = iosBuildNumberMatch ? iosBuildNumberMatch[1] : '';

    console.info('Current iOS version and Build Number:'.padEnd(45, ' '), currentVersionName, Number(currentBuildNumber));
    return { currentVersionName, currentBuildNumber };
}

// Check for command line arguments
if (process.argv.length < 4) {
    console.info("No arguments provided. Fetching current versions...");
    getCurrentAndroidVersion();
    getCurrentIOSVersion();
} else {
    // Get version and build number from command line arguments
    const newVersionName = process.argv[2]; // e.g., '2.2.3'
    const newBuildNumber = process.argv[3]; // Optional build number

    // Update Android version
    function updateAndroidVersion() {
        let buildGradleContent = fs.readFileSync(androidBuildGradlePath, 'utf-8');

        // Increment versionCode
        const versionCodeMatch = buildGradleContent.match(/versionCode (\d+)/);
        const currentVersionCode = versionCodeMatch ? parseInt(versionCodeMatch[1], 10) : 0;
        const updatedVersionCode = newBuildNumber ? parseInt(newBuildNumber, 10) : currentVersionCode + 1;

        // Update versionCode and versionName in build.gradle
        buildGradleContent = buildGradleContent
            .replace(/versionName ".*?"/, `versionName "${newVersionName}"`)
            .replace(/versionCode \d+/, `versionCode ${updatedVersionCode}`);

        fs.writeFileSync(androidBuildGradlePath, buildGradleContent);
        console.info('Updated Android version and build number to'.padEnd(45, ' '), newVersionName,  Number(updatedVersionCode));
    }

    // Update iOS version
    function updateIOSVersion() {
        let infoPlistContent = fs.readFileSync(iosInfoPlistPath, 'utf-8');
        infoPlistContent = infoPlistContent
            .replace(/<key>CFBundleShortVersionString<\/key>\s*<string>.*?<\/string>/, `<key>CFBundleShortVersionString</key>\n<string>${newVersionName}</string>`);
        
        const iosBuildNumber = newBuildNumber ? newBuildNumber : (currentVersionCode + 1);
        infoPlistContent = infoPlistContent.replace(/<key>CFBundleVersion<\/key>\s*<string>.*?<\/string>/, `<key>CFBundleVersion</key>\n<string>${iosBuildNumber}</string>`);
        
        fs.writeFileSync(iosInfoPlistPath, infoPlistContent);
        console.info('Updated iOS version and build number to'.padEnd(45, ' '), newVersionName,  Number(iosBuildNumber));
    }

    // Run the updates
    updateAndroidVersion();
    updateIOSVersion();
}