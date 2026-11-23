// The page of one document: where it sits in the Takam, its title, and the reading view next to the side panel.
import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api, useRequest } from './api';
import { APP_NAME, LOADING, TYPE_LABEL, errorText, formatDate } from './format';
import { ReadView } from './ReadView';
import { SidePanel } from './SidePanel';

export function DocumentPage() {
  const { id = '' } = useParams();
  const [query] = useSearchParams();
  const { data: detail, error } = useRequest(`document ${id}`, () => api.document(id));

  // The tab of the browser names the document, and goes back to the name of the app when the page is left.
  useEffect(() => {
    if (!detail) return;
    document.title = `${detail.number} ${detail.name} | ${APP_NAME}`;
    return () => {
      document.title = APP_NAME;
    };
  }, [detail]);

  if (error) {
    return (
      <>
        <p className="note" role="alert">
          {errorText(error)}
        </p>
        <p className="back">
          <Link className="link" to="/">
            חזרה לרשימת המסמכים
          </Link>
        </p>
      </>
    );
  }

  if (!detail) {
    return (
      <p className="note" role="status">
        {LOADING}
      </p>
    );
  }

  const latest = detail.editions[0];
  // ?edition=N chooses the edition to read. Without it, or with a number the sample does not hold, it is the latest.
  const requested = Number(query.get('edition'));
  const edition = detail.editions.find((candidate) => candidate.number === requested) ?? latest;

  return (
    <article className="doc">
      <p className="doc__path">
        <Link className="link" to="/">
          כל המסמכים
        </Link>{' '}
        / {detail.chapter} / {detail.subChapter}
      </p>
      <h1>
        <span className="doc__number">{detail.number}</span> {detail.name}
      </h1>
      {/* The meta line always names the edition in force, also while an older one is read. */}
      <p className="doc__meta">
        {TYPE_LABEL[detail.type]}, מהדורה {latest.number}, בתוקף מיום {formatDate(latest.validFrom)}
      </p>

      <div className="doc__layout">
        <div className="doc__view">
          <ReadView document={detail} edition={edition} />
        </div>
        <SidePanel document={detail} reading={edition.number} />
      </div>
    </article>
  );
}
