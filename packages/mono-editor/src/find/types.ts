export interface FindMatch {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface FindOptions {
  matchCase: boolean;
  wholeWord: boolean;
  regex: boolean;
}

export interface FindState {
  isRevealed: boolean;
  isReplaceRevealed: boolean;
  searchString: string;
  replaceString: string;
  options: FindOptions;
  matches: FindMatch[];
  /** 0-based index into matches; -1 if none */
  currentIndex: number;
}

export const DEFAULT_FIND_OPTIONS: FindOptions = {
  matchCase: false,
  wholeWord: false,
  regex: false,
};
