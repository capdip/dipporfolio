import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const vite = resolve(__dirname, 'client', 'node_modules', '.bin', 'vite.cmd');

const child = spawn(vite, ['--host'], {
  cwd: resolve(__dirname, 'client'),
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => process.exit(code ?? 1));
