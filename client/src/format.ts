// The words and the formats the screens share.
import type { DocType } from '../../shared/types';

export const TYPE_LABEL: Record<DocType, string> = {
  instruction: 'הוראה',
  message: 'הודעה',
  form: 'טופס',
};

export const LOADING = 'טוען…';

// 2024-09-19 becomes 19.09.2024, as the directives write dates.
// The text is cut and never parsed as a date, so a time zone cannot move it by a day.
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}

// Compares two Takam numbers part by part, so 1.4.10 comes after 1.4.3.
export function byNumber(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true });
}

// The server sends an error as a code; the sentences are written here.
export function errorText(code: string): string {
  switch (code) {
    case 'document_not_found':
      return 'המסמך לא נמצא במדגם.';
    case 'edition_not_found':
      return 'המהדורה לא נמצאת במדגם.';
    case 'file_unreadable':
      return 'הטקסט של אחת המהדורות חסר, ולכן אין השוואה. אפשר לקרוא כל מהדורה בנפרד.';
    default:
      return 'השרת לא ענה. נסו לרענן את הדף.';
  }
}
