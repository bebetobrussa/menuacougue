import React, { useState, useRef } from 'react';
import { useMenu } from '../context/MenuContext.tsx';
import { StoreSettings } from '../types.ts';
import { DEFAULT_SETTINGS } from '../defaultData.ts';
import { compressImageFile } from '../utils/imageUpload.ts';
import {
  Save,
  RotateCcw,
  Download,
  Upload,
  Volume2,
  VolumeX,
  Store,
  Check,
  AlertTriangle,
  Lock,
  KeyRound,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  Link as LinkIcon,
  RefreshCw,
  Moon,
  Sun,
  Wrench,
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToDefaults,
    exportDataJson,
    importDataJson,
    changeAdminPin,
    lockAdmin,
    setIsTvMode,
    refreshFromServer,
    lastServerSync,
    isSyncing,
  } = useMenu();

  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [saveFeedback, setSaveFeedback] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Change PIN states
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [pinFeedback, setPinFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Banner Upload states
  const [isUploadingBanner, setIsUploadingBanner] = useState<boolean>(false);
  const [bannerUploadMsg, setBannerUploadMsg] = useState<string | null>(null);
  const [showBannerUrlInput, setShowBannerUrlInput] = useState<boolean>(false);
  const [bannerUrlInput, setBannerUrlInput] = useState<string>('');
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingBanner(true);
      setBannerUploadMsg('Otimizando imagem do banner para a TV...');

      // Compress to optimal landscape banner dimensions
      const dataUrl = await compressImageFile(file, 1280, 600, 0.86);

      const updated: StoreSettings = {
        ...formData,
        bannerImageUrl: dataUrl,
        showBannerImage: true,
      };
      setFormData(updated);
      updateSettings({ bannerImageUrl: dataUrl, showBannerImage: true });

      setBannerUploadMsg('✓ Novo banner carregado e atualizado na TV!');
      setTimeout(() => setBannerUploadMsg(null), 3500);
    } catch (err) {
      console.error(err);
      setBannerUploadMsg('Erro ao processar imagem do banner.');
    } finally {
      setIsUploadingBanner(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
    }
  };

  const handleBannerUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerUrlInput.trim()) return;

    const updated: StoreSettings = {
      ...formData,
      bannerImageUrl: bannerUrlInput.trim(),
      showBannerImage: true,
    };
    setFormData(updated);
    updateSettings({ bannerImageUrl: bannerUrlInput.trim(), showBannerImage: true });
    setBannerUrlInput('');
    setShowBannerUrlInput(false);
    setBannerUploadMsg('✓ Banner via link atualizado com sucesso!');
    setTimeout(() => setBannerUploadMsg(null), 3500);
  };

  const handleResetDefaultBanner = () => {
    const defaultBanner = DEFAULT_SETTINGS.bannerImageUrl;
    const updated: StoreSettings = {
      ...formData,
      bannerImageUrl: defaultBanner,
    };
    setFormData(updated);
    updateSettings({ bannerImageUrl: defaultBanner });
    setBannerUploadMsg('✓ Banner padrão restaurado.');
    setTimeout(() => setBannerUploadMsg(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2500);
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== confirmPin) {
      setPinFeedback({ type: 'error', text: 'A nova senha e a confirmação não coincidem.' });
      return;
    }

    const res = changeAdminPin(currentPin, newPin);
    if (res.success) {
      setPinFeedback({ type: 'success', text: res.message });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setTimeout(() => setPinFeedback(null), 4000);
    } else {
      setPinFeedback({ type: 'error', text: res.message });
    }
  };

  const handleExport = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `menu_acougue_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const ok = importDataJson(text);
        if (ok) {
          alert('Backup restaurado com sucesso!');
          setImportError(null);
        } else {
          setImportError('Arquivo de backup inválido.');
        }
      } catch {
        setImportError('Erro ao ler arquivo.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Store identity section */}
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Store className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">
              Identificação do Estabelecimento
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Nome do Açougue / Boutique:
              </label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none uppercase font-bold"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Slogan / Subtítulo:
              </label>
              <input
                type="text"
                value={formData.storeSubtitle}
                onChange={(e) => setFormData({ ...formData, storeSubtitle: e.target.value })}
                className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Telefone de Contato:
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 3456-7890"
                className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                WhatsApp para Encomendas:
              </label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="(11) 98765-4321"
                className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Marquee ticker message */}
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-xs font-semibold text-neutral-300">
              Texto do Rodapé Letreiro Digital (Letreiro Animado):
            </label>
            <textarea
              rows={2}
              value={formData.tickerMessage}
              onChange={(e) => setFormData({ ...formData, tickerMessage: e.target.value })}
              className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
            />
            <span className="text-[11px] text-neutral-400">
              Esta mensagem corre continuamente na parte inferior da TV, informando formas de pagamento, horários ou avisos.
            </span>
          </div>
        </div>

        {/* Display and TV Options */}
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex flex-col gap-4">
          <h3 className="font-bold text-white text-base border-b border-neutral-800 pb-3">
            Títulos das Colunas da TV & Marca do Rodapé
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Título da Coluna 1 (Esquerda):
              </label>
              <input
                type="text"
                value={formData.column1Title || 'AVES, SUÍNOS & ESPECIAIS'}
                onChange={(e) => setFormData({ ...formData, column1Title: e.target.value })}
                placeholder="AVES, SUÍNOS & ESPECIAIS"
                className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white font-bold uppercase focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[10px] text-neutral-400">
                Exibido no topo da primeira coluna da TV
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Título da Coluna 2 (Direita):
              </label>
              <input
                type="text"
                value={formData.column2Title || 'CORTES BOVINOS NOBRES'}
                onChange={(e) => setFormData({ ...formData, column2Title: e.target.value })}
                placeholder="CORTES BOVINOS NOBRES"
                className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white font-bold uppercase focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[10px] text-neutral-400">
                Exibido no topo da segunda coluna da TV
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-neutral-800">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Sigla do Logo (Rodapé):
              </label>
              <input
                type="text"
                maxLength={5}
                value={formData.badgeInitials || 'BN'}
                onChange={(e) => setFormData({ ...formData, badgeInitials: e.target.value })}
                placeholder="BN"
                className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white font-bebas text-center text-lg uppercase focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Nome da Marca (Rodapé):
              </label>
              <input
                type="text"
                value={formData.badgeTitle || 'BOI NOBRE'}
                onChange={(e) => setFormData({ ...formData, badgeTitle: e.target.value })}
                placeholder="BOI NOBRE"
                className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white font-bold uppercase focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Subtítulo do Selo (Rodapé):
              </label>
              <input
                type="text"
                value={formData.badgeSubtitle || 'CASA DE CARNES'}
                onChange={(e) => setFormData({ ...formData, badgeSubtitle: e.target.value })}
                placeholder="CASA DE CARNES"
                className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white font-bold uppercase focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Display and TV Options */}
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex flex-col gap-4">
          <h3 className="font-bold text-white text-base border-b border-neutral-800 pb-3">
            Preferências de Exibição na TV
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showClock}
                onChange={(e) => setFormData({ ...formData, showClock: e.target.checked })}
                className="rounded accent-amber-500 w-4 h-4"
              />
              <div>
                <span className="text-sm font-semibold text-white block">Exibir Relógio em Tempo Real</span>
                <span className="text-xs text-neutral-400">Mostra a hora e a data atual no cabeçalho</span>
              </div>
            </label>

            {/* Banner Section with Upload, URL, and Preview */}
            <div className="sm:col-span-2 p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showBannerImage}
                    onChange={(e) => setFormData({ ...formData, showBannerImage: e.target.checked })}
                    className="rounded accent-amber-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-sm font-semibold text-white block">Exibir Banner de Carnes no Topo</span>
                    <span className="text-xs text-neutral-400">Quadro com foto de carnes frescas sobre a lista de preços</span>
                  </div>
                </label>

                {/* Banner Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    disabled={isUploadingBanner}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition-all shadow disabled:opacity-50"
                    title="Enviar nova foto de banner do seu computador ou celular"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isUploadingBanner ? 'Enviando...' : 'Enviar Novo Banner'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowBannerUrlInput(!showBannerUrlInput)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 rounded-lg text-xs font-semibold transition-all"
                    title="Usar imagem através de link externo"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Por Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetDefaultBanner}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg text-xs transition-colors"
                    title="Restaurar banner padrão de carnes frescas"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Padrão</span>
                  </button>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={bannerFileInputRef}
                    accept="image/*"
                    onChange={handleBannerFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* URL Input Form if toggled */}
              {showBannerUrlInput && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="url"
                    value={bannerUrlInput}
                    onChange={(e) => setBannerUrlInput(e.target.value)}
                    placeholder="https://exemplo.com/banner-carnes.jpg"
                    className="flex-1 px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleBannerUrlSubmit}
                    className="px-3 py-1.5 bg-amber-500 text-neutral-950 font-bold text-xs rounded-lg hover:bg-amber-400"
                  >
                    Salvar Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBannerUrlInput(false)}
                    className="px-2.5 py-1.5 bg-neutral-800 text-neutral-400 text-xs rounded-lg hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {/* Status Message */}
              {bannerUploadMsg && (
                <div className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 p-2 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{bannerUploadMsg}</span>
                </div>
              )}

              {/* Banner Badge Text input */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-neutral-800">
                <label className="text-xs font-semibold text-neutral-300">
                  Texto do Selo do Banner:
                </label>
                <input
                  type="text"
                  value={formData.bannerBadgeText || 'Qualidade & Procedência 100% Inspecionada'}
                  onChange={(e) => setFormData({ ...formData, bannerBadgeText: e.target.value })}
                  placeholder="Qualidade & Procedência 100% Inspecionada"
                  className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-neutral-400">
                  Substitui o texto original &quot;Qualidade &amp; Procedência 100% Inspecionada&quot; exibido no selo sobre o banner da TV.
                </span>
              </div>

              {/* Current Banner Preview Thumbnail */}
              {formData.bannerImageUrl && (
                <div className="relative rounded-lg overflow-hidden border border-neutral-800 bg-black max-h-36 w-full shadow-inner flex items-center justify-center">
                  <img
                    src={formData.bannerImageUrl}
                    alt="Banner atual do topo da TV"
                    referrerPolicy="no-referrer"
                    className="w-full h-32 object-cover object-center"
                  />
                  <div className="absolute top-2 left-2 bg-neutral-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-amber-400 border border-white/10">
                    Prévia do Banner Atual na TV
                  </div>
                  <div className="absolute bottom-2 right-2 text-[10px] text-amber-300 font-bold bg-neutral-950/85 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                    {formData.bannerBadgeText || 'Qualidade & Procedência 100% Inspecionada'}
                  </div>
                </div>
              )}
            </div>

            <label className="flex items-center gap-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.soundAlertOnPriceUpdate}
                onChange={(e) => setFormData({ ...formData, soundAlertOnPriceUpdate: e.target.checked })}
                className="rounded accent-amber-500 w-4 h-4"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {formData.soundAlertOnPriceUpdate ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
                  <span className="text-sm font-semibold text-white">Sinal Sonoro na Atualização</span>
                </div>
                <span className="text-xs text-neutral-400">Toca um som suave de sino na TV quando o preço mudar</span>
              </div>
            </label>

            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col justify-center">
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Tempo de Rotação da Oferta do Dia:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="4"
                  max="30"
                  step="1"
                  value={formData.rotationIntervalSeconds}
                  onChange={(e) => setFormData({ ...formData, rotationIntervalSeconds: Number(e.target.value) })}
                  className="flex-1 accent-amber-500"
                />
                <span className="font-mono text-sm font-bold text-amber-400 w-12 text-right">
                  {formData.rotationIntervalSeconds}s
                </span>
              </div>
            </div>

            {/* Modo Noturno para Fechamento da Loja */}
            <div className="sm:col-span-2 p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Modo Noturno (Fechamento da Loja)</span>
                      {formData.nightModeEnabled && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Ativo Agora
                        </span>
                      )}
                    </h4>
                    <span className="text-xs text-neutral-400">
                      Reduz o brilho da tela e aplica uma paleta em tons mais escuros para evitar poluição visual e excesso de claridade na vitrine à noite.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !formData.nightModeEnabled;
                    setFormData({ ...formData, nightModeEnabled: nextVal });
                    updateSettings({ nightModeEnabled: nextVal });
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow ${
                    formData.nightModeEnabled
                      ? 'bg-amber-500 text-neutral-950 hover:bg-amber-400'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                  }`}
                >
                  {formData.nightModeEnabled ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  <span>{formData.nightModeEnabled ? 'Desativar Modo Noturno' : 'Ativar Modo Noturno Agora'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Auto Toggle by Time */}
                <label className="flex items-center gap-3 p-3 bg-neutral-900 rounded-xl border border-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.nightModeAuto ?? false}
                    onChange={(e) => {
                      const nextAuto = e.target.checked;
                      setFormData({ ...formData, nightModeAuto: nextAuto });
                      updateSettings({ nightModeAuto: nextAuto });
                    }}
                    className="rounded accent-amber-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white block">Ativação Automática no Fechamento</span>
                    <span className="text-[11px] text-neutral-400">
                      Liga o modo noturno automaticamente durante o horário programado
                    </span>
                  </div>
                </label>

                {/* Dimming Slider */}
                <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-neutral-300">
                      Nível de Brilho Noturno na TV:
                    </label>
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {formData.nightModeDimLevel ?? 65}% de Brilho
                    </span>
                  </div>
                  <input
                    type="range"
                    min="35"
                    max="85"
                    step="5"
                    value={formData.nightModeDimLevel ?? 65}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormData({ ...formData, nightModeDimLevel: val });
                      updateSettings({ nightModeDimLevel: val });
                    }}
                    className="accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                    <span>35% (Mais escuro / Discreto)</span>
                    <span>65% (Recomendado)</span>
                    <span>85% (Suave)</span>
                  </div>
                </div>
              </div>

              {formData.nightModeAuto && (
                <div className="flex flex-wrap items-center gap-3 p-3 bg-neutral-900/70 rounded-xl border border-neutral-800 text-xs text-neutral-300">
                  <span className="font-semibold text-white">Horário Programado:</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-amber-400">
                    <span className="text-neutral-400 text-xs">Das</span>
                    <select
                      value={formData.nightModeStartHour ?? 19}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormData({ ...formData, nightModeStartHour: val });
                        updateSettings({ nightModeStartHour: val });
                      }}
                      className="bg-neutral-950 border border-neutral-700 px-2 py-1 rounded text-white text-xs font-mono"
                    >
                      {Array.from({ length: 24 }).map((_, h) => (
                        <option key={h} value={h}>
                          {h.toString().padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>

                    <span className="text-neutral-400 text-xs">às</span>

                    <select
                      value={formData.nightModeEndHour ?? 7}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormData({ ...formData, nightModeEndHour: val });
                        updateSettings({ nightModeEndHour: val });
                      }}
                      className="bg-neutral-950 border border-neutral-700 px-2 py-1 rounded text-white text-xs font-mono"
                    >
                      {Array.from({ length: 24 }).map((_, h) => (
                        <option key={h} value={h}>
                          {h.toString().padStart(2, '0')}:00
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-[11px] text-neutral-400">
                    (Ex: 19:00 às 07:00 da manhã seguinte)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-sm transition-all shadow-md"
            >
              {saveFeedback ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{saveFeedback ? 'Configurações Salvas!' : 'Salvar Configurações'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Modo de Manutenção na TV */}
      <div
        className={`border p-5 rounded-2xl flex flex-col gap-4 shadow-xl transition-all ${
          formData.maintenanceModeEnabled
            ? 'bg-amber-950/20 border-amber-500/60 shadow-amber-500/10'
            : 'bg-neutral-900 border-neutral-800'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                formData.maintenanceModeEnabled
                  ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md'
                  : 'bg-neutral-800 text-amber-400 border-neutral-700'
              }`}
            >
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-white text-base">
                  Modo de Manutenção na TV
                </h3>
                {formData.maintenanceModeEnabled ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    ATIVO NA TV
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
                    Desativado
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Exibe uma mensagem personalizada na TV informando aos clientes que o sistema está em atualização
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const nextVal = !formData.maintenanceModeEnabled;
                setFormData({ ...formData, maintenanceModeEnabled: nextVal });
                updateSettings({
                  maintenanceModeEnabled: nextVal,
                  maintenanceTitle: formData.maintenanceTitle,
                  maintenanceMessage: formData.maintenanceMessage,
                  maintenanceEstimatedReturn: formData.maintenanceEstimatedReturn,
                });
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all ${
                formData.maintenanceModeEnabled
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold shadow-amber-500/20'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>
                {formData.maintenanceModeEnabled
                  ? 'Desativar Manutenção (Voltar à TV)'
                  : 'Ativar Modo de Manutenção na TV'}
              </span>
            </button>

            {formData.maintenanceModeEnabled && (
              <button
                type="button"
                onClick={() => setIsTvMode(true)}
                className="px-3 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded-xl text-xs font-semibold border border-neutral-700 transition-colors"
                title="Ver como o aviso está aparecendo na TV"
              >
                Ver na TV
              </button>
            )}
          </div>
        </div>

        {/* Customization Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-300">
                Título do Aviso na TV:
              </label>
              <input
                type="text"
                value={formData.maintenanceTitle ?? 'SISTEMA EM ATUALIZAÇÃO'}
                onChange={(e) => setFormData({ ...formData, maintenanceTitle: e.target.value })}
                placeholder="Ex: SISTEMA EM ATUALIZAÇÃO"
                className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none font-semibold"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-300">
                Previsão de Retorno / Subtítulo:
              </label>
              <input
                type="text"
                value={formData.maintenanceEstimatedReturn ?? 'Retorno em poucos minutos'}
                onChange={(e) => setFormData({ ...formData, maintenanceEstimatedReturn: e.target.value })}
                placeholder="Ex: Retorno em poucos minutos"
                className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-neutral-300">
                Mensagem Explicativa aos Clientes:
              </label>
              <textarea
                rows={3}
                value={formData.maintenanceMessage ?? 'Estamos atualizando nossa tabela de cortes e preços para você. Retornaremos em instantes!'}
                onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
                placeholder="Mensagem exibida na tela da TV..."
                className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="pt-1 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">
                * Os textos salvos atualizam em tempo real na tela da TV.
              </span>
              <button
                type="button"
                onClick={() => {
                  updateSettings({
                    maintenanceTitle: formData.maintenanceTitle,
                    maintenanceMessage: formData.maintenanceMessage,
                    maintenanceEstimatedReturn: formData.maintenanceEstimatedReturn,
                  });
                  setSaveFeedback(true);
                  setTimeout(() => setSaveFeedback(false), 2000);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold rounded-lg text-xs border border-neutral-700 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Textos do Aviso</span>
              </button>
            </div>
          </div>

          {/* Mini Live Preview of Maintenance Screen on TV */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-neutral-400">
              Pré-visualização do Aviso na TV:
            </span>
            <div className="flex-1 min-h-[220px] bg-wood-dark border border-neutral-700 rounded-xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-inner">
              <div className="absolute top-2 left-2 metal-rivet scale-75" />
              <div className="absolute top-2 right-2 metal-rivet scale-75" />
              <div className="absolute bottom-2 left-2 metal-rivet scale-75" />
              <div className="absolute bottom-2 right-2 metal-rivet scale-75" />

              <div className="p-2.5 bg-amber-500/10 rounded-full border border-amber-500/30 text-amber-400 mb-2">
                <Wrench className="w-6 h-6 animate-pulse" />
              </div>

              <h4 className="font-bebas text-xl sm:text-2xl text-amber-400 tracking-wider leading-none mb-1">
                {formData.maintenanceTitle || 'SISTEMA EM ATUALIZAÇÃO'}
              </h4>

              <p className="text-xs text-neutral-300 max-w-[280px] leading-relaxed mb-2 font-medium">
                {formData.maintenanceMessage || 'Estamos atualizando nossa tabela de cortes e preços para você. Retornaremos em instantes!'}
              </p>

              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 border border-neutral-700 text-amber-300">
                {formData.maintenanceEstimatedReturn || 'Retorno em poucos minutos'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Admin PIN Protection */}
      <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-white text-base">
                Segurança & Senha do Painel Admin
              </h3>
              <p className="text-xs text-neutral-400">
                Proteja o acesso para que clientes ou funcionários não autorizados não alterem os preços
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              lockAdmin();
              setIsTvMode(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-900/50 text-red-300 rounded-lg text-xs font-bold border border-red-800 transition-colors"
            title="Bloquear agora e voltar à TV"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Bloquear Painel Agora</span>
          </button>
        </div>

        {/* Require PIN Toggle */}
        <label className="flex items-center gap-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.requirePinForAdmin}
            onChange={(e) => {
              const updated = { ...formData, requirePinForAdmin: e.target.checked };
              setFormData(updated);
              updateSettings({ requirePinForAdmin: e.target.checked });
            }}
            className="rounded accent-amber-500 w-4 h-4"
          />
          <div>
            <span className="text-sm font-semibold text-white block">
              Exigir Senha para Entrar no Painel Admin / Preços
            </span>
            <span className="text-xs text-neutral-400">
              {formData.requirePinForAdmin
                ? 'Ativado: ao clicar em "Painel Admin" na TV, o sistema solicitará a senha.'
                : 'Desativado: qualquer pessoa na TV poderá abrir o painel sem digitar senha.'}
            </span>
          </div>
        </label>

        {/* Change PIN Form */}
        <form onSubmit={handleChangePinSubmit} className="flex flex-col gap-3 pt-2">
          <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Alterar Senha do Administrador</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-neutral-400">
                Senha Atual *:
              </label>
              <input
                type="password"
                required
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="Ex: 1310"
                className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-neutral-400">
                Nova Senha *:
              </label>
              <input
                type="password"
                required
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-neutral-400">
                Confirmar Nova Senha *:
              </label>
              <input
                type="password"
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Repita a nova senha"
                className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {pinFeedback && (
            <div
              className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 border ${
                pinFeedback.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-red-950/60 border-red-800 text-red-300'
              }`}
            >
              {pinFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{pinFeedback.text}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-neutral-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Senha padrão inicial de fábrica: <strong className="text-amber-300 font-mono">1310</strong></span>
            </span>

            <button
              type="submit"
              className="px-4 py-2 bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-white font-bold rounded-lg text-xs uppercase tracking-wider border border-neutral-700 hover:border-amber-400 transition-all"
            >
              Salvar Nova Senha
            </button>
          </div>
        </form>
      </div>

      {/* Backup and Maintenance */}
      <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex flex-col gap-4">
        <h3 className="font-bold text-white text-base border-b border-neutral-800 pb-3">
          Backup, Exportação & Restauração
        </h3>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-bold border border-neutral-700 transition-colors"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Fazer Backup (Exportar JSON)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-bold border border-neutral-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Restaurar Backup (Importar JSON)</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja realmente restaurar os cortes e preços de fábrica do exemplo original?')) {
                resetToDefaults();
                setFormData(settings);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-950/40 hover:bg-red-900/50 text-red-300 rounded-lg text-xs font-bold border border-red-800 transition-colors ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Padrão do Exemplo</span>
          </button>
        </div>

        {importError && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/40 p-2.5 rounded border border-red-800">
            <AlertTriangle className="w-4 h-4" />
            <span>{importError}</span>
          </div>
        )}

        {/* Server Sync / Polling info */}
        <div className="pt-3 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              Sincronização com o Servidor: <strong className="text-neutral-200">Sob demanda</strong>
              {lastServerSync && (
                <span className="text-neutral-500 ml-2">
                  (Última sincronização: {lastServerSync.toLocaleTimeString('pt-BR')})
                </span>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={() => refreshFromServer()}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg text-xs font-bold border border-amber-500/30 transition-all hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar com o Servidor Agora'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
