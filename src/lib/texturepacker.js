const util = require('util');
const execProcess = util.promisify(require('child_process').exec);

const baseOptions = {
  'format': 'pixijs4',
  'texture-format': 'png',
  'png-opt-level':0,
  'opt':'RGBA8888',
  'prepend-folder-name': true,
  'trim-sprite-names': true,

  'algorithm': 'MaxRects',
  'maxrects-heuristics': 'Best',
  'pack-mode': 'Best',
  'scale-mode': 'Smooth',

  'multipack': true,
  'force-identical-layout': true,
  'trim-mode': 'Trim',
  'alpha-handling': 'ClearTransparentPixels',
  'default-pivot-point': '0,0',
  'enable-rotation': true,
  'quiet': true,
  'extrude': '0',
  'variant': ['1:@2x', '0.5:']
};

export async function packFolder(path, options) {
  const command = buildTexturePackerCommand(path, Object.assign(options, baseOptions));

  try {
    await execProcess(command);
  } catch(error) {
    if (error && error.stderr) {
      throw new Error(error.stderr);
    }

    return false;
  }

  return true;
}

function buildTexturePackerCommand(path, options) {
  options = options || {};

  const command = new TexturePackerCommand();
  command.addPath(`${path}`);
  Object.keys(options).forEach(option => {
    command.addOption(option, options[option]);
  });

  return command.build();
}

class TexturePackerCommand {
  constructor() {
    this.commands = [];
    this.path = '';
  }

  addPath(path) {
    this.path = path;
  }

  addOption(option, value) {
    this.commands.push({
      option: `--${this.kebabCase(option)}`,
      value
    });
  }

  build() {
    if (!this.path) {
      throw new Error('Must specify a path to process (image/directory)');
    }

    const options = this.commands
      .map(c => this.resolveValue(c.option, c.value))
      .join(' ');

    return `TexturePacker ${this.path} ${options}`;
  }

  resolveValue(option, value) {
    if (Array.isArray(value)) {
      return value.map(v => this.resolveValue(option, v)).join(' ');
    }

    if (value === true) {
      value = '';
    } else {
      value = ` ${value}`
    }

    return `${option}${value}`;
  }

  // https://gist.github.com/nblackburn/875e6ff75bc8ce171c758bf75f304707
  kebabCase(text) {
    return text.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
}