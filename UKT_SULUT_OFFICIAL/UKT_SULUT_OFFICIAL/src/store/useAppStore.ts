import { create } from 'zustand';
import { Athlete, UKTSession, UKTResult } from '@/types';
import { supabase } from '@/lib/supabase';

interface AppState {
  athletes: Athlete[];
  sessions: UKTSession[];
  results: UKTResult[];
  totalAthletes: number;
  loading: boolean;
  resultsLoading: boolean;
  setAthletes: (athletes: Athlete[]) => void;
  setSessions: (sessions: UKTSession[]) => void;
  fetchAthletes: (page?: number, limit?: number, search?: string, regency?: string, append?: boolean) => Promise<void>;
  fetchSessions: () => Promise<void>;
  fetchResults: () => Promise<void>;
  searchResult: (name: string) => Promise<UKTResult[]>;
  addAthlete: (athlete: Omit<Athlete, 'id' | 'created_at'>) => Promise<void>;
  addAthletes: (athletes: Omit<Athlete, 'id' | 'created_at'>[]) => Promise<void>;
  updateAthlete: (id: string, updates: Partial<Athlete>) => Promise<void>;
  deleteAthlete: (id: string) => Promise<void>;
  deleteAthletes: (ids: string[]) => Promise<void>;
  deleteAllAthletes: () => Promise<void>;
  addSession: (session: Omit<UKTSession, 'id' | 'created_at'>) => Promise<void>;
  updateSession: (id: string, updates: Partial<UKTSession>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  addResult: (result: Omit<UKTResult, 'id' | 'created_at'>) => Promise<void>;
  updateResult: (id: string, updates: Partial<UKTResult>) => Promise<void>;
  deleteResult: (id: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const forceRefresh = () => {
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
};

let athleteFetchId = 0;

export const useAppStore = create<AppState>((set, get) => ({
  athletes: [],
  sessions: [],
  results: [],
  totalAthletes: 0,
  loading: false,
  resultsLoading: false,
  setAthletes: (athletes) => set({ athletes }),
  setSessions: (sessions) => set({ sessions }),
  
  fetchAthletes: async (page = 0, limit = 50, search = '', regency = 'SEMUA', append = false) => {
    const currentFetchId = ++athleteFetchId;
    set({ loading: true });
    
    let query = supabase.from('athletes').select('*', { count: 'exact' });
    
    if (search) {
      // Use ilike for case-insensitive search on name or dojang
      query = query.or(`name.ilike.%${search}%,dojang.ilike.%${search}%`);
    }
    
    if (regency && regency !== 'SEMUA') {
      query = query.eq('regency', regency);
    }
    
    const from = page * limit;
    const to = from + limit - 1;
    
    const { data, error, count } = await query
      .order('name')
      .range(from, to);
      
    // Ignore updates if a newer fetch was initiated
    if (currentFetchId !== athleteFetchId) return;
      
    if (!error && data) {
      set({ totalAthletes: count || 0 });
      if (append) {
        set({ athletes: [...get().athletes, ...data] });
      } else {
        set({ athletes: data });
      }
    }
    
    set({ loading: false });
  },

  fetchSessions: async () => {
    if (get().sessions.length > 0) return; // Menggunakan cache memori untuk performa instan
    set({ loading: true });
    const { data, error } = await supabase.from('ukt_sessions').select('*').order('created_at', { ascending: true });
    if (!error && data) set({ sessions: data });
    set({ loading: false });
  },

  addAthlete: async (athlete: Omit<Athlete, 'id' | 'created_at'>) => {
    // Normalize and exclude target_belt as it is not a database column
    const dbAthlete: any = { ...athlete };
    delete dbAthlete.target_belt;
    
    // Convert empty strings to null for Supabase
    Object.keys(dbAthlete).forEach(key => {
      if (dbAthlete[key] === '') dbAthlete[key] = null;
    });
    
    const { data, error } = await supabase.from('athletes').insert([dbAthlete]).select();
    
    if (error) {
      console.error("Store: addAthlete Error:", error);
      throw error;
    }
    
    if (data) {
      set({ 
        athletes: [...get().athletes, data[0]],
        totalAthletes: get().totalAthletes + 1
      });
      forceRefresh();
    }
  },

  addAthletes: async (athletes: Omit<Athlete, 'id' | 'created_at'>[]) => {
    const dbAthletes = athletes.map(a => {
      const dbA: any = { ...a };
      delete dbA.target_belt;
      
      // Convert empty strings to null for Supabase
      Object.keys(dbA).forEach(key => {
        if (dbA[key] === '') dbA[key] = null;
      });
      
      return dbA;
    });
    
    const { data, error } = await supabase.from('athletes').insert(dbAthletes).select();
    
    if (error) {
      console.error("Store: addAthletes Error:", error);
      throw error;
    }
    
    if (data) {
      set({ 
        athletes: [...get().athletes, ...data],
        totalAthletes: get().totalAthletes + data.length
      });
      forceRefresh();
    }
  },

  updateAthlete: async (id: string, updates: Partial<Athlete>) => {
    const dbUpdates = { ...updates };
    delete dbUpdates.target_belt;
    const { error } = await supabase.from('athletes').update(dbUpdates).eq('id', id);
    
    if (error) {
       throw error;
    }
    
    set({
      athletes: get().athletes.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    });
    forceRefresh();
  },

  deleteAthlete: async (id: string) => {
    console.log("DEBUG: store.deleteAthlete(id) STARTED with ID:", id);
    
    // 1. Manually clean up ukt_results first (Application-level CASCADE)
    console.log("DEBUG: Cleaning up ukt_results for athlete:", id);
    const { error: resultsError } = await supabase.from('ukt_results').delete().eq('athlete_id', id);
    if (resultsError) {
      console.error("DEBUG: Error cleaning up ukt_results:", resultsError);
      // We continue anyway, as the DB might have cascade or the athlete might not have results
    }

    // 2. Delete the athlete
    console.log("DEBUG: Attempting to delete athlete from database...");
    const { error } = await supabase.from('athletes').delete().eq('id', id);
    
    if (error) {
      console.error("DEBUG: Supabase delete error:", error);
      if (error.code === '23503') {
        throw new Error("Tidak dapat menghapus atlet karena data terkait masih ada (Foreign Key). Pastikan data penilaian sudah terhapus.");
      }
      throw error;
    }
    
    console.log("DEBUG: Deletion successful in database, updating local state.");
    set({
      athletes: get().athletes.filter((a) => a.id !== id),
      totalAthletes: Math.max(0, get().totalAthletes - 1)
    });
    forceRefresh();
  },

  deleteAthletes: async (ids: string[]) => {
    console.log("DEBUG: deleteAthletes STARTED with IDs:", ids);
    
    // 1. Clean up ukt_results
    const { error: resultsError } = await supabase.from('ukt_results').delete().in('athlete_id', ids);
    if (resultsError) console.error("DEBUG: Error cleaning up ukt_results:", resultsError);

    // 2. Delete athletes
    const { error } = await supabase.from('athletes').delete().in('id', ids);
    
    if (error) {
      console.error("DEBUG: Supabase bulk delete error:", error);
      throw error;
    }
    
    set({
      athletes: get().athletes.filter((a) => !ids.includes(a.id)),
      totalAthletes: Math.max(0, get().totalAthletes - ids.length)
    });
    forceRefresh();
  },

  deleteAllAthletes: async () => {
    console.log("DEBUG: deleteAllAthletes STARTED");
    
    // 1. Clean up ALL ukt_results
    const { error: resultsError } = await supabase.from('ukt_results').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (resultsError) console.error("DEBUG: Error cleaning up all ukt_results:", resultsError);

    // 2. Delete all athletes
    const { error } = await supabase.from('athletes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (error) {
      console.error("DEBUG: Supabase delete all error:", error);
      throw error;
    }
    
    set({ athletes: [], totalAthletes: 0 });
    forceRefresh();
  },

  addSession: async (session: Omit<UKTSession, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('ukt_sessions').insert([session]).select();
    if (error) {
      throw error;
    }
    if (data) {
      set({ sessions: [data[0], ...get().sessions] });
      forceRefresh();
    }
  },

  updateSession: async (id: string, updates: Partial<UKTSession>) => {
    const { error } = await supabase.from('ukt_sessions').update(updates).eq('id', id);
    if (error) {
      throw error;
    }
    set({
      sessions: get().sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    });
    forceRefresh();
  },

  deleteSession: async (id: string) => {
    const { error } = await supabase.from('ukt_sessions').delete().eq('id', id);
    if (error) {
      throw error;
    }
    set({
      sessions: get().sessions.filter((s) => s.id !== id),
    });
    forceRefresh();
  },

  fetchResults: async () => {
    if (get().results.length > 0) return; // Menggunakan cache memori untuk performa instan
    set({ resultsLoading: true });
    const { data, error } = await supabase.from('ukt_results').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error("DEBUG: fetchResults error:", error);
    }
    if (!error && data) set({ results: data });
    set({ resultsLoading: false });
  },

  searchResult: async (name: string) => {
    set({ resultsLoading: true });
    // First find athletes with that name to get their IDs
    const { data: athleteData } = await supabase
      .from('athletes')
      .select('id')
      .ilike('name', `%${name}%`);

    if (!athleteData || athleteData.length === 0) {
      set({ resultsLoading: false });
      return [];
    }

    const athleteIds = athleteData.map(a => a.id);
    const { data, error } = await supabase
      .from('ukt_results')
      .select('*')
      .in('athlete_id', athleteIds)
      .order('created_at', { ascending: false });

    set({ resultsLoading: false });
    return data || [];
  },

  addResult: async (result: Omit<UKTResult, 'id' | 'created_at'>) => {
    console.log("DEBUG: addResult payload:", result);
    const { data, error } = await supabase.from('ukt_results').insert([result]).select();
    if (error) {
      console.error("DEBUG: addResult error:", error);
      throw error;
    }
    if (data) {
      console.log("DEBUG: addResult success:", data[0]);
      set({ results: [data[0], ...get().results] });
      forceRefresh();
    }
  },
  
  updateResult: async (id: string, updates: Partial<UKTResult>) => {
    console.log("DEBUG: updateResult ID:", id, "updates:", updates);
    const { error } = await supabase.from('ukt_results').update(updates).eq('id', id);
    if (error) {
      console.error("DEBUG: updateResult error:", error);
      throw error;
    }
    set({
      results: get().results.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    });
    forceRefresh();
  },

  deleteResult: async (id: string) => {
    console.log("DEBUG: deleteResult ID:", id);
    const { error } = await supabase.from('ukt_results').delete().eq('id', id);
    if (error) {
      console.error("DEBUG: deleteResult error:", error);
      throw error;
    }
    set({
      results: get().results.filter((r) => r.id !== id),
    });
    forceRefresh();
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },
}));
