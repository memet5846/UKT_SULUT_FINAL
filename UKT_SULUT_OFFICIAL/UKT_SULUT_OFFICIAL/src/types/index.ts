export type BeltLevel = 
  | 'Putih' 
  | 'Kuning' 
  | 'Kuning Strip' 
  | 'Hijau' 
  | 'Hijau Strip' 
  | 'Biru' 
  | 'Biru Strip' 
  | 'Merah' 
  | 'Merah Strip 1' 
  | 'Merah Strip 2' 
  | 'Hitam';

export interface Athlete {
  id: string;
  name: string;
  dojang: string;
  current_belt: BeltLevel;
  target_belt?: BeltLevel;
  regency?: string;
  birth_place?: string;
  birth_date: string;
  registration_number?: string;
  gender: 'M' | 'F';
  last_ukt_date?: string;
  created_at: string;
}

export interface UKTSession {
  id: string;
  name: string;
  date: string;
  location: string;
  regency?: string;
  status: 'DIJADWALKAN' | 'AKTIF' | 'SELESAI';
  participants?: number;
  created_at?: string;
}

export interface UKTResult {
  id: string;
  athlete_id: string;
  session_id: string;
  gibon_score: number;
  poomsae_score: number;
  kyorugi_score: number;
  kyukpa_score: number;
  special_tech_score: number;
  theory_score: number;
  physics_score: number;
  attitude_score: number;
  average_score: number;
  status: 'Lulus' | 'Tidak Lulus';
  target_belt: BeltLevel;
  notes?: string;
  created_at: string;
}
