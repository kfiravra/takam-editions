// The home screen: what was updated lately, and the documents of the sample chapter by chapter.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { DocumentEntry } from '../../shared/types';
import { api, useRequest } from './api';
import { LOADING, TYPE_LABEL, byNumber, errorText, formatDate } from './format';

const RECENT_COUNT = 5;

interface Chapter {
  number: string;
  name: string;
  documents: DocumentEntry[];
}

interface ListedDocument {
  document: DocumentEntry;
  child: boolean; // a message or a form, listed under its instruction
}

// The newest edition is the first one of a document, and a date written as YYYY-MM-DD sorts as text.
function recentlyUpdated(documents: DocumentEntry[]): DocumentEntry[] {
  return [...documents]
    .sort((a, b) => b.editions[0].validFrom.localeCompare(a.editions[0].validFrom))
    .slice(0, RECENT_COUNT);
}

// The number of a chapter is the first part of the number of its documents: 7.3.3 belongs to chapter 7.
function chaptersOf(documents: DocumentEntry[]): Chapter[] {
  const chapters = new Map<string, Chapter>();
  for (const document of documents) {
    const number = document.number.split('.')[0];
    const chapter = chapters.get(number) ?? { number, name: document.chapter, documents: [] };
    chapter.documents.push(document);
    chapters.set(number, chapter);
  }
  return [...chapters.values()].sort((a, b) => byNumber(a.number, b.number));
}

// Instructions by number, each followed by its messages and forms.
// The sort is stable, so a message and a form that share a number keep the order of the manifest.
function inReadingOrder(documents: DocumentEntry[]): ListedDocument[] {
  const sorted = [...documents].sort((a, b) => byNumber(a.number, b.number));
  const ids = new Set(documents.map((document) => document.id));
  // A document whose instruction is not in the list stands on its own.
  const standsAlone = (document: DocumentEntry) => document.parentId === null || !ids.has(document.parentId);
  return sorted.filter(standsAlone).flatMap((parent) => [
    { document: parent, child: false },
    ...sorted.filter((document) => document.parentId === parent.id).map((document) => ({ document, child: true })),
  ]);
}

function DocumentRow({ document, child = false }: { document: DocumentEntry; child?: boolean }) {
  const latest = document.editions[0];
  const address = `/document/${document.id}`;
  return (
    <li className={child ? 'row row--child' : 'row'}>
      <span className="row__number">{document.number}</span>
      <Link className="row__name link" to={address}>
        {document.name}
      </Link>
      <span className="row__type">{TYPE_LABEL[document.type]}</span>
      <span className="row__edition">
        מהדורה {latest.number} מיום {formatDate(latest.validFrom)}
      </span>
      {/* With one edition there is nothing to compare, so the link is not offered. */}
      {document.editions.length > 1 && (
        <Link className="row__changes link link--go" to={`${address}?tab=changes`}>
          מה השתנה
          <svg className="arrow flip" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M1.5 6h8.5M6.5 2.5 10 6l-3.5 3.5" />
          </svg>
        </Link>
      )}
    </li>
  );
}

export function HomePage() {
  const { data: documents, error } = useRequest('documents', api.documents);
  const [chosenChapter, setChosenChapter] = useState<string | null>(null);

  const chapters = documents ? chaptersOf(documents) : [];
  // One chapter is always open: the first one, until the user chooses another.
  const openChapter = chapters.find((chapter) => chapter.number === chosenChapter) ?? chapters[0];

  return (
    <>
      <header className="intro">
        <h1>מה השתנה בהוראות תכ"ם</h1>
        <p className="lead">
          כאן קוראים הוראה בלי להוריד קובץ, ורואים בדיוק מה השתנה בין מהדורה למהדורה.
          {documents && ` במדגם ${documents.length} מסמכים מתוך ${chapters.length} פרקים.`}
        </p>
      </header>

      {!documents ? (
        <p className="note" role={error ? 'alert' : 'status'}>
          {error ? errorText(error) : LOADING}
        </p>
      ) : (
        <>
          <section className="section" aria-labelledby="recent-title">
            <h2 id="recent-title">עודכנו לאחרונה</h2>
            <ul className="rows">
              {recentlyUpdated(documents).map((document) => (
                <DocumentRow key={document.id} document={document} />
              ))}
            </ul>
          </section>

          <section className="section" aria-labelledby="chapters-title">
            <h2 id="chapters-title">פרקים במדגם</h2>
            <div className="tiles">
              {chapters.map((chapter) => (
                <button
                  key={chapter.number}
                  type="button"
                  className="tile"
                  aria-pressed={chapter === openChapter}
                  onClick={() => setChosenChapter(chapter.number)}
                >
                  <span className="tile__number">{chapter.number}</span>
                  <span className="tile__name">{chapter.name}</span>
                  <span className="tile__count">
                    {chapter.documents.length === 1 ? 'מסמך אחד' : `${chapter.documents.length} מסמכים`}
                  </span>
                </button>
              ))}
            </div>
            {openChapter && (
              <ul className="rows" aria-label={openChapter.name}>
                {inReadingOrder(openChapter.documents).map(({ document, child }) => (
                  <DocumentRow key={document.id} document={document} child={child} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
