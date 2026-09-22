const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const titles = {
  success: 'Éxito',
  error: 'Error',
  warning: 'Advertencia',
  info: 'Información'
};

let modifiedFiles = 0;

walkDir('./frontend/src', function(filePath) {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Pattern for sileo.method('String') or sileo.method("String")
    const regex = /sileo\.(success|error|warning|info)\(\s*(['"])(.*?)\2\s*\)/g;
    
    content = content.replace(regex, (match, method, quote, text) => {
      let title = titles[method] || 'Mensaje';
      return `sileo.${method}({ title: '${title}', description: '${text}' })`;
    });

    // Pattern for sileo.method(`String`) with backticks
    const regexBacktick = /sileo\.(success|error|warning|info)\(\s*\`(.*?)\`\s*\)/g;
    content = content.replace(regexBacktick, (match, method, text) => {
      let title = titles[method] || 'Mensaje';
      return `sileo.${method}({ title: '${title}', description: \`${text}\` })`;
    });

    if (original !== content) {
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedFiles++;
      console.log('Modified: ' + filePath);
    }
  }
});

console.log('Total files modified: ' + modifiedFiles);
