import React, { useState } from 'react';
import { useMenu } from '../context/MenuContext.tsx';
import { CATEGORIES, PRESET_CUT_PHOTOS } from '../defaultData.ts';
import { CategoryId, MeatItem } from '../types.ts';
import { formatCurrency, parsePriceInput } from '../utils/format.ts';
import { getStoredCustomPhotos } from '../utils/imageUpload.ts';
import { Plus, ArrowUp, ArrowDown, Trash2, Edit2, Check, X, Image as ImageIcon } from 'lucide-react';

export const CatalogManagerTab: React.FC = () => {
  const { items, addItem, updateItem, deleteItem, moveItemOrder } = useMenu();

  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form states for adding new cut
  const [newName, setNewName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<CategoryId>('bovinos');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newUnit, setNewUnit] = useState<string>('kg');
  const [newIsOffer, setNewIsOffer] = useState<boolean>(false);
  const [newIsFeatured, setNewIsFeatured] = useState<boolean>(false);
  const [newPhoto, setNewPhoto] = useState<string>('');

  // Edit item inline state
  const [editName, setEditName] = useState<string>('');
  const [editCategory, setEditCategory] = useState<CategoryId>('bovinos');
  const [editUnit, setEditUnit] = useState<string>('kg');

  const allAvailablePhotos = [...PRESET_CUT_PHOTOS, ...getStoredCustomPhotos()];

  const handleStartEdit = (item: MeatItem) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditUnit(item.unit || 'kg');
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    updateItem(id, {
      name: editName.trim().toUpperCase(),
      category: editCategory,
      unit: editUnit.trim() || 'kg',
    });
    setEditingItemId(null);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const parsedPrice = parsePriceInput(newPrice);
    if (parsedPrice <= 0) return;

    addItem({
      name: newName.trim().toUpperCase(),
      category: newCategory,
      price: parsedPrice,
      unit: newUnit.trim() || 'kg',
      isOffer: newIsOffer,
      isFeaturedDaily: newIsFeatured,
      featuredImage: newPhoto || undefined,
      available: true,
    });

    // Reset form
    setNewName('');
    setNewPrice('');
    setNewPhoto('');
    setNewIsOffer(false);
    setNewIsFeatured(false);
    setShowAddForm(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800">
        <div>
          <h3 className="font-bold text-lg text-white">
            Catálogo Geral de Carnes & Ordem no Menu
          </h3>
          <p className="text-xs text-neutral-400">
            Adicione novos cortes, reordene a posição nas colunas da TV ou edite informações.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-all shadow-md"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showAddForm ? 'Cancelar' : 'Adicionar Novo Corte'}</span>
        </button>
      </div>

      {/* Add New Meat Cut Form Modal/Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleCreateItem}
          className="bg-neutral-900 border-2 border-amber-500/50 p-5 rounded-2xl flex flex-col gap-4 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h4 className="font-bold text-white text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Cadastrar Novo Corte para o Menu</span>
            </h4>
            <span className="text-xs text-amber-300">Aparecerá automaticamente na TV</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Nome do Corte *:
              </label>
              <input
                type="text"
                required
                placeholder="Ex: MAMINHA PREMIUM"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none uppercase"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Categoria:
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as CategoryId)}
                className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
              >
                {CATEGORIES.filter((c) => c.id !== 'todos').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-amber-400">
                Preço (R$) *:
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 49,90"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white font-bold focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Unidade de Medida:
              </label>
              <select
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="kg">kg (Quilo)</option>
                <option value="un">un (Unidade)</option>
                <option value="peça">peça (Peça inteira)</option>
                <option value="kit">kit (Kit / Pacote)</option>
                <option value="bandeja">bandeja (Bandeja)</option>
              </select>
            </div>
          </div>

          {/* Photo selection for new cut */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Foto do Corte (Opcional - Usada na Placa Amarela caso seja ofertado):</span>
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setNewPhoto('')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all ${
                  !newPhoto
                    ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                }`}
              >
                Sem Foto
              </button>

              {allAvailablePhotos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setNewPhoto(photo.url)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs whitespace-nowrap transition-all ${
                    newPhoto === photo.url
                      ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <img src={photo.url} alt="" className="w-5 h-5 rounded object-cover" />
                  <span>{photo.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-neutral-800">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsOffer}
                  onChange={(e) => setNewIsOffer(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                <span>Marcar com badge (OFERTA)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-amber-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsFeatured}
                  onChange={(e) => setNewIsFeatured(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                <span>Destacar na Placa Amarela (Oferta do Dia)</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs uppercase tracking-wider shadow"
              >
                Salvar Corte no Menu
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Catalog Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-950/80 text-neutral-400 text-xs uppercase font-bold tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3 px-3 w-12 text-center">Ordem</th>
                <th className="py-3 px-4">Nome do Corte</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3">Preço Atual</th>
                <th className="py-3 px-3">Status / Tags</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {items.map((item, index) => {
                const isEditing = editingItemId === item.id;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-neutral-800/40 transition-colors ${
                      !item.available ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Reorder Arrows */}
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => moveItemOrder(item.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-neutral-400 hover:text-amber-400 disabled:opacity-20 transition-colors"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveItemOrder(item.id, 'down')}
                          disabled={index === items.length - 1}
                          className="p-1 text-neutral-400 hover:text-amber-400 disabled:opacity-20 transition-colors"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Meat Name with photo thumbnail */}
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-1 bg-neutral-950 border border-amber-500 rounded text-sm text-white font-bold uppercase w-full max-w-[280px]"
                        />
                      ) : (
                        <div className="flex items-center gap-2.5">
                          {item.featuredImage ? (
                            <img
                              src={item.featuredImage}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded object-cover border border-neutral-700 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-neutral-950 flex items-center justify-center text-[10px] text-neutral-500 font-bold border border-neutral-800 shrink-0">
                              BN
                            </div>
                          )}
                          <div className="font-condensed font-bold text-base text-white uppercase tracking-wide">
                            {item.name}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      {isEditing ? (
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value as CategoryId)}
                          className="px-2 py-1 bg-neutral-950 border border-neutral-700 rounded text-xs text-white"
                        >
                          {CATEGORIES.filter((c) => c.id !== 'todos').map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.shortLabel}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-neutral-400 capitalize">
                          {CATEGORIES.find((c) => c.id === item.category)?.shortLabel || item.category}
                        </span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-3 font-condensed font-bold text-base text-amber-400 tabular-nums">
                      R$ {formatCurrency(item.price)}
                      <span className="text-neutral-400 text-xs ml-1 font-normal">
                        /{item.unit || 'kg'}
                      </span>
                    </td>

                    {/* Badges */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.isFeaturedDaily && (
                          <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                            ★ Placa Amarela
                          </span>
                        )}
                        {item.isOffer && (
                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded">
                            Oferta
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded"
                            title="Salvar"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingItemId(null)}
                            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                            title="Editar informações"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir "${item.name}" do cardápio?`)) {
                                deleteItem(item.id);
                              }
                            }}
                            className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
                            title="Excluir corte"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
