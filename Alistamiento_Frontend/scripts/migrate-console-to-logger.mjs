import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(__dirname, 'src');

function getLoggerImportPath(filePath) {
  const relative = path.relative(path.dirname(filePath), path.join(srcRoot, 'utils', 'logger.js'));
  const normalized = relative.split(path.sep).join('/');
  const withoutExt = normalized.replace(/\.js$/, '');
  return withoutExt.startsWith('.') ? withoutExt : `./${withoutExt}`;
}

function processFile(filePath) {
  if (filePath.endsWith('utils/logger.js')) {
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  if (!/console\.(log|warn|error|debug|info)\(/.test(content)) {
    return false;
  }

  content = content
    .replace(/console\.log\(/g, 'logger.debug(')
    .replace(/console\.debug\(/g, 'logger.debug(')
    .replace(/console\.info\(/g, 'logger.info(')
    .replace(/console\.warn\(/g, 'logger.warn(')
    .replace(/console\.error\(/g, 'logger.error(');

  if (!content.includes("from '../utils/logger'") && !content.includes('from "../utils/logger"') && !content.includes('utils/logger')) {
    const importPath = getLoggerImportPath(filePath);
    const importLine = `import { logger } from '${importPath}';\n`;

    const importMatch = content.match(/^import .+;\n/m);
    if (importMatch) {
      const firstImportIndex = content.indexOf(importMatch[0]);
      content = content.slice(0, firstImportIndex) + importLine + content.slice(firstImportIndex);
    } else {
      content = importLine + content;
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

function walk(dir) {
  let updated = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      updated += walk(fullPath);
    } else if (/\.(js|jsx)$/.test(entry.name)) {
      if (processFile(fullPath)) {
        updated += 1;
        console.log('updated', path.relative(srcRoot, fullPath));
      }
    }
  }
  return updated;
}

const count = walk(srcRoot);
console.log(`Files updated: ${count}`);
