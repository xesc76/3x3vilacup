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
  home_team: Pick<Team, 'id' | 'name' | 'logo_url'> | null;
  away_team: Pick<Team, 'id' | 'name' | 'logo_url'> | null;
  court: Pick<Court, 'id' | 'name'> | null;
};

export type Sponsor = {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
};

export type Settings = {
  id: number;
  default_photos_url: string | null;
  live_message: string | null;
  updated_at: string;
};

/** Select compartit per portar-se els noms d'equip i pista d'una tacada. */
export const MATCH_SELECT = `
  *,
  home_team:teams!matches_home_team_id_fkey (id, name, logo_url),
  away_team:teams!matches_away_team_id_fkey (id, name, logo_url),
  court:courts (id, name)
` as const;
