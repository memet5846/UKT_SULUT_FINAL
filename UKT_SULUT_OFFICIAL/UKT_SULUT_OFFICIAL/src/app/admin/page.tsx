"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Trophy, 
  Calendar, 
  TrendingUp 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

const stats_placeholder = [
  { name: 'Total Atlet', value: '1,284', icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { name: 'Sudah UKT', value: '842', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { name: 'Jadwal UKT Terdekat', value: '24 Mar', icon: Calendar, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { name: 'Tingkat Kelulusan', value: '94.2%', icon: TrendingUp, color: 'text-amber-300', bg: 'bg-amber-300/10' },
];

export default function AdminDashboard() {
  const { sessions, fetchSessions } = useAppStore();
  const [results, setResults] = useState<any[]>([]);
  const [totalAthletes, setTotalAthletes] = useState<number>(0);

  useEffect(() => {
    fetchSessions();

    const fetchResults = async () => {
      const { data } = await supabase.from('ukt_results').select('status, session_id');
      if (data) setResults(data);
    };
    
    // Gunakan query super ringan count
    const fetchTotalAthletes = async () => {
      const { count } = await supabase.from('athletes').select('id', { count: 'exact', head: true });
      if (count !== null) setTotalAthletes(count);
    };

    fetchResults();
    fetchTotalAthletes();
  }, [fetchSessions]);

  const passingRate = results.length > 0 
    ? ((results.filter(r => r.status === 'LULUS').length / results.length) * 100).toFixed(1)
    : '0';

  const regionStats: Record<string, { total: number, passed: number }> = {};
  
  // Inisialisasi daftar wilayah yang memiliki sesi AKTIF terlebih dahulu
  sessions.filter(s => s.status === 'AKTIF').forEach(session => {
    const region = session.regency || session.location || 'Wilayah Lain';
    if (!regionStats[region]) regionStats[region] = { total: 0, passed: 0 };
  });

  // Hitung tingkat kelulusan dari data yang masuk
  results.forEach(r => {
    const session = sessions.find(s => s.id === r.session_id);
    if (!session || session.status !== 'AKTIF') return;
    const region = session.regency || session.location || 'Wilayah Lain';
    if (!regionStats[region]) regionStats[region] = { total: 0, passed: 0 };
    regionStats[region].total++;
    if (r.status === 'LULUS') regionStats[region].passed++;
  });

  const topRegions = Object.entries(regionStats)
    .map(([name, stats]) => ({
      name,
      rate: stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0',
      passed: stats.passed,
      total: stats.total
    }))
    .slice(0, 3);

  const closestSession = sessions.length > 0 ? sessions[0] : null;

  const stats: Array<{
    name: string;
    value?: string;
    icon: any;
    color: string;
    bg: string;
    customRender?: React.ReactNode;
    subValue?: string;
  }> = [
    { name: 'Total Atlet', value: totalAthletes.toString(), icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { name: 'Sesi UKT', value: sessions.length.toString(), icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { 
      name: 'Jadwal UKT Terdekat', 
      icon: Calendar, 
      color: 'text-orange-400', 
      bg: 'bg-orange-500/10',
      customRender: sessions.length > 0 ? (
        <div className="mt-5 flex justify-center divide-x divide-white/10 overflow-x-auto no-scrollbar w-full">
          {sessions.slice(0, 3).map((session, idx) => (
            <div key={session.id || idx} className="flex flex-col gap-3 min-w-max px-8 first:pl-0 last:pr-0">
              <div className="flex flex-col items-center text-center">
                 <span className="text-[10px] text-orange-500/70 font-bold uppercase tracking-widest mb-0.5">Wilayah</span>
                 <span className="text-sm text-white font-medium leading-tight">{session.regency || session.location}</span>
              </div>
              <div className="flex flex-col items-center text-center">
                 <span className="text-[10px] text-orange-500/70 font-bold uppercase tracking-widest mb-0.5">Tanggal</span>
                 <span className="text-sm text-white font-medium leading-tight">{new Date(session.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long' })}</span>
              </div>
              <div className="flex flex-col items-center text-center">
                 <span className="text-[10px] text-orange-500/70 font-bold uppercase tracking-widest mb-0.5">Tahun</span>
                 <span className="text-sm text-white font-medium leading-tight">{new Date(session.date).getFullYear()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4"><h3 className="text-2xl font-bold text-neutral-600">Belum Ada Jadwal</h3></div>
      )
    },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight text-gradient bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">Overview Dashboard</h2>
        <p className="text-neutral-400 mt-2 text-lg">Selamat Datang Kembali, Admin.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item) => (
          <div 
            key={item.name} 
            className={`glass p-6 rounded-2xl border border-white/5 hover:border-amber-500/20 transition-all duration-300 flex flex-col items-center justify-center text-center ${item.name === 'Jadwal UKT Terdekat' ? 'md:col-span-2 lg:col-span-2' : ''}`}
          >
            <div className={`mb-4 ${item.bg} p-4 rounded-2xl inline-flex items-center justify-center shadow-inner`}>
              <item.icon className={`w-8 h-8 ${item.color}`} />
            </div>
            <div className="w-full">
              <p className="font-bold text-base w-full block uppercase tracking-widest text-center bg-gradient-to-r from-amber-300 to-yellow-600 bg-clip-text text-transparent mb-1 drop-shadow-sm">{item.name}</p>
              {item.customRender ? item.customRender : (
                <>
                  <h3 className="text-3xl font-bold text-white mt-1">{item.value}</h3>
                  {item.subValue && <span className="text-xs font-bold text-emerald-400 mt-2 inline-block bg-emerald-400/10 px-2 py-0.5 rounded-md">{item.subValue}</span>}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-3xl border border-white/10">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            Tingkat Kelulusan per Wilayah
          </h3>
          <div className="space-y-4">
            {topRegions.length > 0 ? (
              topRegions.map((region, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-black font-black">
                      W{idx + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white uppercase">{region.name}</h4>
                      <p className="text-sm text-neutral-500">{region.total} Data Masuk</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">{region.rate}% LULUS</p>
                    <p className="text-xs text-neutral-500">{region.passed} / {region.total} atlet lulus</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-white/10 rounded-2xl shrink-0">
                <p className="text-neutral-500">Belum ada data nilai UKT untuk ditampilkan.</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass p-8 rounded-3xl border border-white/10 flex flex-col justify-start">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
             <Calendar className="w-5 h-5 text-amber-500" />
             Wilayah Terjadwal
          </h3>
          <div className="space-y-3">
             {sessions.filter(s => s.status === 'AKTIF').length > 0 ? (
               sessions.filter(s => s.status === 'AKTIF').map((session, idx) => (
                 <div key={session.id || idx} className="flex flex-row items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all">
                   <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                        {idx + 1}
                      </div>
                      <span className="font-bold text-sm text-white uppercase tracking-wider">{session.regency || session.location}</span>
                   </div>
                   <Link href={`/admin/athletes?regency=${encodeURIComponent(session.regency || session.location || '')}`} className="px-5 py-2 text-xs font-black text-black bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 rounded-lg shadow-lg shadow-amber-500/20 transition-all">
                     DAFTAR
                   </Link>
                 </div>
               ))
             ) : (
               <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-white/10 rounded-2xl">
                  <p className="text-neutral-500">Tidak ada jadwal UKT aktif.</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
