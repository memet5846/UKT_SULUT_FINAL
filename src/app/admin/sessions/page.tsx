"use client";
import { useState, useEffect } from 'react';
import { CalendarDays, Plus, Clock, X, MapPin, Calendar as CalendarIcon, Edit, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { UKTSession } from '@/types';
import { cn } from '@/lib/utils';

const REGENCIES = [
  "KABUPATEN BOLAANG MONGONDOW",
  "KABUPATEN BOLAANG MONGONDOW SELATAN",
  "KABUPATEN BOLAANG MONGONDOW UTARA",
  "KABUPATEN KEPULAUAN SANGIHE",
  "KABUPATEN MINAHASA",
  "KABUPATEN MINAHASA TENGGARA",
  "KABUPATEN MINAHASA UTARA",
  "KABUPATEN SIAU TAGULANDANG BIARO",
  "KOTA BITUNG",
  "KOTA KOTAMOBAGU",
  "KOTA MANADO",
  "KOTA TOMOHON"
];

export default function SessionsPage() {
  const { sessions, fetchSessions, addSession, updateSession, deleteSession, loading } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    regency: REGENCIES[0],
    status: 'AKTIF' as 'AKTIF' | 'SELESAI',
  });

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const openAddModal = () => {
    setEditId(null);
    setFormData({
      name: '',
      date: '',
      location: '',
      regency: REGENCIES[0],
      status: 'AKTIF',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (session: UKTSession) => {
    setEditId(session.id);
    setFormData({
      name: session.name,
      date: session.date,
      location: session.location,
      regency: session.regency || REGENCIES[0],
      status: session.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await deleteSession(deleteTarget.id);
      setDeleteTarget(null);
      alert('Sesi UKT berhasil dihapus!');
    } catch (error) {
      alert('Gagal menghapus sesi UKT.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editId) {
        await updateSession(editId, formData);
        alert('Sesi UKT berhasil diperbarui!');
      } else {
        await addSession(formData);
        alert('Sesi UKT berhasil dibuat!');
      }
      setIsModalOpen(false);
      setFormData({
        name: '',
        date: '',
        location: '',
        regency: REGENCIES[0],
        status: 'AKTIF',
      });
      setEditId(null);
    } catch (error: any) {
      console.error(error);
      if (error?.message?.includes('column') || error?.code === '42703') {
        alert(`Gagal menyimpan. Pastikan kolom 'regency' (Tipe: text) sudah ditambahkan pada tabel ukt_sessions di Supabase.\n\nDetail: ${error.message}`);
      } else {
        alert(`Gagal ${editId ? 'memperbarui' : 'membuat'} sesi UKT.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="animate-fade-in space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Manajemen Sesi UKT</h2>
            <p className="text-neutral-400 mt-2">Buat dan kelola jadwal ujian kenaikan tingkat.</p>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black rounded-xl font-bold transition-all shadow-[0_4px_20px_rgba(251,191,36,0.3)]"
          >
            <Plus className="w-5 h-5" />
            Buat Sesi UKT
          </button>
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
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(session)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(session.id, session.name)}
                    className="p-1.5 hover:bg-red-500/10 rounded-lg text-neutral-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors uppercase tracking-tight line-clamp-2">{session.name}</h3>
              
              <div className="space-y-2 mb-6">
                <p className="text-neutral-400 text-sm flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-neutral-500" />
                  {new Date(session.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-neutral-400 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-neutral-500" />
                  {session.location} {session.regency ? ` - ${session.regency.replace('KABUPATEN', 'KAB.').replace('KOTA ', '')}` : ''}
                </p>
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                   Peserta: <span className="text-white">{session.participants || 0} Atlet</span>
                </p>
              </div>
            </div>
          ))}

          {!loading && sessions.length === 0 && (
            <div className="col-span-full py-20 text-center glass rounded-3xl border border-white/5">
              <CalendarDays className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-500">Belum ada sesi UKT yang dibuat.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-neutral-950/90"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div 
              className="relative w-full max-w-xl p-8 rounded-3xl glass-no-blur border border-white/10 animate-in fade-in zoom-in duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
              style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-white tracking-tight">{editId ? 'Edit Sesi UKT' : 'Buat Sesi UKT Baru'}</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-neutral-500 hover:text-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Nama Sesi UKT</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-medium"
                    placeholder="Contoh: UKT Semester Ganjil 2026"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Tempat / Gedung</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-medium"
                      placeholder="Contoh: GOR Wolter Monginsidi"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Wilayah / Kabupaten / Kota</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-medium"
                      value={formData.regency}
                      onChange={(e) => setFormData({...formData, regency: e.target.value})}
                    >
                      {REGENCIES.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Tanggal</label>
                    <input 
                      required
                      type="date" 
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-medium"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Status</label>
                    <select 
                      className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-medium"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    >
                      <option value="AKTIF">AKTIF</option>
                      <option value="SELESAI">SELESAI</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-black rounded-2xl transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Memproses...' : (
                      <>
                        {editId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        {editId ? 'Simpan Perubahan' : 'Buat Sesi UKT'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="fixed inset-0 bg-neutral-950/95" onClick={() => setDeleteTarget(null)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative w-full max-w-md p-8 rounded-3xl glass-no-blur border border-red-500/20 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-white text-center mb-2">Hapus Sesi UKT?</h3>
              <p className="text-neutral-400 text-center mb-8">
                Apakah Anda yakin ingin menghapus sesi <span className="text-white font-bold">{deleteTarget.name}</span>? 
                <br/><span className="text-red-400 text-sm mt-2 block italic">Tindakan ini juga akan menghapus seluruh daftar nilai yang ada dalam sesi ini.</span>
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setDeleteTarget(null)}
                  className="py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10"
                >
                  Batalkan
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={isSubmitting}
                  className="py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(220,38,38,0.3)] disabled:opacity-50"
                >
                  {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper icons that were missing
function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
