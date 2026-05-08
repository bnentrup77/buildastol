import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LogOut, Plus, Search, Filter, ChevronDown, ChevronUp, Pencil, Trash2, X,
  Download, Settings, LayoutDashboard, FolderOpen, AlertTriangle, CheckCircle,
  Clock, Star, ArrowUpDown, ChevronRight, Users, CalendarDays, Package,
  Menu, Plane, ImagePlus, Images, Loader2, ZoomIn, ChevronLeft,
  Calculator, TrendingUp, DollarSign, GripVertical, ClipboardList,
} from 'lucide-react';
import type {
  CrmProject, ProjectDraft, ProjectStatus, Priority,
  CrmClient, ClientDraft, ClientStatus,
  CrmSession, SessionDraft, SessionType, SessionStatus,
} from './types';
import { EMPTY_DRAFT, EMPTY_CLIENT_DRAFT, EMPTY_SESSION_DRAFT } from './types';
import { getSession, setSession, clearSession, sha256hex } from './auth';
import {
  fetchProjects, createProject, updateProject, deleteProject,
  fetchClients, createClient, updateClient, deleteClient,
  fetchSessions, createSession, updateSession, deleteSession,
  verifyCredentials, updateCredentials, exportToCsv,
  fetchPhotos, uploadPhoto, deletePhoto, getPhotoUrl,
} from './db';
import type { DealPhoto } from './db';
import {
  fetchPricingConfig, createPricingConfig, updatePricingConfig, deletePricingConfig,
  fetchAircraftTypes, createAircraftType, updateAircraftType, deleteAircraftType,
} from './db';
import type { PricingConfig, AircraftType } from './db';
import { ProjectEvaluator } from './ProjectEvaluator';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['CH750 STOL', 'CH750 SD', 'CH701', 'Other'];
const SOURCES = ['Facebook', 'Barnstormers', 'Craigslist', 'Referral', 'EAA Forum', 'Trade-A-Plane', 'Other'];
const ENGINE_TYPES = ['Rotax', 'Jabiru', 'UL Power', 'Continental', 'Lycoming', 'Other'];
const STATUSES: ProjectStatus[] = ['New Lead', 'Contacted', 'Negotiating', 'Under Review', 'Purchased', 'Passed'];
const PRIORITIES: Priority[] = ['Low', 'Medium', 'High'];
const CLIENT_STATUSES: ClientStatus[] = ['Prospect', 'Registered', 'Active', 'Completed', 'Cancelled'];
const PROGRAM_TYPES = ['Rudder Workshop', 'Full Build Assist', 'Consultation', 'Other'];
const SESSION_TYPES: SessionType[] = ['Build Session', 'Rudder Workshop', 'Consultation', 'Orientation', 'Other'];
const SESSION_STATUSES: SessionStatus[] = ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

// ─── Color helpers ─────────────────────────────────────────────────────────────

function projectStatusColor(s: ProjectStatus) {
  switch (s) {
    case 'Purchased':    return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'New Lead':     return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'Contacted':   return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    case 'Negotiating': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'Under Review':return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
    case 'Passed':      return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    default:            return 'bg-zinc-700/40 text-zinc-700 border-zinc-600/30';
  }
}

function clientStatusColor(s: ClientStatus) {
  switch (s) {
    case 'Active':     return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'Registered': return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    case 'Completed':  return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'Cancelled':  return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    default:           return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  }
}

function sessionStatusColor(s: SessionStatus) {
  switch (s) {
    case 'Confirmed':   return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'In Progress': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'Completed':   return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'Cancelled':   return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    default:            return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
  }
}

function priorityColor(p: Priority) {
  switch (p) {
    case 'High':   return 'text-emerald-400';
    case 'Medium': return 'text-amber-400';
    case 'Low':    return 'text-zinc-400';
  }
}

function priorityBorder(p: Priority) {
  switch (p) {
    case 'High':   return 'border-l-2 border-l-emerald-500';
    case 'Medium': return 'border-l-2 border-l-amber-500';
    case 'Low':    return 'border-l-2 border-l-zinc-600';
  }
}

function fmt$(n: number | null | undefined) {
  if (n == null) return '—';
  return '$' + n.toLocaleString('en-US');
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5 select-none">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full bg-white border border-zinc-200 text-zinc-900 px-3 py-2.5 text-sm focus:outline-none focus:border-[#C8441A]/60 focus:ring-1 focus:ring-[#C8441A]/20 transition-colors placeholder:text-zinc-400 rounded-sm';

function Inp({ value, onChange, type = 'text', placeholder = '', required = false }: {
  value: string | number | null; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} required={required} className={inputCls} />
  );
}

function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={inputCls + ' appearance-none cursor-pointer'}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Txt({ value, onChange, rows = 3, placeholder = '' }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
      placeholder={placeholder} className={inputCls + ' resize-none'} />
  );
}

function SecLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2 pb-1">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C8441A] whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-zinc-200" />
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-sm ${className}`}>
      {children}
    </span>
  );
}

// ─── Modal wrapper (fixed centered, proper scroll) ────────────────────────────

function Modal({ title, onClose, onSave, saving, error, children }: {
  title: string; onClose: () => void; onSave: (e: React.FormEvent) => void;
  saving: boolean; error: string; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white border border-zinc-200 flex flex-col my-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100 sticky top-0 bg-white z-10">
          <h2 className="text-sm font-black text-zinc-900 uppercase tracking-widest">{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Body */}
        <form onSubmit={onSave}>
          <div className="px-7 py-6 space-y-4 bg-zinc-50/50">{children}</div>
          {error && <p className="px-7 pb-2 text-red-500 text-sm">{error}</p>}
          {/* Footer */}
          <div className="px-7 py-5 border-t border-zinc-200 flex items-center justify-end gap-3 bg-white">
            <button type="button" onClick={onClose}
              className="border border-zinc-200 hover:border-zinc-400 text-zinc-500 hover:text-zinc-800 font-bold px-6 py-2.5 text-xs uppercase tracking-widest transition-colors rounded-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="bg-[#C8441A] hover:bg-[#b03a16] text-white font-extrabold px-8 py-2.5 text-xs uppercase tracking-widest transition-colors disabled:opacity-50 rounded-sm">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white border border-zinc-200 p-8 max-w-sm w-full shadow-2xl">
        <h3 className="text-zinc-900 font-black text-sm uppercase tracking-widest mb-2">Confirm Delete</h3>
        <p className="text-zinc-500 text-sm mb-6">
          Permanently delete <strong className="text-zinc-900">{name}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="bg-red-600 hover:bg-red-500 text-zinc-900 font-extrabold text-xs px-6 py-2.5 uppercase tracking-widest transition-colors rounded-sm">Delete</button>
          <button onClick={onCancel} className="border border-zinc-200 hover:border-zinc-400 text-zinc-500 hover:text-zinc-800 font-bold text-xs px-6 py-2.5 uppercase tracking-widest transition-colors rounded-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── DEAL GALLERY ─────────────────────────────────────────────────────────────

function DealGallery({ projectId }: { projectId: string }) {
  const [photos, setPhotos] = useState<DealPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DealPhoto | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try { setPhotos(await fetchPhotos(projectId)); }
    catch { setError('Failed to load photos.'); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true); setError('');
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'];
    try {
      for (const file of Array.from(files)) {
        if (!allowed.includes(file.type)) { setError(`Unsupported file type: ${file.name}`); continue; }
        if (file.size > 15 * 1024 * 1024) { setError(`${file.name} exceeds 15 MB limit.`); continue; }
        const photo = await uploadPhoto(projectId, file);
        setPhotos(prev => [...prev, photo]);
      }
    } catch { setError('Upload failed.'); }
    finally { setUploading(false); }
  }

  async function handleDelete(photo: DealPhoto) {
    try {
      await deletePhoto(photo);
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      if (lightbox !== null) {
        const idx = photos.findIndex(p => p.id === photo.id);
        if (idx === lightbox) setLightbox(photos.length > 1 ? Math.max(0, idx - 1) : null);
      }
    } catch { setError('Delete failed.'); }
    setDeleteTarget(null);
  }

  // Drag-and-drop
  const [dragging, setDragging] = useState(false);
  function onDragOver(e: React.DragEvent) { e.preventDefault(); setDragging(true); }
  function onDragLeave() { setDragging(false); }
  function onDrop(e: React.DragEvent) { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }

  // Lightbox navigation
  function lbPrev() { setLightbox(i => (i != null && i > 0 ? i - 1 : photos.length - 1)); }
  function lbNext() { setLightbox(i => (i != null && i < photos.length - 1 ? i + 1 : 0)); }
  useEffect(() => {
    if (lightbox === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') lbPrev();
      if (e.key === 'ArrowRight') lbNext();
      if (e.key === 'Escape') setLightbox(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, photos.length]);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#C8441A] flex items-center gap-2">
          <Images className="w-3.5 h-3.5" /> Photos
          {photos.length > 0 && <span className="text-zinc-500 font-normal">({photos.length})</span>}
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-500 px-3 py-1.5 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
          {uploading ? 'Uploading…' : 'Add Photos'}
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => handleFiles(e.target.files)} />
      </div>

      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-600 text-xs py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading photos…
        </div>
      ) : photos.length === 0 ? (
        <div
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-sm px-6 py-8 text-center cursor-pointer transition-colors ${
            dragging ? 'border-[#C8441A]/60 bg-[#C8441A]/5' : 'border-zinc-200 hover:border-zinc-600'
          }`}
        >
          <ImagePlus className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-500 text-xs">Drag & drop photos here, or click to upload</p>
          <p className="text-zinc-700 text-[10px] mt-1">JPG, PNG, WEBP — max 15 MB each</p>
        </div>
      ) : (
        <div
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          className={`grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 transition-all ${dragging ? 'ring-2 ring-[#C8441A]/40 ring-offset-2 ring-offset-[#0a0d14]' : ''}`}
        >
          {photos.map((photo, idx) => (
            <div key={photo.id} className="relative group aspect-square bg-zinc-50 border border-zinc-200 overflow-hidden">
              <img
                src={getPhotoUrl(photo.storage_path)}
                alt={photo.filename}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 cursor-pointer"
                onClick={() => setLightbox(idx)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                <button onClick={() => setLightbox(idx)} className="w-7 h-7 bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(photo)} className="w-7 h-7 bg-black/60 flex items-center justify-center text-red-400 hover:bg-black/80 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {/* Upload tile */}
          <div
            onClick={() => inputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-zinc-200 hover:border-zinc-500 flex items-center justify-center cursor-pointer transition-colors"
          >
            {uploading ? <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" /> : <Plus className="w-4 h-4 text-zinc-600" />}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && photos[lightbox] && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center" onClick={() => setLightbox(null)}>
          {/* Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <span className="text-zinc-500 text-xs">{lightbox + 1} / {photos.length}</span>
            <button onClick={e => { e.stopPropagation(); setDeleteTarget(photos[lightbox]); }}
              className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-300 bg-white/10 hover:bg-white/20 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={() => setLightbox(null)} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-900 bg-white/10 hover:bg-white/20 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Prev */}
          {photos.length > 1 && (
            <button onClick={e => { e.stopPropagation(); lbPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors z-10">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {/* Image */}
          <img
            src={getPhotoUrl(photos[lightbox].storage_path)}
            alt={photos[lightbox].filename}
            className="max-w-[90vw] max-h-[85vh] object-contain select-none"
            onClick={e => e.stopPropagation()}
          />
          {/* Next */}
          {photos.length > 1 && (
            <button onClick={e => { e.stopPropagation(); lbNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors z-10">
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
          {/* Filename */}
          <p className="absolute bottom-4 text-zinc-600 text-xs">{photos[lightbox].filename}</p>
          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="absolute bottom-10 flex gap-1.5 max-w-[80vw] overflow-x-auto pb-1">
              {photos.map((p, i) => (
                <button key={p.id} onClick={e => { e.stopPropagation(); setLightbox(i); }}
                  className={`flex-shrink-0 w-12 h-12 border-2 transition-colors overflow-hidden ${i === lightbox ? 'border-[#C8441A]' : 'border-transparent opacity-50 hover:opacity-80'}`}>
                  <img src={getPhotoUrl(p.storage_path)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteConfirm
          name={deleteTarget.filename}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

function LoginPage({ onLogin }: { onLogin: (u: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const hash = await sha256hex(password);
      const ok = await verifyCredentials(username.trim().toLowerCase(), hash);
      if (ok) { setSession(username.trim().toLowerCase()); onLogin(username.trim().toLowerCase()); }
      else setError('Invalid username or password.');
    } catch { setError('Login failed. Check your connection.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#C8441A]/10 border border-[#C8441A]/25 mb-6">
            <Plane className="w-8 h-8 text-[#C8441A]" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Build A STOL</h1>
          <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest">Command Center</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 p-8 space-y-4">
          <Field label="Username">
            <Inp value={username} onChange={setUsername} required />
          </Field>
          <Field label="Password">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className={inputCls} autoComplete="current-password" required />
          </Field>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#C8441A] hover:bg-[#b03a16] text-white font-extrabold text-sm py-3 uppercase tracking-widest transition-colors disabled:opacity-50 rounded-sm">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function DashCard({ label, value, sub, icon, color, onClick }: {
  label: string; value: number; sub?: string; icon: React.ReactNode; color: string; onClick?: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`bg-white border border-zinc-200 p-5 flex items-center gap-4 w-full text-left transition-all hover:border-[#C8441A]/40 hover:shadow-sm ${onClick ? 'cursor-pointer' : 'cursor-default'}`}>
      <div className={`w-11 h-11 flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-black text-zinc-900 leading-none">{value}</p>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>}
      </div>
    </button>
  );
}

function DashboardView({ projects, clients, sessions, onNav }: {
  projects: CrmProject[]; clients: CrmClient[]; sessions: CrmSession[];
  onNav: (v: CrmView) => void;
}) {
  const now = new Date().toISOString().slice(0, 10);
  const upcoming = sessions.filter(s => s.start_date >= now && s.status !== 'Cancelled');
  const activeProjects = projects.filter(p => ['New Lead','Contacted','Negotiating','Under Review'].includes(p.status));
  const purchased = projects.filter(p => p.status === 'Purchased');
  const highPriority = projects.filter(p => p.priority === 'High');
  const activeClients = clients.filter(c => c.status === 'Active');

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl">
      <div>
        <h2 className="text-xl font-black text-zinc-900 uppercase tracking-widest">Dashboard</h2>
        <p className="text-zinc-500 text-sm mt-1">Command center overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashCard label="Active Deals" value={activeProjects.length} icon={<FolderOpen className="w-5 h-5" />} color="bg-[#C8441A]/15 text-[#C8441A]" onClick={() => onNav('deals')} />
        <DashCard label="Purchased" value={purchased.length} icon={<CheckCircle className="w-5 h-5" />} color="bg-blue-500/15 text-blue-400" onClick={() => onNav('deals')} />
        <DashCard label="Active Clients" value={activeClients.length} icon={<Users className="w-5 h-5" />} color="bg-emerald-500/15 text-emerald-400" onClick={() => onNav('clients')} />
        <DashCard label="Upcoming Sessions" value={upcoming.length} icon={<CalendarDays className="w-5 h-5" />} color="bg-amber-500/15 text-amber-400" onClick={() => onNav('schedule')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent deals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Recent Deals</p>
            <button onClick={() => onNav('deals')} className="text-[10px] text-[#C8441A] hover:opacity-80 flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="bg-white border border-zinc-200 divide-y divide-zinc-200">
            {projects.slice(0, 6).map(p => (
              <div key={p.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-colors ${priorityBorder(p.priority)}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-900 text-sm font-semibold truncate">{p.project_name || '—'}</p>
                  <p className="text-zinc-500 text-xs">{p.category} · {p.city}{p.state ? `, ${p.state}` : ''}</p>
                </div>
                <Badge className={projectStatusColor(p.status)}>{p.status}</Badge>
                <span className="text-zinc-400 text-xs font-mono">{fmt$(p.asking_price)}</span>
              </div>
            ))}
            {projects.length === 0 && <p className="text-zinc-600 text-sm px-4 py-6">No deals yet.</p>}
          </div>
        </div>

        {/* Upcoming sessions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Upcoming Sessions</p>
            <button onClick={() => onNav('schedule')} className="text-[10px] text-[#C8441A] hover:opacity-80 flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="bg-white border border-zinc-200 divide-y divide-zinc-200">
            {upcoming.slice(0, 6).map(s => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-colors">
                <div className="flex-shrink-0 text-center w-10">
                  <p className="text-[#C8441A] font-black text-sm leading-none">{new Date(s.start_date + 'T00:00:00').getDate()}</p>
                  <p className="text-zinc-500 text-[10px] uppercase">{new Date(s.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-900 text-sm font-semibold truncate">{s.title}</p>
                  <p className="text-zinc-500 text-xs">{s.session_type}{s.client_name ? ` · ${s.client_name}` : ''}</p>
                </div>
                <Badge className={sessionStatusColor(s.status)}>{s.status}</Badge>
              </div>
            ))}
            {upcoming.length === 0 && <p className="text-zinc-600 text-sm px-4 py-6">No upcoming sessions.</p>}
          </div>
        </div>
      </div>

      {/* High priority deals */}
      {highPriority.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
            High Priority Deals <span className="text-emerald-400 ml-1">({highPriority.length})</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {highPriority.map(p => (
              <div key={p.id} className="bg-white border border-emerald-500/20 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-zinc-900 font-bold text-sm">{p.project_name}</p>
                  <Badge className={projectStatusColor(p.status)}>{p.status}</Badge>
                </div>
                <p className="text-zinc-500 text-xs mb-2">{p.category} · {p.city}{p.state ? `, ${p.state}` : ''}</p>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-700 text-sm font-mono">{fmt$(p.asking_price)}</span>
                  <span className="text-xs text-zinc-500">Score: <span className="text-zinc-900 font-bold">{p.deal_score}/10</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PROJECT FORM ─────────────────────────────────────────────────────────────

const fmtCurrency = (n: number | null | undefined) =>
  n != null ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : '—';

function scoreColor(score: number): string {
  if (score >= 8) return 'text-emerald-400';
  if (score >= 6) return 'text-yellow-400';
  if (score >= 4) return 'text-orange-400';
  return 'text-red-400';
}
function scoreBg(score: number): string {
  if (score >= 8) return 'bg-emerald-400/10 border-emerald-400/30';
  if (score >= 6) return 'bg-yellow-400/10 border-yellow-400/30';
  if (score >= 4) return 'bg-orange-400/10 border-orange-400/30';
  return 'bg-red-400/10 border-red-400/30';
}
function scoreLabel(score: number): string {
  if (score >= 9) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Marginal';
  if (score >= 3) return 'Weak';
  return 'Pass';
}

function ProjectForm({ project, onClose, onSave }: {
  project: CrmProject | null; onClose: () => void; onSave: (d: ProjectDraft) => Promise<void>;
}) {
  const [d, setD] = useState<ProjectDraft>(project ? { ...project } : { ...EMPTY_DRAFT });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showEvaluator, setShowEvaluator] = useState(false);

  function set<K extends keyof ProjectDraft>(k: K, v: ProjectDraft[K]) { setD(p => ({ ...p, [k]: v })); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!d.project_name.trim()) { setError('Project name is required.'); return; }
    setSaving(true); setError('');
    try { await onSave(d); onClose(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Save failed.'); }
    finally { setSaving(false); }
  }

  return (
    <>
    <Modal title={project ? 'Edit Project' : 'New Project'} onClose={onClose} onSave={handleSave} saving={saving} error={error}>
      <SecLabel>Basic Info</SecLabel>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><Field label="Project Name *"><Inp value={d.project_name} onChange={v => set('project_name', v)} placeholder="e.g. CH750 STOL N1234" required /></Field></div>
        <Field label="Seller Name"><Inp value={d.seller_name} onChange={v => set('seller_name', v)} /></Field>
        <Field label="Phone"><Inp value={d.phone} onChange={v => set('phone', v)} type="tel" /></Field>
        <Field label="Email"><Inp value={d.email} onChange={v => set('email', v)} type="email" /></Field>
        <Field label="Source"><Sel value={d.source || SOURCES[0]} onChange={v => set('source', v)} options={SOURCES} /></Field>
        <Field label="City"><Inp value={d.city} onChange={v => set('city', v)} /></Field>
        <Field label="State"><Inp value={d.state} onChange={v => set('state', v)} /></Field>
        <div className="col-span-2"><Field label="Listing URL"><Inp value={d.listing_url} onChange={v => set('listing_url', v)} type="url" placeholder="https://www.barnstormers.com/…" /></Field></div>
      </div>

      <SecLabel>Aircraft Details</SecLabel>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Category"><Sel value={d.category} onChange={v => set('category', v)} options={CATEGORIES} /></Field>
        <Field label="Completion %"><Inp value={d.completion_pct} onChange={v => set('completion_pct', parseInt(v)||0)} type="number" placeholder="0–100" /></Field>
        <Field label="Condition"><Inp value={d.condition_text} onChange={v => set('condition_text', v)} placeholder="e.g. Good – needs paint" /></Field>
        <Field label="Build Quality (1–5)"><Sel value={String(d.build_quality_rating)} onChange={v => set('build_quality_rating', parseInt(v))} options={['1','2','3','4','5']} /></Field>
        <div className="col-span-2"><Field label="Aircraft Notes"><Txt value={d.aircraft_notes} onChange={v => set('aircraft_notes', v)} /></Field></div>
      </div>

      <SecLabel>Engine</SecLabel>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Engine Type"><Sel value={d.engine_type || ENGINE_TYPES[0]} onChange={v => set('engine_type', v)} options={ENGINE_TYPES} /></Field>
        <Field label="Engine Model"><Inp value={d.engine_model} onChange={v => set('engine_model', v)} placeholder="e.g. 912 ULS" /></Field>
        <Field label="Engine Hours"><Inp value={d.engine_hours} onChange={v => set('engine_hours', v ? parseInt(v) : null)} type="number" /></Field>
        <Field label="Engine Condition"><Inp value={d.engine_condition} onChange={v => set('engine_condition', v)} /></Field>
        <Field label="Firewall Forward?"><Sel value={d.firewall_forward ? 'Yes' : 'No'} onChange={v => set('firewall_forward', v === 'Yes')} options={['Yes','No']} /></Field>
      </div>

      <SecLabel>Financial</SecLabel>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Asking Price ($)"><Inp value={d.asking_price} onChange={v => set('asking_price', v ? parseFloat(v) : null)} type="number" /></Field>
        <Field label="My Offer ($)"><Inp value={d.my_offer} onChange={v => set('my_offer', v ? parseFloat(v) : null)} type="number" /></Field>
        <Field label="Completed Market Price ($)"><Inp value={d.estimated_value} onChange={v => set('estimated_value', v ? parseFloat(v) : null)} type="number" /></Field>
        <Field label="Target Purchase Price ($)"><Inp value={d.target_purchase_price} onChange={v => set('target_purchase_price', v ? parseFloat(v) : null)} type="number" /></Field>
      </div>

      {/* Project Evaluator CTA */}
      <div className="border border-[#C8441A]/25 bg-[#C8441A]/4 p-4 mt-1">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calculator className="w-4 h-4 text-[#C8441A] flex-shrink-0" />
            <div>
              <p className="text-zinc-900 text-xs font-black uppercase tracking-widest">Project Evaluator</p>
              <p className="text-zinc-500 text-[10px]">Calculate total cost, profit & auto-rate this deal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowEvaluator(true)}
            className="flex items-center gap-2 bg-[#C8441A]/15 hover:bg-[#C8441A]/25 border border-[#C8441A]/40 text-[#C8441A] font-bold text-[10px] uppercase tracking-widest px-4 py-2 transition-colors whitespace-nowrap"
          >
            <Calculator className="w-3 h-3" /> Run Evaluator
          </button>
        </div>

        {/* Show result summary if evaluated */}
        {d.project_cost != null && d.project_cost > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-200 grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-0.5">Project Cost</p>
              <p className="text-zinc-900 text-sm font-bold">{fmtCurrency(d.project_cost)}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-0.5 flex items-center justify-center gap-1"><TrendingUp className="w-2.5 h-2.5" />Profit</p>
              <p className={`text-sm font-bold ${(d.profit_potential ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtCurrency(d.profit_potential)}</p>
              {d.profit_pct != null && <p className={`text-[10px] ${(d.profit_potential ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{d.profit_pct.toFixed(1)}%</p>}
            </div>
            <div className={`text-center border ${scoreBg(d.deal_score)} py-1`}>
              <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-0.5 flex items-center justify-center gap-1"><Star className="w-2.5 h-2.5" />Score</p>
              <p className={`text-xl font-black leading-none ${scoreColor(d.deal_score)}`}>{d.deal_score}<span className="text-xs font-normal text-zinc-600">/10</span></p>
              <p className={`text-[9px] font-bold uppercase tracking-widest ${scoreColor(d.deal_score)}`}>{scoreLabel(d.deal_score)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden deal_score field (set by evaluator but keep manual override available) */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Deal Score (1–10) — manual override">
          <Sel value={String(d.deal_score)} onChange={v => set('deal_score', parseInt(v))} options={['1','2','3','4','5','6','7','8','9','10']} />
        </Field>
      </div>

      <SecLabel>Analysis</SecLabel>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Pros"><Txt value={d.pros} onChange={v => set('pros', v)} rows={3} placeholder="What's working…" /></Field>
        <Field label="Cons"><Txt value={d.cons} onChange={v => set('cons', v)} rows={3} placeholder="Red flags…" /></Field>
        <Field label="Risk Level"><Sel value={d.risk_level} onChange={v => set('risk_level', v as 'Low'|'Medium'|'High')} options={['Low','Medium','High']} /></Field>
        <Field label="Flip Potential"><Sel value={d.flip_potential} onChange={v => set('flip_potential', v as 'Low'|'Medium'|'High')} options={['Low','Medium','High']} /></Field>
        <div className="col-span-2"><Field label="Strategy Notes"><Txt value={d.strategy_notes} onChange={v => set('strategy_notes', v)} /></Field></div>
      </div>

      <SecLabel>Status</SecLabel>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Status"><Sel value={d.status} onChange={v => set('status', v as ProjectStatus)} options={STATUSES} /></Field>
        <Field label="Priority"><Sel value={d.priority} onChange={v => set('priority', v as Priority)} options={PRIORITIES} /></Field>
      </div>
    </Modal>

    {showEvaluator && (
      <ProjectEvaluator
        aircraftType={d.category === 'CH750 STOL' ? 'CH750 STOL' : 'CH750 STOL'}
        clientBasis={d.target_purchase_price ?? d.my_offer}
        sellingPrice={d.estimated_value}
        onApply={result => {
          setD(prev => ({
            ...prev,
            project_cost: result.projectCost,
            profit_potential: result.profitPotential,
            profit_pct: result.profitPct,
            deal_score: result.dealScore,
          }));
        }}
        onClose={() => setShowEvaluator(false)}
      />
    )}
    </>
  );
}

// ─── DEALS VIEW ───────────────────────────────────────────────────────────────

function DealsView({ projects, onRefresh }: { projects: CrmProject[]; onRefresh: (updated: CrmProject[]) => void }) {
  const [search, setSearch] = useState('');
  const [fStatus, setFStatus] = useState('All');
  const [fCat, setFCat] = useState('All');
  const [fPri, setFPri] = useState('All');
  const [sortField, setSortField] = useState<keyof CrmProject>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CrmProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CrmProject | null>(null);

  function toggleSort(f: keyof CrmProject) { if (sortField === f) setSortAsc(a => !a); else { setSortField(f); setSortAsc(true); } }

  const filtered = projects.filter(p => {
    if (fStatus !== 'All' && p.status !== fStatus) return false;
    if (fCat !== 'All' && p.category !== fCat) return false;
    if (fPri !== 'All' && p.priority !== fPri) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.project_name.toLowerCase().includes(q) || p.seller_name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) || p.state.toLowerCase().includes(q) ||
        p.engine_type.toLowerCase().includes(q) || p.engine_model.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    const av = a[sortField] ?? ''; const bv = b[sortField] ?? '';
    const c = av < bv ? -1 : av > bv ? 1 : 0;
    return sortAsc ? c : -c;
  });

  async function handleSave(draft: ProjectDraft) {
    if (editTarget) {
      const u = await updateProject(editTarget.id, draft);
      onRefresh(projects.map(p => p.id === u.id ? u : p));
    } else {
      const c = await createProject(draft);
      onRefresh([c, ...projects]);
    }
  }

  async function handleDelete(p: CrmProject) {
    await deleteProject(p.id);
    onRefresh(projects.filter(x => x.id !== p.id));
    setDeleteTarget(null); setExpandedId(null);
  }

  function SortIcon({ field }: { field: keyof CrmProject }) {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  }

  function TH({ field, label }: { field: keyof CrmProject; label: string }) {
    return (
      <th className="px-4 py-3 text-left cursor-pointer hover:text-zinc-900 transition-colors" onClick={() => toggleSort(field)}>
        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
          {label} <SortIcon field={field} />
        </span>
      </th>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-900 uppercase tracking-widest">Incoming Deals</h2>
          <p className="text-zinc-500 text-sm mt-1">Aircraft projects under evaluation</p>
        </div>
        <button onClick={() => { setEditTarget(null); setFormOpen(true); }}
          className="flex items-center gap-2 bg-[#C8441A] hover:bg-[#b03a16] text-white font-extrabold text-xs px-5 py-2.5 uppercase tracking-widest transition-colors rounded-sm">
          <Plus className="w-3.5 h-3.5" /> Add Deal
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, location, engine…"
            className="w-full bg-white border border-zinc-200 text-zinc-900 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#C8441A]/50 transition-colors placeholder:text-zinc-400" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          {[['All', ...STATUSES], ['All', ...CATEGORIES], ['All', ...PRIORITIES]].map((opts, i) => {
            const vals = [fStatus, fCat, fPri];
            const setters = [setFStatus, setFCat, setFPri];
            return (
              <select key={i} value={vals[i]} onChange={e => setters[i](e.target.value)}
                className="bg-white border border-zinc-200 text-zinc-700 px-3 py-2 text-xs focus:outline-none focus:border-[#C8441A]/50 appearance-none">
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-500 text-sm">No deals match your filters.</p>
            {projects.length === 0 && (
              <button onClick={() => { setEditTarget(null); setFormOpen(true); }}
                className="mt-3 text-[#C8441A] font-bold text-sm hover:opacity-80">Add your first deal →</button>
            )}
          </div>
        ) : (
          <table className="w-full min-w-[800px]">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="w-8" />
                <TH field="project_name" label="Project" />
                <TH field="category" label="Category" />
                <TH field="status" label="Status" />
                <TH field="priority" label="Priority" />
                <TH field="asking_price" label="Asking" />
                <TH field="deal_score" label="Score" />
                <TH field="completion_pct" label="Done %" />
                <TH field="seller_name" label="Seller" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filtered.map(p => (
                <>
                  <tr key={p.id} onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                    className={`cursor-pointer hover:bg-zinc-50 transition-colors ${priorityBorder(p.priority)}`}>
                    <td className="pl-3 text-zinc-600">
                      {expandedId === p.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-zinc-900 text-sm font-semibold">{p.project_name || '—'}</p>
                      <p className="text-zinc-500 text-xs">{p.city}{p.state ? `, ${p.state}` : ''}</p>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-700 text-sm">{p.category}</td>
                    <td className="px-4 py-3.5"><Badge className={projectStatusColor(p.status)}>{p.status}</Badge></td>
                    <td className="px-4 py-3.5"><span className={`text-xs font-bold ${priorityColor(p.priority)}`}><Star className="w-3 h-3 inline mr-1 opacity-60" />{p.priority}</span></td>
                    <td className="px-4 py-3.5 text-zinc-700 text-sm font-mono">{fmt$(p.asking_price)}</td>
                    <td className="px-4 py-3.5"><span className="text-zinc-900 font-bold text-sm">{p.deal_score}</span><span className="text-zinc-600 text-xs">/10</span></td>
                    <td className="px-4 py-3.5 text-zinc-700 text-sm">{p.completion_pct}%</td>
                    <td className="px-4 py-3.5 text-zinc-400 text-sm">{p.seller_name || '—'}</td>
                  </tr>
                  {expandedId === p.id && (
                    <tr key={`${p.id}-exp`}>
                      <td colSpan={9} className="p-0">
                        <div className="bg-zinc-50 border-t border-zinc-200 px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#C8441A] mb-2">Contact</p>
                            {[['Email', p.email],['Phone', p.phone],['Location', [p.city,p.state].filter(Boolean).join(', ')],['Source', p.source]].map(([l,v]) => (
                              <div key={l} className="flex gap-2"><span className="text-zinc-500 text-xs w-16 flex-shrink-0">{l}</span><span className="text-zinc-700 text-xs">{v||'—'}</span></div>
                            ))}
                            {p.listing_url && (
                              <div className="flex gap-2 pt-0.5">
                                <span className="text-zinc-500 text-xs w-16 flex-shrink-0">Listing</span>
                                <a href={p.listing_url} target="_blank" rel="noopener noreferrer"
                                  className="text-[#C8441A] text-xs underline underline-offset-2 hover:text-[#b03a16] transition-colors truncate max-w-[160px]"
                                  onClick={e => e.stopPropagation()}>
                                  View Listing →
                                </a>
                              </div>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#C8441A] mb-2">Aircraft</p>
                            {[['Completion',`${p.completion_pct}%`],['Condition',p.condition_text],['Build Quality',`${p.build_quality_rating}/5`],['Engine',`${p.engine_type} ${p.engine_model}`.trim()],['Hours',p.engine_hours!=null?String(p.engine_hours):'—'],['FWF',p.firewall_forward?'Yes':'No']].map(([l,v]) => (
                              <div key={l} className="flex gap-2"><span className="text-zinc-500 text-xs w-20 flex-shrink-0">{l}</span><span className="text-zinc-700 text-xs">{v||'—'}</span></div>
                            ))}
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#C8441A] mb-2">Financial</p>
                            {[['Asking',fmt$(p.asking_price)],['My Offer',fmt$(p.my_offer)],['Mkt Price',fmt$(p.estimated_value)],['Target',fmt$(p.target_purchase_price)],['Score',`${p.deal_score}/10`]].map(([l,v]) => (
                              <div key={l} className="flex gap-2"><span className="text-zinc-500 text-xs w-16 flex-shrink-0">{l}</span><span className="text-zinc-700 text-xs">{v}</span></div>
                            ))}
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#C8441A] mb-2">Analysis</p>
                            {[['Risk',p.risk_level],['Flip',p.flip_potential]].map(([l,v]) => (
                              <div key={l} className="flex gap-2"><span className="text-zinc-500 text-xs w-16 flex-shrink-0">{l}</span><span className="text-zinc-700 text-xs">{v}</span></div>
                            ))}
                            {p.pros && <p className="text-zinc-400 text-xs"><span className="text-zinc-500">Pros: </span>{p.pros}</p>}
                            {p.cons && <p className="text-zinc-400 text-xs"><span className="text-zinc-500">Cons: </span>{p.cons}</p>}
                          </div>
                          {p.strategy_notes && (
                            <div className="col-span-2 md:col-span-4">
                              <span className="text-zinc-500 text-xs">Strategy: </span>
                              <span className="text-zinc-700 text-xs">{p.strategy_notes}</span>
                            </div>
                          )}
                          <div className="col-span-2 md:col-span-4">
                            <DealGallery projectId={p.id} />
                          </div>
                          <div className="col-span-2 md:col-span-4 flex gap-3 pt-1">
                            <button onClick={() => { setEditTarget(p); setFormOpen(true); }}
                              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-700 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-500 px-4 py-2 transition-colors">
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                            <button onClick={() => setDeleteTarget(p)}
                              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-400/40 px-4 py-2 transition-colors">
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-zinc-600 text-xs">{filtered.length} of {projects.length} deals</p>

      {formOpen && <ProjectForm key={editTarget?.id ?? 'new'} project={editTarget} onClose={() => setFormOpen(false)} onSave={handleSave} />}
      {deleteTarget && <DeleteConfirm name={deleteTarget.project_name} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ─── CLIENT FORM ──────────────────────────────────────────────────────────────

function ClientForm({ client, onClose, onSave }: { client: CrmClient | null; onClose: () => void; onSave: (d: ClientDraft) => Promise<void> }) {
  const [d, setD] = useState<ClientDraft>(client ? { ...client } : { ...EMPTY_CLIENT_DRAFT });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  function set<K extends keyof ClientDraft>(k: K, v: ClientDraft[K]) { setD(p => ({ ...p, [k]: v })); }
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!d.name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError('');
    try { await onSave(d); onClose(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Save failed.'); }
    finally { setSaving(false); }
  }
  return (
    <Modal title={client ? 'Edit Client' : 'New Client'} onClose={onClose} onSave={handleSave} saving={saving} error={error}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><Field label="Full Name *"><Inp value={d.name} onChange={v => set('name', v)} required /></Field></div>
        <Field label="Email"><Inp value={d.email} onChange={v => set('email', v)} type="email" /></Field>
        <Field label="Phone"><Inp value={d.phone} onChange={v => set('phone', v)} type="tel" /></Field>
        <Field label="City"><Inp value={d.city} onChange={v => set('city', v)} /></Field>
        <Field label="State"><Inp value={d.state} onChange={v => set('state', v)} /></Field>
        <Field label="Program Type"><Sel value={d.program_type} onChange={v => set('program_type', v)} options={PROGRAM_TYPES} /></Field>
        <Field label="Status"><Sel value={d.status} onChange={v => set('status', v as ClientStatus)} options={CLIENT_STATUSES} /></Field>
        <div className="col-span-2"><Field label="Pilot Status"><Inp value={d.pilot_status} onChange={v => set('pilot_status', v)} placeholder="e.g. Private Pilot, Student, Sport" /></Field></div>
        <div className="col-span-2"><Field label="Notes"><Txt value={d.notes} onChange={v => set('notes', v)} rows={3} /></Field></div>
      </div>
    </Modal>
  );
}

// ─── CLIENTS VIEW ─────────────────────────────────────────────────────────────

function ClientsView({ clients, onRefresh }: { clients: CrmClient[]; onRefresh: (c: CrmClient[]) => void }) {
  const [search, setSearch] = useState('');
  const [fStatus, setFStatus] = useState('All');
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CrmClient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CrmClient | null>(null);

  const filtered = clients.filter(c => {
    if (fStatus !== 'All' && c.status !== fStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.city.toLowerCase().includes(q);
    }
    return true;
  });

  async function handleSave(draft: ClientDraft) {
    if (editTarget) { const u = await updateClient(editTarget.id, draft); onRefresh(clients.map(c => c.id === u.id ? u : c)); }
    else { const c = await createClient(draft); onRefresh([c, ...clients]); }
  }

  async function handleDelete(c: CrmClient) {
    await deleteClient(c.id);
    onRefresh(clients.filter(x => x.id !== c.id));
    setDeleteTarget(null);
  }

  return (
    <div className="p-6 md:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-900 uppercase tracking-widest">Clients</h2>
          <p className="text-zinc-500 text-sm mt-1">Build program participants and prospects</p>
        </div>
        <button onClick={() => { setEditTarget(null); setFormOpen(true); }}
          className="flex items-center gap-2 bg-[#C8441A] hover:bg-[#b03a16] text-white font-extrabold text-xs px-5 py-2.5 uppercase tracking-widest transition-colors rounded-sm">
          <Plus className="w-3.5 h-3.5" /> Add Client
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…"
            className="w-full bg-white border border-zinc-200 text-zinc-900 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#C8441A]/50 transition-colors placeholder:text-zinc-400" />
        </div>
        <select value={fStatus} onChange={e => setFStatus(e.target.value)}
          className="bg-white border border-zinc-200 text-zinc-700 px-3 py-2 text-xs focus:outline-none focus:border-[#C8441A]/50 appearance-none">
          {['All', ...CLIENT_STATUSES].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <div className="bg-white border border-zinc-200 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-500 text-sm">No clients yet.</p>
            <button onClick={() => { setEditTarget(null); setFormOpen(true); }} className="mt-3 text-[#C8441A] font-bold text-sm hover:opacity-80">Add your first client →</button>
          </div>
        ) : (
          <table className="w-full min-w-[600px]">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                {['Name','Program','Status','Location','Pilot Status',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="text-zinc-900 text-sm font-semibold">{c.name}</p>
                    <p className="text-zinc-500 text-xs">{c.email}</p>
                  </td>
                  <td className="px-4 py-3.5 text-zinc-700 text-sm">{c.program_type}</td>
                  <td className="px-4 py-3.5"><Badge className={clientStatusColor(c.status)}>{c.status}</Badge></td>
                  <td className="px-4 py-3.5 text-zinc-400 text-sm">{c.city}{c.state ? `, ${c.state}` : ''}</td>
                  <td className="px-4 py-3.5 text-zinc-400 text-sm">{c.pilot_status || '—'}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => { setEditTarget(c); setFormOpen(true); }} className="text-zinc-500 hover:text-zinc-900 transition-colors p-1"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteTarget(c)} className="text-zinc-500 hover:text-red-400 transition-colors p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-zinc-600 text-xs">{filtered.length} of {clients.length} clients</p>

      {formOpen && <ClientForm client={editTarget} onClose={() => setFormOpen(false)} onSave={handleSave} />}
      {deleteTarget && <DeleteConfirm name={deleteTarget.name} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ─── SESSION FORM ─────────────────────────────────────────────────────────────

function SessionForm({ session, onClose, onSave }: { session: CrmSession | null; onClose: () => void; onSave: (d: SessionDraft) => Promise<void> }) {
  const [d, setD] = useState<SessionDraft>(session ? { ...session } : { ...EMPTY_SESSION_DRAFT });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  function set<K extends keyof SessionDraft>(k: K, v: SessionDraft[K]) { setD(p => ({ ...p, [k]: v })); }
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!d.title.trim()) { setError('Title is required.'); return; }
    if (d.end_date < d.start_date) { setError('End date must be on or after start date.'); return; }
    setSaving(true); setError('');
    try { await onSave(d); onClose(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Save failed.'); }
    finally { setSaving(false); }
  }
  return (
    <Modal title={session ? 'Edit Session' : 'New Session'} onClose={onClose} onSave={handleSave} saving={saving} error={error}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><Field label="Session Title *"><Inp value={d.title} onChange={v => set('title', v)} placeholder="e.g. CH750 Build Week — Mike R." required /></Field></div>
        <Field label="Session Type"><Sel value={d.session_type} onChange={v => set('session_type', v as SessionType)} options={SESSION_TYPES} /></Field>
        <Field label="Status"><Sel value={d.status} onChange={v => set('status', v as SessionStatus)} options={SESSION_STATUSES} /></Field>
        <Field label="Start Date"><Inp value={d.start_date} onChange={v => set('start_date', v)} type="date" /></Field>
        <Field label="End Date"><Inp value={d.end_date} onChange={v => set('end_date', v)} type="date" /></Field>
        <Field label="Client Name"><Inp value={d.client_name} onChange={v => set('client_name', v)} placeholder="Client or group name" /></Field>
        <Field label="Instructor / Lead"><Inp value={d.instructor} onChange={v => set('instructor', v)} /></Field>
        <Field label="Max Capacity"><Inp value={d.max_capacity} onChange={v => set('max_capacity', parseInt(v)||1)} type="number" /></Field>
        <Field label="Enrolled Count"><Inp value={d.enrolled_count} onChange={v => set('enrolled_count', parseInt(v)||0)} type="number" /></Field>
        <div className="col-span-2"><Field label="Description"><Txt value={d.description} onChange={v => set('description', v)} /></Field></div>
        <div className="col-span-2"><Field label="Notes"><Txt value={d.notes} onChange={v => set('notes', v)} /></Field></div>
      </div>
    </Modal>
  );
}

// ─── SCHEDULE VIEW ────────────────────────────────────────────────────────────

function ScheduleView({ sessions, onRefresh }: { sessions: CrmSession[]; onRefresh: (s: CrmSession[]) => void }) {
  const [fStatus, setFStatus] = useState('All');
  const [fType, setFType] = useState('All');
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CrmSession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CrmSession | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const now = new Date().toISOString().slice(0, 10);

  const filtered = sessions.filter(s => {
    if (fStatus !== 'All' && s.status !== fStatus) return false;
    if (fType !== 'All' && s.session_type !== fType) return false;
    return true;
  });

  const upcoming = filtered.filter(s => s.end_date >= now && s.status !== 'Cancelled');
  const past = filtered.filter(s => s.end_date < now || s.status === 'Cancelled');

  async function handleSave(draft: SessionDraft) {
    if (editTarget) { const u = await updateSession(editTarget.id, draft); onRefresh(sessions.map(s => s.id === u.id ? u : s)); }
    else { const c = await createSession(draft); onRefresh([...sessions, c].sort((a, b) => a.start_date.localeCompare(b.start_date))); }
  }

  async function handleDelete(s: CrmSession) {
    await deleteSession(s.id);
    onRefresh(sessions.filter(x => x.id !== s.id));
    setDeleteTarget(null);
  }

  function SessionRow({ s }: { s: CrmSession }) {
    const multiDay = s.start_date !== s.end_date;
    return (
      <>
        <tr key={s.id} onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
          className="cursor-pointer hover:bg-zinc-50 transition-colors border-l-2 border-l-zinc-200">
          <td className="pl-3 text-zinc-600">
            {expandedId === s.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </td>
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 text-center">
                <p className="text-[#C8441A] font-black text-base leading-none">{new Date(s.start_date + 'T00:00:00').getDate()}</p>
                <p className="text-zinc-500 text-[10px] uppercase">{new Date(s.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</p>
              </div>
              <div>
                <p className="text-zinc-900 text-sm font-semibold">{s.title}</p>
                {multiDay && <p className="text-zinc-500 text-xs">Through {fmtDate(s.end_date)}</p>}
              </div>
            </div>
          </td>
          <td className="px-4 py-3.5 text-zinc-700 text-sm">{s.session_type}</td>
          <td className="px-4 py-3.5 text-zinc-400 text-sm">{s.client_name || '—'}</td>
          <td className="px-4 py-3.5 text-zinc-400 text-sm">{s.instructor || '—'}</td>
          <td className="px-4 py-3.5 text-zinc-700 text-sm">{s.enrolled_count}/{s.max_capacity}</td>
          <td className="px-4 py-3.5"><Badge className={sessionStatusColor(s.status)}>{s.status}</Badge></td>
        </tr>
        {expandedId === s.id && (
          <tr key={`${s.id}-exp`}>
            <td colSpan={7} className="p-0">
              <div className="bg-zinc-50 border-t border-zinc-200 px-6 py-4">
                {s.description && <p className="text-zinc-400 text-sm mb-3">{s.description}</p>}
                {s.notes && <p className="text-zinc-500 text-xs mb-3"><span className="text-zinc-600">Notes: </span>{s.notes}</p>}
                <div className="flex gap-3 mt-2">
                  <button onClick={() => { setEditTarget(s); setFormOpen(true); }}
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-700 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-500 px-4 py-2 transition-colors">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => setDeleteTarget(s)}
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-400/40 px-4 py-2 transition-colors">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            </td>
          </tr>
        )}
      </>
    );
  }

  function SessionTable({ rows, label }: { rows: CrmSession[]; label: string }) {
    if (rows.length === 0) return null;
    return (
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">{label}</p>
        <div className="bg-white border border-zinc-200 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="w-8" />
                {['Date / Title','Type','Client','Instructor','Capacity','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {rows.map(s => <SessionRow key={s.id} s={s} />)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-900 uppercase tracking-widest">Schedule</h2>
          <p className="text-zinc-500 text-sm mt-1">Build sessions, workshops, and consultations</p>
        </div>
        <button onClick={() => { setEditTarget(null); setFormOpen(true); }}
          className="flex items-center gap-2 bg-[#C8441A] hover:bg-[#b03a16] text-white font-extrabold text-xs px-5 py-2.5 uppercase tracking-widest transition-colors rounded-sm">
          <Plus className="w-3.5 h-3.5" /> Add Session
        </button>
      </div>

      <div className="flex items-center gap-3">
        <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="bg-white border border-zinc-200 text-zinc-700 px-3 py-2 text-xs focus:outline-none focus:border-[#C8441A]/50 appearance-none">
          {['All', ...SESSION_STATUSES].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={fType} onChange={e => setFType(e.target.value)} className="bg-white border border-zinc-200 text-zinc-700 px-3 py-2 text-xs focus:outline-none focus:border-[#C8441A]/50 appearance-none">
          {['All', ...SESSION_TYPES].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200 p-12 text-center">
          <p className="text-zinc-500 text-sm">No sessions scheduled.</p>
          <button onClick={() => { setEditTarget(null); setFormOpen(true); }} className="mt-3 text-[#C8441A] font-bold text-sm hover:opacity-80">Schedule your first session →</button>
        </div>
      ) : (
        <>
          <SessionTable rows={upcoming} label={`Upcoming (${upcoming.length})`} />
          <SessionTable rows={past} label={`Past / Cancelled (${past.length})`} />
        </>
      )}

      {formOpen && <SessionForm session={editTarget} onClose={() => setFormOpen(false)} onSave={handleSave} />}
      {deleteTarget && <DeleteConfirm name={deleteTarget.title} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ─── INVENTORY VIEW (placeholder) ─────────────────────────────────────────────

function InventoryView() {
  return (
    <div className="p-6 md:p-8">
      <h2 className="text-xl font-black text-zinc-900 uppercase tracking-widest mb-2">Inventory</h2>
      <p className="text-zinc-500 text-sm mb-8">Parts, tools, and materials tracking — coming soon.</p>
      <div className="bg-white border border-dashed border-zinc-200 p-16 text-center max-w-lg">
        <Package className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
        <p className="text-zinc-400 font-bold text-sm uppercase tracking-widest mb-2">Inventory Module</p>
        <p className="text-zinc-600 text-sm">Track parts, kits, tools, and shop materials. Ready to build when you are.</p>
      </div>
    </div>
  );
}

// ─── ADMIN VIEW ───────────────────────────────────────────────────────────────

function ComponentsAdminPanel() {
  const [aircraftTypes, setAircraftTypes] = useState<AircraftType[]>([]);
  const [allConfigs, setAllConfigs] = useState<PricingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

  // Aircraft type editing
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editTypeName, setEditTypeName] = useState('');
  const [newTypeName, setNewTypeName] = useState('');
  const [addingType, setAddingType] = useState(false);
  const [deletingTypeId, setDeletingTypeId] = useState<string | null>(null);

  // Component editing
  const [editingCompId, setEditingCompId] = useState<string | null>(null);
  const [editComp, setEditComp] = useState({ label: '', component: '', default_cost: '' });
  const [newComp, setNewComp] = useState({ label: '', component: '', default_cost: '' });
  const [addingComp, setAddingComp] = useState(false);
  const [deletingCompId, setDeletingCompId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchAircraftTypes(), fetchPricingConfig()])
      .then(([types, configs]) => {
        setAircraftTypes(types);
        setAllConfigs(configs);
        if (types.length > 0 && !selectedTypeId) setSelectedTypeId(types[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedType = aircraftTypes.find(t => t.id === selectedTypeId);
  const components = allConfigs.filter(c => selectedType && c.aircraft_type === selectedType.name)
    .sort((a, b) => a.sort_order - b.sort_order);

  // ── Aircraft type actions ──
  async function saveType(id: string) {
    if (!editTypeName.trim()) return;
    setSaving(true);
    try {
      const updated = await updateAircraftType(id, editTypeName);
      setAircraftTypes(prev => prev.map(t => t.id === id ? updated : t));
      // Update configs that reference old name
      const old = aircraftTypes.find(t => t.id === id);
      if (old && old.name !== updated.name) {
        setAllConfigs(prev => prev.map(c => c.aircraft_type === old.name ? { ...c, aircraft_type: updated.name } : c));
      }
      setEditingTypeId(null);
    } finally { setSaving(false); }
  }

  async function addType() {
    if (!newTypeName.trim()) return;
    setSaving(true);
    try {
      const created = await createAircraftType(newTypeName, aircraftTypes.length);
      setAircraftTypes(prev => [...prev, created]);
      setNewTypeName('');
      setAddingType(false);
      setSelectedTypeId(created.id);
    } finally { setSaving(false); }
  }

  async function removeType(id: string) {
    const type = aircraftTypes.find(t => t.id === id);
    if (!type) return;
    setDeletingTypeId(id);
    try {
      await deleteAircraftType(id);
      setAircraftTypes(prev => prev.filter(t => t.id !== id));
      setAllConfigs(prev => prev.filter(c => c.aircraft_type !== type.name));
      if (selectedTypeId === id) {
        const remaining = aircraftTypes.filter(t => t.id !== id);
        setSelectedTypeId(remaining[0]?.id ?? null);
      }
    } finally { setDeletingTypeId(null); }
  }

  // ── Component actions ──
  async function saveComp(id: string) {
    const cost = parseFloat(editComp.default_cost);
    if (!editComp.label.trim() || isNaN(cost)) return;
    setSaving(true);
    try {
      await updatePricingConfig(id, { label: editComp.label.trim(), default_cost: cost });
      setAllConfigs(prev => prev.map(c => c.id === id ? { ...c, label: editComp.label.trim(), default_cost: cost } : c));
      setEditingCompId(null);
    } finally { setSaving(false); }
  }

  async function addComp() {
    if (!selectedType || !newComp.label.trim() || !newComp.component.trim()) return;
    const cost = parseFloat(newComp.default_cost) || 0;
    setSaving(true);
    try {
      const created = await createPricingConfig(
        selectedType.name, newComp.component.trim().toLowerCase().replace(/\s+/g, '_'),
        newComp.label.trim(), cost, components.length
      );
      setAllConfigs(prev => [...prev, created]);
      setNewComp({ label: '', component: '', default_cost: '' });
      setAddingComp(false);
    } finally { setSaving(false); }
  }

  async function removeComp(id: string) {
    setDeletingCompId(id);
    try {
      await deletePricingConfig(id);
      setAllConfigs(prev => prev.filter(c => c.id !== id));
    } finally { setDeletingCompId(null); }
  }

  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);

  function onDragStart(id: string) {
    dragIdRef.current = id;
  }

  function onDragEnter(id: string) {
    if (dragIdRef.current && dragIdRef.current !== id) setDragOverId(id);
  }

  function onDragEnd() {
    setDragOverId(null);
    dragIdRef.current = null;
  }

  async function onDrop(targetId: string) {
    const fromId = dragIdRef.current;
    if (!fromId || fromId === targetId) { onDragEnd(); return; }
    const ordered = [...components];
    const fromIdx = ordered.findIndex(c => c.id === fromId);
    const toIdx   = ordered.findIndex(c => c.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { onDragEnd(); return; }
    const [item] = ordered.splice(fromIdx, 1);
    ordered.splice(toIdx, 0, item);
    const reindexed = ordered.map((c, i) => ({ ...c, sort_order: i + 1 }));
    setAllConfigs(prev => {
      const map = new Map(reindexed.map(c => [c.id, c]));
      return prev.map(c => map.get(c.id) ?? c);
    });
    setDragOverId(null);
    dragIdRef.current = null;
    await Promise.all(reindexed.map(c => updatePricingConfig(c.id, { sort_order: c.sort_order })));
  }

  const fmt$ = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  if (loading) return (
    <div className="bg-white border border-zinc-200 p-7 flex items-center gap-2 text-zinc-500 text-xs">
      <Loader2 className="w-3 h-3 animate-spin" /> Loading components…
    </div>
  );

  return (
    <div className="bg-white border border-zinc-200">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100">
        <Package className="w-4 h-4 text-[#C8441A]" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#C8441A]">Components Admin</p>
          <p className="text-zinc-500 text-[10px]">Manage aircraft types and their build components</p>
        </div>
      </div>

      <div className="grid grid-cols-[220px_1fr] divide-x divide-zinc-100 min-h-[320px]">
        {/* Left: Aircraft types list */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 bg-zinc-50">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-400">Aircraft Types</p>
            <button onClick={() => { setAddingType(true); setEditingTypeId(null); }}
              className="text-[#C8441A] hover:text-[#b03a16] transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add new type input */}
          {addingType && (
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-100 bg-zinc-50">
              <input autoFocus value={newTypeName} onChange={e => setNewTypeName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addType(); if (e.key === 'Escape') { setAddingType(false); setNewTypeName(''); } }}
                placeholder="e.g. CH701" className="flex-1 text-xs bg-white border border-zinc-200 text-zinc-900 px-2 py-1 outline-none focus:border-[#C8441A]/60" />
              <button onClick={addType} disabled={saving}
                className="text-[10px] font-bold text-white bg-[#C8441A] hover:bg-[#b03a16] px-2 py-1 transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
              </button>
              <button onClick={() => { setAddingType(false); setNewTypeName(''); }}
                className="text-zinc-400 hover:text-zinc-700 transition-colors"><X className="w-3 h-3" /></button>
            </div>
          )}

          <div className="flex-1 divide-y divide-zinc-100">
            {aircraftTypes.map(t => (
              <div key={t.id}
                className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${selectedTypeId === t.id ? 'bg-zinc-100 border-r-2 border-r-[#C8441A]' : 'hover:bg-zinc-50'}`}
                onClick={() => { setSelectedTypeId(t.id); setEditingTypeId(null); setEditingCompId(null); }}>
                {editingTypeId === t.id ? (
                  <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                    <input autoFocus value={editTypeName} onChange={e => setEditTypeName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveType(t.id); if (e.key === 'Escape') setEditingTypeId(null); }}
                      className="flex-1 text-xs bg-white border border-zinc-200 text-zinc-900 px-2 py-0.5 outline-none focus:border-[#C8441A]/60" />
                    <button onClick={() => saveType(t.id)} disabled={saving}
                      className="text-emerald-600 hover:text-emerald-700 transition-colors">
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                    </button>
                    <button onClick={() => setEditingTypeId(null)} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className={`flex-1 text-xs font-semibold truncate ${selectedTypeId === t.id ? 'text-[#C8441A]' : 'text-zinc-700'}`}>{t.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setEditingTypeId(t.id); setEditTypeName(t.name); }}
                        className="text-zinc-400 hover:text-zinc-700 transition-colors p-0.5"><Pencil className="w-2.5 h-2.5" /></button>
                      <button onClick={() => removeType(t.id)} disabled={deletingTypeId === t.id}
                        className="text-zinc-400 hover:text-red-500 transition-colors p-0.5">
                        {deletingTypeId === t.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Trash2 className="w-2.5 h-2.5" />}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {aircraftTypes.length === 0 && (
              <p className="text-zinc-400 text-xs px-4 py-6 text-center">No types yet.<br />Click + to add one.</p>
            )}
          </div>
        </div>

        {/* Right: Components for selected type */}
        <div className="flex flex-col">
          {selectedType ? (
            <>
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-zinc-100 bg-zinc-50">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-400">
                  Components — <span className="text-zinc-600">{selectedType.name}</span>
                </p>
                <button onClick={() => { setAddingComp(true); setEditingCompId(null); }}
                  className="text-[#C8441A] hover:text-[#b03a16] transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add new component row */}
              {addingComp && (
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-5 py-3 border-b border-zinc-100 bg-zinc-50">
                  <div className="grid grid-cols-2 gap-2">
                    <input autoFocus value={newComp.label} onChange={e => setNewComp(p => ({ ...p, label: e.target.value }))}
                      placeholder="Label (e.g. Avionics Package)"
                      className="text-xs bg-white border border-zinc-200 text-zinc-900 px-2 py-1.5 outline-none focus:border-[#C8441A]/60" />
                    <input value={newComp.component} onChange={e => setNewComp(p => ({ ...p, component: e.target.value }))}
                      placeholder="Key (e.g. avionics)"
                      className="text-xs bg-white border border-zinc-200 text-zinc-900 px-2 py-1.5 outline-none focus:border-[#C8441A]/60" />
                  </div>
                  <input type="number" value={newComp.default_cost} onChange={e => setNewComp(p => ({ ...p, default_cost: e.target.value }))}
                    placeholder="Default $"
                    className="w-24 text-xs bg-white border border-zinc-200 text-zinc-900 text-right px-2 py-1.5 outline-none focus:border-[#C8441A]/60" />
                  <button onClick={addComp} disabled={saving}
                    className="text-[10px] font-bold text-white bg-[#C8441A] hover:bg-[#b03a16] px-3 py-1.5 transition-colors disabled:opacity-50">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
                  </button>
                  <button onClick={() => { setAddingComp(false); setNewComp({ label: '', component: '', default_cost: '' }); }}
                    className="text-zinc-400 hover:text-zinc-700 transition-colors"><X className="w-3.5 h-3.5" /></button>
                </div>
              )}

              <div className="flex-1 divide-y divide-zinc-100">
                {components.map(cfg => (
                  <div
                    key={cfg.id}
                    draggable={editingCompId !== cfg.id}
                    onDragStart={() => onDragStart(cfg.id)}
                    onDragEnter={() => onDragEnter(cfg.id)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => onDrop(cfg.id)}
                    onDragEnd={onDragEnd}
                    className={`group flex items-center gap-3 px-5 py-2.5 transition-colors ${
                      dragOverId === cfg.id ? 'bg-[#C8441A]/6 border-t-2 border-t-[#C8441A]' : 'hover:bg-zinc-50/60'
                    }`}
                  >
                    <div className={`flex-shrink-0 cursor-grab active:cursor-grabbing transition-opacity ${editingCompId === cfg.id ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}>
                      <GripVertical className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    {editingCompId === cfg.id ? (
                      <>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input autoFocus value={editComp.label} onChange={e => setEditComp(p => ({ ...p, label: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Escape') setEditingCompId(null); }}
                            className="text-xs bg-white border border-zinc-200 text-zinc-900 px-2 py-1 outline-none focus:border-[#C8441A]/60" />
                          <input value={editComp.component} disabled
                            className="text-xs bg-zinc-50 border border-zinc-200 px-2 py-1 text-zinc-400 cursor-not-allowed" />
                        </div>
                        <input type="number" value={editComp.default_cost} onChange={e => setEditComp(p => ({ ...p, default_cost: e.target.value }))}
                          className="w-24 text-xs bg-white border border-zinc-200 text-zinc-900 text-right px-2 py-1 outline-none focus:border-[#C8441A]/60" />
                        <button onClick={() => saveComp(cfg.id)} disabled={saving}
                          className="text-emerald-600 hover:text-emerald-700 transition-colors">
                          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setEditingCompId(null)} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-zinc-700 text-xs">{cfg.label}</span>
                        <span className="text-zinc-400 text-[10px] font-mono">{cfg.component}</span>
                        <span className="text-zinc-900 text-xs font-semibold tabular-nums w-20 text-right">{fmt$(cfg.default_cost)}</span>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingCompId(cfg.id); setEditComp({ label: cfg.label, component: cfg.component, default_cost: String(cfg.default_cost) }); }}
                            className="text-zinc-400 hover:text-zinc-700 transition-colors p-0.5"><Pencil className="w-3 h-3" /></button>
                          <button onClick={() => removeComp(cfg.id)} disabled={deletingCompId === cfg.id}
                            className="text-zinc-400 hover:text-red-500 transition-colors p-0.5">
                            {deletingCompId === cfg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {components.length === 0 && (
                  <p className="text-zinc-400 text-xs px-5 py-8 text-center">No components yet for {selectedType.name}.<br />Click + to add one.</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center flex-1 p-8">
              <p className="text-zinc-400 text-xs text-center">Select an aircraft type to manage its components.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminView({ username, projects, onLogout }: { username: string; projects: CrmProject[]; onLogout: () => void }) {
  const [newUsername, setNewUsername] = useState(username);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setMsg(''); setErr('');
    if (!newUsername.trim()) { setErr('Username cannot be empty.'); return; }
    if (newPw && newPw !== confirmPw) { setErr('Passwords do not match.'); return; }
    if (newPw && newPw.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    setSaving(true);
    try {
      const currentHash = await sha256hex(currentPw);
      const ok = await verifyCredentials(username, currentHash);
      if (!ok) { setErr('Current password is incorrect.'); setSaving(false); return; }
      const newHash = newPw ? await sha256hex(newPw) : currentHash;
      await updateCredentials(username, newUsername.trim().toLowerCase(), newHash);
      setSession(newUsername.trim().toLowerCase());
      setMsg('Updated successfully.'); setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch { setErr('Failed to update credentials.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="p-6 md:p-8 max-w-xl space-y-6">
      <div>
        <h2 className="text-xl font-black text-zinc-900 uppercase tracking-widest">Admin Settings</h2>
        <p className="text-zinc-500 text-sm mt-1">Credentials and data management</p>
      </div>

      <div className="bg-white border border-zinc-200 p-7">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#C8441A] mb-5">Change Credentials</p>
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="New Username"><Inp value={newUsername} onChange={setNewUsername} /></Field>
          <Field label="Current Password">
            <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className={inputCls} required />
          </Field>
          <Field label="New Password (leave blank to keep)">
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className={inputCls} />
          </Field>
          {newPw && <Field label="Confirm New Password">
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className={inputCls} />
          </Field>}
          {msg && <p className="text-emerald-400 text-sm">{msg}</p>}
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <button type="submit" disabled={saving}
            className="bg-[#C8441A] hover:bg-[#b03a16] text-white font-extrabold text-sm px-7 py-2.5 uppercase tracking-widest transition-colors disabled:opacity-50 rounded-sm">
            {saving ? 'Saving…' : 'Update Credentials'}
          </button>
        </form>
      </div>

      <ComponentsAdminPanel />

      <div className="bg-white border border-zinc-200 p-7">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#C8441A] mb-3">Export Data</p>
        <p className="text-zinc-400 text-sm mb-4">{projects.length} deal records in database.</p>
        <button onClick={() => exportToCsv(projects)}
          className="flex items-center gap-2 border border-zinc-200 hover:border-zinc-500 text-zinc-700 hover:text-zinc-900 font-bold text-sm px-6 py-2.5 uppercase tracking-widest transition-colors rounded-sm">
          <Download className="w-4 h-4" /> Export Deals CSV
        </button>
      </div>

      <div className="bg-white border border-red-500/20 p-7">
        <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-3">Session</p>
        <p className="text-zinc-500 text-sm mb-4">Signed in as <strong className="text-zinc-900">{username}</strong></p>
        <button onClick={onLogout}
          className="flex items-center gap-2 border border-red-500/30 hover:border-red-400 text-red-400 hover:text-red-300 font-bold text-sm px-6 py-2.5 uppercase tracking-widest transition-colors rounded-sm">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── LEADS VIEW ───────────────────────────────────────────────────────────────

interface Registration {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  pilot_status: string;
  interested_in: string;
  desired_build_month: string;
  notes: string;
  registration_type: string;
  created_at: string;
}

function LeadsView() {
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'builder_list' | 'workshop'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    import('../supabase').then(({ supabase }) => {
      supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setRows((data as Registration[]) ?? []);
          setLoading(false);
        });
    });
  }, []);

  const filtered = rows.filter(r => {
    const matchTab = tab === 'all' || r.registration_type === tab;
    const q = search.toLowerCase();
    const matchSearch = !q || [r.first_name, r.last_name, r.email, r.phone].join(' ').toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const tabBtn = (id: typeof tab, label: string) => (
    <button
      onClick={() => setTab(id)}
      className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
        tab === id ? 'bg-[#C8441A] text-white' : 'text-zinc-400 hover:text-zinc-200'
      }`}
    >{label} ({rows.filter(r => id === 'all' || r.registration_type === id).length})</button>
  );

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black text-zinc-900 uppercase tracking-widest">Leads</h2>
          <p className="text-zinc-500 text-sm mt-1">Form submissions from buildastol.com</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex border border-zinc-200 overflow-hidden rounded-sm">
          {tabBtn('all', 'All')}
          {tabBtn('builder_list', 'Builder List')}
          {tabBtn('workshop', 'Workshop')}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-8 pr-4 py-2 text-sm border border-zinc-200 rounded-sm w-56 focus:outline-none focus:border-[#C8441A]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-400 py-12 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 text-sm">No leads found.</div>
      ) : (
        <div className="bg-white border border-zinc-200 overflow-x-auto rounded-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Name</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Email</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Pilot Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Interested In</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Build Month</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Type</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-zinc-900">{r.first_name} {r.last_name}</td>
                  <td className="px-4 py-3 text-zinc-600">{r.email}</td>
                  <td className="px-4 py-3 text-zinc-600">{r.phone || '—'}</td>
                  <td className="px-4 py-3 text-zinc-600">{r.pilot_status || '—'}</td>
                  <td className="px-4 py-3 text-zinc-600">{r.interested_in || '—'}</td>
                  <td className="px-4 py-3 text-zinc-600">{r.desired_build_month || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-xs font-bold uppercase rounded-sm ${
                      r.registration_type === 'workshop'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-orange-50 text-[#C8441A]'
                    }`}>{r.registration_type === 'workshop' ? 'Workshop' : 'Builder List'}</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── SIDEBAR NAV ──────────────────────────────────────────────────────────────

type CrmView = 'dashboard' | 'deals' | 'schedule' | 'clients' | 'inventory' | 'leads' | 'admin';

const NAV_ITEMS: { id: CrmView; label: string; icon: React.ReactNode; group?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'deals', label: 'Incoming Deals', icon: <FolderOpen className="w-4 h-4" />, group: 'Acquisitions' },
  { id: 'clients', label: 'Clients', icon: <Users className="w-4 h-4" />, group: 'Operations' },
  { id: 'schedule', label: 'Schedule', icon: <CalendarDays className="w-4 h-4" />, group: 'Operations' },
  { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" />, group: 'Operations' },
  { id: 'leads', label: 'Leads', icon: <ClipboardList className="w-4 h-4" />, group: 'Operations' },
  { id: 'admin', label: 'Admin Settings', icon: <Settings className="w-4 h-4" />, group: 'System' },
];

function Sidebar({ view, onNav, username, onLogout, collapsed, onToggle }: {
  view: CrmView; onNav: (v: CrmView) => void; username: string; onLogout: () => void;
  collapsed: boolean; onToggle: () => void;
}) {
  const groups = ['', 'Acquisitions', 'Operations', 'System'];

  return (
    <aside className={`flex flex-col bg-[#111318] border-r border-white/5 transition-all duration-200 flex-shrink-0 ${collapsed ? 'w-14' : 'w-52'}`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-3 h-14 border-b border-white/5 flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <Plane className="w-5 h-5 text-[#C8441A] flex-shrink-0" />
            <span className="text-white font-black text-xs uppercase tracking-widest truncate">Build A STOL</span>
          </div>
        )}
        {collapsed && <Plane className="w-5 h-5 text-[#C8441A] mx-auto" />}
        <button onClick={onToggle} className={`text-zinc-500 hover:text-white transition-colors p-1 flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`}>
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        {groups.map(group => {
          const items = NAV_ITEMS.filter(n => (n.group ?? '') === group);
          if (items.length === 0) return null;
          return (
            <div key={group} className="mb-4">
              {group && !collapsed && (
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 px-4 mb-1">{group}</p>
              )}
              {items.map(item => (
                <button key={item.id} onClick={() => onNav(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                    view === item.id
                      ? 'bg-[#C8441A]/15 text-[#C8441A] border-r-2 border-[#C8441A]'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
                  } ${collapsed ? 'justify-center' : ''}`}>
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && item.id === 'inventory' && (
                    <span className="ml-auto text-[8px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex-shrink-0">Soon</span>
                  )}
                </button>
              ))}
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className={`border-t border-white/5 p-3 flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-7 h-7 bg-[#C8441A]/20 border border-[#C8441A]/30 flex items-center justify-center flex-shrink-0">
          <span className="text-[#C8441A] text-xs font-black uppercase">{username[0]}</span>
        </div>
        {!collapsed && (
          <>
            <span className="text-zinc-400 text-xs truncate flex-1">{username}</span>
            <button onClick={onLogout} className="text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0" title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

// ─── MAIN SHELL ───────────────────────────────────────────────────────────────

function CrmMain({ username, onLogout }: { username: string; onLogout: () => void }) {
  const [view, setView] = useState<CrmView>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [projects, setProjects] = useState<CrmProject[]>([]);
  const [clients, setClients] = useState<CrmClient[]>([]);
  const [sessions, setSessions] = useState<CrmSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchProjects(), fetchClients(), fetchSessions()])
      .then(([p, c, s]) => { setProjects(p); setClients(c); setSessions(s); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <Plane className="w-8 h-8 text-[#C8441A] mx-auto mb-3 animate-pulse" />
          <p className="text-zinc-500 text-sm uppercase tracking-widest">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <Sidebar
        view={view} onNav={setView} username={username} onLogout={onLogout}
        collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)}
      />
      <main className="flex-1 overflow-auto">
        {view === 'dashboard' && <DashboardView projects={projects} clients={clients} sessions={sessions} onNav={setView} />}
        {view === 'deals' && <DealsView projects={projects} onRefresh={setProjects} />}
        {view === 'clients' && <ClientsView clients={clients} onRefresh={setClients} />}
        {view === 'schedule' && <ScheduleView sessions={sessions} onRefresh={setSessions} />}
        {view === 'inventory' && <InventoryView />}
        {view === 'leads' && <LeadsView />}
        {view === 'admin' && <AdminView username={username} projects={projects} onLogout={onLogout} />}
      </main>
    </div>
  );
}

// ─── APP ENTRY ────────────────────────────────────────────────────────────────

export function CrmApp() {
  const [session, setSessionState] = useState(() => getSession());
  function handleLogin(username: string) { setSessionState({ username, loggedInAt: Date.now() }); }
  function handleLogout() { clearSession(); setSessionState(null); }
  if (!session) return <LoginPage onLogin={handleLogin} />;
  return <CrmMain username={session.username} onLogout={handleLogout} />;
}
