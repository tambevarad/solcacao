/** Test harness only: loopback app + isolated MongoDB + local Mailpit. */
import { randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import mongoose from 'mongoose';
import { connectDb, disconnectDb } from '../../server/src/shared/db.js';
import { InquiryModel } from '../../server/src/features/support/model.js';
import { isolatedMongoUri, seedTestCatalog } from './integration-db.js';

const uri = isolatedMongoUri(process.env.TEST_MONGODB_URI ?? '', 'browser');
// A prior interrupted outage run may have left the local service stopped.
await promisify(execFile)('docker', ['compose', 'start', 'mailpit']);
let mailReady = false;
for (let attempt = 0; attempt < 50; attempt++) {
  try {
    mailReady = (await fetch('http://127.0.0.1:8025/api/v1/info')).ok;
  } catch {
    /* Wait for the local container to bind its port. */
  }
  if (mailReady) break;
  await new Promise((resolve) => setTimeout(resolve, 100));
}
if (!mailReady) throw new Error('Local Docker Mailpit did not become ready');
Object.assign(process.env, {
  JWT_SECRET: randomBytes(48).toString('base64url'),
  CLIENT_ORIGIN: 'http://127.0.0.1:5176',
  SMTP_HOST: '127.0.0.1',
  SMTP_PORT: '1025',
  SMTP_SECURE: 'false',
  SMTP_USER: '',
  SMTP_PASS: '',
  MAIL_FROM: 'demo@example.test',
  SUPPORT_EMAIL: 'support@example.test',
});
await seedTestCatalog(uri);
await connectDb(uri);
const { app } = await import('../../server/src/app.js');
await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).init()));
// Test-only observability is registered on a separate app, never on the production app.
const { default: express } = await import('express');
const harness = express();
harness.get('/__test/inquiries/:requestId', async (req, res) => {
  const record = await InquiryModel.findOne({ requestId: req.params.requestId }).lean();
  res.json({
    count: await InquiryModel.countDocuments({ requestId: req.params.requestId }),
    id: record?._id.toString(),
    category: record?.category,
    status: record?.status,
    notificationStatus: record?.notificationStatus,
    samplerItems: record?.samplerItems,
  });
});
harness.get('/__test/mail', async (_req, res) => {
  const listing = await fetch('http://127.0.0.1:8025/api/v1/messages');
  if (!listing.ok) throw new Error('Local Mailpit unavailable');
  const body: { messages: { ID: string }[] } = await listing.json();
  const messages = await Promise.all(
    body.messages.map(async ({ ID }) => {
      const response = await fetch(
        `http://127.0.0.1:8025/api/v1/message/${encodeURIComponent(ID)}`,
      );
      if (!response.ok) throw new Error('Mailpit message unavailable');
      const mail: { Text: string; HTML: string } = await response.json();
      return `${mail.Text}\n${mail.HTML}`;
    }),
  );
  res.json(messages);
});
harness.post('/__test/stop-smtp', async (_req, res) => {
  // Stop only this repository's Compose service, never an arbitrary process/container.
  await promisify(execFile)('docker', ['compose', 'stop', 'mailpit']);
  // Wait until SMTP actually refuses connections, rather than merely assuming the signal worked.
  const { Socket } = await import('node:net');
  for (let attempt = 0; attempt < 30; attempt++) {
    const reachable = await new Promise<boolean>((resolve) => {
      const socket = new Socket();
      socket.setTimeout(100);
      socket.once('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.once('error', () => resolve(false));
      socket.once('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(1025, '127.0.0.1');
    });
    if (!reachable) {
      res.sendStatus(204);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Mailpit did not stop');
});
harness.use(app);
const server = harness.listen(4015, '127.0.0.1', () =>
  console.log('Member 5 HTTP browser harness ready'),
);
let stopping = false;
const stop = async () => {
  if (stopping) return;
  stopping = true;
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await promisify(execFile)('docker', ['compose', 'start', 'mailpit']);
  await mongoose.connection.dropDatabase();
  await disconnectDb();
  process.exit(0);
};
process.once('SIGTERM', () => void stop());
process.once('SIGINT', () => void stop());
