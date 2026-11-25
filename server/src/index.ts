import { createApp } from './app.js';
import { HOST, PORT, DATA_DIR, DB_PATH, NESTLY_PASSWORD, STATIC_DIR } from './config.js';
import { getDb } from './db.js';

getDb();
const app = createApp();

app.listen(PORT, HOST, () => {
  console.log(`Nestly API listening on http://${HOST}:${PORT}`);
  console.log(`DATA_DIR=${DATA_DIR}`);
  console.log(`DB_PATH=${DB_PATH}`);
  console.log(`STATIC_DIR=${STATIC_DIR}`);
  console.log(
    NESTLY_PASSWORD
      ? 'Auth: NESTLY_PASSWORD is set (Bearer required)'
      : 'Auth: open (set NESTLY_PASSWORD to require a shared password)',
  );
});
