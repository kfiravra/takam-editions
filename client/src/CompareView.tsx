// What changed between the latest edition of a document and an older one, paragraph by paragraph.
import { Fragment, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Block, CompareSummary, DocumentEntry } from '../../shared/types';
import { api, useRequest } from './api';
import { EditionPicker } from './EditionPicker';
import { errorText } from './format';

// Colour is never the only signal: every block that is not the same carries its word.
const KIND_WORD = {
  changed: 'שונה',
  added: 'נוסף',
  removed: 'הוסר',
} as const;

// The four counts are also the key to the colours of the list under them.
function Counts({ summary }: { summary: CompareSummary }) {
  return (
    <ul className="chips">
      <li className="chip chip--changed">
        <span>
          <b>{summary.changed}</b> פסקאות שונו
        </span>
      </li>
      <li className="chip chip--added">
        <span>
          <b>{summary.added}</b> נוספו
        </span>
      </li>
      <li className="chip chip--removed">
        <span>
          <b>{summary.removed}</b> הוסרו
        </span>
      </li>
      <li className="chip">
        <span>
          <b>{summary.same}</b> לא השתנו
        </span>
      </li>
    </ul>
  );
}

function BlockRow({ block }: { block: Block }) {
  return (
    <p className={`block block--${block.kind}`}>
      {block.kind !== 'same' && <span className={`block__kind badge badge--${block.kind}`}>{KIND_WORD[block.kind]}</span>}
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
export function CompareView({ document }: { document: DocumentEntry }) {
  const [query] = useSearchParams();
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
      {/* The row that chooses the edition stays in every state, so a failed comparison can be replaced by another. */}
      <div className="pick">
        <span className="pick__words">מה השתנה במהדורה {latest.number} לעומת</span>
        <EditionPicker editions={older} chosen={from.number} to={(pill) => `?tab=changes&from=${pill.number}`} />
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
          <div className="summary">
            <Counts summary={data.summary} />
            <label className="check">
              <input type="checkbox" checked={showSame} onChange={(event) => setShowSame(event.target.checked)} />
              להציג גם פסקאות שלא השתנו
            </label>
          </div>
          <p className="caption">ההשוואה היא של נוסח הסעיפים. סעיף שרק מספרו השתנה לא נחשב שינוי.</p>
          <div className="blocks">
            {/* The index of a block in the whole comparison is its key, so the checkbox never reorders the list. */}
            {data.blocks.map((block, index) => (showSame || block.kind !== 'same') && <BlockRow key={index} block={block} />)}
          </div>
        </>
      )}
    </>
  );
}
