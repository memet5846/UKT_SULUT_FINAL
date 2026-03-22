"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowLeft, Award, CheckCircle2, XCircle, User, FileText, Download } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { UKTResult, Athlete, UKTSession } from '@/types';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Certificate } from '@/components/Certificate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
// Removed unused createRoot import

export default function ResultsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(UKTResult & { athlete?: Athlete; session?: UKTSession })[]>([]);
  const { resultsLoading, searchResult } = useAppStore();
  const [hasSearched, setHasSearched] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<(UKTResult & { athlete?: Athlete; session?: UKTSession }) | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setHasSearched(true);
    const results = await searchResult(searchQuery);
    
    // Fetch related athlete and session data for the results
    const enrichedResults = await Promise.all(results.map(async (res) => {
      const { data: athlete } = await supabase.from('athletes').select('*').eq('id', res.athlete_id).single();
      const { data: session } = await supabase.from('ukt_sessions').select('*').eq('id', res.session_id).single();
      return { ...res, athlete, session };
    }));

    setSearchResults(enrichedResults);
  };

  const handleDownload = async (result: UKTResult & { athlete?: Athlete; session?: UKTSession }) => {
    if (!result.athlete || !result.session) {
      alert("Data tidak lengkap untuk membuat sertifikat. Hubungi admin.");
      return;
    }
    
    setIsDownloading(result.id);
    setSelectedResult(result);
    console.log("Memulai proses sertifikat untuk:", result.athlete?.name, result);

    try {
      // Allow React to commit the new selectedResult to the DOM
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const certElement = document.getElementById('certificate-print-area');
      
      if (!certElement) {
         console.warn("DOM Render check: container-print-area not found. Attempting second try...");
         await new Promise(resolve => setTimeout(resolve, 500));
      }

      const finalElement = document.getElementById('certificate-print-area');
      if (!finalElement) {
        throw new Error("Gagal menemukan area render sertifikat di DOM setelah 1.7 detik.");
      }

      const canvas = await html2canvas(finalElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 1123,
        height: 794
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `Bukti_Lulus_${result.athlete.name.replace(/\W+/g, '_')}.jpg`;
      link.click();

    } catch (error: any) {
       console.error("DEBUG - Gagal membuat Gambar:", error);
       alert(`Terjadi kesalahan teknis: ${error.message || "Gagal memproses gambar"}`);
    } finally {
      setIsDownloading(null);
      setSelectedResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Hidden Render Area for Certificate Printing */}
      {selectedResult && (
        <div className="fixed top-0 left-0 w-[1123px] h-[792px] pointer-events-none opacity-0 overflow-hidden" style={{ zIndex: -100 }}>
          <div id="certificate-print-area">
             <Certificate result={selectedResult} />
          </div>
        </div>
      )}

      {/* Background Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <Link 
            href="/" 
            className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-400 group-hover:text-white" />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">
              Verifikasi <span className="text-amber-500">Hasil UKT</span>
            </h1>
            <p className="text-neutral-500 font-medium">Cek status kelulusan dan rincian nilai ujian</p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-16 relative">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-neutral-500 group-focus-within:text-amber-500 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Masukkan nama lengkap atlet..."
              className="block w-full pl-16 pr-6 py-6 bg-neutral-900/50 border-2 border-white/5 rounded-[32px] focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/50 outline-none text-xl font-bold placeholder:text-neutral-600 transition-all backdrop-blur-xl"
            />
            <button 
              type="submit"
              disabled={resultsLoading}
              className="absolute right-4 top-4 px-8 py-3 bg-amber-600 hover:bg-amber-500 text-black font-black rounded-2xl transition-all shadow-[0_0_20px_rgba(251,191,36,0.3)] disabled:opacity-50"
            >
              CARI
            </button>
          </div>
        </form>

        {/* Results Info */}
        {resultsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-neutral-500 font-bold tracking-widest animate-pulse">MENGAMBIL DATA...</p>
          </div>
        ) : hasSearched ? (
          <div className="space-y-8">
            {searchResults.length > 0 ? (
              searchResults.map((result) => (
                <div 
                  key={result.id}
                  className="glass-dark border border-white/10 rounded-[32px] overflow-hidden group hover:border-amber-500/30 transition-all"
                >
                  <div className={cn(
                    "px-8 py-6 flex flex-wrap items-center justify-between gap-6 border-b border-white/5",
                    result.status === 'Lulus' ? "bg-emerald-500/10" : "bg-red-500/10"
                  )}>
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "p-4 rounded-2xl",
                        result.status === 'Lulus' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                      )}>
                        {result.status === 'Lulus' ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight">{result.athlete?.name || 'Atlet'}</h3>
                        <p className="text-neutral-500 font-bold">{result.athlete?.dojang || 'Dojang'}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-3">
                      <div className={cn(
                        "text-sm font-black uppercase tracking-widest px-4 py-2 rounded-full inline-block",
                        result.status === 'Lulus' ? "bg-emerald-500 text-black" : "bg-red-500 text-white"
                      )}>
                        {result.status}
                      </div>

                      {result.status === 'Lulus' && (
                        <button
                          onClick={() => handleDownload(result)}
                          disabled={isDownloading === result.id}
                          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] disabled:opacity-50"
                        >
                          {isDownloading === result.id ? (
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          Unduh Bukti Lulus
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <ScoreStat label="GIBON" value={result.gibon_score} />
                    <ScoreStat label="POOMSAE" value={result.poomsae_score} />
                    <ScoreStat label="KYORUGI" value={result.kyorugi_score} />
                    <ScoreStat label="KYUKPA" value={result.kyukpa_score} />
                    <ScoreStat label="SPECIAL" value={result.special_tech_score} />
                    <ScoreStat label="TEORI" value={result.theory_score} />
                    <ScoreStat label="FISIK" value={result.physics_score} />
                    <ScoreStat label="ATTITUDE" value={result.attitude_score} />
                  </div>

                  <div className="px-8 py-6 bg-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-neutral-400 font-bold text-sm">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>Rata-rata: <span className="text-white text-lg">{result.average_score.toFixed(2)}</span></span>
                    </div>
                    <div className="text-right">
                       <p className="text-neutral-400 font-bold text-sm mb-1">{result.session?.name || 'Sesi UKT'}</p>
                       {result.notes && (
                         <div className="text-neutral-500 text-sm italic">
                           &quot;{result.notes}&quot;
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-neutral-900/30 rounded-[32px] border border-white/5">
                <FileText className="w-16 h-16 text-neutral-700 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-neutral-400 mb-2">HASIL TIDAK DITEMUKAN</h3>
                <p className="text-neutral-500 font-medium">Pastikan nama yang dimasukkan sudah benar sesuai pendaftaran.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
             <div className="glass p-8 rounded-3xl space-y-4">
                <div className="p-3 bg-amber-600/20 w-fit rounded-xl text-amber-500">
                  <User className="w-6 h-6" />
                </div>
                <h4 className="font-black text-xl">CEK DATA ATLET</h4>
                <p className="text-neutral-500 text-sm font-medium">Cari hasil ujian menggunakan nama lengkap anda yang terdaftar dalam sistem.</p>
             </div>
             <div className="glass p-8 rounded-3xl space-y-4">
                <div className="p-3 bg-amber-600/20 w-fit rounded-xl text-amber-500">
                  <Award className="w-6 h-6" />
                </div>
                <h4 className="font-black text-xl">HASIL RESMI</h4>
                <p className="text-neutral-500 text-sm font-medium">Seluruh nilai yang muncul adalah hasil penilaian resmi para penguji Pengprov T.I SULUT.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreStat({ label, value }: { label: string, value: number }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-neutral-500 tracking-widest uppercase">{label}</p>
      <p className="text-xl font-black text-white">{value}</p>
      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]" 
          style={{ width: `${(value / 100) * 100}%` }}
        />
      </div>
    </div>
  );
}
