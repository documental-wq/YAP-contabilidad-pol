import { spawn } from 'child_process';
import fs from 'fs';

const child = spawn('node', ['src/server.js'], {
    cwd: process.cwd(),
    stdio: 'pipe'
});

const log = fs.createWriteStream('debug_server_2.log');

child.stdout.on('data', (data) => log.write(data));
child.stderr.on('data', (data) => log.write(data));

child.on('error', (err) => {
    fs.appendFileSync('debug_server_2.log', `\nSPAWN ERROR: ${err.message}`);
});

setTimeout(() => {
    child.kill();
    process.exit(0);
}, 3000);
