"use client";
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, UserPlus, Filter, MoreVertical, Edit, Trash2, X, Plus, Upload, Download, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Athlete, BeltLevel } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

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

function AthletesParamsHandler({ onRegency }: { onRegency: (r: string) => void }) {
  const searchParams = useSearchParams();
  const urlRegency = searchParams.get('regency');
  
  useEffect(() => {
    if (urlRegency && REGENCIES.includes(urlRegency)) {
      onRegency(urlRegency);
    }
  }, [urlRegency, onRegency]);
  
  return null;
}

export default function AthletesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRegency, setSelectedRegency] = useState<string>("SEMUA");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 50;

  const { athletes, totalAthletes, fetchAthletes, addAthlete, addAthletes, updateAthlete, deleteAthlete, deleteAthletes, deleteAllAthletes, loading } = useAppStore();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    dojang: '',
    regency: REGENCIES[0],
    current_belt: 'Putih' as BeltLevel,
    gender: 'M' as 'M' | 'F',
    birth_date: '',
    birth_place: '',
    registration_number: '',
    last_ukt_date: '',
  });

  // Debounce search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(0); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch athletes when filters or page change
  useEffect(() => {
    fetchAthletes(currentPage, ITEMS_PER_PAGE, debouncedSearch, selectedRegency, currentPage > 0);
  }, [currentPage, debouncedSearch, selectedRegency, fetchAthletes]);

  // Reset to page 0 when regency filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedRegency]);

  const openAddModal = () => {
    setEditId(null);
    setFormData({
      name: '',
      dojang: '',
      regency: REGENCIES[0],
      current_belt: 'Putih' as BeltLevel,
      gender: 'M' as 'M' | 'F',
      birth_date: '',
      birth_place: '',
      registration_number: '',
      last_ukt_date: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (athlete: Athlete) => {
    setEditId(athlete.id);
    setFormData({
      name: athlete.name,
      dojang: athlete.dojang,
      regency: athlete.regency || REGENCIES[0],
      current_belt: athlete.current_belt,
      gender: athlete.gender,
      birth_date: athlete.birth_date,
      birth_place: athlete.birth_place || '',
      registration_number: athlete.registration_number || '',
      last_ukt_date: athlete.last_ukt_date || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    console.log("UI: Triggering Custom Delete Modal for:", name);
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsSubmitting(true);
    console.log("UI: Deletion Confirmed for ID:", deleteTarget.id);
    try {
      await deleteAthlete(deleteTarget.id);
      console.log("UI: Deletion Success");
      setDeleteTarget(null);
      alert('Data atlet berhasil dihapus selamanya!');
    } catch (error: Error | unknown) {
      const err = error as Error;
      console.error("UI: Deletion Error:", err);
      alert('Gagal menghapus: ' + (err?.message || 'Terjadi kesalahan.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");

      // Skip header
      const dataLines = lines.slice(1);
      const parsedData: any[] = [];
      const errors: string[] = [];

      dataLines.forEach((line, index) => {
        // Simple CSV split (not handling commas inside quotes for now, assuming standard export)
        const cols = line.split(',').map(c => c.trim());

        if (cols.length < 10) {
          errors.push(`Baris ${index + 2}: Kolom tidak lengkap (Minimal 10 kolom)`);
          return;
        }

        const normalize = (val: string) => {
          const trimmed = val.trim();
          return trimmed === '-' || trimmed === '' ? null : trimmed;
        };

        const [no, name, birth_place, birth_date, reg_no, gender, last_ukt, geup, dojang, regency] = cols;

        if (!name || !birth_date || !dojang) {
          errors.push(`Baris ${index + 2}: Nama, Tanggal Lahir, dan Dojang wajib ada.`);
          return;
        }

        // Normalize Gender
        let normalizedGender: 'M' | 'F' = 'M';
        const gLabel = gender.toUpperCase();
        if (gLabel.startsWith('P') || gLabel === 'F' || gLabel.includes('WANITA')) {
          normalizedGender = 'F';
        }

        // Normalize Belt/Geup
        let belt: BeltLevel = 'Putih';
        const g = geup.toLowerCase().trim();
        
        // Handle numeric GEUP
        if (!isNaN(parseInt(g))) {
          const gNum = parseInt(g);
          switch(gNum) {
            case 10: belt = 'Putih'; break;
            case 9: belt = 'Kuning'; break;
            case 8: belt = 'Kuning Strip'; break;
            case 7: belt = 'Hijau'; break;
            case 6: belt = 'Hijau Strip'; break;
            case 5: belt = 'Biru'; break;
            case 4: belt = 'Biru Strip'; break;
            case 3: belt = 'Merah'; break;
            case 2: belt = 'Merah Strip 1'; break;
            case 1: belt = 'Merah Strip 2'; break;
            default: belt = 'Putih';
          }
        } else {
          // Handle text GEUP
          if (g.includes('putih')) belt = 'Putih';
          else if (g.includes('kuning') && g.includes('strip')) belt = 'Kuning Strip';
          else if (g.includes('kuning')) belt = 'Kuning';
          else if (g.includes('hijau') && g.includes('strip')) belt = 'Hijau Strip';
          else if (g.includes('hijau')) belt = 'Hijau';
          else if (g.includes('biru') && g.includes('strip')) belt = 'Biru Strip';
          else if (g.includes('biru')) belt = 'Biru';
          else if (g.includes('merah') && g.includes('strip') && g.includes('2')) belt = 'Merah Strip 2';
          else if (g.includes('merah') && g.includes('strip')) belt = 'Merah Strip 1';
          else if (g.includes('merah')) belt = 'Merah';
          else if (g.includes('hitam')) belt = 'Hitam';
        }

        parsedData.push({
          name: name.trim(),
          birth_place: normalize(birth_place),
          birth_date: normalize(birth_date),
          registration_number: normalize(reg_no),
          gender: normalizedGender,
          last_ukt_date: normalize(last_ukt),
          current_belt: belt,
          dojang: dojang.trim(),
          regency: normalize(regency)?.toUpperCase().includes('KAB') || normalize(regency)?.toUpperCase().includes('KOTA') ? normalize(regency)?.toUpperCase() : normalize(regency)
        });
      });

      setCsvData(parsedData);
      setImportErrors(errors);
    };
    reader.readAsText(file);
  };

  const executeImport = async () => {
    if (csvData.length === 0) return;
    setIsSubmitting(true);
    try {
      await addAthletes(csvData);
      alert(`${csvData.length} atlet berhasil diimpor!`);
      setIsImportModalOpen(false);
      setCsvData([]);
    } catch (error: any) {
      alert('Gagal impor CSV: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToExcel = async () => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from('athletes').select('*').order('name');
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        alert('Tidak ada data atlet yang bisa diekspor.');
        setIsSubmitting(false);
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

      const colWidths = [
          { wch: 5 },  // NO
          { wch: 30 }, // NAMA LENGKAP
          { wch: 20 }, // TEMPAT LAHIR
          { wch: 15 }, // TANGGAL LAHIR
          { wch: 20 }, // NO REGISTER
          { wch: 15 }, // JENIS KELAMIN
          { wch: 25 }, // TANGGAL UKT TERAKHIR
          { wch: 20 }, // GEUP TERAKHIR
          { wch: 30 }, // DOJANG
          { wch: 25 }  // WILAYAH
      ];
      worksheet['!cols'] = colWidths;

      const fileName = `data_atlet_taekwondo_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
    } catch (error: any) {
      alert('Gagal mengekspor data: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === athletes.length && athletes.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(athletes.map(a => a.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      await deleteAthletes(selectedIds);
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      alert(`${selectedIds.length} atlet berhasil dihapus!`);
    } catch (error: any) {
      alert('Gagal menghapus masal: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAll = async () => {
    setIsSubmitting(true);
    try {
      await deleteAllAthletes();
      setIsDeleteAllModalOpen(false);
      setSelectedIds([]);
      alert('Seluruh data atlet telah dihapus!');
    } catch (error: any) {
      alert('Gagal mengosongkan database: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editId) {
        await updateAthlete(editId, formData);
        alert('Data atlet berhasil diperbarui!');
      } else {
        await addAthlete(formData);
        alert('Atlet berhasil didaftarkan!');
      }
      setIsModalOpen(false);
      setFormData({
        name: '',
        dojang: '',
        regency: REGENCIES[0],
        current_belt: 'Putih' as BeltLevel,
        gender: 'M' as 'M' | 'F',
        birth_date: '',
        birth_place: '',
        registration_number: '',
        last_ukt_date: '',
      });
      setEditId(null);
    } catch (error: Error | unknown) {
      const err = error as any;
      console.error("UI: Submit Athlete Error:", err);
      let errorMsg = err?.message || 'Terjadi kesalahan pada server.';

      if (err?.code === '42703' || errorMsg.includes('column') || (err?.status === 400)) {
        errorMsg = `Gagal menyimpan. Pastikan Anda telah menjalankan script SQL untuk menambahkan kolom baru (birth_place, registration_number, last_ukt_date). \n\nDetail: ${errorMsg}`;
      }

      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Suspense fallback={null}>
        <AthletesParamsHandler onRegency={setSelectedRegency} />
      </Suspense>
      <div className="animate-fade-in space-y-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent tracking-tight">Data Atlet</h2>
            <p className="text-neutral-400 mt-2">Kelola informasi atlet Taekwondo Sulawesi Utara.</p>
          </div>
          <div className="flex flex-wrap lg:flex-nowrap justify-start md:justify-end items-start gap-4">
            <div className="flex flex-col gap-3 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10 h-[50px] w-full"
              >
                <Upload className="w-5 h-5" />
                Impor CSV
              </button>
            </div>
            
            <div className="flex flex-col gap-3 shrink-0 w-full sm:w-auto">
              <button
                onClick={openAddModal}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black rounded-xl font-bold transition-all shadow-[0_4px_20px_rgba(251,191,36,0.3)] h-[50px] w-full"
              >
                <UserPlus className="w-5 h-5" />
                Tambah Atlet Baru
                <span className="ml-2 px-2 py-0.5 bg-black/20 rounded-full text-[10px] font-black uppercase tracking-widest text-black/50">V3.1</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar - Sticky */}
        {selectedIds.length > 0 && (
          <div className="sticky top-4 z-40 animate-in slide-in-from-top duration-300">
            <div className="bg-amber-500 p-4 rounded-2xl flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-4 text-black">
                <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center font-bold text-sm">
                  {selectedIds.length}
                </div>
                <span className="font-bold">Atlet Terpilih</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedIds([])}
                  className="px-4 py-2 bg-black/10 hover:bg-black/20 text-black font-bold rounded-xl transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="px-4 py-2 bg-black hover:bg-neutral-900 text-white font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus Terpilih
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="text"
              placeholder="Cari nama atlet atau dojang..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto no-scrollbar md:max-w-[600px] lg:max-w-[800px] shrink-0">
            <button
              onClick={() => setSelectedRegency("SEMUA")}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                selectedRegency === "SEMUA"
                  ? "bg-amber-600/20 text-amber-400 border border-amber-500/30"
                  : "text-neutral-500 hover:text-white"
              )}
            >
              SEMUA WILAYAH
            </button>
            {REGENCIES.map(r => (
              <button
                key={r}
                onClick={() => setSelectedRegency(r)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                  selectedRegency === r
                    ? "bg-amber-600/20 text-amber-400 border border-amber-500/30"
                    : "text-neutral-500 hover:text-white"
                )}
              >
                {r.replace("KABUPATEN ", "").replace("KOTA ", "")}
              </button>
            ))}
          </div>
        </div>

        {/* Table Section */}
        <div className="glass rounded-3xl border border-white/10 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-white/20 accent-amber-500"
                    checked={athletes.length > 0 && selectedIds.length === athletes.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">Nama Atlet</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">Dojang</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">Wilayah</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">Sabuk</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && athletes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                    <p className="mt-4 text-neutral-500 font-medium">Memuat data atlet...</p>
                  </td>
                </tr>
              ) : athletes.map((athlete) => (
                <tr 
                  key={athlete.id} 
                  className={cn(
                    "border-b border-white/5 hover:bg-white/5 transition-colors group",
                    selectedIds.includes(athlete.id) && "bg-amber-500/5 hover:bg-amber-500/10"
                  )}
                >
                  <td className="px-6 py-5 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-white/20 accent-amber-500"
                      checked={selectedIds.includes(athlete.id)}
                      onChange={() => toggleSelect(athlete.id)}
                    />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold">
                        {athlete.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-white font-bold">{athlete.name}</div>
                        <div className="text-xs text-neutral-500 font-medium">{athlete.gender === 'M' ? 'Laki-laki' : 'Perempuan'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-medium text-neutral-300">{athlete.dojang}</td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-neutral-400 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                      {athlete.regency?.replace("KABUPATEN ", "").replace("KOTA ", "") || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-3 h-3 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]",
                        athlete.current_belt === 'Putih' ? "bg-white" :
                          athlete.current_belt.includes('Kuning') ? "bg-yellow-400" :
                            athlete.current_belt.includes('Hijau') ? "bg-green-500" :
                              athlete.current_belt.includes('Biru') ? "bg-blue-500" :
                                athlete.current_belt.includes('Merah') ? "bg-red-500" : "bg-neutral-900"
                      )} />
                      <span className="text-white font-bold text-sm tracking-tight">{athlete.current_belt}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(athlete)}
                        className="p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(athlete.id, athlete.name)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-neutral-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {athletes.length === 0 && !loading && (
            <div className="py-20 text-center">
              <p className="text-neutral-500">Tidak ada data atlet yang ditemukan.</p>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {athletes.length < totalAthletes && (
          <div className="flex justify-center pt-8">
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              Muat Lebih Banyak ({athletes.length} dari {totalAthletes})
            </button>
          </div>
        )}
      </div>

      {/* Modals - Outside animation div to fix symmetry and clipping */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div
            className="fixed inset-0 bg-neutral-950/90"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative min-h-screen flex items-center justify-center p-4 md:p-12">
            <div
              className="relative w-full max-w-xl p-8 rounded-3xl glass-no-blur border border-white/10 animate-in fade-in zoom-in duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
              style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-white tracking-tight">{editId ? 'Edit Data Atlet' : 'Daftarkan Atlet Baru'}</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-neutral-500 hover:text-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Nama Lengkap</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                    placeholder="Contoh: Budi Santoso"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Dojang / Klub</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                      placeholder="Contoh: Manado Center"
                      value={formData.dojang}
                      onChange={(e) => setFormData({ ...formData, dojang: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Kabupaten/Kota</label>
                    <select
                      required
                      className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                      value={formData.regency}
                      onChange={(e) => setFormData({ ...formData, regency: e.target.value })}
                    >
                      {REGENCIES.map((regency) => (
                        <option key={regency} value={regency}>{regency}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Fields - User Request V3.2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Tempat Lahir</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                      placeholder="Contoh: Manado"
                      value={formData.birth_place}
                      onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">No. Register (Jika ada)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                      placeholder="Contoh: REG-123456"
                      value={formData.registration_number}
                      onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Sabuk Saat Ini</label>
                    <select
                      className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                      value={formData.current_belt}
                      onChange={(e) => setFormData({ ...formData, current_belt: e.target.value as BeltLevel })}
                    >
                      <option value="Putih">Putih</option>
                      <option value="Kuning">Kuning</option>
                      <option value="Kuning Strip">Kuning Strip</option>
                      <option value="Hijau">Hijau</option>
                      <option value="Hijau Strip">Hijau Strip</option>
                      <option value="Biru">Biru</option>
                      <option value="Biru Strip">Biru Strip</option>
                      <option value="Merah">Merah</option>
                      <option value="Merah Strip 1">Merah Strip 1</option>
                      <option value="Merah Strip 2">Merah Strip 2</option>
                      <option value="Hitam">Hitam</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Tanggal Lahir</label>
                    <input
                      required
                      type="date"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Tanggal UKT Terakhir</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                      value={formData.last_ukt_date}
                      onChange={(e) => setFormData({ ...formData, last_ukt_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Jenis Kelamin</label>
                    <div className="flex gap-4 pt-1">
                      <label className="flex items-center gap-2 text-white cursor-pointer group">
                        <input
                          type="radio"
                          name="gender"
                          className="w-4 h-4 accent-amber-500"
                          checked={formData.gender === 'M'}
                          onChange={() => setFormData({ ...formData, gender: 'M' })}
                        />
                        <span className="text-sm font-medium group-hover:text-amber-400">Laki-laki</span>
                      </label>
                      <label className="flex items-center gap-2 text-white cursor-pointer group">
                        <input
                          type="radio"
                          name="gender"
                          className="w-4 h-4 accent-amber-500"
                          checked={formData.gender === 'F'}
                          onChange={() => setFormData({ ...formData, gender: 'F' })}
                        />
                        <span className="text-sm font-medium group-hover:text-amber-400">Perempuan</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-black rounded-2xl transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      editId ? 'Menyimpan...' : 'Mendaftarkan...'
                    ) : (
                      <>
                        {editId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        {editId ? 'Simpan Perubahan' : 'Simpan Data Atlet'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus - Individual */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="fixed inset-0 bg-neutral-950/95" onClick={() => setDeleteTarget(null)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative w-full max-w-md p-8 rounded-3xl glass-no-blur border border-red-500/20 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-white text-center mb-2">Hapus Data Atlet?</h3>
              <p className="text-neutral-400 text-center mb-8">
                Apakah Anda yakin ingin menghapus <span className="text-white font-bold">{deleteTarget.name}</span>?
                <br /><span className="text-red-400 text-sm mt-2 block italic">Tindakan ini juga akan menghapus seluruh riwayat nilai UKT yang bersangkutan.</span>
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

      {/* Modal Konfirmasi Hapus Masal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="fixed inset-0 bg-neutral-950/95" onClick={() => setIsBulkDeleteModalOpen(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative w-full max-w-md p-8 rounded-3xl glass-no-blur border border-red-500/20 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-white text-center mb-2">Hapus {selectedIds.length} Atlet Terpilih?</h3>
              <p className="text-neutral-400 text-center mb-8">
                Tindakan ini tidak dapat dibatalkan. {selectedIds.length} data atlet dan seluruh riwayat penilaiannya akan dihapus permanen.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  className="py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10"
                >
                  Batalkan
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isSubmitting}
                  className="py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(220,38,38,0.3)] disabled:opacity-50"
                >
                  {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Masal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Impor CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="fixed inset-0 bg-neutral-950/95" onClick={() => setIsImportModalOpen(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4 md:p-8 text-left">
            <div className="relative w-full max-w-4xl p-8 rounded-3xl glass-no-blur border border-white/10 animate-in fade-in zoom-in duration-300 shadow-[0_4px_50px_rgba(0,0,0,0.8)]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Impor Data Atlet via CSV</h3>
                  <p className="text-neutral-500 text-sm mt-1">Format: NO, NAMA, TEMPAT, TANGGAL, REG, JK, UKT TERAKHIR, GEUP, DOJANG, WILAYAH</p>
                </div>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-neutral-500 hover:text-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Upload Area */}
                {!csvData.length && (
                  <div className="relative group">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="py-12 border-2 border-dashed border-white/10 group-hover:border-amber-500/50 rounded-2xl bg-white/5 flex flex-col items-center justify-center transition-all">
                      <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4 text-amber-500 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8" />
                      </div>
                      <p className="text-white font-bold">Pilih File CSV Atlet</p>
                      <p className="text-neutral-500 text-sm mt-1">Pastikan baris pertama adalah judul kolom (Header)</p>
                    </div>
                  </div>
                )}

                {/* Error Section */}
                {importErrors.length > 0 && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                      <AlertCircle className="w-4 h-4" />
                      Ditemukan {importErrors.length} Baris Bermasalah:
                    </div>
                    <ul className="text-xs text-red-400/80 list-disc pl-5 max-h-32 overflow-y-auto">
                      {importErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}

                {/* Preview Table */}
                {csvData.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        {csvData.length} Data Atlet Terdeteksi
                      </div>
                      <button
                        onClick={() => { setCsvData([]); setImportErrors([]); }}
                        className="text-xs text-neutral-500 hover:text-white underline"
                      >
                        Ganti File
                      </button>
                    </div>
                    <div className="max-h-[350px] overflow-auto border border-white/10 rounded-xl no-scrollbar">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead className="sticky top-0 bg-neutral-900 border-b border-white/10 z-20">
                          <tr>
                            <th className="px-4 py-3 text-neutral-500 font-bold uppercase">Nama</th>
                            <th className="px-4 py-3 text-neutral-500 font-bold uppercase">No. Register</th>
                            <th className="px-4 py-3 text-neutral-500 font-bold uppercase">Geup</th>
                            <th className="px-4 py-3 text-neutral-500 font-bold uppercase">Dojang</th>
                            <th className="px-4 py-3 text-neutral-500 font-bold uppercase">Wilayah</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-white/5">
                          {csvData.map((d, i) => (
                            <tr key={i} className="hover:bg-white/5">
                              <td className="px-4 py-3">
                                <div className="text-white font-bold">{d.name}</div>
                                <div className="text-[10px] text-neutral-500">{d.birth_place}, {d.birth_date}</div>
                              </td>
                              <td className="px-4 py-3 text-neutral-400">{d.registration_number || '-'}</td>
                              <td className="px-4 py-3">
                                <span className={cn(
                                  "px-2 py-0.5 rounded flex items-center gap-1.5 w-fit",
                                  d.current_belt.includes('Putih') ? "bg-white/10 text-white" :
                                    d.current_belt.includes('Kuning') ? "bg-yellow-500/10 text-yellow-500" :
                                      d.current_belt.includes('Hijau') ? "bg-green-500/10 text-green-500" :
                                        d.current_belt.includes('Biru') ? "bg-blue-500/10 text-blue-400" :
                                          "bg-red-500/10 text-red-500"
                                )}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                  {d.current_belt}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-neutral-400 font-medium">{d.dojang}</td>
                              <td className="px-4 py-3">
                                <span className="text-[10px] font-bold text-neutral-500 bg-white/5 px-2 py-1 rounded border border-white/5">
                                  {d.regency?.replace("KABUPATEN ", "").replace("KOTA ", "") || "-"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button
                    onClick={() => {
                      setIsImportModalOpen(false);
                      setCsvData([]);
                      setImportErrors([]);
                    }}
                    className="py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10"
                  >
                    Batalkan
                  </button>
                  <button
                    onClick={executeImport}
                    disabled={isSubmitting || csvData.length === 0}
                    className="py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black rounded-2xl transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Sedang Mengimpor...
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Daftarkan {csvData.length} Atlet
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
