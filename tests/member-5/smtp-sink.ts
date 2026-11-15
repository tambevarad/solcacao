import { createServer, type Socket } from 'node:net';
import { once } from 'node:events';

/** Loopback-only SMTP capture. Never relays mail or contacts a real recipient. */
export async function startSmtpSink() {
  const messages: string[] = [];
  const sockets = new Set<Socket>();
  const server = createServer((socket) => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
    socket.setEncoding('utf8');
    socket.write('220 localhost synthetic SMTP\r\n');
    let buffer = '';
    let data = false;
    let message = '';
    socket.on('data', (chunk: string) => {
      buffer += chunk;
      let newline: number;
      while ((newline = buffer.indexOf('\r\n')) >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 2);
        if (data) {
          if (line === '.') {
            messages.push(message);
            data = false;
            socket.write('250 2.0.0 Captured locally\r\n');
          } else message += `${line.startsWith('..') ? line.slice(1) : line}\r\n`;
        } else if (/^(EHLO|HELO)/.test(line)) socket.write('250 localhost\r\n');
        else if (line === 'DATA') {
          data = true;
          message = '';
          socket.write('354 End with dot\r\n');
        } else if (line === 'QUIT') socket.end('221 Bye\r\n');
        else socket.write('250 OK\r\n');
      }
    });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No SMTP test port');
  let stopped = false;
  return {
    port: address.port,
    messages,
    async stop() {
      if (stopped) return;
      stopped = true;
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    },
  };
}

/** Nodemailer's quoted-printable text/HTML parts, decoded for assertions only. */
export function decodedMail(raw: string) {
  const bytes = Buffer.from(raw.replace(/=\r\n/g, ''), 'utf8');
  const decoded: number[] = [];
  for (let index = 0; index < bytes.length; index++) {
    const hex = bytes.subarray(index + 1, index + 3).toString('ascii');
    if (bytes[index] === 61 && /^[\dA-F]{2}$/i.test(hex)) {
      decoded.push(Number.parseInt(hex, 16));
      index += 2;
    } else decoded.push(bytes[index]);
  }
  return Buffer.from(decoded).toString('utf8');
}
