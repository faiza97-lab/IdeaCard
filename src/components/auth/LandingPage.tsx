import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  HeartHandshake,
  Lightbulb,
  MessageSquarePlus,
  Moon,
  ShieldCheck,
  Sun,
  Users,
} from 'lucide-react';

interface LandingPageProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onGoAuth: (mode: 'login' | 'register') => void;
  onEnterGuest: () => void;
}

const ONBOARDING_STEPS = [
  {
    step: '01',
    title: 'Tulis Dulu, Baru Diskusi',
    subtitle: 'Semua anggota menulis gagasannya secara mandiri sebelum rapat dimulai.',
    description:
      'Siswa atau anggota yang pendiam tidak lagi kalah cepat dengan yang paling vokal. Setiap ide punya ruang yang sama untuk muncul di kartu ide, lengkap dengan pilihan mode anonim.',
    accent: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
    dotColor: 'bg-indigo-500',
    Icon: Lightbulb,
  },
  {
    step: '02',
    title: 'Tunda Kritik, Kembangkan Bersama',
    subtitle: 'Tambahkan gagasan lanjutan tanpa mematahkan semangat pengirimnya.',
    description:
      'Lewat kolom "Tambahan Ide", anggota lain memperkaya ide mentah menjadi rencana yang matang. Kritik pribadi dihindari agar fokus tetap pada solusi dan manfaat.',
    accent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
    Icon: MessageSquarePlus,
  },
  {
    step: '03',
    title: 'Tanpa Mengejek, Jembatan Menuju Aksi',
    subtitle: 'Dari kartu ide, dikelompokkan bersama, lalu dipantau hingga terlaksana.',
    description:
      'IdeaCard bukan pengganti rapat, melainkan jembatan menuju diskusi nyata yang lebih terarah. Ide yang disetujui langsung terhubung ke daftar program dan pemantauan bulanan.',
    accent: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
    dotColor: 'bg-amber-500',
    Icon: HeartHandshake,
  },
];

