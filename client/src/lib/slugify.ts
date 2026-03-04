export function slugify(input?: string | null) {
  if (!input) return "";

  var slug = input.toLowerCase().trim();

  // Strip character accents
  slug = slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Replace invalid chars with spaces
  slug = slug.replace(/[^a-z0-9\s-]/g, " ").trim();

  // Replace multiple spaces or hyphens with a single hyphen
  slug = slug.replace(/[\s-]+/g, "-");

  // Trim leading and trailing hyphens
  slug = slug.replace(/^-+|-+$/g, "");

  return slug;
}
