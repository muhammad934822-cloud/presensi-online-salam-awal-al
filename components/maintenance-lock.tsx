export default function MaintenanceLock() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#0b1020] via-[#141a33] to-[#0b1020] px-6 text-center">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 sm:p-10 shadow-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/15 ring-1 ring-amber-300/30">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-amber-300"
          >
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Server Ditutup Sementara
        </h1>
        <p className="mt-2 text-sm font-medium text-amber-300/90">
          Salam Awal Al Uswah 1448 H
        </p>

        <p className="mt-5 text-sm leading-relaxed text-slate-300/90">
          Terima kasih telah berpartisipasi! Seluruh rangkaian kegiatan Mabit
          Salam Awal Al Uswah 1448 H telah selesai dan sistem presensi resmi
          ditutup. Data kehadiran tersimpan aman.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-sm font-semibold text-white">
            Sampai jumpa di SAA 1449 H 🕌
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Untuk keperluan rekap &amp; dokumentasi, hubungi panitia.
          </p>
        </div>
      </div>
    </div>
  );
}
