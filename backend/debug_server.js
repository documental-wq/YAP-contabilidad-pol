import { spawn } from 'child_process';
import fs from 'fs';

const child = spawn('node', ['src/server.js'], {
    cwd: process.cwd(),
    stdio: 'pipe'
});

const log = fs.createWriteStream('debug_server.log');

child.stdout.pipe(log);
child.stderr.pipe(log);

child.on('error', (err) => {
    fs.appendFileSync('debug_server.log', `\nSPAWN ERROR: ${err.message}`);
});

setTimeout(() => {
    child.kill();
    process.exit(0);
}, 5000);
