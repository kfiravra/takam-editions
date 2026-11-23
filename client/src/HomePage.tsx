// The home screen: the catalogue of the sample, and beside it the documents that were updated last.
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { DocumentEntry } from '../../shared/types';
import { Catalogue } from './Catalogue';
import { editionLine } from './format';
import { recentlyUpdated } from './tree';

export function HomePage({ documents }: { documents: DocumentEntry[] }) {
  const { hash } = useLocation();

  // The breadcrumb of a document leads here with the id of a chapter or of a sub-chapter after the #.
  // The router changes the address without loading a page, so the browser does not scroll there on its own.
  // The ids hold dots (s-1.4), so the element is found by its id and not by a selector.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <>
      <h1>כל המסמכים</h1>
      <div className="home">
        <Catalogue documents={documents} />
        <aside className="card recent" aria-labelledby="recent-title">
          <h2 className="recent__title" id="recent-title">
            עודכנו לאחרונה
          </h2>
          <ul>
            {recentlyUpdated(documents).map((recent) => (
              <li key={recent.id} className="recent__item">
                {/* As in a row of the catalogue, the link is stretched over the whole item. */}
                <Link className="recent__name" to={`/document/${recent.id}`}>
                  <span className="recent__number">{recent.number}</span> {recent.name}
                </Link>
                <span className="recent__line meta">
                  {editionLine(recent.editions[0])}
                  {recent.editions.length > 1 && (
                    <Link className="changes" to={`/document/${recent.id}?tab=changes`}>
                      מה השתנה
                    </Link>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
