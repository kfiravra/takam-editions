// Reading an edition inside the page: its PDF, drawn by the browser's own viewer, and the way to its other editions.
import { Link } from 'react-router-dom';
import type { DocumentEntry, Edition } from '../../shared/types';
import { api } from './api';
import { EditionPicker } from './EditionPicker';
import { formatDate } from './format';

export function ReadView({ document, edition }: { document: DocumentEntry; edition: Edition }) {
  const [latest] = document.editions;
  // The address without a query shows the edition in force.
  const inForce = `/document/${document.id}`;
  const pdf = api.fileUrl(document.id, edition.number, 'pdf');
  // What follows the # is for the viewer: fit the width of the frame, and hide the viewer's own side panel.
  const address = `${pdf}#view=FitH&navpanes=0`;

  return (
    <>
      {/* Both actions name or open the edition on the screen, which is not always the one in force. */}
      <div className="actions">
        <a className="button" href={api.fileUrl(document.id, edition.number, 'docx')} download>
          הורדת Word, מהדורה {edition.number}
        </a>
        {/* Not every mobile browser shows a PDF inside a page, so the same file also opens alone. */}
        <a className="button button--quiet" href={pdf} target="_blank" rel="noreferrer">
          פתיחת המסמך בלשונית נפרדת
        </a>
      </div>
      <EditionPicker
        editions={document.editions}
        chosen={edition.number}
        inForce={latest.number}
        to={(pill) => (pill.number === latest.number ? inForce : `?edition=${pill.number}`)}
      />
      {edition.number !== latest.number && (
        <p className="banner">
          זו מהדורה {edition.number} מיום {formatDate(edition.validFrom)}, לא המהדורה שבתוקף.
          <Link className="banner__link" to={inForce}>
            למהדורה שבתוקף
          </Link>
        </p>
      )}
      {/* An iframe whose src changes adds a step to the history of the browser.
          The key makes a new frame for every edition, so the back button stays on the page. */}
      <iframe key={address} className="reader" src={address} title={`${document.name}, מהדורה ${edition.number}`} />
    </>
  );
}
