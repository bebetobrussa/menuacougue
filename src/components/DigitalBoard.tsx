import React, { useState, useEffect } from 'react';
import { useMenu } from '../context/MenuContext.tsx';
import { formatCurrency } from '../utils/format.ts';
import { Clock, Sliders, Maximize2, Minimize2, ChevronLeft, ChevronRight, Sparkles, Phone, Award, Edit3, Moon, Sun, Wrench } from 'lucide-react';
import { EditBoardTitlesModal } from './EditBoardTitlesModal.tsx';

interface DigitalBoardProps {
  onOpenAdmin: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const DigitalBoard: React.FC<DigitalBoardProps> = ({
  onOpenAdmin,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const {
    items,
    settings,
    updateSettings,
    featuredOffers,
    currentFeaturedOffer,
    activeOfferIndex,
    lastUpdatedItemId,
    goToNextOffer,
    goToPrevOffer,
  } = useMenu();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [showEditTitlesModal, setShowEditTitlesModal] = useState<boolean>(false);
  const [editFocusField, setEditFocusField] = useState<'col1' | 'col2' | 'badge' | 'banner'>('col1');

  const openEditTitles = (field: 'col1' | 'col2' | 'badge' | 'banner') => {
    setEditFocusField(field);
    setShowEditTitlesModal(true);
  };

  // Auto hide floating controls after 4 seconds of inactivity in TV mode
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setControlsVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setControlsVisible(false);
      }, 4000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  // Live Clock updater
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time and date
  const timeStr = currentTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateStr = currentTime.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).toUpperCase();

  // Filter available items
  const activeItems = items.filter((i) => i.available);

  // Divide into 2 balanced columns (just like the reference image!)
  const midpoint = Math.ceil(activeItems.length / 2);
  const column1 = activeItems.slice(0, midpoint);
  const column2 = activeItems.slice(midpoint);

  // Featured Offer calculations
  const featured = currentFeaturedOffer || (activeItems.length > 0 ? activeItems[0] : null);
  const formattedPriceParts = featured ? formatCurrency(featured.price).split(',') : ['0', '00'];
  const discountPercent =
    featured?.originalPrice && featured.originalPrice > featured.price
      ? Math.round(((featured.originalPrice - featured.price) / featured.originalPrice) * 100)
      : 0;

  // Check if Night Mode is active (manual toggle or scheduled auto closing hours)
  const currentHour = currentTime.getHours();
  const startHour = settings.nightModeStartHour ?? 19;
  const endHour = settings.nightModeEndHour ?? 7;
  const isAutoNightTime = Boolean(
    settings.nightModeAuto && (
      startHour > endHour
        ? currentHour >= startHour || currentHour < endHour
        : currentHour >= startHour && currentHour < endHour
    )
  );
  const isNightActive = Boolean(settings.nightModeEnabled || isAutoNightTime);
  const dimLevel = settings.nightModeDimLevel ?? 65;

