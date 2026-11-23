// The entry of the client: the typeface, the styles, and the app inside a router.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// The typeface is bundled with the app, so no request leaves for a font server.
// Only the Hebrew and the Latin subsets (the digits are Latin), in the three weights the look uses.
import '@fontsource/ibm-plex-sans-hebrew/hebrew-400.css';
import '@fontsource/ibm-plex-sans-hebrew/hebrew-500.css';
import '@fontsource/ibm-plex-sans-hebrew/hebrew-600.css';
import '@fontsource/ibm-plex-sans-hebrew/latin-400.css';
import '@fontsource/ibm-plex-sans-hebrew/latin-500.css';
import '@fontsource/ibm-plex-sans-hebrew/latin-600.css';
import './styles.css';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('index.html has no #root element');

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
