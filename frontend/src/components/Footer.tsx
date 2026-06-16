export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink-950">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-white/40 md:flex-row">
        <p>© {new Date().getFullYear()} DocuForge AI. Cinematic documentaries, automated.</p>
        <p className="flex items-center gap-4">
          <span>Powered by NVIDIA NIM · ElevenLabs · Remotion</span>
        </p>
      </div>
    </footer>
  );
}
