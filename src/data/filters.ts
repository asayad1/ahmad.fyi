// The curated subset of project tags that appear as toggleable filter chips
// above the projects carousel. Projects carry many tags (Python, PyTorch, …);
// only the ones listed here are filterable, in this display order.
//
// To add a filter, add a tag here whose exact string also appears in some
// project's `tags` array in projects.json. A chip only renders if at least one
// project actually uses it, so listing an unused tag is harmless.
export const FILTERABLE_TAGS: string[] = [
  "From Scratch",
  "Research",
  "LLMs",
  "Generative Models",
  "Agentic AI",
  "Reinforcement Learning",
  "Computer Vision",
];

// The curated set of note tags that appear as toggleable filter chips above
// the notes carousel, in this display order. Unlike the project chips, these
// render even when no note uses them yet — e.g. "Generative Models" is kept
// as a placeholder category for future notes.
export const NOTES_FILTERABLE_TAGS: string[] = [
  "Deep Learning",
  "Generative Models",
];
