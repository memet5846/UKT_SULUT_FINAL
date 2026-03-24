import Link from 'next/link';
import { ShieldCheck, Database, Award, ArrowRight, Activity } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background Hero Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-flame.png"
          alt="Taekwondo Hybrid Background"
          className="w-full h-full object-cover opacity-40 scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-950/80 to-neutral-950" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 p-8 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="Logo TI" className="w-12 h-12 object-contain" />
          <span className="text-xl font-bold tracking-tighter text-white uppercase group">UKT <span className="text-amber-500 shimmer-text">SULUT</span></span>
        </div>
        <div className="flex items-center space-x-8">
          <Link href="/admin" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">Portal Admin</Link>
          <button className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-full text-sm transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)]">
            Hubungi Kami
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center mt-[-40px]">
        <div className="max-w-4xl space-y-8 animate-fade-in">

          <h1 className="text-6xl md:text-8xl font-black text-white leading-none tracking-tighter">
            PENGPROV T.I. SULAWESI UTARA <br />
            <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]">
              UKT TAEKWONDO
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Platform terintegrasi untuk pendaftaran, penilaian, dan manajemen database atlet Taekwondo di Sulawesi Utara secara profesional dan transparan.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-8">
            <Link href="/admin" className="px-10 py-5 bg-gradient-to-br from-amber-400 to-amber-600 text-black font-black rounded-2xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(251,191,36,0.3)] flex items-center gap-3 group">
              MASUK KE DASHBOARD
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/results" className="px-10 py-5 bg-neutral-900 text-white font-bold rounded-2xl border border-white/10 hover:bg-neutral-800 transition-all text-center">
              LIHAT HASIL UJIAN
            </Link>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-8 pt-24 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Integrated Database",
              desc: "Data atlet tersentralisasi dan terintegrasi langsung dengan modul penilaian UKT.",
              icon: Database,
              color: "text-amber-400"
            },
            {
              title: "Real-time Scoring",
              desc: "Input nilai UKT langsung oleh penguji dengan kalkulasi otomatis sesuai standar WT/PBTI.",
              icon: Award,
              color: "text-yellow-400"
            },
            {
              title: "Digital Verification",
              desc: "Verifikasi kelulusan dan histori sabuk yang dapat diakses kapan saja secara digital.",
              icon: ShieldCheck,
              color: "text-orange-400"
            }
          ].map((feature, i) => (
            <div key={i} className="glass p-8 rounded-3xl border border-white/5 hover:border-amber-500/20 transition-all group">
              <div className={`p-4 rounded-2xl bg-white/5 w-fit mb-6 group-hover:bg-amber-600/20 transition-colors`}>
                <feature.icon className={`w-8 h-8 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-neutral-500 leading-relaxed font-medium">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold shadow-[0_0_20px_rgba(251,191,36,0.1)]">
            <Activity className="w-4 h-4" />
            <span>Sistem Inovasi UKT Taekwondo v1.0</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 p-12 text-center border-t border-white/5 bg-neutral-950/50 backdrop-blur-xl">
        <p className="text-neutral-600 font-medium tracking-widest text-sm uppercase">
          &copy; 2026 TAEKWONDO SULAWESI UTARA
        </p>
        <p className="text-amber-500/20 font-black tracking-[0.6em] text-[10px] uppercase mt-4">
          PROJECT BY DJM
        </p>
      </footer>
    </div>
  );
}
