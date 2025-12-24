#!/usr/bin/env node

/**
 * Script to prepare Profile directory structure
 * Run with: node scripts/prep-profile-structure.js
 */

import { mkdirSync, copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Define the directory structure
const dirs = [
  'src/pages/Profile',
  'src/pages/Profile/components',
  'src/pages/Profile/components/tabs'
];

// Create directories
console.log('Creating Profile directory structure...\n');

dirs.forEach(dir => {
  const fullPath = join(rootDir, dir);
  if (!existsSync(fullPath)) {
    mkdirSync(fullPath, { recursive: true });
    console.log(`✓ Created: ${dir}`);
  } else {
    console.log(`✓ Already exists: ${dir}`);
  }
});

// Move Profile.tsx to Profile/index.tsx
const oldPath = join(rootDir, 'src/pages/Profile.tsx');
const newPath = join(rootDir, 'src/pages/Profile/index.tsx');

if (existsSync(oldPath) && !existsSync(newPath)) {
  copyFileSync(oldPath, newPath);
  console.log('\n✓ Copied Profile.tsx to Profile/index.tsx');
  console.log('  (Original Profile.tsx can be manually deleted after verification)');
} else if (existsSync(newPath)) {
  console.log('\n✓ Profile/index.tsx already exists');
} else {
  console.log('\n⚠ Profile.tsx not found at expected location');
}

console.log('\n✅ Profile directory structure preparation complete!');
console.log('\nNext steps:');
console.log('1. Verify the import still works: import Profile from \'@/pages/Profile\'');
console.log('2. Run: npm run typecheck');
console.log('3. If everything works, manually delete src/pages/Profile.tsx');
console.log('4. Proceed with prompts 18A-18E to create the component files');
