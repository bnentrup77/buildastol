import { useState } from 'react';
import { CrmApp } from './crm/CrmApp';
import {
  ArrowRight,
  CheckCircle,
  ChevronDown,
  Mail,
  Menu,
  X,
  Wrench,
  Users,
  Clock,
  Star,
  Shield,
} from 'lucide-react';
import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type Page = 'home' | 'learn-more' | 'aircraft-overview' | 'rudder-workshop' | 'builder-list' | 'faq';

interface LeadForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  pilot_status: string;
  interested_in: string;
  desired_build_month: string;
  notes: string;
  registration_type: string;
}

const EMPTY_LEAD: LeadForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  pilot_status: '',
  interested_in: '',
  desired_build_month: '',
  notes: '',
  registration_type: 'builder_list',
};

const LOGO = '/main_-logo.png';

// ─── Brand primitives ─────────────────────────────────────────────────────────

function AviationBadge({ children }: { children: React.ReactNode }) {
  return <span className="aviation-badge">{children}</span>;
}

function OrangeLine() {
  return (
    <div
      className="h-[3px] w-full"
      style={{ background: 'repeating-linear-gradient(90deg,#C8441A 0,#C8441A 8px,transparent 8px,transparent 14px)' }}
    />
  );
}

function SectionDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-10">
      <div className="h-px flex-1 max-w-24" style={{ background: 'rgba(249,115,22,0.25)' }} />
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="2" fill="#C8441A" />
        <ellipse cx="12" cy="6" rx="2" ry="4.5" fill="#C8441A" fillOpacity="0.4" />
        <ellipse cx="12" cy="6" rx="2" ry="4.5" fill="#C8441A" fillOpacity="0.4" transform="rotate(120 12 12)" />
        <ellipse cx="12" cy="6" rx="2" ry="4.5" fill="#C8441A" fillOpacity="0.4" transform="rotate(240 12 12)" />
      </svg>
      <div className="h-px flex-1 max-w-24" style={{ background: 'rgba(249,115,22,0.25)' }} />
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV_LINKS: { label: string; page: Page }[] = [
  { label: 'Learn More', page: 'learn-more' },
  { label: 'Aircraft Overview', page: 'aircraft-overview' },
  { label: 'Rudder Workshop', page: 'rudder-workshop' },
  { label: 'FAQs', page: 'faq' },
  { label: 'Builder List', page: 'builder-list' },
];

