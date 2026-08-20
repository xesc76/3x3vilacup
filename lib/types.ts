export type Category =
  | 'minibasquet'
  | 'infantil'
  | 'cadet'
  | 'junior'
  | 'senior';

export type MatchStatus = 'programado' | 'en_juego' | 'finalizado';

export type Court = {
  id: string;
  name: string;
  sort_order: number;
  google_photos_url: string | null;
  created_at: string;
};

export type Team = {
  id: string;
  name: string;
  category: Category;
  /** Grup dins de la categoria ("A", "B"...). Null = grup únic. */
  group_name: string | null;
  logo_url: string | null;
  created_at: string;
};

export type Match = {
  id: string;
  category: Category;
  court_id: string | null;
  starts_at: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  status: MatchStatus;
  round: string | null;
  created_at: string;
  updated_at: string;
};

/** Partit amb els noms d'equip i pista ja resolts (el que consumeix la UI). */
export type MatchWithNames = Match & {
  home_team: Pick<Team, 'id' | 'name' | 'logo_url' | 'group_name'> | null;
  away_team: Pick<Team, 'id' | 'name' | 'logo_url' | 'group_name'> | null;
  court: Pick<Court, 'id' | 'name'> | null;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TriplesDivision = 'noi' | 'noia';

export type TriplesResult = {
  id: string;
  division: TriplesDivision;
  participant: string;
  club: string | null;
  score: number;
  /** Els més petits tiren a cistella baixa: rànquing a part. */
  small_basket: boolean;
  created_at: string;
};

/** D'on surt un equip en un creuament del quadre. */
export type SlotSource = 'group_position' | 'winner' | 'team' | 'text';

export type PlayoffRound = {
  id: string;
  category: Category;
  name: string;
  sort_order: number;
  created_at: string;
};

export type PlayoffMatch = {
  id: string;
  round_id: string;
  slot: number;
  court_id: string | null;
  starts_at: string | null;

  home_source: SlotSource;
  home_group: string | null;
  home_rank: number | null;
  home_from_match: string | null;
  home_team_id: string | null;
  home_label: string | null;

  away_source: SlotSource;
  away_group: string | null;
  away_rank: number | null;
  away_from_match: string | null;
  away_team_id: string | null;
  away_label: string | null;

  resolved_home_team_id: string | null;
  resolved_away_team_id: string | null;

  home_score: number;
  away_score: number;
  status: MatchStatus;
  created_at: string;
  updated_at: string;
};

export type PlayoffMatchWithNames = PlayoffMatch & {
  court: Pick<Court, 'id' | 'name'> | null;
  resolved_home_team: Pick<Team, 'id' | 'name' | 'logo_url'> | null;
  resolved_away_team: Pick<Team, 'id' | 'name' | 'logo_url'> | null;
  home_team: Pick<Team, 'id' | 'name' | 'logo_url'> | null;
  away_team: Pick<Team, 'id' | 'name' | 'logo_url'> | null;
};

export type CategoryPlayoff = {
  category: Category;
  active: boolean;
  activated_at: string | null;
};

/** Nivell de col·laboració, de més a menys aportació. */
export type SponsorTier = 'principal' | 'collaborador' | 'patrocinador';

export type Sponsor = {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  tier: SponsorTier;
  sort_order: number;
  active: boolean;
  created_at: string;
};

export type Settings = {
  id: number;
  default_photos_url: string | null;
  /** Enllaç al document de normativa i bases de competició. */
  rules_url: string | null;
  live_message: string | null;
  updated_at: string;
};

/** Select compartit per portar-se els noms d'equip i pista d'una tacada. */
export const MATCH_SELECT = `
  *,
  home_team:teams!matches_home_team_id_fkey (id, name, logo_url, group_name),
  away_team:teams!matches_away_team_id_fkey (id, name, logo_url, group_name),
  court:courts (id, name)
` as const;

/** Igual que MATCH_SELECT però per als creuaments del play-off. */
export const PLAYOFF_MATCH_SELECT = `
  *,
  court:courts (id, name),
  home_team:teams!playoff_matches_home_team_id_fkey (id, name, logo_url),
  away_team:teams!playoff_matches_away_team_id_fkey (id, name, logo_url),
  resolved_home_team:teams!playoff_matches_resolved_home_team_id_fkey (id, name, logo_url),
  resolved_away_team:teams!playoff_matches_resolved_away_team_id_fkey (id, name, logo_url)
` as const;
