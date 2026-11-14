const WHITESPACE = /\s+/;

function firstLetter(word: string): string {
  // Array.from keeps a letter outside the basic plane in one piece.
  return (Array.from(word)[0] ?? "").toUpperCase();
}

/**
 * "Nadia Rahman" -> "NR". The first letters of the first and the last word;
 * one word gives one letter; no name gives "".
 */
export function initialsOf(name: string | null): string {
  const words = (name ?? "").trim().split(WHITESPACE).filter((word) => word !== "");
  if (words.length === 0) {
    return "";
  }
  const first = firstLetter(words[0]);
  if (words.length === 1) {
    return first;
  }
  return first + firstLetter(words[words.length - 1]);
}
