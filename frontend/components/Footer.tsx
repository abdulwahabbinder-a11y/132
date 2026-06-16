export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 py-10">
      <div className="container-x flex flex-col items-center justify-between gap-4 text-sm text-slate-400 sm:flex-row">
        <p>© {new Date().getFullYear()} DocuForge AI. All rights reserved.</p>
        <p className="text-xs">
          Uses openly-licensed media (Wikimedia, Internet Archive, Pexels, Pixabay).
          Use neural character cinematics responsibly.
        </p>
      </div>
    </footer>
  );
}
