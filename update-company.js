const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content
              .replace(/Netra Vidya/g, 'PT Artavista')
              .replace(/- NV/g, '- ARTA')
              .replace(/NV\b/g, 'ARTA');
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent);
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}
replaceInDir(path.join(__dirname, 'src'));
