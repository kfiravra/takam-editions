// The catalogue of the home screen: a card per chapter, a strip per sub-chapter, a row per document.
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import type { DocumentEntry } from '../../shared/types';
import { TYPE_LABEL, editionLine } from './format';
import { chaptersOf } from './tree';
import type { ListedDocument } from './tree';

function DocumentRow({ document, child }: ListedDocument) {
  const address = `/document/${document.id}`;
  return (
    <li className={child ? 'row row--child' : 'row'}>
      <span className="row__number">{document.number}</span>
      <span className="row__title">
        {/* The link is stretched over the whole row (its ::after), so the whole row opens the document. */}
        <Link className="row__name" to={address}>
          {document.name}
        </Link>
        {/* An instruction is the rule, so only a message and a form are named. */}
        {document.type !== 'instruction' && <span className="badge">{TYPE_LABEL[document.type]}</span>}
      </span>
      <span className="row__edition meta">{editionLine(document.editions[0])}</span>
      {/* With one edition there is nothing to compare, so the link is not offered. */}
      {document.editions.length > 1 && (
        <Link className="changes" to={`${address}?tab=changes`}>
          מה השתנה
        </Link>
      )}
    </li>
  );
}

export function Catalogue({ documents }: { documents: DocumentEntry[] }) {
  return (
    <div className="catalogue">
      {chaptersOf(documents).map((chapter) => (
        // The ids are where the breadcrumb of a document leads: #c-1 for a chapter, #s-1.4 for a sub-chapter.
        <section key={chapter.number} className="card chapter" id={`c-${chapter.number}`}>
          <header className="chapter__head">
            <h2 className="chapter__title">
              <span className="chapter__number">{chapter.number}</span>
              {chapter.name}
            </h2>
            <span className="meta">{chapter.count === 1 ? 'מסמך אחד' : `${chapter.count} מסמכים`}</span>
          </header>
          {chapter.subChapters.map((subChapter) => (
            <Fragment key={subChapter.number}>
              <h3 className="strip" id={`s-${subChapter.number}`}>
                <span>{subChapter.number}</span>
                {subChapter.name}
              </h3>
              <ul>
                {subChapter.documents.map((listed) => (
                  <DocumentRow key={listed.document.id} {...listed} />
                ))}
              </ul>
            </Fragment>
          ))}
        </section>
      ))}
    </div>
  );
}
