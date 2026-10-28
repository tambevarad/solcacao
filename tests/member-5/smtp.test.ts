import { createServer } from 'node:net';
import { once } from 'node:events';
import { expect, it } from 'vitest';
import {
  createNotifications,
  createNotificationTransport,
} from '../../server/src/features/support/notifications.js';
import { input, product } from './fixtures.js';

it('delivers through real Nodemailer to a local-only synthetic SMTP sink', async () => {
  const messages: string[] = [];
  const server = createServer((socket) => {
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
          } else message += `${line}\r\n`;
        } else if (/^(EHLO|HELO)/.test(line)) socket.write('250 localhost\r\n');
        else if (line === 'DATA') {
          data = true;
          message = '';
          socket.write('354 End with dot\r\n');
        } else if (line === 'QUIT') {
          socket.end('221 Bye\r\n');
        } else socket.write('250 OK\r\n');
      }
    });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No local SMTP port');
  try {
    const env = {
      NODE_ENV: 'test',
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: String(address.port),
      MAIL_FROM: 'demo@example.test',
      SUPPORT_EMAIL: 'support@example.test',
    };
    const notifications = createNotifications({ env, transport: createNotificationTransport(env) });
    expect(await notifications.notifyInquiry({ ...input, inquiryId: product.id })).toBe('sent');
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('To: support@example.test');
    expect(messages[0]).toContain('A fictional support question.');
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
