// The side panel of a document: its editions, and the documents that belong with it.
import { Link } from 'react-router-dom';
import type { DocumentDetail, DocumentEntry } from '../../shared/types';
import { api } from './api';
import { TYPE_LABEL, formatDate } from './format';

function RelatedRow({ document }: { document: DocumentEntry }) {
  return (
    <li className="related">
      <Link className="link related__link" to={`/document/${document.id}`}>
        {TYPE_LABEL[document.type]} {document.number}
      </Link>
      <span className="related__name">{document.name}</span>
    </li>
  );
}

// `reading` is the number of the edition on the screen. The changes view reads none, so it marks none.
export function SidePanel({ document, reading }: { document: DocumentDetail; reading?: number }) {
  return (
    <aside className="panel">
      <section>
        <h2>מהדורות</h2>
        <ul>
          {document.editions.map((edition) => (
            <li key={edition.number} className="edition">
              <Link
                className="link edition__link"
                to={`?edition=${edition.number}`}
                aria-current={edition.number === reading ? 'true' : undefined}
              >
                מהדורה {edition.number}
              </Link>
              <span className="edition__date">{formatDate(edition.validFrom)}</span>
              <a className="link edition__word" href={api.fileUrl(document.id, edition.number, 'docx')} download>
                הורדת Word
              </a>
            </li>
          ))}
        </ul>
        <p className="panel__note">במדגם נשמרות עד שלוש המהדורות האחרונות של כל מסמך.</p>
      </section>

      {/* A message or a form points at its instruction; an instruction lists its messages and forms. */}
      {document.parent && (
        <section>
          <h2>שייך להוראה</h2>
          <ul>
            <RelatedRow document={document.parent} />
          </ul>
        </section>
      )}
      {document.children.length > 0 && (
        <section>
          <h2>הודעות וטפסים של ההוראה</h2>
          <ul>
            {document.children.map((child) => (
              <RelatedRow key={child.id} document={child} />
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
