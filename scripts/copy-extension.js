import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function copyExtensionFiles() {
  const rootDir = join(__dirname, '..');
  const distDir = join(rootDir, 'dist');
  
  try {
    // Ensure dist directory exists
    await fs.mkdir(distDir, { recursive: true });
    
    // Copy extension files to dist
    const extensionFiles = [
      'manifest.json',
      'background.js',
      'content.js',
      'popup.html',
      'dashboard.html'
    ];
    
    for (const file of extensionFiles) {
      try {
        await fs.copyFile(join(rootDir, file), join(distDir, file));
        console.log(`✓ Copied ${file}`);
      } catch (error) {
        console.warn(`⚠ Could not copy ${file}:`, error.message);
      }
    }
    
    // Copy directories
    const directories = ['styles', 'scripts', 'icons'];
    
    for (const dir of directories) {
      try {
        await copyDirectory(join(rootDir, dir), join(distDir, dir));
        console.log(`✓ Copied ${dir}/ directory`);
      } catch (error) {
        console.warn(`⚠ Could not copy ${dir}/:`, error.message);
      }
    }
    
    console.log('\n🎉 Extension files copied successfully!');
    console.log('📁 Extension ready in dist/ directory');
    console.log('🔧 Load the extension from the dist/ folder in your browser');
    
  } catch (error) {
    console.error('❌ Error copying extension files:', error);
  }
}

async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

copyExtensionFiles();