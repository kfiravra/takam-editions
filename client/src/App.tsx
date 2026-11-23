// The frame of every screen: the top bar, and the route that fills the page under it.
import { Link, Route, Routes } from 'react-router-dom';
import { HomePage } from './HomePage';

const TAKAM_SITE = 'https://takam.mof.gov.il';

export function App() {
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
            מה השתנה בתכ"ם
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
          <Route path="*" element={<p className="note">הדף לא נמצא.</p>} />
        </Routes>
      </main>
    </>
  );
}
