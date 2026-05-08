import { useState, useEffect, useRef } from 'react';
import { X, Calculator, TrendingUp, Star, Plus, Minus, Loader2, Trash2 } from 'lucide-react';
import { fetchPricingConfig } from './db';
import type { PricingConfig } from './db';

interface EvalResult {
  projectCost: number;
  profitPotential: number;
  profitPct: number;
  dealScore: number;
}

interface Props {
  aircraftType?: string;
  clientBasis: number | null;
  sellingPrice: number | null;
  onApply: (result: EvalResult) => void;
  onClose: () => void;
}

function autoScore(profitPct: number): number {
  if (profitPct >= 40) return 10;
  if (profitPct >= 35) return 9;
  if (profitPct >= 30) return 8;
  if (profitPct >= 25) return 7;
  if (profitPct >= 20) return 6;
  if (profitPct >= 15) return 5;
  if (profitPct >= 10) return 4;
  if (profitPct >= 5)  return 3;
  if (profitPct > 0)   return 2;
  return 1;
}

function scoreColor(score: number): string {
  if (score >= 8) return 'text-emerald-600';
  if (score >= 6) return 'text-amber-600';
  if (score >= 4) return 'text-orange-600';
  return 'text-red-600';
}

function scoreBg(score: number): string {
  if (score >= 8) return 'bg-emerald-50 border-emerald-200';
  if (score >= 6) return 'bg-amber-50 border-amber-200';
  if (score >= 4) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
}

