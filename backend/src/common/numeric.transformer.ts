// TypeORM returns `numeric`/`decimal` columns as strings to preserve precision.
// This transformer parses them back to JS numbers on read.
export const numericTransformer = {
  to: (value?: number | null): number | null | undefined => value,
  from: (value?: string | null): number | null | undefined =>
    value === null || value === undefined ? value : Number(value),
};
