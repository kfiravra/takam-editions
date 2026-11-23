// The frame of every screen: the top bar, and the route that fills the page under it.
import { useEffect } from 'react';
import { Link, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { DocumentPage } from './DocumentPage';
import { APP_NAME } from './format';
import { HomePage } from './HomePage';

const TAKAM_SITE = 'https://takam.mof.gov.il';

export function App() {
  const { pathname } = useLocation();
  const navigation = useNavigationType();

  // The router keeps the scroll position when the page changes, so a document would open half way down.
  // A new page starts at its top; going back is left to the browser, which returns to where the reader was.
  useEffect(() => {
    if (navigation !== 'POP') window.scrollTo(0, 0);
  }, [pathname, navigation]);

  return (
    <>
      <header className="topbar">
        <div className="wrap topbar__bar">
          <Link className="topbar__name" to="/">
            {/* Three lines, each shorter than the one before: a text that was cut down between editions. */}
            <svg className="topbar__mark flip" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="2" y="3" width="20" height="4.5" rx="1" />
              <rect x="2" y="9.75" width="14" height="4.5" rx="1" />
              <rect x="2" y="16.5" width="8" height="4.5" rx="1" />
            </svg>
            {APP_NAME}
          </Link>
          <a className="topbar__site" href={TAKAM_SITE} target="_blank" rel="noreferrer">
            לאתר הוראות תכ"ם
            <svg className="icon flip" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M4 2.5h5.5V8M9.5 2.5 2.5 9.5" />
            </svg>
          </a>
        </div>
      </header>
      <main className="wrap page">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/document/:id" element={<DocumentPage />} />
          <Route path="*" element={<p className="note">הדף לא נמצא.</p>} />
        </Routes>
      </main>
    </>
  );
}
