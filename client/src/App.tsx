// The frame of every screen: the top bar, the list of documents that both pages read, and the page under the bar.
import { useEffect } from 'react';
import { Link, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { api, useRequest } from './api';
import { DocumentPage } from './DocumentPage';
import { APP_NAME, LOADING, errorText } from './format';
import { HomePage } from './HomePage';

export function App() {
  const { pathname, hash } = useLocation();
  const navigation = useNavigationType();
  // One request serves the whole app: the home screen lists the documents, and the page of a document finds
  // its document and the neighbours of it in the same list.
  const { data: documents, error } = useRequest('documents', api.documents);

  // The router keeps the scroll position when the page changes, so a document would open half way down.
  // A new page starts at its top, with two exceptions: going back, where the browser returns to where the
  // reader was, and an address with a hash, where the home screen scrolls to the place the hash names.
  useEffect(() => {
    if (navigation !== 'POP' && !hash) window.scrollTo(0, 0);
  }, [pathname, hash, navigation]);

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
        </div>
      </header>
      <main className="wrap page">
        {documents ? (
          <Routes>
            <Route path="/" element={<HomePage documents={documents} />} />
            <Route path="/document/:id" element={<DocumentPage documents={documents} />} />
            <Route path="*" element={<p className="note">הדף לא נמצא.</p>} />
          </Routes>
        ) : (
          // Every page needs the list, so until it arrives, or when it fails, a note stands in place of the page.
          <p className="note" role={error ? 'alert' : 'status'}>
            {error ? errorText(error) : LOADING}
          </p>
        )}
      </main>
    </>
  );
}
