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

    // Pattern for sileo.method( ... ) where it's NOT starting with `{`
    // We want to catch things like: sileo.error(error.response?.data?.error || 'Ocurrió un error')
    // We replace it with sileo.error({ title: 'Error', description: error.response?.data?.error || 'Ocurrió un error' })
    
    // The regex matches sileo.(method)( ANY_CONTENT_NOT_STARTING_WITH_CURLY_BRACE )
    // Because JS regex can't easily balance parentheses, we'll do a simpler approach:
    // If we find `sileo.METHOD(` followed by anything except `{`, we rewrite it.
    
    const lines = content.split('\n');
    let changed = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/sileo\.(success|error|warning|info)\((?!\s*\{)(.*)\)/);
        if (match) {
            const method = match[1];
            let inner = match[2];
            // If inner ends with a comma (e.g. from multiline or second param), this might be tricky,
            // but in most of this codebase it's single-line like sileo.error(err)
            // Or sileo.info('text', { icon: '??' }) -> we want { title: 'Info', description: 'text', icon: '??' } 
            
            // For simplicity, let's just do a naive wrap if it doesn't contain a second param
            if (!inner.includes(',')) {
                let title = titles[method];
                lines[i] = line.replace(match[0], `sileo.${method}({ title: '${title}', description: ${inner} })`);
                changed = true;
            } else {
                // If it contains a comma, it might be sileo.info('text', { icon: '?' })
                // Let's just wrap the first arg as description and merge the second arg
                const parts = inner.split(',');
                const firstArg = parts[0];
                const restArgs = parts.slice(1).join(',').trim();
                if (restArgs.startsWith('{') && restArgs.endsWith('}')) {
                    const innerProps = restArgs.slice(1, -1);
                    let title = titles[method];
                    lines[i] = line.replace(match[0], `sileo.${method}({ title: '${title}', description: ${firstArg}, ${innerProps} })`);
                    changed = true;
                } else if (!line.includes('toastId')) {
                    // Just wrap the whole thing if it's not a toastId update (which shouldn't match .success anyway)
                    let title = titles[method];
                    lines[i] = line.replace(match[0], `sileo.${method}({ title: '${title}', description: ${inner} })`);
                    changed = true;
                }
            }
        }
        
        // Also handle multiline:
        // sileo.success(
        //   `Item ${...}`
        // )
        if (line.match(/sileo\.(success|error|warning|info)\(\s*$/)) {
            const method = line.match(/sileo\.(success|error|warning|info)\(\s*$/)[1];
            let title = titles[method];
            lines[i] = line.replace(`sileo.${method}(`, `sileo.${method}({ title: '${title}', description: `);
            // find the closing parenthesis for this
            let j = i + 1;
            let braces = 1;
            while(j < lines.length) {
                if (lines[j].includes(')')) {
                    lines[j] = lines[j].replace(')', '})');
                    break;
                }
                j++;
            }
            changed = true;
        }
    }
    
    if (changed) {
        fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
        modifiedFiles++;
        console.log('Modified complex: ' + filePath);
    }
  }
});

console.log('Total complex files modified: ' + modifiedFiles);
