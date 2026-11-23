// The tree of the Takam beside a document: every chapter, its sub-chapters and their documents.
// It shows where the open document sits, and it is the way to its neighbours.
import { Link } from 'react-router-dom';
import type { DocumentEntry } from '../../shared/types';
import { TYPE_LABEL } from './format';
import { chaptersOf } from './tree';

export function SideTree({ documents, openId }: { documents: DocumentEntry[]; openId: string }) {
  return (
    <nav className="tree" aria-label="עץ המסמכים">
      <Link className="tree__row tree__home" to="/">
        כל המסמכים
      </Link>
      <ul>
        {chaptersOf(documents).map((chapter) => (
          <li key={chapter.number}>
            <p className="tree__chapter">
              {chapter.number} {chapter.name}
            </p>
            <ul>
              {chapter.subChapters.map((subChapter) => (
                <li key={subChapter.number}>
                  <p className="tree__sub">
                    {subChapter.number} {subChapter.name}
                  </p>
                  <ul>
                    {subChapter.documents.map(({ document, child }) => (
                      <li key={document.id}>
                        <Link
                          className={child ? 'tree__row tree__row--child' : 'tree__row'}
                          to={`/document/${document.id}`}
                          aria-current={document.id === openId ? 'page' : undefined}
                        >
                          {/* A message and a form can share a number, so the type word tells them apart. */}
                          {child && <span className="tree__type">{TYPE_LABEL[document.type]}</span>}
                          <span className="tree__number">{document.number}</span>
                          {document.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}
