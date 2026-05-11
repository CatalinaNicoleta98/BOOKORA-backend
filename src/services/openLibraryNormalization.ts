export type SeriesConfidence = "high" | "medium" | "low" | "none";

export interface ResolvedSeriesMembership {
  confidence: SeriesConfidence;
  seriesTitle?: string;
  seriesKey?: string;
  seriesPosition?: string;
}

const normalizeTrimmed = (value?: string) => {
  const normalizedValue = value?.trim();
  return normalizedValue && normalizedValue.length > 0 ? normalizedValue : undefined;
};

const normalizeSpaces = (value: string) => value.replace(/\s+/g, " ").trim();

export const normalizeOpenLibraryKey = (key?: string | null) => {
  if (!key) {
    return "";
  }

  const normalizedKey = key.trim();

  if (!normalizedKey) {
    return "";
  }

  return normalizeSpaces(normalizedKey.split("/").filter(Boolean).pop() || normalizedKey);
};

export const normalizeWorkKey = (key?: string | null) => normalizeOpenLibraryKey(key);

export const normalizeEditionKey = (key?: string | null) => normalizeOpenLibraryKey(key);

export const normalizeAuthorKey = (key?: string | null) => {
  if (!key) {
    return "";
  }

  const normalizedKey = key.trim();

  if (!normalizedKey) {
    return "";
  }

  return normalizeSpaces(normalizedKey.replace(/^\/authors\//, ""));
};

export const isEditionKey = (key?: string | null) => /^OL\d+M$/i.test(normalizeEditionKey(key));

export const isWorkKey = (key?: string | null) => /^OL\d+W$/i.test(normalizeWorkKey(key));

export const canonicalizeSeriesTitle = (value?: string) => {
  const normalizedValue = normalizeTrimmed(value);

  if (!normalizedValue) {
    return undefined;
  }

  return normalizedValue
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
};

export const buildSeriesKey = (seriesTitle: string) =>
  canonicalizeSeriesTitle(seriesTitle)?.replace(/\s+/g, "-");

const parseSeriesPositionToken = (value?: string | number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  const normalizedValue = normalizeTrimmed(typeof value === "string" ? value : undefined);

  if (!normalizedValue) {
    return undefined;
  }

  if (!/^\d+(?:\.\d+)?$/.test(normalizedValue)) {
    return undefined;
  }

  return normalizedValue;
};

const getPatternMatches = (label: string) => {
  const patterns: Array<{
    pattern: RegExp;
    seriesIndex: number;
    positionIndex: number;
  }> = [
    { pattern: /^(.+?)\s+#(\d+(?:\.\d+)?)$/i, seriesIndex: 1, positionIndex: 2 },
    { pattern: /^(.+?),\s*book\s+(\d+(?:\.\d+)?)$/i, seriesIndex: 1, positionIndex: 2 },
    { pattern: /^book\s+(\d+(?:\.\d+)?)\s+of\s+(.+)$/i, seriesIndex: 2, positionIndex: 1 },
    { pattern: /^(?:.+?)\((.+?),\s*#(\d+(?:\.\d+)?)\)$/i, seriesIndex: 1, positionIndex: 2 },
  ];

  for (const { pattern, seriesIndex, positionIndex } of patterns) {
    const match = label.match(pattern);

    if (match?.[seriesIndex] && match[positionIndex]) {
      return {
        seriesTitle: normalizeSpaces(match[seriesIndex]),
        seriesPosition: match[positionIndex],
      };
    }
  }

  return undefined;
};

export const parseSeriesLabel = (label?: string) => {
  const normalizedLabel = normalizeTrimmed(label);

  if (!normalizedLabel) {
    return undefined;
  }

  const matchedPattern = getPatternMatches(normalizedLabel);

  if (!matchedPattern?.seriesTitle || !matchedPattern.seriesPosition) {
    return undefined;
  }

  return {
    seriesTitle: matchedPattern.seriesTitle,
    seriesKey: buildSeriesKey(matchedPattern.seriesTitle),
    seriesPosition: matchedPattern.seriesPosition,
  };
};

export const parseSeriesPositionForTitle = (
  label: string | undefined,
  seriesTitle: string
) => {
  const normalizedLabel = normalizeTrimmed(label);
  const canonicalSeriesTitle = canonicalizeSeriesTitle(seriesTitle);

  if (!normalizedLabel || !canonicalSeriesTitle) {
    return undefined;
  }

  const parsedSeriesLabel = parseSeriesLabel(normalizedLabel);

  if (!parsedSeriesLabel?.seriesTitle || !parsedSeriesLabel.seriesPosition) {
    return undefined;
  }

  if (canonicalizeSeriesTitle(parsedSeriesLabel.seriesTitle) !== canonicalSeriesTitle) {
    return undefined;
  }

  return parsedSeriesLabel.seriesPosition;
};

const getConsistentEditionSeriesMatch = (editionSeriesValues: string[]) => {
  const parsedMatches = editionSeriesValues
    .map((value) => parseSeriesLabel(value))
    .filter((value): value is NonNullable<typeof value> => Boolean(value));

  if (parsedMatches.length === 0) {
    return undefined;
  }

  const canonicalTitles = new Set(
    parsedMatches
      .map((match) => canonicalizeSeriesTitle(match.seriesTitle))
      .filter((value): value is string => Boolean(value))
  );

  if (canonicalTitles.size !== 1) {
    return undefined;
  }

  return parsedMatches[0];
};

export const resolveSeriesMembership = ({
  explicitSeries,
  explicitPosition,
  editionSeriesValues,
}: {
  explicitSeries?: string;
  explicitPosition?: string | number;
  editionSeriesValues?: string[];
}): ResolvedSeriesMembership => {
  const normalizedExplicitSeries = normalizeTrimmed(explicitSeries);
  const normalizedEditionSeriesValues = (editionSeriesValues ?? [])
    .map((value) => normalizeTrimmed(value))
    .filter((value): value is string => Boolean(value));

  if (normalizedExplicitSeries) {
    const explicitSeriesPosition = parseSeriesPositionToken(explicitPosition);
    const editionDerivedPosition = normalizedEditionSeriesValues
      .map((value) => parseSeriesPositionForTitle(value, normalizedExplicitSeries))
      .filter((value): value is string => Boolean(value));

    const uniqueDerivedPositions = [...new Set(editionDerivedPosition)];

    return {
      confidence: "high",
      seriesTitle: normalizedExplicitSeries,
      seriesKey: buildSeriesKey(normalizedExplicitSeries),
      seriesPosition:
        explicitSeriesPosition ??
        (uniqueDerivedPositions.length === 1 ? uniqueDerivedPositions[0] : undefined),
    };
  }

  const consistentEditionSeriesMatch = getConsistentEditionSeriesMatch(normalizedEditionSeriesValues);

  if (consistentEditionSeriesMatch) {
    return {
      confidence: "medium",
      seriesTitle: consistentEditionSeriesMatch.seriesTitle,
      seriesKey: consistentEditionSeriesMatch.seriesKey,
      seriesPosition: consistentEditionSeriesMatch.seriesPosition,
    };
  }

  return {
    confidence: normalizedEditionSeriesValues.length > 0 ? "low" : "none",
  };
};

export const getComparableSeriesPosition = (value?: string | number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return Number.POSITIVE_INFINITY;
  }

  const match = value.match(/^(\d+(?:\.\d+)?)$/);

  if (!match?.[1]) {
    return Number.POSITIVE_INFINITY;
  }

  const numericValue = Number.parseFloat(match[1]);
  return Number.isFinite(numericValue) ? numericValue : Number.POSITIVE_INFINITY;
};
