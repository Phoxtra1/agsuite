export default function GlobalFooter() {
  return (
    <footer className="relative mt-16 border-t border-white/10 bg-[#101D32] text-white">
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
      <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-5 text-center text-xs text-white/65">
        © {new Date().getFullYear()} Amineva Global. All rights reserved.
      </div>
    </footer>
  );
}
