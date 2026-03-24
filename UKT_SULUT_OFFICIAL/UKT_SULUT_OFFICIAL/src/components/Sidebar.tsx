"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  ClipboardCheck, 
  CalendarDays,
  Settings, 
  LayoutDashboard, 
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Data Atlet', href: '/admin/athletes', icon: Users },
  { name: 'Sesi UKT', href: '/admin/sessions', icon: CalendarDays },
  { name: 'Penilaian UKT', href: '/admin/ukt', icon: ClipboardCheck },
  { name: 'Pengaturan', href: '/admin/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAppStore();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Gagal logout. Silakan coba lagi.');
    }
  };

  return (
    <div className="w-64 h-screen glass border-r border-white/10 flex flex-col p-4 fixed left-0 top-0">
      <div className="mb-10 px-4">
        <div className="flex items-center gap-3 mb-2">
          <img src="/logo.png" alt="Logo TI" className="w-10 h-10 object-contain" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent uppercase leading-tight">
            UKT SULUT
          </h1>
        </div>
        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold text-wrap">
          Admin Control Center
        </p>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                isActive 
                  ? "bg-amber-600/20 text-amber-400 border border-amber-500/30" 
                  : "text-neutral-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                isActive ? "text-amber-400" : "text-neutral-500 group-hover:text-amber-400"
              )} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5">
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 w-full text-neutral-500 hover:text-red-400 transition-colors duration-300 group"
        >
          <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
