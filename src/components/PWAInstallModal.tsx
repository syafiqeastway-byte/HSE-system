import React, { useState, useEffect } from 'react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallSuccess: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess
}) => {
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [installing, setInstalling] = useState<boolean>(false);

  useEffect(() => {
    // Check if device is iOS
    const userAgent = window.navigator.userAgent;
    const iosDevice = /iPhone|iPad|iPod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(iosDevice);

    // Check if running in Standalone (Installed) Mode
    const standaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    setIsStandalone(standaloneMode);
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('PWA installation is supported directly in your browser address bar or menu ("Install App" / "Add to Home Screen").');
      return;
    }

    setInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('User PWA install prompt response:', outcome);
      if (outcome === 'accepted') {
        onInstallSuccess();
        onClose();
      }
    } catch (err) {
      console.error('PWA install error:', err);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        
        {/* Background glow accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 p-2 flex items-center justify-center shadow-lg border border-slate-800 flex-shrink-0 overflow-hidden">
            <img 
              src="/EE LOGO.png" 
              alt="Eastway Engineering Digital Hub Logo" 
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/icons/icon-192.png';
              }}
            />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase leading-tight">
              INSTALL APP
            </h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mt-0.5">
              Eastway Engineering Digital Hub
            </p>
          </div>
        </div>

        {isStandalone ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center my-4">
            <span className="material-symbols-outlined text-3xl text-emerald-500 mb-1">check_circle</span>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              App is already installed!
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              You are running Eastway Engineering Digital Hub in Standalone App Mode.
            </p>
          </div>
        ) : isIOS ? (
          /* iOS Step-by-Step Installation Instructions */
          <div className="space-y-4 my-4">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              To install <strong>EE Digital Hub</strong> on <strong>iPhone / iPad</strong>:
            </p>
            <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                <span>Tap the <strong>Share</strong> button (<span className="material-symbols-outlined text-sm inline align-middle">ios_share</span>) in Safari.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                <span>Scroll down and select <strong>"Add to Home Screen"</strong> (<span className="material-symbols-outlined text-sm inline align-middle">add_box</span>).</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                <span>Tap <strong>"Add"</strong> in the top right corner.</span>
              </div>
            </div>
          </div>
        ) : (
          /* Android / Desktop Direct Install */
          <div className="space-y-4 my-4">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Install <strong>Eastway Engineering Digital Hub</strong> on your Android Smartphone, Windows PC, or Tablet for fast launch, standalone window mode, and offline reliability.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-base">check</span>
                <span>Instant Home Screen & Taskbar access</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-base">check</span>
                <span>Standalone application window without browser bars</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-base">check</span>
                <span>Fast & responsive offline app shell</span>
              </li>
            </ul>
          </div>
        )}

        {/* Modal Actions */}
        <div className="mt-6 flex items-center gap-3">
          {!isStandalone && !isIOS && (
            <button
              onClick={handleInstallClick}
              disabled={installing}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-lg ${installing ? 'animate-spin' : ''}`}>
                {installing ? 'sync' : 'download_for_offline'}
              </span>
              <span>{installing ? 'INSTALLING...' : 'INSTALL NOW'}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            {isStandalone || isIOS ? 'CLOSE' : 'CANCEL'}
          </button>
        </div>

      </div>
    </div>
  );
};
