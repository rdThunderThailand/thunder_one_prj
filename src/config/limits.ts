// Field limits for the publication wizard. Kept here so the counter, the
// validation message and any future server-side check read one number.
export const PUBLICATION_LIMITS = {
  nameMaxLength: 100,
  descriptionMaxLength: 300,
} as const;
