import React from 'react';
import { useMenu } from '../context/MenuContext.tsx';
import { QuickPricesTab } from './QuickPricesTab.tsx';
import { OffersManagerTab } from './OffersManagerTab.tsx';
import { CatalogManagerTab } from './CatalogManagerTab.tsx';
import { SettingsTab } from './SettingsTab.tsx';
import {
  Tv,
  ExternalLink,
  Flame,
  ListPlus,
  SlidersHorizontal,
  Sparkles,
  Zap,
  Lock,
} from 'lucide-react';

interface AdminPanelProps {
  onOpenTvMode: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onOpenTvMode }) => {
  const {
    activeAdminTab,
    setActiveAdminTab,
    items,
    featuredOffers,
    settings,
    lockAdmin,
  } = useMenu();

  const handleOpenInNewTab = () => {
    // Open TV menu in a new tab with ?tv=true
    const url = new URL(window.location.href);
    url.searchParams.set('tv', 'true');
    window.open(url.toString(), '_blank');
  };

  const handleLockAndExit = () => {
    lockAdmin();
    onOpenTvMode();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bebas text-neutral-950 text-xl font-bold shadow-md shadow-amber-500/20">
              BN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg text-white leading-tight">
                  Painel de Controle do Açougue
                </h1>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Tempo Real
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {settings.storeName}
              </p>
            </div>
          </div>

          {/* Action buttons: TV Mode & Open TV in New Window */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenInNewTab}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold border border-neutral-700 transition-colors"
              title="Abrir TV em outra janela ou tela secundária"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir TV em Nova Aba</span>
            </button>

            <button
              onClick={onOpenTvMode}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold rounded-lg text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all"
            >
              <Tv className="w-4 h-4" />
              <span>Visualizar Menu na TV</span>
            </button>

            <button
              onClick={handleLockAndExit}
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800/80 hover:bg-red-950/50 text-neutral-300 hover:text-red-300 rounded-lg text-xs font-semibold border border-neutral-700 hover:border-red-800 transition-colors"
              title="Bloquear painel com senha e voltar à TV"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bloquear</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveAdminTab('quick_prices')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
              activeAdminTab === 'quick_prices'
                ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Atualização Rápida de Preços</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded-full bg-neutral-950/20">
              {items.length}
            </span>
          </button>

          <button
            onClick={() => setActiveAdminTab('offers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
              activeAdminTab === 'offers'
                ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Ofertas & Placa Amarela</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded-full bg-neutral-950/20">
              {featuredOffers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveAdminTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
              activeAdminTab === 'catalog'
                ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <ListPlus className="w-4 h-4" />
            <span>Catálogo Completo & Novo Corte</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
              activeAdminTab === 'settings'
                ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Configurações da Loja & TV</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="pb-12">
          {activeAdminTab === 'quick_prices' && <QuickPricesTab />}
          {activeAdminTab === 'offers' && <OffersManagerTab />}
          {activeAdminTab === 'catalog' && <CatalogManagerTab />}
          {activeAdminTab === 'settings' && <SettingsTab />}
        </div>
      </main>
    </div>
  );
};
