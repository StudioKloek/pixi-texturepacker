const ora = require('ora');
const fs = require('fs-extra');
const get = require('get-value');

export async function readSettingsFrom(_file) {
  const spinner = ora(`Reading settings from ${_file}...`).start();

  let settings = {};

  try {
    const data = await fs.readJSON(_file);

    settings = get(data, 'sprites', { default: {
      sourceDirectory: './assets/',
      scriptDirectory: './assets/converted/',
      targetDirectory: './assets/converted/',
      watch: false,
      watchDelay: 500,
      directories: []
    } });

  } catch (error) {
    spinner.fail(`Could not load settings from ${_file}... (does it exist?)`);

    return settings;
  }

  const numberOfDirectories = settings.directories.length;

  if (numberOfDirectories) {
    spinner.succeed(`Found ${numberOfDirectories} directories to process...`);

  } else {
    spinner.fail(`Found no directories to process...`);
  }

  return settings;
}