function NavBar({ current, onNavigate }: { current: Page; onNavigate: (p: Page) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function go(p: Page) {
    onNavigate(p);
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-[#05070d]/96 backdrop-blur-md border-b border-[#1e2535]">
      <OrangeLine />
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between relative" style={{height: '72px'}}>
        {/* Logo */}
        <button onClick={() => go('home')} className="focus:outline-none">
          <img src={LOGO} alt="Build A STOL" className="h-16 object-contain" />
        </button>

        {/* Indianapolis label — true center of the full navbar */}
        <div className="hidden md:flex flex-col items-center absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 gap-2.5">
          <span className="text-[#C8441A] italic text-sm tracking-widest font-black uppercase pointer-events-none">Indianapolis, Indiana</span>
          <div className="flex items-center gap-6">
            {NAV_LINKS.map(({ label, page }) => (
              <button
                key={page}
                onClick={() => go(page)}
                className={[
                  'text-xs font-bold uppercase tracking-widest transition-colors',
                  current === page ? 'text-[#C8441A]' : 'text-[#A1A1AA] hover:text-[#F5EFE3]',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Join Builder List — right side */}
        <button
          onClick={() => go('builder-list')}
          className="hidden md:block bg-[#C8441A] hover:bg-[#a33615] text-white text-xs font-extrabold px-5 py-2.5 tracking-widest uppercase transition-colors"
        >
          Join Builder List
        </button>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-[#A1A1AA] hover:text-[#F5EFE3]"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#05070d] border-t border-[#1e2535] px-4 py-4 flex flex-col gap-4">
          {NAV_LINKS.map(({ label, page }) => (
            <button
              key={page}
              onClick={() => go(page)}
              className={[
                'text-left text-xs font-bold uppercase tracking-widest transition-colors',
                current === page ? 'text-[#C8441A]' : 'text-[#A1A1AA]',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => go('builder-list')}
            className="bg-[#C8441A] text-white text-xs font-extrabold px-5 py-3 tracking-widest uppercase mt-2"
          >
            Join Builder List
          </button>
        </div>
      )}
    </nav>
  );
}

// ─── Lead Capture Form (shared across pages) ──────────────────────────────────

function LeadForm({ defaultType = 'builder_list' }: { defaultType?: string }) {
  const [form, setForm] = useState<LeadForm>({ ...EMPTY_LEAD, registration_type: defaultType });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof LeadForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const { error: dbError } = await supabase.from('registrations').insert([form]);
    setSubmitting(false);
    if (dbError) {
      setError(dbError.code === '23505'
        ? 'This email is already on our list. Contact us if you need help.'
        : 'Something went wrong. Please try again or email us directly.');
      return;
    }
    setSuccess(true);
  }

  const inputClass = 'w-full bg-[#05070d] border border-[#1e2535] focus:border-[#C8441A] text-[#f5efe3] px-3 py-2.5 text-sm outline-none transition-colors';
  const labelClass = 'block text-xs font-bold uppercase tracking-widest text-[#A1A1AA] mb-1.5';
  const selectClass = inputClass + ' cursor-pointer';

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-[#C8441A]/15 border border-[#C8441A]/40 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-[#C8441A]" />
        </div>
        <h3 className="text-2xl font-extrabold text-[#f5efe3] mb-3">You're on the list!</h3>
        <p className="text-[#A1A1AA] max-w-sm mx-auto">
          We'll reach out with priority access to upcoming build dates and workshop spots.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>First Name *</label>
          <input required type="text" value={form.first_name} onChange={set('first_name')} className={inputClass} placeholder="John" />
        </div>
        <div>
          <label className={labelClass}>Last Name *</label>
          <input required type="text" value={form.last_name} onChange={set('last_name')} className={inputClass} placeholder="Smith" />
        </div>
      </div>
      <div>
        <label className={labelClass}>Email Address *</label>
        <input required type="email" value={form.email} onChange={set('email')} className={inputClass} placeholder="john@example.com" />
      </div>
      <div>
        <label className={labelClass}>Phone Number</label>
        <input type="tel" value={form.phone} onChange={set('phone')} className={inputClass} placeholder="(555) 000-0000" />
      </div>
      <div>
        <label className={labelClass}>Pilot Status</label>
        <select value={form.pilot_status} onChange={set('pilot_status')} className={selectClass}>
          <option value="">Select one...</option>
          <option value="Student Pilot">Student Pilot</option>
          <option value="Private Pilot">Private Pilot</option>
          <option value="Instrument Rated">Instrument Rated</option>
          <option value="Commercial/ATP">Commercial / ATP</option>
          <option value="Non-Pilot">Non-Pilot (yet)</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Interested In</label>
        <select value={form.interested_in} onChange={set('interested_in')} className={selectClass}>
          <option value="">Select one...</option>
          <option value="Builder Assist Program">Builder Assist Program (Full Build)</option>
          <option value="Rudder Workshop">Rudder Workshop</option>
          <option value="Both">Both</option>
          <option value="Just Exploring">Just Exploring</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Desired Build Month</label>
        <select value={form.desired_build_month} onChange={set('desired_build_month')} className={selectClass}>
          <option value="">Select one...</option>
          <option value="September 2026">September 2026</option>
          <option value="October 2026">October 2026</option>
          <option value="November 2026">November 2026</option>
          <option value="Early 2027">Early 2027</option>
          <option value="Flexible">Flexible</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Notes (optional)</label>
        <textarea rows={3} value={form.notes} onChange={set('notes')} className={inputClass + ' resize-none'} placeholder="Flying experience, questions, anything you'd like us to know..." />
      </div>
      {error && (
        <p className="text-[#C8441A] text-sm bg-[#C8441A]/10 border border-[#C8441A]/30 px-4 py-3">{error}</p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#C8441A] hover:bg-[#C8441A] disabled:opacity-50 text-white font-extrabold py-4 transition-colors text-sm tracking-widest uppercase"
      >
        {submitting ? 'Submitting...' : 'Submit — We\'ll Be In Touch'}
      </button>
    </form>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer({ onNavigate }: { onNavigate: (p: Page) => void }) {
  function go(p: Page) {
    onNavigate(p);
    window.scrollTo({ top: 0 });
  }

  return (
    <footer className="bg-[#05070d] border-t border-[#1e2535]">
      <OrangeLine />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <button onClick={() => go('home')} className="focus:outline-none">
            <img src={LOGO} alt="Build A STOL" className="h-14 object-contain" />
          </button>
          <div className="flex flex-wrap justify-center gap-6">
            {NAV_LINKS.map(({ label, page }) => (
              <button
                key={page}
                onClick={() => go(page)}
                className="text-[#A1A1AA] hover:text-[#C8441A] text-xs uppercase tracking-widest font-bold transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
          <a href="mailto:info@buildastol.com" className="hover:text-[#C8441A] transition-colors flex items-center gap-2 text-[#A1A1AA] text-xs uppercase tracking-widest">
            <Mail className="w-3 h-3" /> info@buildastol.com
          </a>
        </div>
        <div className="border-t border-[#1e2535] mt-8 pt-6 text-center">
          <p className="text-[#A1A1AA] text-xs uppercase tracking-widest">&copy; 2026 Build A STOL LLC. All rights reserved. &bull; Shelbyville, IN</p>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: HOME
// ═══════════════════════════════════════════════════════════════════════════════

function HomePage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  function go(p: Page) {
    onNavigate(p);
    window.scrollTo({ top: 0 });
  }

  return (
    <>
      {/* ── HERO ── */}
      <div className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/ChatGPT_Image_Apr_29,_2026,_02_57_18_PM.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="fixed inset-0 z-0" style={{ background: 'rgba(5,7,13,0.60)' }} />

      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 text-center" style={{ paddingTop: '80px' }}>
        <div className="w-full max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <AviationBadge>Builder Assist Programs — Launching September 2026</AviationBadge>
          </div>

          <h1
            className="font-black text-[#f5efe3] leading-[1.04] mb-5 tracking-tight"
            style={{ fontSize: 'clamp(2.6rem, 7vw, 5rem)', textShadow: '0 4px 32px rgba(0,0,0,0.7)' }}
          >
            Build Your Own<br />
            <span className="text-[#C8441A]">STOL Aircraft</span><br />
            in Just 2 Weeks!
          </h1>

          <p
            className="text-xl md:text-2xl text-[#f5efe3] mb-4 max-w-2xl mx-auto leading-relaxed"
            style={{ textShadow: '0 2px 16px rgba(0,0,0,0.8)' }}
          >
            Assemble your own Zenith CH750 with expert A&P guidance in a structured Builder Assist Program.
          </p>

          <p className="text-[#A1A1AA] font-bold text-base mb-10 tracking-wide">
            No experience required. Just show up ready to build.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              onClick={() => go('builder-list')}
              className="group bg-[#C8441A] hover:bg-[#C8441A] text-white font-extrabold text-sm px-9 py-4 tracking-widest uppercase transition-all inline-flex items-center justify-center gap-3"
              style={{ boxShadow: '0 8px 40px rgba(249,115,22,0.38)' }}
            >
              Join the Builder List
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => go('rudder-workshop')}
              className="group border border-[#f5efe3]/30 hover:border-[#C8441A]/70 bg-white/5 hover:bg-white/10 text-[#f5efe3] font-extrabold text-sm px-9 py-4 tracking-widest uppercase transition-all inline-flex items-center justify-center gap-3 backdrop-blur-sm"
            >
              Start with the Rudder Workshop
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <p className="text-[#f5efe3]/80 text-xs uppercase tracking-widest">
            Limited builder spots &bull; Workshop participants receive priority access
          </p>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6" style={{ color: 'rgba(249,115,22,0.4)' }} />
        </div>
      </section>

      {/* ── RUDDER WORKSHOP TEASER ── */}
      <section className="relative z-20 bg-[#05070D] py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <SectionDivider />
          <AviationBadge>Start Here</AviationBadge>
          <h2 className="text-3xl md:text-4xl font-black text-[#f5efe3] mt-4 mb-5 leading-tight">
            Start with a Rudder Workshop
          </h2>
          <p className="text-[#A1A1AA] text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Considering one of our Builder Assist Programs? Start here.
            Meet the team, use the same tools and materials, experience the process firsthand,
            and leave with your completed rudder.
          </p>
          <button
            onClick={() => go('rudder-workshop')}
            className="group bg-[#C8441A] hover:bg-[#C8441A] text-white font-extrabold text-sm px-8 py-4 tracking-widest uppercase transition-all inline-flex items-center justify-center gap-3"
            style={{ boxShadow: '0 6px 32px rgba(249,115,22,0.22)' }}
          >
            Reserve a Workshop Spot
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ── BUILT. NOT BOUGHT. ── */}
      <section className="relative z-20 bg-[#05070d] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <SectionDivider />
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <AviationBadge>Builder Identity</AviationBadge>
              <h2 className="text-4xl md:text-5xl font-black text-[#f5efe3] leading-tight mt-4 mb-6">
                Built. Not Bought.
              </h2>
              <p className="text-[#A1A1AA] text-xl leading-relaxed mb-6">
                This isn't a factory airplane. You build it — with expert guidance — and fly what you created, in Just Two Weeks.{' '}
                <button
                  onClick={() => { onNavigate('faq'); window.scrollTo({ top: 0 }); }}
                  className="text-[#C8441A] font-bold underline underline-offset-2 hover:opacity-80 transition-opacity"
                >
                  (Really? Read our FAQs)
                </button>
              </p>
              <div className="border-l-4 border-[#C8441A] bg-[#05070D] px-5 py-4 mb-8">
                <p className="text-[#A1A1AA] text-sm leading-relaxed">
                  <span className="text-[#C8441A] font-bold">Every full-build participant</span> receives an official{' '}
                  <span className="text-[#f5efe3] font-semibold">i STOL iT</span> shirt on the final day of the build.
                </p>
              </div>
              <button
                disabled
                className="border border-[#1e2535] text-[#A1A1AA] font-bold px-6 py-3 uppercase tracking-widest text-xs cursor-not-allowed inline-flex items-center gap-2"
              >
                Builder Gallery Coming Soon
              </button>
            </div>

            {/* Shop photo */}
            <div className="relative overflow-hidden border border-[#1e2535]">
              <img
                src="/kit.png"
                alt="CH750 STOL under construction in the Build A STOL facility"
                className="w-full h-[480px] object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-white font-black text-base tracking-wide">Your Build. Your Aircraft.</p>
                <p className="text-[#C8441A] text-xs uppercase tracking-widest font-bold mt-1">Indianapolis, Indiana</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: LEARN MORE
// ═══════════════════════════════════════════════════════════════════════════════

function LearnMorePage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const steps = [
    {
      number: '01',
      icon: Star,
      title: 'Join the Builder List',
      description: 'Add your name to our early access list. Workshop participants and builder list members receive priority when build dates are announced.',
    },
    {
      number: '02',
      icon: Wrench,
      title: 'Start with the Rudder Workshop',
      description: 'Before committing to a full build, we recommend attending a Rudder Workshop. Get hands-on with the tools, meet the team, and leave with a completed part.',
    },
    {
      number: '03',
      icon: Users,
      title: 'Select Your Build Session',
      description: 'Once Builder Assist Program dates are announced, priority access goes to workshop participants and those on the builder list first.',
    },
    {
      number: '04',
      icon: Clock,
      title: 'Arrive. Build. Fly.',
      description: 'Show up at our Shelbyville, Indiana facility. Spend two structured weeks building your Zenith CH750 alongside a small group with expert A&P guidance from first rivet to final inspection.',
    },
    {
      number: '05',
      icon: CheckCircle,
      title: 'Leave with Your Aircraft',
      description: 'Complete the program with a fully assembled aircraft — through our Builders Assist Program and leave with a ready to fly airplane.',
    },
    {
      number: '06',
      icon: Shield,
      title: 'Join the Community',
      description: 'You built it. Now fly it. Builder Assist alumni become part of the Build A STOL community — and earn their i STOL iT shirt on the final day.',
    },
  ];

  return (
    <div className="relative z-20 bg-[#05070d] pt-28 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-14">
          <AviationBadge>The Process</AviationBadge>
          <h1 className="text-4xl md:text-5xl font-black text-[#f5efe3] leading-tight mt-4 mb-5">
            How the Builder Assist<br />
            <span className="text-[#C8441A]">Program Works</span>
          </h1>
          <p className="text-[#A1A1AA] text-lg max-w-xl leading-relaxed">
            A structured, guided two-week experience designed to take you from zero to a fully assembled aircraft.
            No prior building experience required.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1e2535] mb-16">
          {steps.map((step) => (
            <div key={step.number} className="bg-[#05070d] hover:bg-[#05070D] transition-colors p-8 group">
              <div className="flex items-start gap-3 mb-5">
                <span className="font-black text-5xl leading-none tabular-nums" style={{ color: 'rgba(249,115,22,0.18)' }}>
                  {step.number}
                </span>
                <step.icon className="w-5 h-5 text-[#C8441A] mt-3 flex-shrink-0" />
              </div>
              <h3 className="text-[#f5efe3] font-extrabold text-lg mb-3 tracking-tight">{step.title}</h3>
              <p className="text-[#A1A1AA] text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#05070D] border border-[#C8441A]/25 p-8 md:p-12 text-center">
          <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#C8441A] relative" style={{ display: 'none' }} />
          <AviationBadge>Ready?</AviationBadge>
          <h2 className="text-3xl font-black text-[#f5efe3] mt-4 mb-4">Start with a Rudder Workshop</h2>
          <p className="text-[#A1A1AA] mb-8 max-w-md mx-auto">
            The best way to know if you're ready for a full build is to experience it firsthand.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => { onNavigate('rudder-workshop'); window.scrollTo({ top: 0 }); }}
              className="group bg-[#C8441A] hover:bg-[#C8441A] text-white font-extrabold text-sm px-8 py-4 tracking-widest uppercase transition-all inline-flex items-center justify-center gap-2"
            >
              Reserve a Workshop Spot <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => { onNavigate('builder-list'); window.scrollTo({ top: 0 }); }}
              className="border border-[#1e2535] hover:border-[#C8441A]/50 text-[#A1A1AA] hover:text-[#F5EFE3] font-bold px-8 py-4 uppercase tracking-widest text-xs transition-colors inline-flex items-center justify-center gap-2"
            >
              Join the Builder List <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: AIRCRAFT OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════

function AircraftOverviewPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const specs = [
    { label: 'Wingspan', value: '27 ft' },
    { label: 'Cruise Speed', value: '~100 mph' },
    { label: 'Stall Speed', value: '~33 mph' },
    { label: 'Takeoff Roll', value: '<150 ft' },
    { label: 'Seats', value: '2 side-by-side' },
    { label: 'Engine (base)', value: 'ULPower 350iS' },
  ];

  const includes = [
    'Quick Build Fuselage Kit',
    'Quick Build Wings',
    'ULPower 350iS Engine',
    'Basic EFIS + Com Radio',
    'Standard Wheels / Tires',
    'Basic Interior / Upholstery',
    'Complete Hardware + Systems',
  ];

  return (
    <div className="relative z-20 bg-[#05070d] pt-28 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <AviationBadge>The Aircraft</AviationBadge>
          <h1 className="text-4xl md:text-5xl font-black text-[#f5efe3] leading-tight mt-4 mb-5">
            Zenith CH750 STOL<br />
            <span className="text-[#C8441A]">Base Build Package</span>
          </h1>
          <p className="text-[#A1A1AA] text-lg max-w-xl leading-relaxed">
            One of the most proven kit aircraft ever built — exceptional short-field performance,
            straightforward aluminum construction, and purpose-made for a structured 2-week build program.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 mb-14">
          {/* Photo */}
          <div className="relative overflow-hidden border border-[#1e2535]">
            <img
              src="/ChatGPT_Image_May_6,_2026,_08_14_23_AM.png"
              alt="CH750 STOL aircraft at sunset"
              className="w-full h-80 object-cover"
              style={{ filter: 'grayscale(20%) contrast(1.1)' }}
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(5,7,13,0.65) 0%, transparent 55%)' }} />
            <div className="absolute bottom-0 left-0 bg-[#C8441A] px-5 py-3">
              <p className="text-white font-black text-sm tracking-tight uppercase">CH750 STOL</p>
              <p className="text-white/80 text-xs uppercase tracking-widest">Quick build kit</p>
            </div>
          </div>

          {/* Specs */}
          <div className="bg-[#05070D] border border-[#1e2535] p-7">
            <p className="text-xs font-bold uppercase tracking-widest text-[#C8441A] mb-5">Flight Specs</p>
            <div className="space-y-1">
              {specs.map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-3 border-b border-[#1e2535] last:border-0">
                  <span className="text-[#A1A1AA] text-sm">{label}</span>
                  <span className="text-[#f5efe3] font-bold text-sm tabular-nums">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Includes */}
        <div className="bg-[#05070D] border border-[#1e2535] p-8 mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-[#C8441A] mb-6">Base Package Includes</p>
          <ul className="grid sm:grid-cols-2 gap-3">
            {includes.map((item) => (
              <li key={item} className="flex items-center gap-3 text-[#f5efe3]">
                <div className="w-5 h-5 bg-[#C8441A]/15 border border-[#C8441A]/40 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3 h-3 text-[#C8441A]" />
                </div>
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
          <div className="border-l-4 border-[#C8441A] bg-[#05070d] px-5 py-4 mt-6">
            <p className="text-[#A1A1AA] text-sm">
              <span className="text-[#C8441A] font-bold">Upgrades available on request:</span>{' '}
              Garmin avionics, tundra tires, premium interior, and more.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => { onNavigate('builder-list'); window.scrollTo({ top: 0 }); }}
            className="group bg-[#C8441A] hover:bg-[#C8441A] text-white font-extrabold text-sm px-8 py-4 tracking-widest uppercase transition-all inline-flex items-center gap-2"
          >
            Join the Builder List <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => { onNavigate('learn-more'); window.scrollTo({ top: 0 }); }}
            className="border border-[#1e2535] hover:border-[#C8441A]/50 text-[#A1A1AA] hover:text-[#F5EFE3] font-bold px-8 py-4 uppercase tracking-widest text-xs transition-colors inline-flex items-center gap-2"
          >
            How It Works <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: RUDDER WORKSHOP
// ═══════════════════════════════════════════════════════════════════════════════

function RudderWorkshopPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const highlights = [
    { icon: Wrench, text: 'Work with the same tools and materials used in the full build' },
    { icon: Users, text: 'Meet the team and the A&P mechanics who lead the programs' },
    { icon: Star, text: 'Experience the hands-on process firsthand — no guessing what it\'s like' },
    { icon: CheckCircle, text: 'Leave with your completed rudder — a real part of a real aircraft' },
  ];

  return (
    <div className="relative z-20 bg-[#05070d] pt-28 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-14 items-start mb-16">
          {/* Details */}
          <div>
            <AviationBadge>Start Here</AviationBadge>
            <h1 className="text-4xl md:text-5xl font-black text-[#f5efe3] leading-tight mt-4 mb-6">
              Rudder Workshop
            </h1>
            <p className="text-[#A1A1AA] text-lg mb-8 leading-relaxed">
              If you're considering one of our Builder Assist Programs, this is the place to begin.
              A focused, hands-on session where you get a real feel for what building your aircraft looks like.
            </p>
            <ul className="space-y-5 mb-10">
              {highlights.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-4">
                  <div className="w-9 h-9 bg-[#C8441A]/12 border border-[#C8441A]/28 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-[#C8441A]" />
                  </div>
                  <span className="text-[#f5efe3] leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
            <div className="border-l-4 border-[#C8441A] bg-[#05070D] px-5 py-4 mb-8">
              <p className="text-[#A1A1AA] text-sm leading-relaxed">
                Our full Builder Assist Programs open September 2026.{' '}
                <span className="text-[#f5efe3] font-semibold">Workshop participants receive priority access to program dates.</span>
              </p>
            </div>
          </div>

          {/* Photo */}
          <div className="relative overflow-hidden border border-[#1e2535]">
            <img
              src="/rudder.png"
              alt="Hands-on aircraft building workshop"
              className="w-full h-[420px] object-cover"
              style={{ filter: 'grayscale(15%) contrast(1.1)' }}
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(5,7,13,0.75) 0%, transparent 50%)' }} />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-white font-black text-lg">Rudder Workshop</p>
              <p className="text-[#C8441A] text-xs uppercase tracking-widest font-bold mt-1">Hands-on · Small Group · Expert Guided</p>
            </div>
          </div>
        </div>

        {/* Sign up form */}
        <div className="bg-[#05070D] border border-[#1e2535] p-8 md:p-12 max-w-2xl mx-auto">
          <div className="mb-8">
            <AviationBadge>Reserve Your Spot</AviationBadge>
            <h2 className="text-2xl font-extrabold text-[#f5efe3] mt-3 mb-2">Sign Up for the Rudder Workshop</h2>
            <p className="text-[#A1A1AA] text-sm">Fill out the form and we'll be in touch with workshop dates and details.</p>
          </div>
          <LeadForm defaultType="workshop" />
          <p className="text-[#A1A1AA] text-xs uppercase tracking-widest mt-5 text-center">
            Workshop participants receive priority access to upcoming Builder Assist program dates.
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: BUILDER LIST
// ═══════════════════════════════════════════════════════════════════════════════

function BuilderListPage() {
  return (
    <div className="relative z-20 bg-[#05070d] pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <AviationBadge>Early Access</AviationBadge>
          <h1 className="text-4xl md:text-5xl font-black text-[#f5efe3] leading-tight mt-4 mb-5">
            Join the Builder List
          </h1>
          <p className="text-[#A1A1AA] text-lg leading-relaxed">
            Builder Assist Programs launch September 2026. Get on the list now
            for priority access to build dates, workshop announcements, and program updates.
          </p>
        </div>

        <div className="bg-[#05070D] border border-[#1e2535] p-8 md:p-12">
          <div className="h-1 -mx-8 md:-mx-12 -mt-8 md:-mt-12 mb-8" style={{ background: 'repeating-linear-gradient(90deg,#C8441A 0,#C8441A 10px,transparent 10px,transparent 16px)' }} />
          <LeadForm defaultType="builder_list" />
        </div>

        <p className="text-[#A1A1AA] text-xs uppercase tracking-widest mt-6 text-center">
          No commitment. Just priority access. &bull; Shelbyville, IN
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: FAQ
// ═══════════════════════════════════════════════════════════════════════════════

const FAQ_ITEMS: { question: string; answer: React.ReactNode }[] = [
  {
    question: '1. Can I really build an airplane in 14 days?',
    answer: (
      <>
        <p className="mb-4 text-[#A1A1AA] text-base leading-relaxed">Yes — but only if you're willing to work.</p>
        <p className="mb-4 text-[#A1A1AA] text-base leading-relaxed">This is not a vacation. It's 10–14 long, focused days where you show up ready to work, learn, and stay on task.</p>
        <p className="mb-3 font-bold text-[#f5efe3] text-base uppercase tracking-widest text-xs">Our team provides:</p>
        <ul className="space-y-2 mb-5 ml-1">
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Structure</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Sequencing</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Tools</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Guidance</li>
        </ul>
        <p className="text-[#E8B84B] font-bold">If you stay engaged and committed, we can get you to the finish line.</p>
      </>
    ),
  },
  {
    question: '2. What exactly is a "builder assist" program?',
    answer: (
      <>
        <p className="mb-4 text-[#A1A1AA] text-base leading-relaxed">You build your airplane — with our help.</p>
        <p className="mb-3 font-bold text-[#f5efe3] text-xs uppercase tracking-widest">We guide you through:</p>
        <ul className="space-y-2 mb-5 ml-1">
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Assembly steps</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Sequencing</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Best practices</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Problem solving</li>
        </ul>
        <p className="mb-4 text-[#A1A1AA] text-base leading-relaxed">We keep you moving so you don't get stuck.</p>
        <p className="text-[#E8B84B] font-bold">You do the work. We make sure you succeed.</p>
      </>
    ),
  },
  {
    question: '3. Why do you only focus on the Zenith CH 750 STOL?',
    answer: (
      <>
        <p className="mb-4 text-[#A1A1AA] text-base leading-relaxed">Because it works.</p>
        <p className="mb-3 font-bold text-[#f5efe3] text-xs uppercase tracking-widest">The CH 750 STOL:</p>
        <ul className="space-y-2 mb-5 ml-1">
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Comes highly pre-fabricated (precision-cut, pre-drilled)</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Requires minimal guesswork</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Has excellent factory support</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Is one of the fastest kits to complete correctly</li>
        </ul>
        <p className="mb-3 font-bold text-[#f5efe3] text-xs uppercase tracking-widest">Focusing on one platform allows us to:</p>
        <ul className="space-y-2 mb-5 ml-1">
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Eliminate inefficiencies</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Avoid surprises</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Consistently hit build timelines</li>
        </ul>
        <p className="text-[#E8B84B] font-bold">We're not trying to build everything — we're trying to build it right and fast.</p>
      </>
    ),
  },
  {
    question: '4. Why is the build timeline achievable with this aircraft?',
    answer: (
      <>
        <p className="mb-4 text-[#A1A1AA] text-base leading-relaxed">Zenith has done the hard work upfront.</p>
        <p className="mb-3 font-bold text-[#f5efe3] text-xs uppercase tracking-widest">Their kits are:</p>
        <ul className="space-y-2 mb-5 ml-1">
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Accurately manufactured</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Well-documented</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Designed for assembly, not fabrication</li>
        </ul>
        <p className="mb-3 font-bold text-[#f5efe3] text-xs uppercase tracking-widest">That means:</p>
        <ul className="space-y-2 mb-5 ml-1">
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Less measuring</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Less rework</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Fewer delays</li>
        </ul>
        <p className="text-[#E8B84B] font-bold">This is what makes a 10–14 day completion realistic.</p>
      </>
    ),
  },
  {
    question: '5. What do I get with the program?',
    answer: (
      <>
        <p className="mb-3 font-bold text-[#f5efe3] text-xs uppercase tracking-widest">Everything you need to stay on track:</p>
        <ul className="space-y-2 mb-5 ml-1">
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Fully equipped workspace</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Specialized tools and jigs</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Organized parts and staging</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Experienced staff to guide and assist</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />A&amp;P guidance during critical steps</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Daily structure and build planning</li>
        </ul>
        <p className="text-[#E8B84B] font-bold">You're not figuring this out alone — we run the process.</p>
      </>
    ),
  },
  {
    question: '6. Do I need prior experience to do this?',
    answer: (
      <>
        <p className="mb-4 text-[#A1A1AA] text-base leading-relaxed">No — but you need the right mindset.</p>
        <p className="mb-3 font-bold text-[#f5efe3] text-xs uppercase tracking-widest">Most of our clients:</p>
        <ul className="space-y-2 mb-5 ml-1">
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Have mechanical aptitude</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Are willing to learn</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Stay focused</li>
        </ul>
        <p className="text-[#E8B84B] font-bold">If you can follow instructions and work hard, you can do this.</p>
      </>
    ),
  },
  {
    question: '7. What kind of time commitment should I expect each day?',
    answer: (
      <>
        <p className="mb-4 text-[#A1A1AA] text-base leading-relaxed">Plan for long days.</p>
        <p className="mb-3 font-bold text-[#f5efe3] text-xs uppercase tracking-widest">Typical schedule:</p>
        <ul className="space-y-2 mb-5 ml-1">
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />8–12 hours per day</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Consistent pace</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Minimal downtime</li>
        </ul>
        <p className="text-[#E8B84B] font-bold">This is a sprint — not a casual project.</p>
      </>
    ),
  },
  {
    question: '8. What happens if I fall behind schedule?',
    answer: (
      <>
        <p className="mb-4 text-[#A1A1AA] text-base leading-relaxed">We adjust — but your effort matters.</p>
        <p className="mb-4 text-[#A1A1AA] text-base leading-relaxed">Our system is designed to keep you moving, but delays happen when focus drops and rework happens when steps are rushed.</p>
        <p className="text-[#E8B84B] font-bold">We'll help you recover — but you have to stay engaged.</p>
      </>
    ),
  },
  {
    question: '9. What parts and options are included — and why are they limited?',
    answer: (
      <>
        <p className="mb-4 text-[#A1A1AA] text-base leading-relaxed">We limit options on purpose.</p>
        <p className="mb-3 font-bold text-[#f5efe3] text-xs uppercase tracking-widest">We use:</p>
        <ul className="space-y-2 mb-5 ml-1">
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Proven engine packages</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Pre-configured avionics</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Standardized components</li>
        </ul>
        <p className="mb-3 font-bold text-[#f5efe3] text-xs uppercase tracking-widest">Because customization slows builds and introduces risk. Our goal is:</p>
        <ul className="space-y-2 mb-5 ml-1">
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Reliable completion</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Repeatable results</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />No surprises</li>
        </ul>
        <p className="text-[#E8B84B] font-bold">You can customize later — but first, we get you flying.</p>
      </>
    ),
  },
  {
    question: '10. What happens after the build is complete?',
    answer: (
      <>
        <p className="mb-4 text-[#A1A1AA] text-base leading-relaxed">You leave with a completed aircraft and the knowledge to own it.</p>
        <p className="mb-3 font-bold text-[#f5efe3] text-xs uppercase tracking-widest">We'll help guide you through:</p>
        <ul className="space-y-2 mb-5 ml-1">
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Final steps</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Inspections</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />Next-stage readiness</li>
        </ul>
        <p className="text-[#E8B84B] font-bold">You don't just leave with a plane — you leave understanding it.</p>
      </>
    ),
  },
  {
    question: 'Is this program right for me?',
    answer: (
      <>
        <p className="mb-3 font-bold text-[#f5efe3] text-xs uppercase tracking-widest">This is right for you if:</p>
        <ul className="space-y-2 mb-5 ml-1">
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />You want to build your own aircraft</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />You're ready to commit 10–14 focused days</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />You want structure, guidance, and momentum</li>
        </ul>
        <p className="mb-3 font-bold text-[#f5efe3] text-xs uppercase tracking-widest">This is not for you if:</p>
        <ul className="space-y-2 mb-5 ml-1">
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />You want a casual pace</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />You expect someone else to do the work</li>
          <li className="flex items-center gap-3 text-[#A1A1AA]"><span className="w-1.5 h-1.5 bg-[#C8441A] flex-shrink-0" />You're not ready to stay engaged</li>
        </ul>
        <div className="border-l-4 border-[#E8B84B] pl-4 mt-4">
          <p className="text-[#f5efe3] font-bold mb-2">Ready to get started?</p>
          <p className="text-[#A1A1AA]">Attend a Rudder Workshop. See the process firsthand. Decide if you're ready to build.</p>
        </div>
      </>
    ),
  },
];

function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[#1e2535]">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-6 py-6 text-left group"
      >
        <span className="text-[#E8B84B] font-extrabold text-lg md:text-xl leading-snug tracking-tight group-hover:opacity-80 transition-opacity">
          {question}
        </span>
        <span
          className="flex-shrink-0 w-7 h-7 border border-[#E8B84B]/40 flex items-center justify-center mt-0.5 transition-transform duration-300"
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
            <line x1="5" y1="0" x2="5" y2="10" stroke="#E8B84B" strokeWidth="1.5" />
            <line x1="0" y1="5" x2="10" y2="5" stroke="#E8B84B" strokeWidth="1.5" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="text-[#f5efe3] text-base leading-relaxed pb-8 pr-10">
          {answer}
        </div>
      )}
    </div>
  );
}

function FaqPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(i: number) {
    setOpenIndex(prev => prev === i ? null : i);
  }

  return (
    <div className="relative z-20 bg-[#05070d] pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <AviationBadge>Build Smart. Fly Slow.</AviationBadge>
          <h1 className="text-4xl md:text-5xl font-black text-[#f5efe3] leading-tight mt-4 mb-5">
            Build A STOL <span className="text-[#C8441A]">FAQ</span>
          </h1>
          <p className="text-[#A1A1AA] text-lg leading-relaxed">
            Everything you need to know before you decide to build.
          </p>
        </div>

        <div className="mb-14">
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              open={openIndex === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>

        <div className="bg-[#05070D] border border-[#C8441A]/25 p-8 md:p-12 text-center">
          <AviationBadge>Ready?</AviationBadge>
          <h2 className="text-3xl font-black text-[#f5efe3] mt-4 mb-4">Start with a Rudder Workshop</h2>
          <p className="text-[#A1A1AA] mb-8 max-w-md mx-auto">
            The best way to know if you're ready for a full build is to experience it firsthand.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => { onNavigate('rudder-workshop'); window.scrollTo({ top: 0 }); }}
              className="group bg-[#C8441A] hover:bg-[#C8441A] text-white font-extrabold text-sm px-8 py-4 tracking-widest uppercase transition-all inline-flex items-center justify-center gap-2"
            >
              Reserve a Workshop Spot <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => { onNavigate('builder-list'); window.scrollTo({ top: 0 }); }}
              className="border border-[#1e2535] hover:border-[#C8441A]/50 text-[#A1A1AA] hover:text-[#F5EFE3] font-bold px-8 py-4 uppercase tracking-widest text-xs transition-colors inline-flex items-center justify-center gap-2"
            >
              Join the Builder List <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP SHELL
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [page, setPage] = useState<Page>('home');

  // Route /admin path to the CRM app
  if (window.location.pathname.startsWith('/admin')) {
    return <CrmApp />;
  }

  function renderPage() {
    switch (page) {
      case 'home': return <HomePage onNavigate={setPage} />;
      case 'learn-more': return <LearnMorePage onNavigate={setPage} />;
      case 'aircraft-overview': return <AircraftOverviewPage onNavigate={setPage} />;
      case 'rudder-workshop': return <RudderWorkshopPage onNavigate={setPage} />;
      case 'builder-list': return <BuilderListPage />;
      case 'faq': return <FaqPage onNavigate={setPage} />;
    }
  }

  return (
    <div className="bg-[#05070d] font-sans antialiased min-h-screen flex flex-col">
      <NavBar current={page} onNavigate={setPage} />
      <main className="flex-1">
        {renderPage()}
      </main>
      <Footer onNavigate={setPage} />
    </div>
  );
}
