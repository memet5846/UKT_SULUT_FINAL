"use client";
import { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, CheckCircle2, Clock, X, MapPin, Calendar as CalendarIcon, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { UKTSession } from '@/types';
import { cn } from '@/lib/utils';

export default function UKTAssessmentPage() {
  const { sessions, fetchSessions, loading } = useAppStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <>
      <div className="animate-fade-in space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Penilaian UKT</h2>
          <p className="text-neutral-400 mt-2">Pilih sesi UKT untuk melakukan penilaian atlet.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session: UKTSession) => (
            <div key={session.id} className="glass p-6 rounded-3xl border border-white/10 group hover:border-amber-500/30 transition-all duration-300 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5",
                  session.status === 'AKTIF' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : 
                  "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                )}>
                  {session.status === 'AKTIF' ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                  {session.status === 'AKTIF' ? 'AKTIF' : 'SELESAI'}
                </div>
                <div className="text-neutral-500 font-bold text-[10px] uppercase tracking-tighter">
                  {new Date(session.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors uppercase tracking-tight line-clamp-2">{session.name}</h3>
              <p className="text-neutral-400 text-sm mb-6 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-neutral-500" />
                {session.location}
              </p>
              
              <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                   {session.participants || 0} Peserta
                </div>
                <Link 
                  href={`/admin/ukt/${session.id}`}
                  className="px-6 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl font-bold border border-amber-500/20 transition-all text-sm"
                >
                  Mulai Penilaian
                </Link>
              </div>
            </div>
          ))}

          {!loading && sessions.length === 0 && (
            <div className="col-span-full py-20 text-center glass rounded-3xl border border-white/5">
              <ClipboardCheck className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-500">Belum ada sesi UKT yang tersedia.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
