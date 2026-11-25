import { createApp } from './app.js';
import {
  HOST,
  PORT,
  DATA_DIR,
  DB_PATH,
  NESTLY_PASSWORD,
  NESTLY_ADMIN_USER,
  NESTLY_ADMIN_PASSWORD,
  STATIC_DIR,
} from './config.js';
import { getDb } from './db.js';
import { getAuthMode } from './auth.js';
import { bootstrapAdminFromEnv, purgeExpiredSessions } from './users.js';

getDb();
purgeExpiredSessions();

const bootstrapped = bootstrapAdminFromEnv(NESTLY_ADMIN_USER, NESTLY_ADMIN_PASSWORD);
if (bootstrapped) {
  console.log(`Auth: bootstrap admin "${bootstrapped.username}" created from env`);
}

const app = createApp();

app.listen(PORT, HOST, () => {
  console.log(`Nestly API listening on http://${HOST}:${PORT}`);
  console.log(`DATA_DIR=${DATA_DIR}`);
  console.log(`DB_PATH=${DB_PATH}`);
  console.log(`STATIC_DIR=${STATIC_DIR}`);
  const mode = getAuthMode();
  if (mode === 'users') {
    console.log('Auth: household users (login required)');
  } else if (mode === 'shared_password') {
    console.log('Auth: legacy NESTLY_PASSWORD (Bearer required)');
  } else {
    console.log(
      'Auth: setup required — set NESTLY_ADMIN_USER/NESTLY_ADMIN_PASSWORD or open the app once',
    );
  }
  if (NESTLY_PASSWORD && mode === 'users') {
    console.log('Auth: legacy NESTLY_PASSWORD still accepted alongside sessions');
  }
});
