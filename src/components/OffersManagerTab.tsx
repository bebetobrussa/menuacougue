import React, { useState, useRef, useEffect } from 'react';
import { useMenu } from '../context/MenuContext.tsx';
import { formatCurrency, parsePriceInput } from '../utils/format.ts';
import { PRESET_CUT_PHOTOS, CutPhotoOption } from '../defaultData.ts';
import {
  compressImageFile,
  getStoredCustomPhotos,
  addStoredCustomPhoto,
  removeStoredCustomPhoto,
} from '../utils/imageUpload.ts';
import {
  Sparkles,
  Star,
  Tag,
  RotateCw,
  Image as ImageIcon,
  Check,
  Upload,
  Link as LinkIcon,
  Trash2,
  Plus,
  Ban,
  CheckCircle2,
  Camera,
} from 'lucide-react';

export const OffersManagerTab: React.FC = () => {
  const {
    items,
    settings,
    featuredOffers,
    currentFeaturedOffer,
    updateItem,
    toggleItemFeaturedDaily,
    toggleItemOffer,
    updateSettings,
  } = useMenu();

  const [selectedOfferId, setSelectedOfferId] = useState<string>(
    currentFeaturedOffer?.id || (items.length > 0 ? items[0].id : '')
  );

  const selectedItem = items.find((i) => i.id === selectedOfferId) || items[0];

  const [promoPriceInput, setPromoPriceInput] = useState<string>(
    selectedItem ? selectedItem.price.toFixed(2).replace('.', ',') : ''
  );
  const [originalPriceInput, setOriginalPriceInput] = useState<string>(
    selectedItem?.originalPrice ? selectedItem.originalPrice.toFixed(2).replace('.', ',') : ''
  );
  const [subtitleInput, setSubtitleInput] = useState<string>(
    selectedItem?.featuredSubtitle || 'SUPER OFERTA DA SEMANA • CORTE FRESCO'
  );
  const [selectedImage, setSelectedImage] = useState<string | undefined>(
    selectedItem?.featuredImage || PRESET_CUT_PHOTOS[0].url
  );

  // Custom photos library
  const [customPhotos, setCustomPhotos] = useState<CutPhotoOption[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load custom photos on mount
  useEffect(() => {
    setCustomPhotos(getStoredCustomPhotos());
  }, []);

  // Sync state when selected item changes
  const handleSelectOffer = (id: string) => {
    setSelectedOfferId(id);
    const item = items.find((i) => i.id === id);
    if (item) {
      setPromoPriceInput(item.price.toFixed(2).replace('.', ','));
      setOriginalPriceInput(item.originalPrice ? item.originalPrice.toFixed(2).replace('.', ',') : '');
      setSubtitleInput(item.featuredSubtitle || 'SUPER OFERTA DO DIA • QUALIDADE GARANTIDA');
      setSelectedImage(item.featuredImage || PRESET_CUT_PHOTOS[0].url);
    }
  };

  // Handle file upload from device or camera
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadMessage('Otimizando foto para exibição rápida na TV...');

      // Compress to optimal size for display and storage
      const dataUrl = await compressImageFile(file, 800, 600, 0.84);

      // Extract a clean name from file
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .substring(0, 30);

      const saved = addStoredCustomPhoto(cleanName, dataUrl);
      setCustomPhotos(getStoredCustomPhotos());
      setSelectedImage(saved.url);

      setUploadMessage('✓ Foto enviada e aplicada com sucesso!');
      setTimeout(() => setUploadMessage(null), 3500);
    } catch (err) {
      console.error(err);
      setUploadMessage('Erro ao processar imagem.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle adding photo via web URL
  const handleAddViaUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const saved = addStoredCustomPhoto('Foto Externa', urlInput.trim());
    setCustomPhotos(getStoredCustomPhotos());
    setSelectedImage(saved.url);
    setUrlInput('');
    setShowUrlInput(false);
    setUploadMessage('✓ Imagem via link adicionada!');
    setTimeout(() => setUploadMessage(null), 3500);
  };

  // Delete a custom photo
  const handleDeleteCustomPhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja excluir esta foto da sua galeria?')) {
      removeStoredCustomPhoto(id);
      const updated = getStoredCustomPhotos();
      setCustomPhotos(updated);
      if (selectedImage && customPhotos.find((p) => p.id === id)?.url === selectedImage) {
        setSelectedImage(PRESET_CUT_PHOTOS[0].url);
      }
    }
  };

  const handleSaveOffer = () => {
    if (!selectedItem) return;
    const newPrice = parsePriceInput(promoPriceInput);
    const origPrice = parsePriceInput(originalPriceInput);

    updateItem(selectedItem.id, {
      price: newPrice > 0 ? newPrice : selectedItem.price,
      originalPrice: origPrice > 0 ? origPrice : undefined,
      isOffer: true,
      isFeaturedDaily: true,
      featuredSubtitle: subtitleInput,
      featuredImage: selectedImage,
    });

    setUploadMessage('✓ Oferta e foto publicadas na TV com sucesso!');
    setTimeout(() => setUploadMessage(null), 3500);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-lg text-white">
              Configuração da Placa Amarela (OFERTA DO DIA) & Fotos
            </h3>
          </div>
          <p className="text-xs text-neutral-400">
            A placa amarela é o destaque visual principal do menu da TV. Escolha o corte, envie fotos do seu celular/PC ou selecione cortes da galeria.
          </p>
        </div>

        {/* Rotation switch */}
        <div className="flex items-center gap-3 bg-neutral-950 px-3.5 py-2 rounded-lg border border-neutral-800">
          <RotateCw
            className={`w-4 h-4 ${settings.autoRotateOffers ? 'text-amber-400 animate-spin' : 'text-neutral-500'}`}
            style={{ animationDuration: '6s' }}
          />
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-neutral-200 cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.autoRotateOffers}
                onChange={(e) => updateSettings({ autoRotateOffers: e.target.checked })}
                className="rounded accent-amber-500"
              />
              <span>Girar Ofertas Automaticamente</span>
            </label>
            <span className="text-[10px] text-neutral-400">
              Alterna as ofertas ativas a cada {settings.rotationIntervalSeconds}s
            </span>
          </div>
        </div>
      </div>

      {uploadMessage && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-semibold shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{uploadMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form to edit the active featured offer */}
        <div className="lg:col-span-7 flex flex-col gap-5 bg-neutral-900/90 p-5 rounded-2xl border border-neutral-800 shadow-xl">
          <h4 className="font-bold text-white text-base flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Tag className="w-4 h-4 text-amber-400" />
            <span>Editar Corte para Destaque Principal</span>
          </h4>

          {/* Cut Selector Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              Selecione o Corte de Carne:
            </label>
            <select
              value={selectedOfferId}
              onChange={(e) => handleSelectOffer(e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white font-medium focus:border-amber-500 focus:outline-none"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — R$ {formatCurrency(item.price)} /{item.unit} {item.isFeaturedDaily ? '★ (Em Destaque)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Prices: Promotional & Original */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-amber-400">
                Preço Promocional (OFERTA) *:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 font-bold text-sm">
                  R$
                </span>
                <input
                  type="text"
                  value={promoPriceInput}
                  onChange={(e) => setPromoPriceInput(e.target.value)}
                  placeholder="5,79"
                  className="w-full pl-10 pr-3 py-2 bg-neutral-950 border border-amber-500/60 rounded-lg text-lg font-bold text-white tabular-nums focus:border-amber-400 focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-neutral-400">
                Aparecerá em tamanho gigante na placa amarela.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Preço Anterior (De: R$):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium text-sm">
                  R$
                </span>
                <input
                  type="text"
                  value={originalPriceInput}
                  onChange={(e) => setOriginalPriceInput(e.target.value)}
                  placeholder="17,90"
                  className="w-full pl-10 pr-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-lg font-semibold text-neutral-300 tabular-nums focus:border-neutral-500 focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-neutral-400">
                Opcional: aparece riscado para destacar o desconto.
              </span>
            </div>
          </div>

          {/* Promotional Subtitle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              Subtítulo Promocional (Badge):
            </label>
            <input
              type="text"
              value={subtitleInput}
              onChange={(e) => setSubtitleInput(e.target.value)}
              placeholder="SUPER OFERTA DA SEMANA • CORTE FRESCO"
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* ================= PHOTO UPLOAD & GALLERY SECTION ================= */}
          <div className="flex flex-col gap-3 pt-2 border-t border-neutral-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Foto do Corte na Placa Amarela:</span>
              </label>

              {/* Action buttons: Upload from device & Add via URL */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                  title="Enviar foto do computador ou tirar foto no celular"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Enviando...' : 'Enviar Foto'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 rounded-lg text-xs font-semibold transition-all"
                  title="Adicionar imagem através de link externo"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Por Link</span>
                </button>

                {/* Hidden native file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Optional URL input box */}
            {showUrlInput && (
              <form onSubmit={handleAddViaUrl} className="flex items-center gap-2 p-2 bg-neutral-950 rounded-lg border border-neutral-700">
                <input
                  type="url"
                  required
                  placeholder="https://exemplo.com/foto-carne.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded text-xs"
                >
                  Adicionar
                </button>
              </form>
            )}

            {/* Framing and Sizing Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-950/80 rounded-xl border border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-300">Tamanho da Foto na TV:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateSettings({ featuredPhotoSize: 'large' })}
                    className={`px-2.5 py-1 text-xs font-bold rounded ${
                      settings.featuredPhotoSize !== 'medium'
                        ? 'bg-amber-500 text-neutral-950 shadow'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Grande (TV)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ featuredPhotoSize: 'medium' })}
                    className={`px-2.5 py-1 text-xs font-bold rounded ${
                      settings.featuredPhotoSize === 'medium'
                        ? 'bg-amber-500 text-neutral-950 shadow'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Médio
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-300">Enquadramento:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateSettings({ featuredPhotoFit: 'cover' })}
                    className={`px-2.5 py-1 text-xs font-bold rounded ${
                      settings.featuredPhotoFit !== 'contain'
                        ? 'bg-amber-500 text-neutral-950 shadow'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                    title="Preenche todo o quadro da moldura"
                  >
                    Preencher (Cover)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ featuredPhotoFit: 'contain' })}
                    className={`px-2.5 py-1 text-xs font-bold rounded ${
                      settings.featuredPhotoFit === 'contain'
                        ? 'bg-amber-500 text-neutral-950 shadow'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                    title="Mostra a foto inteira sem cortar bordas"
                  >
                    Inteira (Contain)
                  </button>
                </div>
              </div>
            </div>

            {/* Photos Grid: Preset + User Uploads + Option without photo */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {/* Option 1: No Image (Typography only) */}
              <button
                type="button"
                onClick={() => setSelectedImage(undefined)}
                className={`relative rounded-xl border-2 p-2 text-center flex flex-col items-center justify-center min-h-[90px] transition-all ${
                  !selectedImage
                    ? 'border-amber-500 bg-amber-950/30 text-amber-300'
                    : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700 hover:text-white'
                }`}
              >
                <Ban className="w-5 h-5 mb-1" />
                <span className="text-[11px] font-bold">Sem Foto</span>
                <span className="text-[9px] text-neutral-400">Apenas Tipografia</span>
                {!selectedImage && (
                  <span className="absolute top-1.5 right-1.5 bg-amber-500 text-neutral-950 rounded-full p-0.5 shadow">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </button>

              {/* Preset Cut Photos */}
              {PRESET_CUT_PHOTOS.map((photo) => {
                const isSelected = selectedImage === photo.url;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setSelectedImage(photo.url)}
                    className={`relative rounded-xl overflow-hidden border-2 p-1 text-left transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-950/30'
                        : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-16 object-cover rounded-lg"
                    />
                    <span className="text-[10px] font-bold text-neutral-200 mt-1 block truncate">
                      {photo.name}
                    </span>
                    {isSelected && (
                      <span className="absolute top-2 right-2 bg-amber-500 text-neutral-950 rounded-full p-0.5 shadow-md">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}

              {/* User Uploaded Custom Photos */}
              {customPhotos.map((photo) => {
                const isSelected = selectedImage === photo.url;
                return (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedImage(photo.url)}
                    className={`group relative rounded-xl overflow-hidden border-2 p-1 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-950/30'
                        : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-16 object-cover rounded-lg"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] font-bold text-amber-300 block truncate">
                        {photo.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomPhoto(photo.id, e)}
                        className="opacity-60 hover:opacity-100 p-0.5 text-red-400 hover:text-red-300"
                        title="Excluir foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {isSelected && (
                      <span className="absolute top-2 right-2 bg-amber-500 text-neutral-950 rounded-full p-0.5 shadow-md">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Quick Add Photo Card */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border-2 border-dashed border-neutral-700 hover:border-amber-500/80 p-2 text-center flex flex-col items-center justify-center min-h-[90px] text-neutral-400 hover:text-amber-400 transition-all group"
              >
                <Upload className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold">+ Enviar Foto</span>
                <span className="text-[9px] text-neutral-500">Do Celular ou PC</span>
              </button>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-3">
            <button
              onClick={() => toggleItemFeaturedDaily(selectedItem.id)}
              className={`px-4 py-2.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 ${
                selectedItem.isFeaturedDaily
                  ? 'bg-red-950/40 border-red-800 text-red-300 hover:bg-red-900/50'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
              }`}
            >
              <Star className="w-4 h-4 fill-current" />
              <span>{selectedItem.isFeaturedDaily ? 'Remover da Placa Amarela' : 'Incluir na Placa Amarela'}</span>
            </button>

            <button
              onClick={handleSaveOffer}
              className="flex-1 max-w-[280px] py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg shadow-lg shadow-amber-500/20 text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar & Publicar na TV</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Board Miniature Preview */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Prévia ao Vivo na TV
            </span>
            <span className="text-[11px] text-amber-400 font-medium">
              Atualização Instantânea
            </span>
          </div>

          {/* Simulated yellow board with wood frame */}
          <div className="bg-wood-dark p-3 rounded-2xl border border-neutral-800 shadow-2xl relative">
            <div className="relative mb-2 mx-auto w-full max-w-[260px] bg-wood-header-plaque py-1.5 px-4 rounded border border-neutral-700 flex items-center justify-between text-center">
              <div className="metal-rivet" style={{ width: 10, height: 10 }} />
              <span className="font-bebas text-xl text-white tracking-wider">OFERTA DO DIA</span>
              <div className="metal-rivet" style={{ width: 10, height: 10 }} />
            </div>

            <div className="bg-amber-400 rounded-xl p-4 flex flex-col justify-between items-center text-center shadow-lg border-2 border-amber-600/30 min-h-[420px]">
              <div className="w-full">
                {subtitleInput && (
                  <span className="text-[10px] font-extrabold uppercase text-neutral-900 block mb-0.5">
                    {subtitleInput}
                  </span>
                )}
                <h3 className="font-condensed font-black text-3xl sm:text-4xl text-neutral-950 uppercase tracking-tight leading-tight line-clamp-2">
                  {selectedItem?.name || 'CORTE SELECIONADO'}
                </h3>
              </div>

              {/* Photo preview in board - Enlarged and framed */}
              {selectedImage && (
                <div className="my-auto w-full max-w-[94%] mx-auto py-1">
                  <div
                    className={`relative w-full ${
                      settings.featuredPhotoSize === 'medium' ? 'h-40' : 'h-48 sm:h-52'
                    } rounded-xl overflow-hidden border-3 border-white/95 shadow-xl bg-neutral-950`}
                  >
                    <img
                      src={selectedImage}
                      alt={selectedItem?.name}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full ${
                        settings.featuredPhotoFit === 'contain' ? 'object-contain' : 'object-cover'
                      } object-center`}
                    />

                    <div className="absolute top-2 left-2 bg-red-600 text-white font-condensed font-black px-2 py-0.5 rounded text-[10px] tracking-wider shadow">
                      OFERTA ESPECIAL
                    </div>
                  </div>
                </div>
              )}

              {/* Price display */}
              <div className="w-full mt-auto pt-2 border-t border-neutral-950/20">
                {originalPriceInput && (
                  <div className="mb-0.5 text-xs font-bold text-neutral-900">
                    De <span className="line-through text-red-800">R$ {originalPriceInput}</span> por:
                  </div>
                )}

                <div className="flex items-baseline justify-center text-neutral-950 font-condensed font-black leading-none">
                  <span className="text-xl mr-0.5">R$</span>
                  <span className="text-5xl sm:text-6xl tracking-tight">
                    {promoPriceInput || '0,00'}
                  </span>
                  <span className="text-sm font-bold ml-1 uppercase">
                    /{selectedItem?.unit || 'kg'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* List of active featured offers */}
      <div className="flex flex-col gap-3 mt-2">
        <h4 className="font-bold text-white text-base">
          Todas as Ofertas Ativas no Momento ({featuredOffers.length})
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {featuredOffers.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between gap-3 shadow"
            >
              <div className="flex items-center gap-3">
                {item.featuredImage ? (
                  <img
                    src={item.featuredImage}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-lg object-cover border border-neutral-800 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-neutral-950 flex items-center justify-center text-amber-400 font-bold text-xs border border-neutral-800 shrink-0">
                    BN
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {item.isFeaturedDaily && (
                      <span className="text-[9px] uppercase font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                        Placa Amarela
                      </span>
                    )}
                    <span className="text-[9px] uppercase font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                      Oferta
                    </span>
                  </div>
                  <h5 className="font-condensed font-bold text-white uppercase text-base">
                    {item.name}
                  </h5>
                  <span className="font-condensed font-extrabold text-amber-400 text-lg tabular-nums">
                    R$ {formatCurrency(item.price)} <small className="text-xs text-neutral-400">/{item.unit}</small>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleSelectOffer(item.id)}
                  className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleItemOffer(item.id)}
                  className="p-1.5 text-red-400 hover:bg-red-950/40 rounded text-xs"
                  title="Remover oferta"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
