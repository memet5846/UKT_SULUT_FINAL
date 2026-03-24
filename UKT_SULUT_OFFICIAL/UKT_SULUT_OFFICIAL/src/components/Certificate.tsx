"use client";

import React, { forwardRef } from 'react';
import { UKTResult, Athlete, UKTSession } from '@/types';
import { Award, ShieldCheck, Signature, CheckCircle2, Ticket, ArrowRight, User } from 'lucide-react';

interface CertificateProps {
  result: UKTResult & { athlete?: Athlete; session?: UKTSession };
}

export const Certificate = forwardRef<HTMLDivElement, CertificateProps>(
  ({ result }, ref) => {
    const { athlete, session } = result;
    
    if (!athlete || !session) return null;

    return (
      <div 
        ref={ref}
        className="w-[1123px] h-[794px] bg-white relative overflow-hidden flex flex-col items-center justify-start p-16 text-black"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Simple Professional Border */}
        <div className="absolute inset-8 border-4 border-neutral-200">
           <div className="absolute inset-1 border border-neutral-100"></div>
        </div>

        {/* Header Area */}
        <div className="relative z-10 w-full flex items-center justify-between mb-12 px-8">
           <div className="flex items-center gap-6">
              <img src="/logo.png" alt="Logo" className="w-24 h-24 object-contain" />
              <div>
                 <h2 className="text-2xl font-black text-neutral-900 tracking-tight leading-tight">PENGPROV T.I SULUT</h2>
                 <p className="text-sm font-bold text-neutral-500 uppercase tracking-[0.3em]">Taekwondo Indonesia</p>
              </div>
           </div>
           <div className="text-right">
              <div className="px-5 py-2 bg-neutral-900 text-white font-black text-xs rounded-lg uppercase tracking-widest inline-block">
                 DOKUMEN RESMI DIGITAL
              </div>
              <p className="text-[10px] text-neutral-400 mt-2 font-mono uppercase">UID: {result.id}</p>
           </div>
        </div>

        {/* Main Title Section */}
        <div className="relative z-10 text-center space-y-4 mb-12">
           <div className="flex items-center justify-center gap-3 text-amber-600 mb-2">
              <Ticket className="w-8 h-8" />
              <span className="h-px w-20 bg-amber-200"></span>
           </div>
           <h1 className="text-5xl font-black text-neutral-900 tracking-tighter uppercase">
              TANDA BUKTI LULUS <span className="text-amber-600">SEMENTARA</span>
           </h1>
           <p className="text-lg font-medium text-neutral-500 max-w-2xl mx-auto">
              Dokumen ini sebagai bukti sah sementara hasil Ujian Kenaikan Tingkat (UKT) yang dapat ditukarkan dengan Sertifikat PBTI asli.
           </p>
        </div>

        {/* Athlete Data Card */}
        <div className="relative z-10 w-full max-w-4xl bg-neutral-50 border border-neutral-200 rounded-[32px] p-10 flex gap-12 items-center mb-12 shadow-sm">
           <div className="w-40 h-40 bg-white border border-neutral-200 rounded-3xl flex items-center justify-center relative overflow-hidden">
              <User className="w-20 h-20 text-neutral-200" />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-100/50 to-transparent"></div>
           </div>
           
           <div className="flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">NAMA LENGKAP ATLET</p>
                    <p className="text-2xl font-black text-neutral-900 uppercase leading-none">{athlete.name}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">NOMOR REGISTRASI</p>
                    <p className="text-2xl font-black text-neutral-900">{athlete.registration_number || 'TIDAK TERSEDIA'}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">ASAL DOJANG / KLUB</p>
                    <p className="text-xl font-bold text-neutral-700">{athlete.dojang}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">WILAYAH (KAB/KOTA)</p>
                    <p className="text-xl font-bold text-neutral-700">{athlete.regency}</p>
                 </div>
              </div>
              
              <div className="h-px bg-neutral-200 w-full"></div>
              
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-neutral-200 rounded-xl">
                       <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">SABUK ASAL</p>
                       <p className="text-lg font-black text-neutral-700">{athlete.current_belt}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-300" />
                    <div className="px-4 py-2 bg-amber-500 rounded-xl">
                       <p className="text-[9px] font-black text-amber-900 uppercase tracking-widest">SABUK TUJUAN</p>
                       <p className="text-lg font-black text-black">{result.target_belt}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 text-emerald-600 font-bold">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="text-lg uppercase">LULUS VERIFIKASI</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 w-full mt-auto flex justify-between items-end border-t border-neutral-100 pt-10">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <ShieldCheck className="w-6 h-6 text-neutral-900" />
                 <p className="text-sm font-bold text-neutral-500 max-w-sm">
                    Dokumen ini diterbitkan oleh Pengprov T.I SULAWESI UTARA pada {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                 </p>
              </div>
              <p className="text-[10px] text-neutral-400 max-w-xs italic leading-relaxed">
                 *Harap simpan bukti ini untuk pengambilan sertifikat fisik di sekretariat Pengprov T.I SULUT masing-masing wilayah.
              </p>
           </div>
           
           <div className="text-center">
              <div className="mb-2 relative">
                 <Signature className="w-24 h-16 text-blue-900/40" />
              </div>
              <p className="text-sm font-bold text-neutral-900 underline underline-offset-4 decoration-amber-500">PENGPROV T.I SULAWESI UTARA</p>
              <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-widest font-black">Tim Penguji UKT</p>
           </div>
        </div>

        {/* Watermark Logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none">
           <img src="/logo.png" alt="" className="w-[600px] h-[600px] object-contain" />
        </div>
      </div>
    );
  }
);

Certificate.displayName = 'Certificate';
