// Starts the server: the settings, the catalogue, the app, the port.
import { createApp } from './app';
import { loadCatalog } from './catalog';
import { config } from './config';

const catalog = loadCatalog(config.dataDir);
// After `npm run build` the same port serves the client too.
const app = createApp(catalog, 'client/dist');

app.listen(config.port, (error) => {
  // Express 5 hands a listen error (a taken port) to this callback and does not throw it.
  // Without the throw, the line below would announce a server that is not there.
  if (error) throw error;
  console.log(`takam-editions is listening on http://localhost:${config.port} with ${catalog.documents.length} documents`);
});
