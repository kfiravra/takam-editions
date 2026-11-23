// Reading an edition inside the page: its PDF, drawn by the browser's own viewer.
import type { DocumentDetail, Edition } from '../../shared/types';
import { api } from './api';
import { formatDate } from './format';

export function ReadView({ document, edition }: { document: DocumentDetail; edition: Edition }) {
  const pdf = api.fileUrl(document.id, edition.number, 'pdf');
  // What follows the # is for the viewer: fit the width of the frame, and hide the viewer's own side panel.
  const address = `${pdf}#view=FitH&navpanes=0`;
  const isLatest = edition.number === document.editions[0].number;

  return (
    <>
      {!isLatest && (
        <p className="note note--mark">
          זו מהדורה {edition.number} מיום {formatDate(edition.validFrom)}, לא המהדורה שבתוקף.
        </p>
      )}
      {/* An iframe whose src changes adds a step to the history of the browser.
          The key makes a new frame for every edition, so the back button stays on the page. */}
      <iframe key={address} className="reader" src={address} title={`${document.name}, מהדורה ${edition.number}`} />
      {/* Not every mobile browser shows a PDF inside a page, so the same file also opens alone. */}
      <a className="link reader__alone" href={pdf} target="_blank" rel="noreferrer">
        פתיחת המסמך בלשונית נפרדת
      </a>
    </>
  );
}
