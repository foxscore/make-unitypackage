import { debug, getInput, info, setFailed } from "@actions/core";
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "fs";
import { exit } from "process";
import { globSync } from "glob";
import { execSync } from "child_process";

// Getting ready
info('Getting ready...')
let path = getInput('path', { required: true });
let outputPath = getInput('saveTo', { required: true });
let iconPath = getInput('icon', { required: false });
let prefix = getInput('prefix', { required: false }) ?? '';

const tmpPath = '/tmp/make-unitypackage';
if (existsSync(tmpPath))
    rmSync(tmpPath, { recursive: true, force: true });
mkdirSync(tmpPath);
if (existsSync(`/tmp/archtemp.tar`))
    rmSync(`/tmp/archtemp.tar`);

// Copy icon
if (iconPath !== undefined && iconPath !== null && iconPath !== "") {
    if (!iconPath.endsWith('.png')) {
        setFailed('The icon must be a png');
        exit(1);
    }
    if (!existsSync(iconPath)) {
        setFailed('The icon does not exist at the defined path');
        exit(1);
    }
    info('Copying icon...')
    copyFileSync(iconPath, `${tmpPath}/.icon.png`);
}

// Copy files
info('Copying files...')
let files = globSync(`${path}/**`, { nodir: true, ignore: '**/*.meta' });
for (let file of files) {
    if (!existsSync(`${file}.meta`)) {
        debug(`File '${file}' does not have a .meta file - Skipping`)
        continue;
    }
    debug(`\tIncluding file '${file}'...`)
    let lines = readFileSync(`${file}.meta`, { encoding: 'utf-8' }).split('\n');
    const guid = lines.find(line => line.startsWith('guid: '))!.replace('guid: ', '').trim();
    mkdirSync(`${tmpPath}/${guid}`);
    copyFileSync(file, `${tmpPath}/${guid}/asset`);
    copyFileSync(`${file}.meta`, `${tmpPath}/${guid}/asset.meta`);
    writeFileSync(`${tmpPath}/${guid}/pathname`, `${prefix}${file}`);
}

// Make archtemp.tar
info('Building tar archive...')
execSync(`tar -cf /tmp/archtemp.tar -C ${tmpPath} .`)

// Make gz file
info('Compressing archive...')
const previousPath = process.cwd();
process.chdir('/tmp/');
execSync(`gzip /tmp/archtemp.tar`)
process.chdir(previousPath);
if (existsSync(outputPath))
    rmSync(outputPath);
renameSync('/tmp/archtemp.tar.gz', outputPath);

// Cleaning up
info('Cleaning up...')
if (existsSync('/tmp/archtemp.tar'))
    rmSync('/tmp/archtemp.tar');
rmSync(tmpPath, { recursive: true, force: true });
