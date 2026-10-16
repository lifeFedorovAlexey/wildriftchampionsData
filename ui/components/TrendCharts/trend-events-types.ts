export type TrendEvents = {
  patches: Array<{
    version: string;
    date: string;
    nextDate: string | null;
    sourceUrl: string;
    dateSourceUrl: string | null;
    changes: Array<{
      id: string;
      entityKind: string;
      entitySlug: string;
      entityName: string;
      imageUrl: string | null;
      changeType: string;
      relation: { kind: string; patch: string | null; sourceUrl: string | null } | null;
      records: Array<{ changeType: string; changeName: string | null; details: Array<{ label: string | null; before: string | null; after: string | null; text: string }> }>;
    }>;
  }>;
  seasons: Array<{ id: string; name: string; date: string; region: string; sourceUrl: string }>;
};

export type TrendPatch = TrendEvents["patches"][number];
export type TrendSeason = TrendEvents["seasons"][number];
