// The page of one document: the tree of the Takam beside it, where it sits, its title, and one of its two views.
import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import type { DocumentEntry } from '../../shared/types';
import { CompareView } from './CompareView';
import { APP_NAME, TYPE_LABEL, errorText, formatDate } from './format';
import { ReadView } from './ReadView';
import { SideTree } from './SideTree';
import { chapterNumber, subChapterNumber } from './tree';

export function DocumentPage({ documents }: { documents: DocumentEntry[] }) {
  const { id = '' } = useParams();
  const [query] = useSearchParams();
  // The list that App loaded holds everything the page shows, so the document is found in it and not asked for.
  const entry = documents.find((candidate) => candidate.id === id);

  // The tab of the browser names the document, and goes back to the name of the app when the page is left.
  useEffect(() => {
    if (!entry) return;
    document.title = `${entry.number} ${entry.name} | ${APP_NAME}`;
    return () => {
      document.title = APP_NAME;
    };
  }, [entry]);

  if (!entry) {
    return (
      <div className="docpage">
        <SideTree documents={documents} openId={id} />
        <div className="doc">
          <p className="note" role="alert">
            {errorText('document_not_found')}
          </p>
          <p className="back">
            <Link className="button" to="/">
              חזרה לרשימת המסמכים
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // What the page shows lives in its address, so a view can be sent as a link and the back button works.
  const showsChanges = query.get('tab') === 'changes';
  const [latest] = entry.editions;
  // ?edition=N chooses the edition to read. Without it, or with a number the sample does not hold, it is the latest.
  const requested = Number(query.get('edition'));
  const edition = entry.editions.find((candidate) => candidate.number === requested) ?? latest;
  const chapter = chapterNumber(entry);
  const subChapter = subChapterNumber(entry);

  return (
    <div className="docpage">
      <SideTree documents={documents} openId={entry.id} />
      <article className="doc">
        {/* The way up the tree. The two last links land on the home screen, at the card or at the strip. */}
        <nav aria-label="מיקום המסמך">
          <ol className="crumbs">
            <li>
              <Link to="/">כל המסמכים</Link>
            </li>
            <li>
              <Link to={`/#c-${chapter}`}>
                {chapter} {entry.chapter}
              </Link>
            </li>
            <li>
              <Link to={`/#s-${subChapter}`}>
                {subChapter} {entry.subChapter}
              </Link>
            </li>
          </ol>
        </nav>
        <h1>
          <span className="doc__number">{entry.number}</span> {entry.name}
        </h1>
        {/* The meta line always names the edition in force, also while an older one is read. */}
        <p className="doc__meta">
          {TYPE_LABEL[entry.type]}, מהדורה {latest.number}, בתוקף מיום {formatDate(latest.validFrom)}
        </p>

        {/* Row A is the view switch and, in the reading view, its two actions. Every other part of a view
            takes a row of its own under it. */}
        <div className="doc__body">
          <nav className="switch" aria-label="תצוגות המסמך">
            <Link className="switch__link" to={`/document/${entry.id}`} aria-current={showsChanges ? undefined : 'page'}>
              קריאה
            </Link>
            <Link className="switch__link" to="?tab=changes" aria-current={showsChanges ? 'page' : undefined}>
              מה השתנה
            </Link>
          </nav>
          {!showsChanges ? (
            <ReadView document={entry} edition={edition} />
          ) : entry.editions.length > 1 ? (
            <CompareView document={entry} />
          ) : (
            <p className="note">למסמך הזה יש במדגם מהדורה אחת, אז אין עם מה להשוות.</p>
          )}
        </div>
      </article>
    </div>
  );
}
