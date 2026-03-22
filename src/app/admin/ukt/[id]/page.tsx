"use client";
import { useState, useEffect, use, useRef } from 'react';
import { 
  ArrowLeft, 
  Search, 
  UserPlus, 
  Award, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  ChevronLeft,
  Save,
  X,
  Trash2,
  AlertCircle,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Athlete, UKTResult, BeltLevel } from '@/types';

export default function ScoringPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const sessionId = params.id;
  
  const { 
    sessions, 
    results, 
    fetchSessions, 
    fetchResults,
    addResult,
    updateResult,
    deleteResult,
    loading 
  } = useAppStore();

  const [search, setSearch] = useState('');
  const [isScoringModalOpen, setIsScoringModalOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeResult, setActiveResult] = useState<UKTResult | null>(null);
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);
  const [isFetchingAthletes, setIsFetchingAthletes] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollContainer = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 350; // Approximates w-80 (320px) + gap-6 (24px)
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const [scoreData, setScoreData] = useState({
    gibon_score: 70,
    poomsae_score: 70,
    kyorugi_score: 70,
    kyukpa_score: 70,
    special_tech_score: 70,
    theory_score: 70,
    physics_score: 70,
    attitude_score: 70,
    status: 'Lulus' as 'Lulus' | 'Tidak Lulus',
    notes: '',
    target_belt: 'Kuning' as BeltLevel,
  });

  // Get session first
  const currentSession = sessions.find(s => s.id === sessionId);

  // Separate effect for basic loads
  useEffect(() => {
    fetchSessions();
    fetchResults();
  }, [fetchSessions, fetchResults]);

  // Dependent effect for athletes
  useEffect(() => {
    // Wait until session is loaded to get its regency
    if (sessions.length === 0) return;
    
    // If we have sessions but this session is invalid, we could technically still fetch, 
    // but the regency might be undefined. Let's gracefully handle it.
    const session = sessions.find(s => s.id === sessionId);

    const loadFilteredAthletes = async () => {
      setIsFetchingAthletes(true);
      
      let query = supabase.from('athletes').select('*');
      
      // If the session has a regency, strictly filter athletes by it.
      if (session?.regency) {
        query = query.eq('regency', session.regency);
      }

      const { data, error } = await query.order('name');
      if (data && !error) setAllAthletes(data);
      setIsFetchingAthletes(false);
    };

    loadFilteredAthletes();
  }, [sessions, sessionId]);
  
  // Results for this specific session
  const sessionResults = results.filter(r => r.session_id === sessionId);
  const getResultForAthlete = (athleteId: string) => sessionResults.find(r => r.athlete_id === athleteId);

  const BELT_ORDER: BeltLevel[] = [
    'Putih', 'Kuning', 'Kuning Strip', 'Hijau', 'Hijau Strip', 
    'Biru', 'Biru Strip', 'Merah', 'Merah Strip 1', 'Merah Strip 2', 'Hitam'
  ];

  const getNextBelt = (current: BeltLevel): BeltLevel => {
    const index = BELT_ORDER.indexOf(current);
    return index !== -1 && index < BELT_ORDER.length - 1 ? BELT_ORDER[index + 1] : current;
  };

  const filteredAthletes = allAthletes.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.dojang.toLowerCase().includes(search.toLowerCase())
  );

  // Group all athletes by belt
  const groupedAthletes: Partial<Record<BeltLevel | 'Lainnya', Athlete[]>> = {};
  BELT_ORDER.forEach(belt => groupedAthletes[belt] = []);
  filteredAthletes.forEach(a => {
    const belt = a.current_belt;
    if (belt && groupedAthletes[belt]) {
      groupedAthletes[belt]!.push(a);
    } else if (belt) {
      if(!groupedAthletes['Lainnya']) groupedAthletes['Lainnya'] = [];
      groupedAthletes['Lainnya']!.push(a);
    }
  });

  const openScoring = (athlete: Athlete, existingResult?: UKTResult) => {
    if (currentSession?.status === 'SELESAI') {
      alert('Sesi Penilaian ini telah SELESAI. Nilai tidak dapat diubah lagi.');
      return;
    }

    setSelectedAthlete(athlete);
    if (existingResult) {
      setActiveResult(existingResult);
      setScoreData({
        gibon_score: existingResult.gibon_score,
        poomsae_score: existingResult.poomsae_score,
        kyorugi_score: existingResult.kyorugi_score,
        kyukpa_score: existingResult.kyukpa_score,
        special_tech_score: existingResult.special_tech_score,
        theory_score: existingResult.theory_score,
        physics_score: existingResult.physics_score,
        attitude_score: existingResult.attitude_score,
        status: existingResult.status as 'Lulus' | 'Tidak Lulus',
        notes: existingResult.notes || '',
        target_belt: existingResult.target_belt as BeltLevel || 'Kuning',
      });
    } else {
      setActiveResult(null);
      // Default values for new assessment
      setScoreData({
        gibon_score: 70,
        poomsae_score: 70,
        kyorugi_score: 70,
        kyukpa_score: 70,
        special_tech_score: 70,
        theory_score: 70,
        physics_score: 70,
        attitude_score: 70,
        status: 'Lulus',
        notes: '',
        target_belt: getNextBelt(athlete.current_belt),
      });
    }
    setIsScoringModalOpen(true);
  };

  const calculateAverage = () => {
    const scores = [
      scoreData.gibon_score,
      scoreData.poomsae_score,
      scoreData.kyorugi_score,
      scoreData.kyukpa_score,
      scoreData.special_tech_score,
      scoreData.theory_score,
      scoreData.physics_score,
      scoreData.attitude_score
    ];
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthlete) return;
    
    setIsSubmitting(true);
    const average = calculateAverage();
    
    try {
      if (activeResult) {
        await updateResult(activeResult.id, {
          ...scoreData,
          average_score: average,
        });
        alert('Nilai berhasil diperbarui!');
      } else {
        await addResult({
          athlete_id: selectedAthlete.id,
          session_id: sessionId,
          ...scoreData,
          average_score: average,
        });
        alert('Hasil UKT berhasil disimpan!');
      }
      setIsScoringModalOpen(false);
      fetchResults(); // Refresh list
    } catch (error) {
       console.error("DEBUG: handleSave Error:", error);
       alert('Gagal menyimpan nilai. Pastikan koneksi stabil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResult = async (id: string) => {
    if (!confirm('Hapus penilaian ini?')) return;
    try {
      await deleteResult(id);
      fetchResults();
    } catch (error) {
      alert('Gagal menghapus penilaian.');
    }
  };

  if (loading && !currentSession) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-neutral-500 font-bold tracking-widest uppercase">Memuat Sesi...</p>
      </div>
    );
  }

  return (
    <>
      <div className="animate-fade-in space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/ukt" 
              className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-400 group-hover:text-white" />
            </Link>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                {currentSession?.name || 'Detail UKT'}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-amber-500 font-bold text-sm tracking-widest uppercase">{currentSession?.location}</span>
                <span className="w-1 h-1 rounded-full bg-neutral-700" />
                <span className="text-neutral-500 font-medium">{currentSession ? new Date(currentSession.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board Layout */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                Papan Penilaian
              </h3>
              <div className="flex items-center gap-2 ml-2">
                <button 
                  onClick={() => scrollContainer('left')}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all focus:outline-none"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => scrollContainer('right')}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all focus:outline-none"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input 
                type="text" 
                placeholder="Cari nama atau dojang..." 
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {isFetchingAthletes ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="relative group/board">

              <div 
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar scroll-smooth" 
                style={{ minHeight: '600px' }}
              >
                {[...BELT_ORDER, 'Lainnya' as const].map(belt => {
                const athletesInBelt = groupedAthletes[belt];
                if (!athletesInBelt || athletesInBelt.length === 0) return null;

                return (
                  <div key={belt} className="snap-start shrink-0 w-80 flex flex-col gap-4">
                    {/* Column Header */}
                    <div className={cn(
                      "px-4 py-3 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-between shadow-lg sticky top-0 z-10",
                      belt.includes('Putih') ? "bg-white text-black" :
                      belt.includes('Kuning') ? "bg-yellow-400 text-black" :
                      belt.includes('Hijau') ? "bg-green-500 text-white" :
                      belt.includes('Biru') ? "bg-blue-500 text-white" :
                      belt.includes('Merah') ? "bg-red-500 text-white" :
                      belt.includes('Hitam') ? "bg-black border border-white/20 text-white" :
                      "bg-white/10 text-white"
                    )}>
                      <span>Sabuk {belt}</span>
                      <span className="bg-black/20 px-2 py-0.5 rounded-full text-[10px]">{athletesInBelt.length}</span>
                    </div>

                    {/* Column Items */}
                    <div className="flex flex-col gap-3">
                      {athletesInBelt.map(athlete => {
                        const result = getResultForAthlete(athlete.id);
                        const isScored = !!result;

                        return (
                          <div 
                            key={athlete.id}
                            onClick={() => openScoring(athlete, result)}
                            className={cn(
                              "p-4 rounded-2xl border transition-all cursor-pointer group hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(251,191,36,0.15)]",
                              isScored ? "bg-white/5 border-white/10 hover:border-amber-500/30" : "bg-neutral-900 border-dashed border-white/10 hover:border-amber-500/50"
                            )}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-white text-sm uppercase leading-tight group-hover:text-amber-400 transition-colors">
                                {athlete.name}
                              </h4>
                              {isScored ? (
                                <div className="flex flex-col items-end">
                                   <span className="text-xl font-black text-white">{result.average_score.toFixed(1)}</span>
                                   <span className={cn(
                                     "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1",
                                     result.status === 'Lulus' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                                   )}>{result.status}</span>
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-neutral-500 group-hover:bg-amber-500/20 group-hover:text-amber-500 transition-colors">
                                  <Plus className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-neutral-500 font-medium truncate">{athlete.dojang}</p>
                            
                            {isScored && (
                              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-neutral-500 uppercase">Target: <span className="text-amber-500">{result.target_belt}</span></span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteResult(result.id); }}
                                  className="text-neutral-600 hover:text-red-500 p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            
                            {!isScored && (
                               <div className="mt-3">
                                  <span className="text-[10px] font-black tracking-widest uppercase text-neutral-600">Belum Dinilai</span>
                               </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          )}
        </div>
      </div>

      {/* Scoring Modal - Decoupled with perfect symmetry */}
      {isScoringModalOpen && selectedAthlete && (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="fixed inset-0 bg-neutral-950/95" onClick={() => setIsScoringModalOpen(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4 md:p-12">
            <div 
              className="relative w-full max-w-4xl p-8 rounded-[40px] glass-no-blur border border-white/10 shadow-[0_4px_40px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in duration-300"
              style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
            >
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-black font-black text-2xl shadow-lg">
                    {selectedAthlete.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">{selectedAthlete.name}</h3>
                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">{selectedAthlete.dojang} • {selectedAthlete.current_belt}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsScoringModalOpen(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-neutral-500 hover:text-white transition-all border border-white/5"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveScore} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {/* Scoring Fields */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-4">Parameter Penilaian</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <ScoreInput label="GIBON (DASAR)" value={scoreData.gibon_score} onChange={(v) => setScoreData({...scoreData, gibon_score: v})} />
                    <ScoreInput label="POOMSAE (JURUS)" value={scoreData.poomsae_score} onChange={(v) => setScoreData({...scoreData, poomsae_score: v})} />
                    <ScoreInput label="KYORUGI (FIGHT)" value={scoreData.kyorugi_score} onChange={(v) => setScoreData({...scoreData, kyorugi_score: v})} />
                    <ScoreInput label="KYUKPA (PECAH PAPAN)" value={scoreData.kyukpa_score} onChange={(v) => setScoreData({...scoreData, kyukpa_score: v})} />
                    <ScoreInput label="SPECIAL TECH" value={scoreData.special_tech_score} onChange={(v) => setScoreData({...scoreData, special_tech_score: v})} />
                    <ScoreInput label="TEORI" value={scoreData.theory_score} onChange={(v) => setScoreData({...scoreData, theory_score: v})} />
                    <ScoreInput label="FISIK" value={scoreData.physics_score} onChange={(v) => setScoreData({...scoreData, physics_score: v})} />
                    <ScoreInput label="ATTITUDE" value={scoreData.attitude_score} onChange={(v) => setScoreData({...scoreData, attitude_score: v})} />
                  </div>
                </div>

                {/* Status & Results */}
                <div className="space-y-8">
                  <div className="p-8 rounded-[32px] bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center">
                    <p className="text-xs font-black text-neutral-500 uppercase tracking-[0.2em] mb-2">Rata-rata Nilai</p>
                    <div className="text-7xl font-black text-white tracking-tighter mb-4">{calculateAverage().toFixed(1)}</div>
                    <div className={cn(
                      "px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-lg transition-all",
                      calculateAverage() >= 70 ? "bg-emerald-500 text-black" : "bg-red-500 text-white"
                    )}>
                      {calculateAverage() >= 70 ? 'REKOMENDASI LULUS' : 'DIBAWAH STANDAR'}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Sabuk Target (UKT)</label>
                       <select 
                        className="w-full px-5 py-4 bg-neutral-900 border border-white/10 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-amber-500/50"
                        value={scoreData.target_belt}
                        onChange={(e) => setScoreData({...scoreData, target_belt: e.target.value as BeltLevel})}
                       >
                        <option value="Kuning">Kuning</option>
                        <option value="Kuning Strip">Kuning Strip</option>
                        <option value="Hijau">Hijau</option>
                        <option value="Hijau Strip">Hijau Strip</option>
                        <option value="Biru">Biru</option>
                        <option value="Biru Strip">Biru Strip</option>
                        <option value="Merah">Merah</option>
                        <option value="Merah Strip 1">Merah Strip 1</option>
                        <option value="Merah Strip 2">Merah Strip 2</option>
                        <option value="Hitam">Hitam (DAN)</option>
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Keputusan Akhir</label>
                       <div className="grid grid-cols-2 gap-4">
                          <button 
                            type="button"
                            onClick={() => setScoreData({...scoreData, status: 'Lulus'})}
                            className={cn(
                              "py-4 rounded-2xl font-black text-sm transition-all border",
                              scoreData.status === 'Lulus' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "bg-white/5 text-neutral-500 border-white/5"
                            )}
                          >
                            LULUS
                          </button>
                          <button 
                            type="button"
                            onClick={() => setScoreData({...scoreData, status: 'Tidak Lulus'})}
                            className={cn(
                              "py-4 rounded-2xl font-black text-sm transition-all border",
                              scoreData.status === 'Tidak Lulus' ? "bg-red-500/20 text-red-500 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : "bg-white/5 text-neutral-500 border-white/5"
                            )}
                          >
                            TIDAK LULUS
                          </button>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Catatan Penguji</label>
                       <textarea 
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-amber-500/50 h-24 resize-none"
                        placeholder="Masukkan catatan jika ada..."
                        value={scoreData.notes}
                        onChange={(e) => setScoreData({...scoreData, notes: e.target.value})}
                       />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 pt-8">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-black text-lg rounded-3xl transition-all shadow-[0_10px_40px_rgba(251,191,36,0.3)] disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-6 h-6" />
                        SIMPAN PENILAIAN RESMI
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ScoreInput({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{label}</label>
      <input 
        required
        type="number" 
        min="0" 
        max="100"
        className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded-xl text-white font-bold text-center outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      />
    </div>
  );
}
