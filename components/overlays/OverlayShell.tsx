'use client';
import { useEffect } from 'react';

export default function OverlayShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-night-950/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="glass-panel relative z-10 flex max-h-[85vh] w-[92vw] max-w-2xl flex-col rounded-2xl p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-[#f5ead6]">{title}</h2>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-sm text-[#f5ead6]/60 hover:bg-white/5 hover:text-[#f5ead6]">
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
}
