import { loadConfig } from './config.js';
import { createPool } from './db.js';
import { runMigrations } from './migrations.js';
import { createServer } from './server.js';

const config = loadConfig();
const pool = createPool(config);

await runMigrations(pool);

const app = createServer({ config, pool });

app.listen(config.port, () => {
  console.log(`payment-bridge listening on ${config.port}`);
});
