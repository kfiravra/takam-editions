// The editions of a document as a row of pills. A pill is a link, so the chosen edition lives in the address.
import { Link } from 'react-router-dom';
import type { Edition } from '../../shared/types';
import { formatDate } from './format';

interface Props {
  editions: Edition[];
  chosen: number; // the number of the edition the screen shows now
  inForce?: number; // the number of the latest edition, when it is among the pills: it carries the badge
  to: (edition: Edition) => string; // where a pill leads
}

export function EditionPicker({ editions, chosen, inForce, to }: Props) {
  return (
    <ul className="picker" aria-label="מהדורות">
      {editions.map((edition) => (
        <li key={edition.number}>
          <Link className="picker__pill" to={to(edition)} aria-current={edition.number === chosen ? 'true' : undefined}>
            <span className="picker__name">מהדורה {edition.number}</span>
            <span className="picker__date">{formatDate(edition.validFrom)}</span>
            {edition.number === inForce && <span className="badge badge--added">בתוקף</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