export function LandingPage({
  darkMode,
  onToggleDarkMode,
  onGoAuth,
  onEnterGuest,
}: LandingPageProps) {
  const [activeStep, setActiveStep] = useState(0);
  const current = ONBOARDING_STEPS[activeStep];
  const StepIcon = current.Icon;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Bar Contract: 3 zona ringkas */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          <a
            href="#atas"
            className="font-display text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 dark:text-white"
          >
            Idea<span className="text-indigo-600 dark:text-indigo-400">Card</span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a
              href="#prinsip"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0"
            >
              Prinsip Brainwriting
            </a>
            <a
              href="#ruang"
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0"
            >
              Untuk Kelompok Apa
            </a>
            <button
              type="button"
              onClick={onEnterGuest}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Lihat Contoh Publik
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={darkMode ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => onGoAuth('login')}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Masuk
            </button>
          </div>
        </div>
      </header>

      <main id="atas" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        {/* Hero Split */}
        <section className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-6">
            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              Kotak Ide Digital &amp; Kartu Brainwriting
            </p>
            <h1
              className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white"
              style={{ textWrap: 'balance' }}
            >
              Suara setiap anggota layak terdengar sebelum rapat dimulai.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
              IdeaCard membantu kelas, OSIS, ekstrakurikuler, komunitas, hingga tim kerja
              mengumpulkan ide secara aman dan boleh anonim, mengembangkannya tanpa kritik,
              lalu memantau eksekusinya hingga tuntas.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onGoAuth('register')}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap"
              >
                Buat Akun Baru
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onGoAuth('login')}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                Masuk ke Ruang
              </button>
              <button
                type="button"
                onClick={onEnterGuest}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Eye className="h-4 w-4" />
                Coba sebagai Tamu
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Tanpa email &amp; tanpa nomor HP</span>
              <span aria-hidden="true">·</span>
              <span>Mode anonim + filter moderasi</span>
              <span aria-hidden="true">·</span>
              <span>Siap pakai untuk kelompok apa pun</span>
            </div>
          </div>

          {/* Ilustrasi Kartu Ide Ramah (SVG) */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <svg
                viewBox="0 0 400 300"
                className="w-full h-auto"
                role="img"
                aria-label="Ilustrasi kartu ide berwarna yang saling terhubung"
              >
                <rect x="16" y="20" width="170" height="118" rx="18" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="2" />
                <circle cx="42" cy="46" r="10" fill="#6366F1" />
                <rect x="60" y="40" width="96" height="10" rx="5" fill="#4338CA" opacity="0.85" />
                <rect x="34" y="68" width="130" height="8" rx="4" fill="#6366F1" opacity="0.35" />
                <rect x="34" y="84" width="108" height="8" rx="4" fill="#6366F1" opacity="0.35" />
                <rect x="34" y="106" width="66" height="16" rx="8" fill="#FFFFFF" />

                <rect x="210" y="34" width="174" height="122" rx="18" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="2" />
                <circle cx="236" cy="60" r="10" fill="#10B981" />
                <rect x="254" y="54" width="102" height="10" rx="5" fill="#047857" opacity="0.85" />
                <rect x="228" y="82" width="134" height="8" rx="4" fill="#10B981" opacity="0.35" />
                <rect x="228" y="98" width="114" height="8" rx="4" fill="#10B981" opacity="0.35" />
                <rect x="228" y="120" width="84" height="16" rx="8" fill="#FFFFFF" />

                <rect x="104" y="160" width="196" height="120" rx="18" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="2" />
                <circle cx="132" cy="186" r="10" fill="#F59E0B" />
                <rect x="150" y="180" width="118" height="10" rx="5" fill="#B45309" opacity="0.85" />
                <rect x="122" y="208" width="156" height="8" rx="4" fill="#F59E0B" opacity="0.35" />
                <rect x="122" y="224" width="128" height="8" rx="4" fill="#F59E0B" opacity="0.35" />
                <rect x="122" y="246" width="96" height="16" rx="8" fill="#FFFFFF" />

                <path
                  d="M 186 80 C 198 80, 198 92, 210 92"
                  stroke="#94A3B8"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  fill="none"
                />
                <path
                  d="M 288 156 C 288 175, 275 182, 260 182"
                  stroke="#94A3B8"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  fill="none"
                />
              </svg>
              <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>1. Tulis Gagasan</span>
                <span>→</span>
                <span>2. Tambahan Ide</span>
                <span>→</span>
                <span>3. Jadi Program</span>
              </div>
            </div>
          </div>
        </section>

        {/* Onboarding 3 Layar Interaktif */}
        <section id="prinsip" className="mt-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                3 Prinsip Utama IdeaCard
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Kenali aturan main sebelum menulis ide agar semua anggota merasa aman.
              </p>
            </div>
            <div className="inline-flex rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/80">
              {ONBOARDING_STEPS.map((item, index) => (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  className={`min-h-[40px] rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    activeStep === index
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  Layar {index + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${current.accent}`}>
                  <StepIcon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Prinsip {current.step} dari 03
                  </p>
                  <h3 className="font-display text-xl font-extrabold text-slate-900 dark:text-white">
                    {current.title}
                  </h3>
                </div>
              </div>
              <p className="mt-4 text-base font-bold text-slate-800 dark:text-slate-200">
                {current.subtitle}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {current.description}
              </p>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {ONBOARDING_STEPS.map((s, idx) => (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setActiveStep(idx)}
                      aria-label={`Pilih prinsip ${idx + 1}`}
                      className={`h-2.5 rounded-full transition-all cursor-pointer ${
                        idx === activeStep ? `w-8 ${s.dotColor}` : 'w-2.5 bg-slate-300 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    activeStep < ONBOARDING_STEPS.length - 1
                      ? setActiveStep(activeStep + 1)
                      : onGoAuth('register')
                  }
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  {activeStep < ONBOARDING_STEPS.length - 1 ? 'Lanjut Prinsip Berikutnya' : 'Mulai Pakai Sekarang'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 grid gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                      Privasi &amp; Anonimitas yang Jujur
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      Identitas penulis anonim disimpan terpisah dan tidak tampil di papan publik.
                      Admin hanya dapat meninjaunya jika ada laporan pelanggaran serius.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                      Satu Akun untuk Banyak Ruang
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      Cukup buat satu akun tanpa email. Kamu bisa bergabung ke ruang Kelas, OSIS,
                      ekstrakurikuler, maupun organisasi lain sekaligus.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                      Monev Program &amp; Laporan Bulanan
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      Ide yang disetujui dapat langsung diubah menjadi program lengkap dengan tugas,
                      anggaran, dokumentasi, dan laporan bulanan siap cetak PDF.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fleksibel untuk Berbagai Kelompok */}
        <section id="ruang" className="mt-16 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-display text-xl font-extrabold text-slate-900 dark:text-white">
            Cocok untuk Berbagai Jenis Kelompok
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Pilih template siap pakai saat membuat ruang, lalu ubah bidang, kategori, dan istilah sesuai kebutuhanmu.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Kelas & Wali Kelas', desc: 'Aturan piket adil, kelompok belajar, kas transparan, dan acara kelas.' },
              { title: 'OSIS SMP & SMA', desc: 'Menjaring aspirasi seluruh siswa per Sekbid sebelum rapat pleno.' },
              { title: 'Ekstrakurikuler', desc: 'Ide latihan, persiapan lomba, inventaris alat, dan proyek anggota.' },
              { title: 'Organisasi & Tim Kerja', desc: 'Retrospektif aman, perbaikan alur, dan pemantauan proyek bulanan.' },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60"
              >
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
