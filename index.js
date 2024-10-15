const fs = require('fs');
const core = require('@actions/core');
const {execSync} = require('child_process');

const unityPackagePath = process.env.INPUT_PACKAGE_PATH;
let iconPath = process.env.INPUT_ICON_PATH;

// region Validation
console.log('Validating inputs...');
// Make sure the behaviour flags are valid
const validBehaviors = ['fail', 'warn', 'ignore'];
if (!validBehaviors.includes(iconNotFoundBehavior)) {
    core.setFailed(`Invalid icon not found behavior: ${iconNotFoundBehavior}`);
    return;
}
if (!validBehaviors.includes(packageNotFoundBehavior)) {
    core.setFailed(
        `Invalid Unity Package not found behavior: ${packageNotFoundBehavior}`,
    );
    return;
}

// Make sure the Icon ends with .png and exists
if (!iconPath.endsWith('.png')) {
    core.setFailed(`Icon path must end with .png: ${iconPath}`);
    return;
}
if (!fs.existsSync(iconPath)) {
    switch (iconNotFoundBehavior) {
    case 'fail':
        core.setFailed(`Icon not found at path: ${iconPath}`);
        return;
    case 'warn':
        core.warning(`Icon not found at path: ${iconPath}`);
        return;
    case 'ignore':
        core.info(`Icon not found at path: ${iconPath}`);
        return;
    }
}

// Make sure the Unity Package ends with .unitypackage and exists
if (!unityPackagePath.endsWith('.unitypackage')) {
    core.setFailed(
        `Unity Package path must end with .unitypackage: ${unityPackagePath}`,
    );
    return;
}
if (!fs.existsSync(unityPackagePath)) {
    switch (packageNotFoundBehavior) {
    case 'fail':
        core.setFailed(`Unity Package not found at path: ${unityPackagePath}`);
        return;
    case 'warn':
        core.warning(`Unity Package not found at path: ${unityPackagePath}`);
        return;
    case 'ignore':
        core.info(`Unity Package not found at path: ${unityPackagePath}`);
        return;
    }
}
// endregion

// region Prepare
console.log(`Extracting Unity Package...`);
// Create a temporary directory
let tempDir = fs.mkdtempSync('tmp_unitypackage-icon-action_');
// Make sure the temporary directory path is absolute
tempDir = fs.realpathSync(tempDir);
// Get the cleanup function ready
const cleanup = () => {
    // Delete the temporary directory
    console.log(`Cleaning up...`);
    fs.rmSync(tempDir, {recursive: true});
};
// Extract the Unity Package (.gz) to the temporary directory
// Keep the .tar file intact
execSync(`gzip -d -c ${unityPackagePath} > ${tempDir}/archtemp.tar`);
// Copy the icon to the temporary path as .icon.png
console.log(`Preparing icon...`);
fs.copyFileSync(iconPath, `${tempDir}/.icon.png`);
iconPath = `${tempDir}/.icon.png`;
// endregion

// region Modify
console.log(`Modifying Unity Package...`);
// Check if a ".icon.png" file exists in the root of the package
// If it does, remove it
const iconFile = '.icon.png';
const stdout = execSync(`tar --list --file=${tempDir}/archtemp.tar`);
const filenames = stdout.toString().split('\n');
if (filenames.includes(iconFile)) {
    const str = `Icon already present in Unity Package: ${unityPackagePath}`;
    switch (iconAlreadyPresentBehavior) {
    case 'fail':
        core.setFailed(str);
        break;
    case 'warn':
        core.warning(str);
        break;
    case 'ignore':
        core.info(str);
        break;
    }
    cleanup();
    return;
}
// Add the new icon file to the root of the package
execSync(
    `tar --append --file=${tempDir}/archtemp.tar` +
    ` --directory=${tempDir} '${iconFile}'`,
);
// endregion

// region Package
// Compress the temporary directory back into a Unity Package (.gz)
console.log(`Building Unity Package...`);
const previousPath = process.cwd();
process.chdir(tempDir);
execSync(`gzip archtemp.tar`);
process.chdir(previousPath);
// Move the Unity Package (.gz) to the original path
fs.rmSync(unityPackagePath);
fs.renameSync(`${tempDir}/archtemp.tar.gz`, unityPackagePath);
// endregion

cleanup();
