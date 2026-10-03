import React, { useState } from 'react';
import { useMenu } from '../context/MenuContext.tsx';
import { CATEGORIES } from '../defaultData.ts';
import { CategoryId, MeatItem } from '../types.ts';
import { formatCurrency, parsePriceInput } from '../utils/format.ts';
import { Search, Sparkles, Star, Check, Plus, Minus, Tag, CheckCircle2, XCircle } from 'lucide-react';

export const QuickPricesTab: React.FC = () => {
  const {
    items,
    updateItemPrice,
    toggleItemOffer,
    toggleItemFeaturedDaily,
    toggleItemAvailability,
    lastUpdatedItemId,
  } = useMenu();

  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === 'todos' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleStartEdit = (item: MeatItem) => {
    setEditingPriceId(item.id);
    setTempPrice(item.price.toFixed(2).replace('.', ','));
  };

  const handleSavePrice = (id: string) => {
    const parsed = parsePriceInput(tempPrice);
    if (parsed > 0) {
      updateItemPrice(id, parsed);
    }
    setEditingPriceId(null);
  };

  const handleQuickAdjust = (item: MeatItem, amount: number) => {
    const newPrice = Math.max(0.1, Number((item.price + amount).toFixed(2)));
    updateItemPrice(item.id, newPrice);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Informative helper card */}
      <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 rounded-lg text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">
              Edição Instantânea em Tempo Real
            </h3>
            <p className="text-xs text-amber-300/80">
              Qualquer alteração de preço, oferta ou estoque reflete imediatamente na tela da TV do açougue.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium bg-neutral-900/80 px-3 py-1.5 rounded-lg border border-neutral-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-emerald-300">Sincronização Ativa</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
              }`}
            >
              {cat.shortLabel}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar carne ou corte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Meat Items Grid for Quick Price Editing */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredItems.map((item) => {
          const isFlash = lastUpdatedItemId === item.id;
          const isEditing = editingPriceId === item.id;

          return (
            <div
              key={item.id}
              className={`flex flex-col justify-between p-4 rounded-xl border bg-neutral-900/90 transition-all ${
                isFlash
                  ? 'ring-2 ring-amber-400 bg-amber-950/40 border-amber-500'
                  : 'border-neutral-800 hover:border-neutral-700'
              } ${!item.available ? 'opacity-50' : ''}`}
            >
              {/* Card Header: Name + Badges */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    {item.isFeaturedDaily && (
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                        ★ Placa Amarela (Destaque)
                      </span>
                    )}
                    {item.isOffer && (
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded">
                        Oferta
                      </span>
                    )}
                    {!item.available && (
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded">
                        Esgotado
                      </span>
                    )}
                  </div>
                  <h4 className="font-condensed font-bold text-lg text-white uppercase tracking-wide">
                    {item.name}
                  </h4>
                  <span className="text-xs text-neutral-400">
                    Unidade: <strong className="text-neutral-200">/{item.unit || 'kg'}</strong>
                  </span>
                </div>

                {/* Star toggle for Big Yellow Signboard */}
                <button
                  onClick={() => toggleItemFeaturedDaily(item.id)}
                  title={item.isFeaturedDaily ? 'Remover da Oferta do Dia' : 'Colocar na Oferta do Dia (Placa Amarela)'}
                  className={`p-2 rounded-lg border transition-all ${
                    item.isFeaturedDaily
                      ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-amber-400 hover:bg-neutral-700'
                  }`}
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              </div>

              {/* Price & Quick Steppers Area */}
              <div className="bg-neutral-950/80 p-3 rounded-lg border border-neutral-800 flex items-center justify-between gap-2 mb-3">
                <div className="flex-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">
                    Preço no Menu
                  </span>

                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-400 font-bold text-base">R$</span>
                      <input
                        type="text"
                        autoFocus
                        value={tempPrice}
                        onChange={(e) => setTempPrice(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSavePrice(item.id);
                          if (e.key === 'Escape') setEditingPriceId(null);
                        }}
                        className="w-24 px-2 py-1 bg-neutral-900 border border-amber-500 rounded text-amber-300 font-bold text-lg tabular-nums focus:outline-none"
                      />
                      <button
                        onClick={() => handleSavePrice(item.id)}
                        className="p-1.5 bg-amber-500 text-neutral-950 rounded hover:bg-amber-400 transition-colors"
                        title="Salvar preço"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="group flex items-baseline gap-1 hover:text-amber-400 transition-colors text-left"
                      title="Clique para digitar o preço"
                    >
                      <span className="text-amber-400 font-semibold text-sm">R$</span>
                      <span className="font-condensed font-extrabold text-2xl text-white group-hover:text-amber-300 tabular-nums">
                        {formatCurrency(item.price)}
                      </span>
                      <span className="text-[11px] text-neutral-500 group-hover:text-amber-400 underline ml-1">
                        (editar)
                      </span>
                    </button>
                  )}
                </div>

                {/* Quick adjustments +/- R$ 1,00 */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleQuickAdjust(item, -1.0)}
                    className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700 hover:border-neutral-600 transition-all text-xs font-bold"
                    title="- R$ 1,00"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleQuickAdjust(item, 1.0)}
                    className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700 hover:border-neutral-600 transition-all text-xs font-bold"
                    title="+ R$ 1,00"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons: Toggle Offer, Toggle Stock */}
              <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                <button
                  onClick={() => toggleItemOffer(item.id)}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    item.isOffer
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                      : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{item.isOffer ? 'Em Oferta' : 'Promover (Oferta)'}</span>
                </button>

                <button
                  onClick={() => toggleItemAvailability(item.id)}
                  className={`py-1.5 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                    item.available
                      ? 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                      : 'bg-red-950/40 border-red-800 text-red-300'
                  }`}
                  title={item.available ? 'Marcar como esgotado' : 'Marcar como disponível'}
                >
                  {item.available ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Disponível</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                      <span className="hidden sm:inline">Esgotado</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
