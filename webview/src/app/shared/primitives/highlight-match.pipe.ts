import { Pipe, PipeTransform } from '@angular/core';

export interface MatchSegment {
  text: string;
  match: boolean;
}

@Pipe({ name: 'highlightMatch', standalone: true, pure: true })
export class HighlightMatchPipe implements PipeTransform {
  transform(text: string, ranges: [number, number][]): MatchSegment[] {
    if (!text || !ranges.length) return [{ text, match: false }];

    const segments: MatchSegment[] = [];
    let cursor = 0;

    for (const [start, end] of ranges) {
      if (start > cursor) segments.push({ text: text.slice(cursor, start), match: false });
      segments.push({ text: text.slice(start, end + 1), match: true });
      cursor = end + 1;
    }

    if (cursor < text.length) segments.push({ text: text.slice(cursor), match: false });
    return segments;
  }
}
