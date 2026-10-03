import React, { useState, useEffect, useRef } from 'react';
import { useMenu } from '../context/MenuContext.tsx';
import { compressImageFile } from '../utils/imageUpload.ts';
import { Edit3, Check, X, Tag, Sparkles, Store, Camera, Image as ImageIcon } from 'lucide-react';

interface EditBoardTitlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFocusField?: 'col1' | 'col2' | 'badge' | 'banner';
}

export const EditBoardTitlesModal: React.FC<EditBoardTitlesModalProps> = ({
  isOpen,
  onClose,
  initialFocusField = 'col1',
}) => {
  const { settings, updateSettings } = useMenu();

  const [col1Title, setCol1Title] = useState<string>(
    settings.column1Title || 'AVES, SUÍNOS & ESPECIAIS'
  );
  const [col2Title, setCol2Title] = useState<string>(
    settings.column2Title || 'CORTES BOVINOS NOBRES'
  );
  const [badgeInitials, setBadgeInitials] = useState<string>(
    settings.badgeInitials || 'BN'
  );
  const [badgeTitle, setBadgeTitle] = useState<string>(
    settings.badgeTitle || 'BOI NOBRE'
  );
  const [badgeSubtitle, setBadgeSubtitle] = useState<string>(
    settings.badgeSubtitle || 'CASA DE CARNES'
  );
  const [bannerImageUrl, setBannerImageUrl] = useState<string>(
    settings.bannerImageUrl || ''
  );
  const [bannerBadgeText, setBannerBadgeText] = useState<string>(
    settings.bannerBadgeText || 'Qualidade & Procedência 100% Inspecionada'
  );
  const [isUploadingBanner, setIsUploadingBanner] = useState<boolean>(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<boolean>(false);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCol1Title(settings.column1Title || 'AVES, SUÍNOS & ESPECIAIS');
      setCol2Title(settings.column2Title || 'CORTES BOVINOS NOBRES');
      setBadgeInitials(settings.badgeInitials || 'BN');
      setBadgeTitle(settings.badgeTitle || 'BOI NOBRE');
      setBadgeSubtitle(settings.badgeSubtitle || 'CASA DE CARNES');
      setBannerImageUrl(settings.bannerImageUrl || '');
      setBannerBadgeText(
        settings.bannerBadgeText || 'Qualidade & Procedência 100% Inspecionada'
      );
      setFeedback(false);
      setBannerMsg(null);
    }
  }, [isOpen, settings]);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingBanner(true);
      setBannerMsg('Otimizando banner...');
      const dataUrl = await compressImageFile(file, 1280, 600, 0.86);
      setBannerImageUrl(dataUrl);
      updateSettings({ bannerImageUrl: dataUrl, showBannerImage: true });
      setBannerMsg('✓ Banner atualizado na TV!');
      setTimeout(() => setBannerMsg(null), 3000);
    } catch {
      setBannerMsg('Erro ao processar imagem.');
    } finally {
      setIsUploadingBanner(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      column1Title: col1Title.trim().toUpperCase(),
      column2Title: col2Title.trim().toUpperCase(),
      badgeInitials: badgeInitials.trim().toUpperCase() || 'BN',
      badgeTitle: badgeTitle.trim().toUpperCase() || 'BOI NOBRE',
      badgeSubtitle: badgeSubtitle.trim().toUpperCase() || 'CASA DE CARNES',
      bannerBadgeText: bannerBadgeText.trim() || 'Qualidade & Procedência 100% Inspecionada',
    });

    setFeedback(true);
    setTimeout(() => {
      setFeedback(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col gap-5 text-neutral-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">
              Editar Títulos das Colunas & Rodapé
            </h3>
            <p className="text-xs text-neutral-400">
              Altere os nomes das categorias e a marca do rodapé exibidos no menu da TV
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Columns Headers Section */}
          <div className="flex flex-col gap-3 p-3.5 bg-neutral-950/70 rounded-xl border border-neutral-800">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Cabeçalhos das Colunas da TV</span>
            </span>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Título da Coluna 1 (Esquerda):
              </label>
              <input
                type="text"
                required
                autoFocus={initialFocusField === 'col1'}
                value={col1Title}
                onChange={(e) => setCol1Title(e.target.value)}
                placeholder="AVES, SUÍNOS & ESPECIAIS"
                className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white font-bold uppercase focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[10px] text-neutral-500">
                Substitui o texto original &quot;AVES, SUÍNOS &amp; ESPECIAIS&quot;
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Título da Coluna 2 (Direita):
              </label>
              <input
                type="text"
                required
                autoFocus={initialFocusField === 'col2'}
                value={col2Title}
                onChange={(e) => setCol2Title(e.target.value)}
                placeholder="CORTES BOVINOS NOBRES"
                className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white font-bold uppercase focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[10px] text-neutral-500">
                Substitui o texto original &quot;CORTES BOVINOS NOBRES&quot;
              </span>
            </div>
          </div>

          {/* Footer Badge / Brand Section */}
          <div className="flex flex-col gap-3 p-3.5 bg-neutral-950/70 rounded-xl border border-neutral-800">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              <span>Selo / Logo no Rodapé da TV</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  Sigla do Logo:
                </label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={badgeInitials}
                  onChange={(e) => setBadgeInitials(e.target.value)}
                  placeholder="BN"
                  className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white font-bebas text-center text-lg uppercase focus:border-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-neutral-500">Ex: BN, AC</span>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-neutral-300">
                  Nome da Marca:
                </label>
                <input
                  type="text"
                  required
                  value={badgeTitle}
                  onChange={(e) => setBadgeTitle(e.target.value)}
                  placeholder="BOI NOBRE"
                  className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white font-bold uppercase focus:border-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-neutral-500">Ex: BOI NOBRE, PRIME MEAT</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Subtítulo do Selo:
              </label>
              <input
                type="text"
                required
                value={badgeSubtitle}
                onChange={(e) => setBadgeSubtitle(e.target.value)}
                placeholder="CASA DE CARNES"
                className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white font-bold uppercase focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[10px] text-neutral-500">Ex: CASA DE CARNES, BOUTIQUE DE CARNES</span>
            </div>

            {/* Live miniature preview of the badge */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
              <span className="text-[11px] text-neutral-400">Prévia do Selo:</span>
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-md">
                <span className="font-bebas text-amber-400 text-lg leading-none">
                  {badgeInitials || 'BN'}
                </span>
                <div className="text-[10px] uppercase font-bold text-neutral-300 leading-tight">
                  {badgeTitle || 'BOI NOBRE'}
                  <span className="block text-[8px] text-amber-400/80">
                    {badgeSubtitle || 'CASA DE CARNES'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Banner Photo Section */}
          <div className="flex flex-col gap-3 p-3.5 bg-neutral-950/70 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Banner de Carnes no Topo da TV</span>
              </span>

              <button
                type="button"
                onClick={() => bannerFileInputRef.current?.click()}
                disabled={isUploadingBanner}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition-all shadow disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{isUploadingBanner ? 'Enviando...' : 'Enviar Novo Banner'}</span>
              </button>

              <input
                type="file"
                ref={bannerFileInputRef}
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
              />
            </div>

            {bannerMsg && (
              <span className="text-xs text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/30">
                {bannerMsg}
              </span>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Texto do Selo do Banner:
              </label>
              <input
                type="text"
                autoFocus={initialFocusField === 'banner'}
                value={bannerBadgeText}
                onChange={(e) => setBannerBadgeText(e.target.value)}
                placeholder="Qualidade & Procedência 100% Inspecionada"
                className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs sm:text-sm text-white font-medium focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[10px] text-neutral-500">
                Texto que aparece no selo sobre a foto do banner no topo da TV.
              </span>
            </div>

            {bannerImageUrl && (
              <div className="relative rounded-lg overflow-hidden border border-neutral-800 h-24 w-full bg-black">
                <img
                  src={bannerImageUrl}
                  alt="Banner Topo"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all"
            >
              {feedback ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              <span>{feedback ? 'Salvo!' : 'Aplicar na TV'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
