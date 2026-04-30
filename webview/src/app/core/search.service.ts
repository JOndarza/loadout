import { Injectable } from '@angular/core';
import uFuzzy from '@leeoniya/ufuzzy';

const uf = new uFuzzy({ intraMode: 1, intraIns: 1 });

export interface ParsedQuery {
  fuzzy: string;
  type?: 'agents' | 'skills' | 'commands';
  active?: boolean;
  tokGt?: number;
}

const TOKEN_RE = /(?:type:(agents?|skills?|commands?))|(?:active:(true|false))|(?:tok>(\d+))/gi;

@Injectable({ providedIn: 'root' })
export class SearchService {
  parseQuery(raw: string): ParsedQuery {
    const result: ParsedQuery = { fuzzy: raw };
    result.fuzzy = raw.replace(TOKEN_RE, (_, t, a, tok) => {
      if (t) {
        const v = t.toLowerCase();
        result.type = v.startsWith('agent') ? 'agents' : v.startsWith('skill') ? 'skills' : 'commands';
      }
      if (a !== undefined) result.active = a === 'true';
      if (tok !== undefined) result.tokGt = parseInt(tok, 10);
      return '';
    }).trim();
    return result;
  }

  fuzzyFilter<T>(items: T[], getHaystack: (item: T) => string, query: string): T[] {
    if (!query) return items;
    const haystack = items.map(getHaystack);
    const result = uf.search(haystack, query);
    if (!result) return [];
    const [idxs] = result;
    if (!idxs || idxs.length === 0) return [];
    return idxs.map((i) => items[i]);
  }

  getMatchRanges(text: string, query: string): [number, number][] {
    if (!query || !text) return [];
    const idxs = uf.filter([text], query);
    if (!idxs || idxs.length === 0) return [];
    const info = uf.info(idxs, [text], query);
    if (!info || !info.ranges) return [];
    const raw = info.ranges[0];
    if (!raw || raw.length === 0) return [];
    const pairs: [number, number][] = [];
    for (let i = 0; i < raw.length; i += 2) pairs.push([raw[i], raw[i + 1]]);
    return pairs;
  }
}