  // Keyboard shortcut: Press 'N' to toggle night mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'n' || e.key === 'N') {
        updateSettings({ nightModeEnabled: !isNightActive });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNightActive, updateSettings]);

  return (
    <div
      className={`relative w-full min-h-screen ${
        isNightActive ? 'bg-wood-dark-night' : 'bg-wood-dark'
      } text-neutral-100 flex flex-col justify-between overflow-x-hidden select-none transition-all duration-700`}
      style={{
        filter: isNightActive
          ? `brightness(${dimLevel}%) contrast(92%) saturate(92%)`
          : undefined,
      }}
    >
      {/* Top Floating Control Bar (visible on mouse hover, discreet) */}
      <aside
        aria-label="Controles Rápidos"
        className={`fixed top-3 right-4 z-50 flex items-center gap-2 transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Maintenance Mode active alert button */}
        {settings.maintenanceModeEnabled && (
          <button
            onClick={() => updateSettings({ maintenanceModeEnabled: false })}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold border border-red-400 shadow-lg backdrop-blur-md transition-all animate-pulse"
            title="Desativar modo de manutenção e voltar a exibir a tabela de cortes"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Desativar Manutenção</span>
          </button>
        )}

        {/* Night Mode Toggle Button */}
        <button
          onClick={() => updateSettings({ nightModeEnabled: !isNightActive })}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border shadow-lg backdrop-blur-md transition-all hover:scale-105 ${
            isNightActive
              ? 'bg-amber-500 text-neutral-950 border-amber-400 font-extrabold shadow-amber-500/30'
              : 'bg-neutral-900/90 hover:bg-neutral-800 text-amber-300 border-neutral-700 hover:border-amber-500/40'
          }`}
          title={
            isNightActive
              ? 'Desativar Modo Noturno (Pressione N para alternar)'
              : 'Ativar Modo Noturno para Fechamento (Pressione N)'
          }
        >
          {isNightActive ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          <span>{isNightActive ? 'Modo Noturno (Ativo)' : 'Modo Noturno'}</span>
        </button>

        <button
          onClick={() => openEditTitles('col1')}
          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900/90 hover:bg-neutral-800 text-amber-300 rounded-lg text-xs font-bold border border-amber-500/40 shadow-lg backdrop-blur-md transition-all hover:scale-105"
          title="Editar nomes das colunas e marca do rodapé"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Editar Títulos & Selo</span>
        </button>

        <button
          onClick={onOpenAdmin}
          className="flex items-center gap-2 px-3.5 py-2 bg-neutral-900/90 hover:bg-amber-600 text-amber-300 hover:text-white rounded-lg border border-amber-500/40 shadow-lg backdrop-blur-md transition-all text-xs font-bold uppercase tracking-wider"
          title="Abrir Painel Administrador"
        >
          <Sliders className="w-4 h-4" />
          <span>Painel Admin / Preços</span>
        </button>

        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-2 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 rounded-lg border border-neutral-700 shadow-lg backdrop-blur-md transition-all"
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Modo TV Tela Cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        )}
      </aside>

      {/* Main Board Container: Framed with rustic wood and metallic rivets */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto p-2 sm:p-4 lg:p-6 flex flex-col gap-3">
        {/* Top Header Bar for Store Name & Clock if enabled */}
        <header
          className={`flex flex-wrap items-center justify-between px-4 py-2 ${
            isNightActive ? 'bg-[#0f0c0a] border-neutral-900 shadow-lg' : 'bg-wood-header-plaque border-b border-white/10'
          } rounded-t-xl transition-colors duration-700`}
        >
          <div className="flex items-center gap-3">
            <div className="metal-rivet" />
            <div>
              <h1 className="font-bebas tracking-wider text-xl sm:text-2xl md:text-3xl text-amber-400 leading-none">
                {settings.storeName}
              </h1>
              <p className="text-[11px] sm:text-xs text-neutral-400 font-medium tracking-wide">
                {settings.storeSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            {isNightActive && (
              <button
                onClick={() => updateSettings({ nightModeEnabled: false })}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="Modo Noturno ativo para horário de fechamento. Clique para voltar ao modo diurno."
              >
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span>Modo Noturno ({dimLevel}%)</span>
              </button>
            )}
            {settings.phone && (
              <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-neutral-300">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>{settings.phone}</span>
              </div>
            )}
            {settings.showClock && (
              <div className="flex items-center gap-2 font-mono text-sm sm:text-base text-amber-300 bg-neutral-950/60 px-3 py-1 rounded border border-neutral-800 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{timeStr}</span>
                <span className="text-neutral-500">|</span>
                <span className="text-xs text-neutral-300">{dateStr}</span>
              </div>
            )}
            <div className={`metal-rivet ${isNightActive ? 'metal-rivet-night' : ''}`} />
          </div>
        </header>

        {/* If Maintenance Mode is Active: Render the Custom Store Maintenance Screen */}
        {settings.maintenanceModeEnabled ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 min-h-[460px]">
            <div
              className={`w-full max-w-3xl ${
                isNightActive ? 'bg-wood-frame-night border-neutral-900' : 'bg-wood-frame border-neutral-700'
              } p-6 sm:p-12 rounded-2xl border shadow-2xl relative text-center flex flex-col items-center justify-center gap-6 my-auto transition-colors duration-700`}
            >
              {/* 4 Screws in frame corners */}
              <div className={`absolute top-3 left-3 metal-rivet ${isNightActive ? 'metal-rivet-night' : ''}`} />
              <div className={`absolute top-3 right-3 metal-rivet ${isNightActive ? 'metal-rivet-night' : ''}`} />
              <div className={`absolute bottom-3 left-3 metal-rivet ${isNightActive ? 'metal-rivet-night' : ''}`} />
              <div className={`absolute bottom-3 right-3 metal-rivet ${isNightActive ? 'metal-rivet-night' : ''}`} />

              {/* Maintenance Plaque Header */}
              <div
                className={`py-1.5 px-6 rounded-md border ${
                  isNightActive ? 'bg-[#0f0c0a] border-neutral-900' : 'bg-wood-header-plaque border-neutral-700'
                } shadow-inner flex items-center gap-2`}
              >
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="font-condensed font-black tracking-widest uppercase text-xs sm:text-sm text-amber-300">
                  COMUNICADO AO CLIENTE
                </span>
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>

              {/* Animated Icon */}
              <div className="relative my-2">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-500/15 border-2 border-amber-500/50 flex items-center justify-center shadow-xl backdrop-blur-sm">
                  <Wrench className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 animate-bounce" />
                </div>
                <div className="absolute inset-0 rounded-full border border-amber-400/30 animate-ping pointer-events-none" />
              </div>

              {/* Custom Title */}
              <h2 className="font-bebas text-4xl sm:text-5xl md:text-6xl text-amber-400 tracking-wider leading-none drop-shadow-md">
                {settings.maintenanceTitle || 'SISTEMA EM ATUALIZAÇÃO'}
              </h2>

              {/* Custom Message */}
              <p className="font-body text-base sm:text-xl md:text-2xl text-neutral-100 max-w-xl leading-relaxed font-semibold">
                {settings.maintenanceMessage ||
                  'Estamos atualizando nossa tabela de cortes e preços para você. Retornaremos em instantes!'}
              </p>

              {/* Estimated return badge */}
              <div className="flex items-center gap-2 px-5 py-2.5 bg-neutral-950/90 border border-amber-500/40 rounded-xl shadow-lg">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-condensed font-bold text-sm sm:text-base text-amber-300 tracking-wide uppercase">
                  {settings.maintenanceEstimatedReturn || 'Retorno em poucos minutos'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-md flex flex-col items-center gap-2 pt-2">
                <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 rounded-full animate-pulse w-3/4 mx-auto" />
                </div>
                <span className="text-[11px] text-neutral-400 tracking-wider font-mono">
                  Sincronizando tabela de preços em tempo real
                </span>
              </div>

              {/* Discreet staff button */}
              <button
                onClick={onOpenAdmin}
                className="mt-2 text-xs text-neutral-500 hover:text-amber-400 font-semibold underline underline-offset-4 transition-colors cursor-pointer"
              >
                Acessar Painel Administrativo para Desativar
              </button>
            </div>
          </div>
        ) : (
          /* 2-Part Grid: Left Side = OFERTA DO DIA (Yellow Board); Right Side = Banner Image + Price List */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 flex-1">
          {/* ================= LEFT SIDE: BIG YELLOW SIGNBOARD "OFERTA DO DIA" ================= */}
          <div
            className={`lg:col-span-4 xl:col-span-4 flex flex-col ${
              isNightActive ? 'bg-wood-frame-night border-neutral-900' : 'bg-wood-frame border-neutral-800'
            } p-2 sm:p-3 rounded-xl border shadow-2xl relative transition-colors duration-700`}
          >
            {/* Top 4 Screws in frame corners */}
            <div className={`absolute top-2 left-2 metal-rivet ${isNightActive ? 'metal-rivet-night' : ''}`} />
            <div className={`absolute top-2 right-2 metal-rivet ${isNightActive ? 'metal-rivet-night' : ''}`} />
            <div className={`absolute bottom-2 left-2 metal-rivet ${isNightActive ? 'metal-rivet-night' : ''}`} />
            <div className={`absolute bottom-2 right-2 metal-rivet ${isNightActive ? 'metal-rivet-night' : ''}`} />

            {/* Plaque Header: OFERTA DO DIA */}
            <div
              className={`relative mb-2.5 mx-auto w-full max-w-[340px] ${
                isNightActive ? 'bg-[#0f0c0a] border-neutral-900' : 'bg-wood-header-plaque border-neutral-700'
              } py-2 px-6 rounded-md border flex items-center justify-between shadow-inner transition-colors duration-700`}
            >
              <div className={`metal-rivet ${isNightActive ? 'metal-rivet-night' : ''}`} />
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="font-bebas text-2xl sm:text-3xl md:text-4xl tracking-wider text-white drop-shadow">
                  OFERTA DO DIA
                </span>
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div className={`metal-rivet ${isNightActive ? 'metal-rivet-night' : ''}`} />
            </div>

            {/* The Big Yellow Signboard */}
            <div
              className={`flex-1 ${
                isNightActive
                  ? 'bg-gradient-to-b from-[#854d0e] via-[#713f12] to-[#451a03] border-amber-950/80 text-amber-50 shadow-inner'
                  : 'bg-amber-400 border-amber-600/30'
              } rounded-2xl border-4 p-4 sm:p-6 flex flex-col justify-between items-center text-center shadow-2xl relative overflow-hidden group transition-colors duration-700`}
            >
              {/* Subtle inner bevel / border highlight */}
              <div
                className={`absolute inset-1 rounded-xl border-2 ${
                  isNightActive ? 'border-amber-500/20' : 'border-amber-300/40'
                } pointer-events-none`}
              />

              {/* Offer Counter / Carousel Indicators if multiple offers */}
              {featuredOffers.length > 1 && (
                <div className="w-full flex items-center justify-between z-10 mb-1">
                  <button
                    onClick={goToPrevOffer}
                    className={`p-1 ${isNightActive ? 'text-amber-200 hover:bg-black/30' : 'text-neutral-900 hover:bg-amber-500/40'} rounded-full transition-colors`}
                    title="Oferta Anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-1.5">
                    {featuredOffers.map((item, idx) => (
                      <span
                        key={item.id}
                        className={`inline-block h-2 rounded-full transition-all ${
                          idx === activeOfferIndex % featuredOffers.length
                            ? isNightActive ? 'w-6 bg-amber-300' : 'w-6 bg-neutral-950'
                            : isNightActive ? 'w-2 bg-amber-200/30' : 'w-2 bg-neutral-950/30'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={goToNextOffer}
                    className={`p-1 ${isNightActive ? 'text-amber-200 hover:bg-black/30' : 'text-neutral-900 hover:bg-amber-500/40'} rounded-full transition-colors`}
                    title="Próxima Oferta"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Meat Name Header */}
              <div className="z-10 w-full px-2 pt-1 pb-1">
                {featured?.featuredSubtitle && (
                  <div
                    className={`text-[10px] sm:text-xs font-extrabold tracking-widest uppercase ${
                      isNightActive ? 'text-amber-200' : 'text-neutral-900'
                    } mb-0.5 line-clamp-1`}
                  >
                    {featured.featuredSubtitle}
                  </div>
                )}
                <h2
                  className={`font-condensed font-black text-3xl sm:text-4xl md:text-5xl lg:text-4xl xl:text-5xl ${
                    isNightActive ? 'text-amber-100' : 'text-neutral-950'
                  } uppercase tracking-tight leading-none drop-shadow-sm line-clamp-2`}
                >
                  {featured?.name || 'CORTE SELECIONADO'}
                </h2>
              </div>

              {/* Framed Featured Cut Photo - Enlarged and prominently framed */}
              {featured?.featuredImage && (
                <div className="my-auto w-full max-w-[96%] mx-auto z-10 py-1">
                  <div
                    className={`relative w-full ${
                      settings.featuredPhotoSize === 'medium'
                        ? 'h-40 sm:h-48 md:h-56 lg:h-44 xl:h-52'
                        : 'h-48 sm:h-56 md:h-64 lg:h-56 xl:h-64 2xl:h-72'
                    } rounded-2xl overflow-hidden border-4 ${
                      isNightActive ? 'border-neutral-800' : 'border-white/95'
                    } shadow-2xl bg-neutral-950`}
                  >
                    <img
                      src={featured.featuredImage}
                      alt={featured.name}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full ${
                        settings.featuredPhotoFit === 'contain' ? 'object-contain' : 'object-cover'
                      } object-center transform hover:scale-105 transition-transform duration-500 ${
                        isNightActive ? 'brightness-[0.85] contrast-[0.95]' : ''
                      }`}
                    />

                    {/* Discount or Deal Badge */}
                    {discountPercent > 0 ? (
                      <div className="absolute top-2.5 left-2.5 bg-red-600 text-white font-condensed font-black px-2.5 py-1 rounded-md text-xs sm:text-sm tracking-wider shadow-lg flex items-center gap-1 border border-white/40">
                        <span>-{discountPercent}% OFF</span>
                      </div>
                    ) : (
                      <div className="absolute top-2.5 left-2.5 bg-neutral-950/85 text-amber-400 font-condensed font-black px-2 py-0.5 rounded text-[10px] sm:text-xs tracking-wider shadow border border-amber-400/40">
                        <span>CORTE SELECIONADO</span>
                      </div>
                    )}

                    {/* Quality watermark seal */}
                    <div className="absolute bottom-2 right-2 bg-neutral-950/80 backdrop-blur-sm text-neutral-300 font-medium px-2 py-0.5 rounded text-[9px] sm:text-[10px] tracking-wide border border-white/10">
                      100% Fresco
                    </div>
                  </div>
                </div>
              )}

              {/* Price Details & Giant Numbers */}
              <div className="w-full z-10 mt-auto pt-1 flex flex-col items-center justify-center">
                {/* Original price strikethrough if offer */}
                {featured?.originalPrice && (
                  <div
                    className={`mb-0.5 ${
                      isNightActive ? 'text-amber-200/90' : 'text-neutral-900'
                    } text-xs sm:text-sm font-bold`}
                  >
                    <span>De </span>
                    <span
                      className={`line-through ${
                        isNightActive ? 'text-red-400 font-bold' : 'text-red-800 font-extrabold'
                      }`}
                    >
                      R$ {formatCurrency(featured.originalPrice)}
                    </span>
                    <span> por apenas:</span>
                  </div>
                )}

                {/* Giant Price: Massive numbers "5,79" */}
                <div
                  className={`flex items-baseline justify-center ${
                    isNightActive ? 'text-amber-300' : 'text-neutral-950'
                  } font-condensed font-black leading-none tracking-tighter`}
                >
                  <span className="text-3xl sm:text-4xl md:text-5xl mr-1 font-extrabold">R$</span>
                  <span className="text-6xl sm:text-7xl md:text-8xl lg:text-7xl xl:text-8xl tracking-tight">
                    {formattedPriceParts[0]}
                  </span>
                  <div className="flex flex-col text-left ml-1">
                    <span className="text-3xl sm:text-4xl md:text-5xl font-black">
                      ,{formattedPriceParts[1]}
                    </span>
                    <span
                      className={`text-xs sm:text-base font-extrabold uppercase ${
                        isNightActive ? 'text-amber-200' : 'text-neutral-900'
                      } tracking-wider`}
                    >
                      /{featured?.unit || 'kg'}
                    </span>
                  </div>
                </div>

                <div
                  className={`mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold ${
                    isNightActive ? 'text-amber-300/80' : 'text-neutral-800'
                  } uppercase tracking-wider`}
                >
                  <Award className={`w-3.5 h-3.5 ${isNightActive ? 'text-amber-400' : 'text-neutral-900'}`} />
                  <span>PREÇO ESPECIAL • APROVEITE HOJE</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT SIDE: TOP BANNER PHOTO + 2-COLUMN PRICE LIST ================= */}
          <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-3">
            {/* Top Banner: Meat Photo Inset Frame with Screws (Exact match to reference photo) */}
            {settings.showBannerImage && settings.bannerImageUrl && (
              <div
                className={`relative rounded-xl overflow-hidden border-2 ${
                  isNightActive ? 'border-neutral-800' : 'border-white/20'
                } bg-neutral-950 shadow-2xl h-36 sm:h-44 md:h-52 transition-colors duration-700`}
              >
                <img
                  src={settings.bannerImageUrl}
                  alt="Carnes frescas selecionadas"
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover object-center ${
                    isNightActive ? 'brightness-75 contrast-95 sepia-[0.10]' : ''
                  } transition-all duration-700`}
                />

                {/* Corner rivets on top frame */}
                <div className={`absolute top-2 left-2 metal-rivet ${isNightActive ? 'metal-rivet-night' : ''}`} />
                <div className={`absolute top-2 right-2 metal-rivet ${isNightActive ? 'metal-rivet-night' : ''}`} />
                <div className={`absolute bottom-2 left-2 metal-rivet ${isNightActive ? 'metal-rivet-night' : ''}`} />
                <div className={`absolute bottom-2 right-2 metal-rivet ${isNightActive ? 'metal-rivet-night' : ''}`} />

                {/* Subtle gradient vignette to blend */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/60 pointer-events-none" />

                {/* Top overlay badge - Click to edit */}
                <button
                  type="button"
                  onClick={() => openEditTitles('banner')}
                  className="absolute bottom-3 right-4 bg-neutral-950/85 hover:bg-neutral-950 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 hover:border-amber-400 text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5 shadow-lg group cursor-pointer transition-all"
                  title="Clique para editar este texto do banner"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{settings.bannerBadgeText || 'Qualidade & Procedência 100% Inspecionada'}</span>
                  <Edit3 className="w-3 h-3 text-amber-400/80 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                </button>
              </div>
            )}

            {/* Price Lists: 2 Wooden Columns with Planks & Metal Rivets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
              {/* Column 1 */}
              <div
                className={`${
                  isNightActive ? 'bg-wood-frame-night border-neutral-900' : 'bg-wood-frame border-neutral-800'
                } p-2 rounded-xl border shadow-xl flex flex-col gap-1.5 relative transition-colors duration-700`}
              >
                <div className={`absolute top-1.5 left-1.5 metal-rivet ${isNightActive ? 'metal-rivet-night' : ''}`} />
                <div className={`absolute top-1.5 right-1.5 metal-rivet ${isNightActive ? 'metal-rivet-night' : ''}`} />

                <div
                  onClick={() => openEditTitles('col1')}
                  className="pt-3 pb-1 px-2 border-b border-white/10 flex items-center justify-between group cursor-pointer hover:bg-white/5 rounded transition-colors"
                  title="Clique para editar o título desta coluna"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-bebas text-sm sm:text-base tracking-wider text-amber-400 uppercase">
                      {settings.column1Title || 'AVES, SUÍNOS & ESPECIAIS'}
                    </span>
                    <Edit3 className="w-3 h-3 text-amber-400/70 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">PREÇO / UNIDADE</span>
                </div>

                <div className="flex flex-col gap-1 flex-1">
                  {column1.map((item) => {
                    const isUpdated = lastUpdatedItemId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between px-3 py-1.5 sm:py-2 rounded ${
                          isNightActive
                            ? 'bg-wood-plank-night hover:bg-neutral-900 border-neutral-900'
                            : 'bg-wood-plank hover:bg-[#221c19] border-b border-black/40'
                        } shadow-sm transition-all duration-300 ${
                          isUpdated ? 'animate-price-flash ring-2 ring-amber-400' : ''
                        }`}
                      >
                        {/* Meat item name + (OFERTA) badge */}
                        <div className="flex items-center gap-2 overflow-hidden pr-2">
                          <span className="text-amber-500 text-lg leading-none select-none">•</span>
                          <span className="font-condensed font-bold text-base sm:text-lg lg:text-xl text-neutral-100 uppercase tracking-wide truncate">
                            {item.name}
                          </span>
                          {item.isOffer && (
                            <span className="text-amber-400 font-extrabold text-xs sm:text-sm tracking-wide shrink-0">
                              (OFERTA)
                            </span>
                          )}
                        </div>

                        {/* Price aligned to right */}
                        <div className="shrink-0 font-condensed font-extrabold text-base sm:text-lg lg:text-xl text-white tabular-nums tracking-wide flex items-baseline gap-1">
                          <span className="text-amber-300 text-sm font-semibold">R$</span>
                          <span>{formatCurrency(item.price)}</span>
                          <span className="text-neutral-400 text-xs font-semibold lowercase">
                            /{item.unit || 'kg'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Column 2 */}
              <div
                className={`${
                  isNightActive ? 'bg-wood-frame-night border-neutral-900' : 'bg-wood-frame border-neutral-800'
                } p-2 rounded-xl border shadow-xl flex flex-col gap-1.5 relative transition-colors duration-700`}
              >
                <div className={`absolute top-1.5 left-1.5 metal-rivet ${isNightActive ? 'metal-rivet-night' : ''}`} />
                <div className={`absolute top-1.5 right-1.5 metal-rivet ${isNightActive ? 'metal-rivet-night' : ''}`} />

                <div
                  onClick={() => openEditTitles('col2')}
                  className="pt-3 pb-1 px-2 border-b border-white/10 flex items-center justify-between group cursor-pointer hover:bg-white/5 rounded transition-colors"
                  title="Clique para editar o título desta coluna"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-bebas text-sm sm:text-base tracking-wider text-amber-400 uppercase">
                      {settings.column2Title || 'CORTES BOVINOS NOBRES'}
                    </span>
                    <Edit3 className="w-3 h-3 text-amber-400/70 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">PREÇO / UNIDADE</span>
                </div>

                <div className="flex flex-col gap-1 flex-1">
                  {column2.map((item) => {
                    const isUpdated = lastUpdatedItemId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between px-3 py-1.5 sm:py-2 rounded ${
                          isNightActive
                            ? 'bg-wood-plank-night hover:bg-neutral-900 border-neutral-900'
                            : 'bg-wood-plank hover:bg-[#221c19] border-b border-black/40'
                        } shadow-sm transition-all duration-300 ${
                          isUpdated ? 'animate-price-flash ring-2 ring-amber-400' : ''
                        }`}
                      >
                        {/* Meat item name + (OFERTA) badge */}
                        <div className="flex items-center gap-2 overflow-hidden pr-2">
                          <span className="text-amber-500 text-lg leading-none select-none">•</span>
                          <span className="font-condensed font-bold text-base sm:text-lg lg:text-xl text-neutral-100 uppercase tracking-wide truncate">
                            {item.name}
                          </span>
                          {item.isOffer && (
                            <span className="text-amber-400 font-extrabold text-xs sm:text-sm tracking-wide shrink-0">
                              (OFERTA)
                            </span>
                          )}
                        </div>

                        {/* Price aligned to right */}
                        <div className="shrink-0 font-condensed font-extrabold text-base sm:text-lg lg:text-xl text-white tabular-nums tracking-wide flex items-baseline gap-1">
                          <span className="text-amber-300 text-sm font-semibold">R$</span>
                          <span>{formatCurrency(item.price)}</span>
                          <span className="text-neutral-400 text-xs font-semibold lowercase">
                            /{item.unit || 'kg'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ================= BOTTOM TICKER & BRAND BADGE ================= */}
        <footer className="mt-2 bg-neutral-950/90 border border-neutral-800 rounded-lg p-2.5 flex items-center justify-between overflow-hidden shadow-inner">
          {/* Marquee message text */}
          <div className="overflow-hidden whitespace-nowrap flex-1 mr-4">
            <div className="animate-marquee font-condensed font-bold text-xs sm:text-sm md:text-base text-neutral-200 tracking-wider flex items-center gap-8">
              <span>{settings.tickerMessage}</span>
              <span className="text-amber-400 font-extrabold">★★★</span>
              <span>{settings.tickerMessage}</span>
              <span className="text-amber-400 font-extrabold">★★★</span>
            </div>
          </div>

          {/* Shop Monogram Seal (Like the 'M' icon in bottom right of reference photo) */}
          <div
            onClick={() => openEditTitles('badge')}
            className="shrink-0 flex items-center gap-2 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 rounded-md cursor-pointer transition-all group"
            title="Clique para editar o selo e nome do rodapé"
          >
            <span className="font-bebas text-amber-400 text-lg leading-none">
              {settings.badgeInitials || 'BN'}
            </span>
            <div className="text-[10px] uppercase font-bold text-neutral-300 leading-tight hidden sm:block">
              <div className="flex items-center gap-1">
                <span>{settings.badgeTitle || 'BOI NOBRE'}</span>
                <Edit3 className="w-2.5 h-2.5 text-amber-400/70 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="block text-[8px] text-amber-400/80">
                {settings.badgeSubtitle || 'CASA DE CARNES'}
              </span>
            </div>
          </div>
        </footer>
      </main>

      {/* Quick Edit Modal for Column Titles & Footer Brand */}
      <EditBoardTitlesModal
        isOpen={showEditTitlesModal}
        onClose={() => setShowEditTitlesModal(false)}
        initialFocusField={editFocusField}
      />
    </div>
  );
};
