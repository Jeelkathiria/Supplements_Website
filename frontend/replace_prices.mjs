import fs from 'fs';
import path from 'path';

const searchDir = './src/app';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(searchDir, function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // Replace all occurrences of .toFixed(2) with .toFixed(0) except the videoFile size one
    content = content.replace(/\.toFixed\(2\)/g, (match, offset, string) => {
      // Check surrounding context, if it's the videoFile size skip it 
      const contextBefore = string.substring(Math.max(0, offset - 40), offset);
      if (contextBefore.includes('videoFile.size')) {
        return '.toFixed(2)';
      }
      return '.toFixed(0)';
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath}`);
    }
  }
});

console.log('Replacement complete.');
