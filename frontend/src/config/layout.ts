// The phone layout, written as in every stylesheet (architecture.md,
// "Tokens and styles"). CSS cannot read a variable in a media query, so each
// module stylesheet writes "@media " + this value; the style check (rule i)
// fails when a stylesheet line differs from it.
export const PHONE_LAYOUT_QUERY = "(max-width: 767.98px)";
