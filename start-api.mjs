import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tsx = resolve(__dirname, 'node_modules', '.bin', 'tsx.cmd');
const entry = resolve(__dirname, 'server', 'src', 'index.ts');

const child = spawn(tsx, [entry], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => process.exit(code ?? 1));