function scoreLabel(score: number): string {
  if (score >= 9) return 'Excellent Deal';
  if (score >= 7) return 'Good Deal';
  if (score >= 5) return 'Marginal';
  if (score >= 3) return 'Weak Deal';
  return 'Pass';
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const inputCls = 'bg-white border border-zinc-200 text-zinc-900 text-sm px-3 py-2 outline-none focus:border-[#C8441A]/60 transition-colors';

export function ProjectEvaluator({ aircraftType = 'CH750 STOL', clientBasis, sellingPrice, onApply, onClose }: Props) {
  const [configs, setConfigs] = useState<PricingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  // Only components the employee has toggled ON are in this set
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Per-item cost overrides (only matter when selected)
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [sellOverride, setSellOverride] = useState(sellingPrice != null ? String(sellingPrice) : '');
  const [basisOverride, setBasisOverride] = useState(clientBasis != null ? String(clientBasis) : '');
  const [customItems, setCustomItems] = useState<{ id: string; label: string; cost: string }[]>([]);
  const newLabelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPricingConfig(aircraftType)
      .then(data => {
        setConfigs(data);
        const init: Record<string, string> = {};
        data.forEach(c => { init[c.component] = String(c.default_cost); });
        setOverrides(init);
      })
      .finally(() => setLoading(false));
  }, [aircraftType]);

  // Exclude both engine options from the general list — they're handled together
  const generalItems = configs.filter(c => !c.component.startsWith('engine_'));
  const engineItems = configs.filter(c => c.component.startsWith('engine_'));

  function toggle(component: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(component)) {
        next.delete(component);
        // If toggling off one engine, deselect all engines
        if (component.startsWith('engine_')) {
          engineItems.forEach(e => next.delete(e.component));
        }
      } else {
        // If selecting an engine, deselect other engines first
        if (component.startsWith('engine_')) {
          engineItems.forEach(e => next.delete(e.component));
        }
        next.add(component);
      }
      return next;
    });
  }

  function getVal(component: string): number {
    if (!selected.has(component)) return 0;
    const raw = overrides[component] ?? '';
    const n = parseFloat(raw.replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
  }

  const activeItems = [...selected].map(c => configs.find(cfg => cfg.component === c)).filter(Boolean) as PricingConfig[];
  const customTotal = customItems.reduce((sum, i) => sum + (parseFloat(i.cost) || 0), 0);
  const totalBuildCost = activeItems.reduce((sum, c) => sum + getVal(c.component), 0) + customTotal;
  const purchaseBasis = parseFloat((basisOverride || '0').replace(/,/g, '')) || 0;
  const projectCost = totalBuildCost + purchaseBasis;

  function addCustomItem() {
    const id = crypto.randomUUID();
    setCustomItems(prev => [...prev, { id, label: '', cost: '' }]);
    setTimeout(() => newLabelRef.current?.focus(), 50);
  }

  function updateCustomItem(id: string, field: 'label' | 'cost', value: string) {
    setCustomItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  }

  function removeCustomItem(id: string) {
    setCustomItems(prev => prev.filter(i => i.id !== id));
  }

  const sell = parseFloat((sellOverride || '0').replace(/,/g, '')) || 0;
  const profitPotential = sell - projectCost;
  const profitPct = projectCost > 0 ? (profitPotential / projectCost) * 100 : 0;
  const dealScore = autoScore(profitPct);

  function handleApply() {
    onApply({ projectCost, profitPotential, profitPct, dealScore });
    onClose();
  }

  const hasItems = selected.size > 0 || purchaseBasis > 0 || customItems.some(i => i.label || i.cost);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white border border-zinc-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#C8441A]/10 border border-[#C8441A]/20 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-[#C8441A]" />
            </div>
            <div>
              <p className="text-zinc-900 font-black text-sm uppercase tracking-widest">Project Evaluator</p>
              <p className="text-zinc-400 text-[10px] uppercase tracking-widest">{aircraftType}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100">

            {/* Purchase basis + market price */}
            <div className="p-5 grid grid-cols-2 gap-4 bg-zinc-50/50">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5 select-none">Purchase Price ($)</label>
                <input type="number" value={basisOverride} onChange={e => setBasisOverride(e.target.value)}
                  placeholder="0" className={inputCls + ' w-full'} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5 select-none">Completed Market Price ($)</label>
                <input type="number" value={sellOverride} onChange={e => setSellOverride(e.target.value)}
                  placeholder="0" className={inputCls + ' w-full'} />
              </div>
            </div>

            {/* Add items section */}
            <div>
              <div className="px-5 py-3 bg-white">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Add Work Items
                  <span className="ml-2 font-normal text-zinc-400 normal-case tracking-normal">— select what this project needs</span>
                </p>
              </div>

              {/* Engine (pick one) */}
              {engineItems.length > 0 && (
                <div className="border-t border-zinc-100">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-400 px-5 py-2 bg-zinc-50">Engine</p>
                  {engineItems.map(cfg => {
                    const on = selected.has(cfg.component);
                    return (
                      <div key={cfg.component}
                        className={`flex items-center gap-3 px-5 py-3 border-t border-zinc-100 transition-colors ${on ? 'bg-[#C8441A]/4' : 'hover:bg-zinc-50/80'}`}>
                        <button onClick={() => toggle(cfg.component)}
                          className={`w-6 h-6 flex-shrink-0 border flex items-center justify-center transition-colors ${
                            on ? 'bg-[#C8441A] border-[#C8441A] text-white' : 'border-zinc-300 text-transparent hover:border-[#C8441A]/50'
                          }`}>
                          {on ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3 text-zinc-400" />}
                        </button>
                        <span className={`flex-1 text-sm transition-colors ${on ? 'text-zinc-900 font-semibold' : 'text-zinc-500'}`}>{cfg.label}</span>
                        <span className="text-zinc-400 text-xs">{fmt(cfg.default_cost)}</span>
                        {on && (
                          <input type="number" value={overrides[cfg.component] ?? ''}
                            onChange={e => setOverrides(prev => ({ ...prev, [cfg.component]: e.target.value }))}
                            onClick={e => e.stopPropagation()}
                            className="w-28 bg-white border border-zinc-200 focus:border-[#C8441A]/60 text-zinc-900 text-xs text-right px-2 py-1.5 outline-none transition-colors"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* General items */}
              {generalItems.length > 0 && (
                <div className="border-t border-zinc-100">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-400 px-5 py-2 bg-zinc-50">Build Components</p>
                  {generalItems.map(cfg => {
                    const on = selected.has(cfg.component);
                    return (
                      <div key={cfg.component}
                        className={`flex items-center gap-3 px-5 py-3 border-t border-zinc-100 transition-colors ${on ? 'bg-[#C8441A]/4' : 'hover:bg-zinc-50/80'}`}>
                        <button onClick={() => toggle(cfg.component)}
                          className={`w-6 h-6 flex-shrink-0 border flex items-center justify-center transition-colors ${
                            on ? 'bg-[#C8441A] border-[#C8441A] text-white' : 'border-zinc-300 text-transparent hover:border-[#C8441A]/50'
                          }`}>
                          {on ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3 text-zinc-400" />}
                        </button>
                        <span className={`flex-1 text-sm transition-colors ${on ? 'text-zinc-900 font-semibold' : 'text-zinc-500'}`}>{cfg.label}</span>
                        <span className="text-zinc-400 text-xs">{fmt(cfg.default_cost)}</span>
                        {on && (
                          <input type="number" value={overrides[cfg.component] ?? ''}
                            onChange={e => setOverrides(prev => ({ ...prev, [cfg.component]: e.target.value }))}
                            onClick={e => e.stopPropagation()}
                            className="w-28 bg-white border border-zinc-200 focus:border-[#C8441A]/60 text-zinc-900 text-xs text-right px-2 py-1.5 outline-none transition-colors"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Custom one-off line items */}
            <div className="border-t border-zinc-100">
              <div className="flex items-center justify-between px-5 py-3 bg-white">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Custom Line Items
                  <span className="ml-2 font-normal text-zinc-400 normal-case tracking-normal">— one-off costs, not saved globally</span>
                </p>
                <button type="button" onClick={addCustomItem}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-[#C8441A] hover:text-[#b03a16] uppercase tracking-widest transition-colors">
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>
              {customItems.length > 0 && (
                <div className="divide-y divide-zinc-100 border-t border-zinc-100">
                  {customItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2 px-5 py-2.5">
                      <input
                        ref={idx === customItems.length - 1 ? newLabelRef : undefined}
                        type="text"
                        value={item.label}
                        onChange={e => updateCustomItem(item.id, 'label', e.target.value)}
                        placeholder="Description"
                        className="flex-1 text-xs bg-white border border-zinc-200 text-zinc-900 px-2 py-1.5 outline-none focus:border-[#C8441A]/60"
                      />
                      <input
                        type="number"
                        value={item.cost}
                        onChange={e => updateCustomItem(item.id, 'cost', e.target.value)}
                        placeholder="$0"
                        className="w-28 text-xs bg-white border border-zinc-200 text-zinc-900 text-right px-2 py-1.5 outline-none focus:border-[#C8441A]/60"
                      />
                      <button type="button" onClick={() => removeCustomItem(item.id)}
                        className="text-zinc-300 hover:text-red-500 transition-colors p-0.5 flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected summary — only shows selected items */}
            {(activeItems.length > 0 || customItems.some(i => parseFloat(i.cost) > 0)) && (
              <div className="border-t border-zinc-200">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-400 px-5 py-2 bg-zinc-50">Selected Work Items</p>
                <div className="divide-y divide-zinc-100">
                  {activeItems.map(cfg => (
                    <div key={cfg.component} className="flex items-center justify-between px-5 py-2">
                      <span className="text-zinc-700 text-xs">{cfg.label}</span>
                      <span className="text-zinc-900 text-xs font-semibold tabular-nums">{fmt(getVal(cfg.component))}</span>
                    </div>
                  ))}
                  {customItems.filter(i => parseFloat(i.cost) > 0 || i.label).map(i => (
                    <div key={i.id} className="flex items-center justify-between px-5 py-2">
                      <span className="text-zinc-700 text-xs italic">{i.label || 'Custom item'}</span>
                      <span className="text-zinc-900 text-xs font-semibold tabular-nums">{fmt(parseFloat(i.cost) || 0)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-5 py-2.5 bg-zinc-50">
                    <span className="text-zinc-600 text-xs font-black uppercase tracking-widest">Work Subtotal</span>
                    <span className="text-zinc-900 text-sm font-black tabular-nums">{fmt(totalBuildCost)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Deal Analysis — auto-generated */}
            {hasItems && (
              <div className="border-t border-zinc-200">
                <div className="px-5 py-2.5 bg-zinc-50 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-[#C8441A]" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Deal Analysis — Auto-Generated</p>
                </div>
                <div className="divide-y divide-zinc-100">
                  <div className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Total Investment</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Purchase price + selected work items</p>
                    </div>
                    <p className="text-zinc-900 font-black text-base tabular-nums">{fmt(projectCost)}</p>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Completed Market Price</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Expected sale value of finished aircraft</p>
                    </div>
                    <p className={`font-black text-base tabular-nums ${sell > 0 ? 'text-zinc-900' : 'text-zinc-300'}`}>
                      {sell > 0 ? fmt(sell) : '—'}
                    </p>
                  </div>
                  <div className={`flex items-center justify-between px-5 py-3 ${sell > 0 ? (profitPotential >= 0 ? 'bg-emerald-50/70' : 'bg-red-50/70') : ''}`}>
                    <div>
                      <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Net Value</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Market price minus total investment</p>
                    </div>
                    <p className={`font-black text-base tabular-nums ${sell > 0 ? (profitPotential >= 0 ? 'text-emerald-700' : 'text-red-700') : 'text-zinc-300'}`}>
                      {sell > 0 ? fmt(profitPotential) : '—'}
                    </p>
                  </div>
                  <div className={`flex items-center justify-between px-5 py-3 ${sell > 0 ? (profitPotential >= 0 ? 'bg-emerald-50/70' : 'bg-red-50/70') : ''}`}>
                    <div>
                      <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Profit Margin</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Net value as % of total investment</p>
                    </div>
                    <p className={`font-black text-base tabular-nums ${sell > 0 ? (profitPotential >= 0 ? 'text-emerald-700' : 'text-red-700') : 'text-zinc-300'}`}>
                      {sell > 0 ? `${profitPct.toFixed(1)}%` : '—'}
                    </p>
                  </div>
                  <div className={`flex items-center justify-between px-5 py-3 ${sell > 0 ? scoreBg(dealScore) : ''}`}>
                    <div>
                      <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest flex items-center gap-1.5">
                        <Star className="w-3 h-3" /> Deal Score
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Auto-rated based on profit margin</p>
                    </div>
                    {sell > 0 ? (
                      <div className="text-right">
                        <p className={`font-black text-2xl leading-none tabular-nums ${scoreColor(dealScore)}`}>
                          {dealScore}<span className="text-sm font-normal text-zinc-400">/10</span>
                        </p>
                        <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${scoreColor(dealScore)}`}>{scoreLabel(dealScore)}</p>
                      </div>
                    ) : (
                      <p className="text-zinc-300 text-base font-black">—</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 p-5 bg-white sticky bottom-0 border-t border-zinc-200">
              <button onClick={handleApply}
                className="flex-1 bg-[#C8441A] hover:bg-[#b03a16] text-white font-black text-xs uppercase tracking-widest py-3.5 transition-colors">
                {hasItems && sell > 0
                  ? `Apply — ${fmt(profitPotential)} Net · ${profitPct.toFixed(1)}% · Score ${dealScore}/10`
                  : hasItems
                  ? `Apply — Investment ${fmt(projectCost)}`
                  : 'Apply to Project'}
              </button>
              <button onClick={onClose}
                className="border border-zinc-200 hover:border-zinc-400 text-zinc-500 hover:text-zinc-800 text-xs font-bold uppercase tracking-widest px-5 transition-colors">
                Cancel
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
