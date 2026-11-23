// What changed between the latest edition of a document and an older one, paragraph by paragraph.
import { Fragment, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Block, CompareSummary, DocumentDetail } from '../../shared/types';
import { api, useRequest } from './api';
import { errorText, formatDate } from './format';

// Colour is never the only signal: every block that is not the same carries its word.
const KIND_WORD = {
  changed: 'שונה',
  added: 'נוסף',
  removed: 'הוסר',
} as const;

function Counts({ summary }: { summary: CompareSummary }) {
  return (
    <ul className="counts">
      <li className="counts__item counts__item--changed">
        <b>{summary.changed}</b> פסקאות שונו
      </li>
      <li className="counts__item counts__item--added">
        <b>{summary.added}</b> נוספו
      </li>
      <li className="counts__item counts__item--removed">
        <b>{summary.removed}</b> הוסרו
      </li>
      <li className="counts__item">
        <b>{summary.same}</b> לא השתנו
      </li>
    </ul>
  );
}

function BlockRow({ block }: { block: Block }) {
  return (
    <p className={`block block--${block.kind}`}>
      {block.kind !== 'same' && <span className="block__kind">{KIND_WORD[block.kind]}</span>}
      {block.label && <span className="block__label">{block.label}</span>}
      <span className="block__text">
        {block.kind !== 'changed'
          ? block.text
          : block.words.map((part, index) => (
              // One space between two parts, outside <del> and <ins>, so a mark never swallows it.
              <Fragment key={index}>
                {index > 0 && ' '}
                {part.kind === 'removed' ? <del>{part.text}</del> : part.kind === 'added' ? <ins>{part.text}</ins> : part.text}
              </Fragment>
            ))}
      </span>
    </p>
  );
}

// The page shows this view only for a document with two editions or more.
export function CompareView({ document }: { document: DocumentDetail }) {
  const [query] = useSearchParams();
  const navigate = useNavigate();
  // A display preference, not a place: it stays out of the address.
  const [showSame, setShowSame] = useState(false);

  const [latest, ...older] = document.editions;
  // ?from=N chooses the older edition. Without it, or with a number that is not an older edition, it is the one
  // before the latest.
  const requested = Number(query.get('from'));
  const from = older.find((edition) => edition.number === requested) ?? older[0];

  const { data, error } = useRequest(`compare ${document.id} ${from.number} ${latest.number}`, () =>
    api.compare(document.id, from.number, latest.number),
  );
  const changes = data ? data.summary.changed + data.summary.added + data.summary.removed : 0;

  return (
    <>
      {/* The line that chooses the edition stays in every state, so a failed comparison can be replaced by another. */}
      <div className="pick">
        <label htmlFor="compare-from">
          משווים את מהדורה {latest.number} מיום {formatDate(latest.validFrom)} מול
        </label>
        <select
          id="compare-from"
          value={from.number}
          onChange={(event) => navigate(`?tab=changes&from=${event.target.value}`)}
        >
          {older.map((edition) => (
            <option key={edition.number} value={edition.number}>
              מהדורה {edition.number} מיום {formatDate(edition.validFrom)}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="note" role="alert">
          {errorText(error)}
        </p>
      ) : !data ? (
        <p className="note" role="status">
          משווה בין המהדורות…
        </p>
      ) : changes === 0 ? (
        <p className="note">אין הבדלים בטקסט בין שתי המהדורות.</p>
      ) : (
        <>
          <Counts summary={data.summary} />
          <label className="check">
            <input type="checkbox" checked={showSame} onChange={(event) => setShowSame(event.target.checked)} />
            להציג גם פסקאות שלא השתנו
          </label>
          <p className="compare__about">ההשוואה היא של נוסח הסעיפים. סעיף שרק מספרו השתנה לא נחשב שינוי.</p>
          <div className="blocks">
            {/* The index of a block in the whole comparison is its key, so the checkbox never reorders the list. */}
            {data.blocks.map((block, index) => (showSame || block.kind !== 'same') && <BlockRow key={index} block={block} />)}
          </div>
        </>
      )}
    </>
  );
}
