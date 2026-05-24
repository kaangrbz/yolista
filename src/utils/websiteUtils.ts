const WEBSITE_DELIMITERS_REGEX = /[,\n;]+/;

export const parseWebsiteInput = (websiteInput: string | null | undefined): string[] => {
  if (!websiteInput) {
    return [];
  }

  const normalizedInput = websiteInput
    .replace(/%2C/gi, ',')
    .replace(/%3B/gi, ';');

  const websites = normalizedInput
    .split(WEBSITE_DELIMITERS_REGEX)
    .map((website) => website.trim())
    .filter((website) => website.length > 0);

  return websites;
};

export const sanitizeWebsiteForStorage = (website: string): string => {
  return website
    .trim()
    .replace(/,/g, '%2C')
    .replace(/;/g, '%3B');
};

export const serializeWebsitesForStorage = (websiteInput: string | null | undefined): string => {
  const parsedWebsites = parseWebsiteInput(websiteInput);

  return serializeWebsiteList(parsedWebsites);
};

export const serializeWebsiteList = (websites: string[]): string => {
  const trimmedWebsites = websites
    .map((website) => website.trim())
    .filter((website) => website.length > 0);

  if (trimmedWebsites.length === 0) {
    return '';
  }

  const shouldUseCommaDelimiter = trimmedWebsites.some((website) => website.includes(';'));
  const delimiter = shouldUseCommaDelimiter ? ',' : ';';

  const sanitizedWebsites = trimmedWebsites.map((website) => sanitizeWebsiteForStorage(website));

  return sanitizedWebsites.join(delimiter);
};

export const parseWebsitesForEditor = (websiteInput: string | null | undefined): string[] => {
  const parsedWebsites = parseWebsiteInput(websiteInput);

  if (parsedWebsites.length === 0) {
    return [''];
  }

  return parsedWebsites;
};
