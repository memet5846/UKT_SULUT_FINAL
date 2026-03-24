"use client";

import { useState } from 'react';
import { Shield, Settings as SettingsIcon, Database, AlertOctagon, Save, Download, Trash2, KeyRound, User, ChevronRight, CheckCircle2, X, Plus, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import * as XLSX from 'xlsx';

const TABS = [
  { id: 'profile', label: 'Profil & Keamanan', icon: Shield, description: 'Kelola informasi kredensial akun dan kata sandi.' },
  { id: 'preferences', label: 'Preferensi Sistem', icon: SettingsIcon, description: 'Kustomisasi wilayah dan nilai kelulusan bawaan.' },
  { id: 'backup', label: 'Pencadangan Data', icon: Database, description: 'Ekspor dan cadangkan seluruh log sistem.' },
  { id: 'danger', label: 'Zona Keamanan', icon: AlertOctagon, description: 'Pemulihan dan penghapusan data secara permanen.' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAddProfileModalOpen, setIsAddProfileModalOpen] = useState(false);
  const { deleteAllAthletes } = useAppStore();

  const [newProfileData, setNewProfileData] = useState({ name: '', email: '', password: '' });

  const handleAddProfile = async () => {
    if (!newProfileData.email || !newProfileData.password) {
      alert('Email dan password wajib diisi!');
      return;
    }
    setIsSubmitting(true);
    // Simulation / Future implementation with Profile Table
    setTimeout(() => {
      alert(`Berhasil mengirimkan undangan admin ke ${newProfileData.email}. (Simulasi Fitur Multi-Admin)`);
      setIsAddProfileModalOpen(false);
      setNewProfileData({ name: '', email: '', password: '' });
      setIsSubmitting(false);
    }, 1500);
  };
  const exportAthletesToExcel = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from('athletes').select('*').order('name');
      if (error) throw error;
      if (!data || data.length === 0) {
        alert('Tidak ada data atlet untuk diekspor.');
        return;
      }

      const excelData = data.map((row, index) => ({
        'NO': index + 1,
        'NAMA LENGKAP': row.name || '',
        'TEMPAT LAHIR': row.birth_place || '',
        'TANGGAL LAHIR': row.birth_date || '',
        'NO REGISTER': row.registration_number || '',
        'JENIS KELAMIN': row.gender === 'M' ? 'L' : 'P',
        'TANGGAL UKT TERAKHIR': row.last_ukt_date || '',
        'GEUP TERAKHIR': row.current_belt || '',
        'DOJANG': row.dojang || '',
        'WILAYAH': row.regency || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Atlet");
      
      const colWidths = [{ wch: 5 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 25 }];
      worksheet['!cols'] = colWidths;

      XLSX.writeFile(workbook, `DATA_ATLET_SULUT_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error: any) {
      alert('Gagal ekspor: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportResultsToExcel = async () => {
    setIsSubmitting(true);
    try {
      // Get results joined with athlete names and session info
      const { data, error } = await supabase
        .from('ukt_results')
        .select(`
          *,
          athletes(name, dojang, regency),
          ukt_sessions(regency, date)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        alert('Tidak ada data hasil UKT untuk diekspor.');
        return;
      }

      const excelData = data.map((row: any, index: number) => ({
        'NO': index + 1,
        'NAMA ATLET': row.athletes?.name || '',
        'DOJANG': row.athletes?.dojang || '',
        'WILAYAH': row.athletes?.regency || '',
        'SESI UKT': `${row.ukt_sessions?.regency || ''} (${row.ukt_sessions?.date || ''})`,
        'SABUK SEKARANG': row.current_belt || '',
        'SABUK TUJUAN': row.target_belt || '',
        'NILAI RATA-RATA': row.average_score || 0,
        'STATUS': row.status || '',
        'TANGGAL PENILAIAN': new Date(row.created_at).toLocaleDateString('id-ID')
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Hasil UKT");
      
      const colWidths = [{ wch: 5 }, { wch: 30 }, { wch: 20 }, { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
      worksheet['!cols'] = colWidths;

      XLSX.writeFile(workbook, `HASIL_UKT_SULUT_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error: any) {
      alert('Gagal ekspor: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFactoryReset = async () => {
    setIsSubmitting(true);
    try {
      await deleteAllAthletes();
      // Also delete sessions manually if store doesn't handle all (store does athletes + results)
      await supabase.from('ukt_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      alert('Sistem berhasil dikosongkan sepenuhnya.');
      setShowDeleteConfirm(false);
    } catch (error: any) {
      alert('Gagal reset sistem: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [passwordData, setPasswordData] = useState({ new: '', confirm: '' });
  const [successMsg, setSuccessMsg] = useState('');

  const handleUpdatePassword = async () => {
    if (!passwordData.new || passwordData.new !== passwordData.confirm) {
      alert('Password baru tidak cocok atau kosong!');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.new });
      if (error) throw error;
      setSuccessMsg('Password berhasil diperbarui!');
      setPasswordData({ new: '', confirm: '' });
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error: any) {
      alert('Gagal update password: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Add Profile Modal */}
      {isAddProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsAddProfileModalOpen(false)} />
          <div className="relative bg-neutral-950/95 p-8 rounded-3xl border border-white/10 max-w-md w-full animate-in zoom-in-95 duration-200 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white">Tambah Administrator Baru</h3>
              <button 
                onClick={() => setIsAddProfileModalOpen(false)}
                className="p-2 hover:bg-white/5 rounded-full text-neutral-500 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={newProfileData.name}
                    onChange={(e) => setNewProfileData({...newProfileData, name: e.target.value})}
                    placeholder="Contoh: Master Sabuk Hitam..."
                    className="w-full mt-2 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-amber-500/50 transition-colors"
                  />
               </div>
               <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Alamat Email</label>
                  <input 
                    type="email" 
                    value={newProfileData.email}
                    onChange={(e) => setNewProfileData({...newProfileData, email: e.target.value})}
                    placeholder="admin2@taekwondosulut.com"
                    className="w-full mt-2 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-amber-500/50 transition-colors"
                  />
               </div>
               <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Kata Sandi Awal</label>
                  <input 
                    type="password" 
                    value={newProfileData.password}
                    onChange={(e) => setNewProfileData({...newProfileData, password: e.target.value})}
                    placeholder="Min. 6 Karakter"
                    className="w-full mt-2 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-amber-500/50 transition-colors"
                  />
               </div>
               
               <div className="pt-4">
                  <button 
                    onClick={handleAddProfile}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl transition-all shadow-[0_10px_20px_rgba(251,191,36,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Plus className="w-5 h-5" />}
                    DAFTARKAN ADMINISTRATOR
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-neutral-950/95 p-8 rounded-3xl border border-red-500/20 max-w-md w-full animate-in zoom-in-95 duration-200 shadow-2xl shadow-red-500/5">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
              <AlertOctagon className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Konfirmasi Reset Total?</h3>
            <p className="text-neutral-400 text-center text-sm mb-8 leading-relaxed">
              Tindakan ini akan menghapus <strong>SELURUH</strong> data Atlet, Sesi, dan Nilai Penilaian secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10"
              >
                Batal
              </button>
              <button 
                onClick={handleFactoryReset}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Ya, Hapus Semua"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent tracking-tight">Pengaturan Sistem</h2>
        <p className="text-neutral-400 mt-2">Konfigurasi preferensi aplikasi, keamanan, dan manajemen basis data pusat.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Menu Pengaturan */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center text-left gap-4 p-4 rounded-2xl transition-all border",
                  isActive 
                    ? "bg-amber-500/10 border-amber-500/30 text-white" 
                    : "bg-white/5 border-white/5 text-neutral-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <div className={cn(
                  "p-2.5 rounded-xl transition-colors",
                  isActive ? "bg-amber-500/20 text-amber-500" : "bg-black/20"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm">{tab.label}</h3>
                  <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">{tab.description}</p>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-amber-500" />}
              </button>
            )
          })}
        </div>

        {/* Display Konten Setup */}
        <div className="flex-1 glass p-8 rounded-3xl border border-white/10 min-h-[500px]">
          
          {/* TAB 1: PROFIL & KEAMANAN */}
          {activeTab === 'profile' && (
            <div className="animate-fade-in space-y-8">
              <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-500" />
                    Profil & Keamanan
                  </h3>
                  <p className="text-sm text-neutral-400 mt-1">Ganti informasi profil administrator dan sandi enkripsi.</p>
                </div>
                <button 
                  onClick={() => setIsAddProfileModalOpen(true)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold border border-white/10 flex items-center gap-2 transition-all w-fit group"
                >
                  <UserPlus className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                  Tambah Profil Baru
                </button>
              </div>

              {successMsg && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 animate-in fade-in slide-in-from-top-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">{successMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Profile List Section */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-neutral-500 uppercase tracking-[0.2em]">Daftar Administrator Aktif</h4>
                  <div className="space-y-3">
                    <div className="p-4 bg-white/5 border border-amber-500/30 rounded-2xl flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center font-bold text-amber-500">A</div>
                        <div>
                          <p className="text-sm font-bold text-white leading-none">admin@taekwondosulut.com</p>
                          <p className="text-[10px] text-amber-500/60 font-bold uppercase tracking-widest mt-1">Administrator Utama</p>
                        </div>
                      </div>
                      <div className="px-2 py-1 bg-amber-500/10 rounded-md text-[10px] font-bold text-amber-500 border border-amber-500/20">AKTIF</div>
                    </div>
                    
                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between opacity-40 grayscale group border-dashed">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-neutral-500/20 flex items-center justify-center font-bold text-neutral-400 text-sm italic">?</div>
                        <div>
                          <p className="text-sm font-bold text-neutral-400 italic">... Menunggu Penambahan ...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password Management Section */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-neutral-500 uppercase tracking-[0.2em]">Ganti Kata Sandi Administrator Utama</h4>
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div className="relative mb-3">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <KeyRound className="w-5 h-5 text-neutral-500" />
                          </div>
                          <input 
                            type="password" 
                            value={passwordData.new}
                            onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                            placeholder="Kata sandi baru..."
                            className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-amber-500/50 transition-colors"
                          />
                      </div>
                      <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <KeyRound className="w-5 h-5 text-neutral-500" />
                          </div>
                          <input 
                            type="password" 
                            value={passwordData.confirm}
                            onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                            placeholder="Ulangi kata sandi baru..."
                            className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-amber-500/50 transition-colors"
                          />
                      </div>
                    </div>

                    <button 
                      onClick={handleUpdatePassword}
                      disabled={isSubmitting || !passwordData.new}
                      className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-black rounded-xl transition-all shadow-[0_10px_20px_rgba(251,191,36,0.2)] disabled:opacity-50 flex items-center gap-2 text-sm"
                    >
                      {isSubmitting ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                      Simpan Perubahan Kata Sandi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PENCADANGAN DATA */}
          {activeTab === 'backup' && (
            <div className="animate-fade-in space-y-8">
              <div className="border-b border-white/10 pb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-500" />
                  Pencadangan Data
                </h3>
                <p className="text-sm text-neutral-400 mt-1">Lakukan backup berkala ke komputer lokal sebagai langkah preventif.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex flex-col h-full group hover:bg-blue-500/10 transition-all">
                    <div className="p-3 bg-blue-500/20 text-blue-400 w-fit rounded-xl mb-4 group-hover:scale-110 transition-transform">
                      <Database className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">Export Data Atlet</h4>
                    <p className="text-sm text-neutral-400 mb-6 flex-1">Unduh seluruh manifestasi data atlet ke format Micosoft Excel/CSV.</p>
                    <button 
                      onClick={exportAthletesToExcel}
                      disabled={isSubmitting}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                      {isSubmitting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                      Download Data Atlet
                    </button>
                 </div>
                 
                 <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex flex-col h-full group hover:bg-emerald-500/10 transition-all">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 w-fit rounded-xl mb-4 group-hover:scale-110 transition-transform">
                      <Database className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">Export Data Ujian</h4>
                    <p className="text-sm text-neutral-400 mb-6 flex-1">Unduh seluruh rekaman riwayat penilaian kelulusan.</p>
                    <button 
                      onClick={exportResultsToExcel}
                      disabled={isSubmitting}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      {isSubmitting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                      Download Data Ujian
                    </button>
                 </div>
              </div>
            </div>
          )}

          {/* TAB 4: ZONA KEAMANAN */}
          {activeTab === 'danger' && (
            <div className="animate-fade-in space-y-8">
              <div className="border-b border-white/10 pb-6">
                <h3 className="text-xl font-bold text-red-500 flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5" />
                  Zona Keamanan Kritis
                </h3>
                <p className="text-sm text-red-500/70 mt-1">Harap berhati-hati! Perintah di area ini bersifat permanen dan sangat merusak sistem apabila disalahgunakan.</p>
              </div>

              <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl border-dashed">
                 <h4 className="text-lg font-bold text-white mb-2 uppercase tracking-tighter">🚨 Format Keseluruhan (Factory Reset)</h4>
                 <p className="text-sm text-neutral-400 mb-6 max-w-2xl leading-relaxed">
                   Tindakan ini akan <strong>menghancurkan dan menghapus secara berantai</strong> seluruh record data Sesi Ujian, Penilaian Ujian, dan seluruh Data Atlet dari dalam peladen (server). Data yang telah terhapus di luar tanggung jawab *backup* tidak dapat dipulihkan kembali.
                 </p>
                 <button 
                   onClick={() => setShowDeleteConfirm(true)}
                   className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition-all shadow-[0_10px_30px_rgba(220,38,38,0.3)] flex items-center gap-3 uppercase text-xs"
                 >
                   <Trash2 className="w-5 h-5" />
                   Eksekusi Pembersihan Total
                 </button>
              </div>
            </div>
          )}

          {/* Fallback for Preferences */}
          {activeTab === 'preferences' && (
            <div className="animate-fade-in space-y-8">
              <div className="border-b border-white/10 pb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-amber-500" />
                  Preferensi Sistem
                </h3>
                <p className="text-sm text-neutral-400 mt-1">Konfigurasi pengaturan yang berimbas pada perhitungan aplikasi.</p>
              </div>

              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                 <SettingsIcon className="w-12 h-12 text-neutral-600 mb-4 animate-[spin_10s_linear_infinite]" />
                 <h4 className="text-lg font-bold text-neutral-400">Modul Sedang Dikembangkan</h4>
                 <p className="text-sm text-neutral-500 mt-2 max-w-sm">Pengaturan variabel seperti batas minimum KKM form akan tersedia pada pembaruan mendatang.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
