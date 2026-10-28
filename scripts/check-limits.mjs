#!/usr/bin/env node
/**
 * Verificação de limites da SPEC-003 (R3.8): arquivos-fonte ≤ 300 linhas e
 * ausência de mídias de áudio/vídeo (Zero-Asset Sound & Graphics).
 * Uso: `npm run check` (após typecheck + testes).
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const SOURCE_EXT = new Set(['.ts', '.tsx']);
const MEDIA_EXT = new Set(['.mp3', '.wav', '.ogg', '.mp4', '.webm', '.png', '.jpg', '.jpeg', '.svg', '.gif']);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === 'coverage' || entry === '.git') continue;
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) walk(full, files);
    else if (stats.isFile()) files.push(full);
  }
  return files;
}

const sourceFiles = walk(root).filter((f) => SOURCE_EXT.has(extname(f)));
const violations = [];

for (const file of sourceFiles) {
  const lines = readFileSync(file, 'utf8').split('\n').length;
  if (lines > 300) violations.push(`>${lines} linhas: ${file}`);
}

const mediaFiles = walk(root).filter((f) => MEDIA_EXT.has(extname(f)));
for (const file of mediaFiles) violations.push(`mídia proibida: ${file}`);

if (violations.length > 0) {
  console.error('check-limits: violações encontradas');
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log(`check-limits: OK (${sourceFiles.length} arquivos-fonte ≤ 300 linhas, zero mídias)`);
