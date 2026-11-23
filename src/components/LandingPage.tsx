import React, { useState } from 'react';
import {
  ArrowRight,
  Building2,
  Compass,
  GitMerge,
  MapPin,
  ShieldCheck,
  ThumbsUp
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { GoogleLogo } from '../auth';
import { isSupabaseConfigured } from '../lib/supabase';
import campusBridgeHeroImg from '../assets/images/campus_bridge_hero_1795446134021.jpg';

const HERO_IMAGE_SRC = campusBridgeHeroImg;

export function LandingPage({
  authUser,
  authError,
  onSignInWithGoogle,
  onEnterAsStudent,
  onEnterAsAdmin,
  onOpenMap
}: {
  authUser: any;
  authError: string;
  onSignInWithGoogle: () => void;
  onEnterAsStudent: () => void;
  onEnterAsAdmin: () => void;
  onOpenMap: () => void;
}) {
  const [heroImgError, setHeroImgError] = useState(false);

  const handlePrimaryAction = () => {
    if (isSupabaseConfigured && !authUser) {
      onSignInWithGoogle();
    } else if (authUser?.role === 'admin') {
      onEnterAsAdmin();
    } else {
      onEnterAsStudent();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-8">
          <a href="#top" className="flex items-center shrink-0 focus-visible:outline-brand-teal">
            <BrandLogo size="lg" />
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a
              href="#how-it-works"
              className="hover:text-brand-navy hover:underline underline-offset-4 transition whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#priority-tiers"
              className="hover:text-brand-navy hover:underline underline-offset-4 transition whitespace-nowrap shrink-0"
            >
              Priority Tiers
            </a>
            <a
              href="#portals"
              className="hover:text-brand-navy hover:underline underline-offset-4 transition whitespace-nowrap shrink-0"
            >
              Workspace
            </a>
          </nav>

          <div className="shrink-0">
            <button
              onClick={handlePrimaryAction}
              className="px-4 py-2 rounded-xl bg-brand-navy hover:bg-brand-navy-dark text-white text-xs sm:text-sm font-semibold transition whitespace-nowrap cursor-pointer"
            >
              {isSupabaseConfigured && !authUser ? 'Sign In' : 'Open Workspace'}
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero Split */}
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center">
                <div className="text-xs font-semibold tracking-wide text-brand-teal-dark mb-3">
                  Campus Issue Intelligence · IGDTUW
                </div>

                <h1
                  className="font-display font-extrabold text-brand-navy tracking-tight leading-[1.1] max-w-xl"
                  style={{ fontSize: 'clamp(2.25rem, 4vw, 3.35rem)', textWrap: 'balance' }}
                >
                  Where student voices bridge straight to campus action.
                </h1>

                <p className="mt-5 text-base text-slate-600 leading-relaxed max-w-xl">
                  Pin facility bottlenecks to the exact building and room, let peers confirm shared
                  disruptions in one tap, and surface high-priority repairs for campus operations.
                </p>

                {/* Signature Navy–Amber–Teal Bridge Divider */}
                <div className="mt-6 flex items-center gap-2 max-w-xs" aria-hidden="true">
                  <span className="h-1 flex-1 rounded-full bg-brand-navy" />
                  <span className="h-1.5 w-12 rounded-full bg-brand-amber" />
                  <span className="h-1 flex-1 rounded-full bg-brand-teal" />
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  {isSupabaseConfigured && !authUser ? (
                    <>
                      <button
                        onClick={onSignInWithGoogle}
                        className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-brand-navy hover:bg-brand-navy-dark text-white font-semibold text-sm transition cursor-pointer"
                      >
                        <GoogleLogo />
                        Continue with Google
                      </button>
                      <button
                        onClick={onEnterAsStudent}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-teal-soft hover:bg-teal-100 text-brand-teal-dark border border-teal-200 font-semibold text-sm transition cursor-pointer"
                      >
                        Explore Demo
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={onEnterAsStudent}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-navy hover:bg-brand-navy-dark text-white font-semibold text-sm transition cursor-pointer"
                      >
                        Enter Student Portal
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={onOpenMap}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-brand-navy border border-slate-300 font-semibold text-sm transition cursor-pointer"
                      >
                        <Compass className="w-4 h-4 text-brand-teal" />
                        Live Campus Map
                      </button>
                    </>
                  )}
                </div>

                {authError && (
                  <p
                    role="alert"
                    className="mt-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 max-w-md"
                  >
                    {authError}
                  </p>
                )}
              </div>

              {/* Hero Image Container */}
              <div className="lg:col-span-6 flex">
                <div className="relative w-full min-h-[300px] lg:h-full rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-br from-brand-navy-soft via-white to-brand-teal-soft">
                  {!heroImgError ? (
                    <img
                      src={HERO_IMAGE_SRC}
                      alt="University campus academic blocks connected by an elevated pedestrian bridge"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full min-h-[320px] flex flex-col items-center justify-center p-8 text-center">
                      <Building2 className="w-12 h-12 text-brand-navy mb-3" />
                      <div className="font-display font-bold text-brand-navy text-lg">
                        Campus Spatial Intelligence
                      </div>
                      <p className="text-xs text-slate-600 mt-1 max-w-xs">
                        Connecting classrooms, labs, hostels, and facilities teams in one live map.
                      </p>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/55 to-transparent p-5 sm:p-6">
                    <div className="flex flex-wrap items-end justify-between gap-3 text-white">
                      <div>
                        <div className="text-xs font-medium text-teal-200">
                          Two-Way Campus Feedback Loop
                        </div>
                        <div className="text-sm sm:text-base font-semibold mt-0.5">
                          Students report &amp; confirm · Facilities triage by real priority
                        </div>
                      </div>
                      <button
                        onClick={onEnterAsAdmin}
                        className="px-3.5 py-2 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/25 text-xs font-semibold text-white transition cursor-pointer whitespace-nowrap"
                      >
                        Admin Overview →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-Width 4-Column Platform Capabilities Strip */}
            <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl font-extrabold text-brand-navy tabular-nums">
                  Pinpoint
                </div>
                <div className="text-xs font-medium text-slate-600 mt-1">
                  Exact building, floor &amp; room location tagging
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-brand-teal-dark tabular-nums">
                  1-Tap
                </div>
                <div className="text-xs font-medium text-slate-600 mt-1">
                  Peer confirmation to elevate shared issues
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-brand-amber-dark tabular-nums">
                  4 Tiers
                </div>
                <div className="text-xs font-medium text-slate-600 mt-1">
                  Transparent priority routing for facilities triage
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-brand-navy tabular-nums">
                  Auto
                </div>
                <div className="text-xs font-medium text-slate-600 mt-1">
                  Backend clustering of duplicate &amp; related reports
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: How Friction Works (All 4 Cards Unified in Deep Navy Style) */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-navy tracking-tight">
              Built to turn scattered complaints into structured action
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              Every report passes through spatial pinning, automatic backend grouping, and clear priority
              routing before reaching maintenance teams.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-brand-navy text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-semibold text-brand-amber mb-3">
                  01. Spatial Precision
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Pin the exact building, floor, or walkway
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed max-w-xl">
                  Drop a marker directly onto the interactive campus map or select your exact
                  building and room. Technicians never waste hours hunting for a faulty outlet or
                  dark streetlight.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center gap-6 text-xs text-teal-200">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Live coordinate pinning
                </span>
                <span className="inline-flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Room &amp; floor verification
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 bg-brand-navy text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-semibold text-brand-amber mb-3">
                  02. Automatic Grouping
                </div>
                <h3 className="text-xl font-bold mb-2">
                  No duplicate noise or manual merging
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  When multiple students report the same outage in a block, Friction automatically
                  clusters related submissions in the backend and surfaces peer confirmations in one
                  canonical thread.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-white/15 flex items-center gap-4 text-xs text-teal-200">
                <span className="inline-flex items-center gap-2">
                  <GitMerge className="w-4 h-4" />
                  Automated similarity clustering
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 bg-brand-navy text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-semibold text-brand-amber mb-3">
                  03. Peer Confirmation
                </div>
                <h3 className="text-lg font-bold mb-2">
                  One-tap confirmation from affected students
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Instead of filing another ticket, students tap &ldquo;I&apos;m experiencing this
                  too&rdquo; to amplify verified issues and elevate their priority level automatically.
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-white/15 flex items-center gap-2 text-xs text-teal-200">
                <ThumbsUp className="w-4 h-4" />
                <span>Anti-spam rate limited &amp; abuse-moderated</span>
              </div>
            </div>

            <div id="priority-tiers" className="lg:col-span-7 bg-brand-navy text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-semibold text-brand-amber mb-3">
                  04. Clear Priority Tiers
                </div>
                <h3 className="text-lg font-bold mb-3">
                  Transparent priority without opaque numbers
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                    <div className="font-bold text-rose-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                      Critical Priority
                    </div>
                    <p className="text-slate-700 mt-1 leading-relaxed">
                      Safety hazards, accessibility barriers, or high-volume essential utility outages.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="font-bold text-amber-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      High Priority
                    </div>
                    <p className="text-slate-700 mt-1 leading-relaxed">
                      Disruptive issues backed by multiple peer confirmations across classes or labs.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200">
                    <div className="font-bold text-brand-teal-dark flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-teal shrink-0" />
                      Medium Priority
                    </div>
                    <p className="text-slate-700 mt-1 leading-relaxed">
                      Ongoing facility problems affecting daily routines with partial workarounds.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
                      Low Priority
                    </div>
                    <p className="text-slate-700 mt-1 leading-relaxed">
                      Localized minor inconveniences queued for routine maintenance rounds.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Dual-Role Entry */}
        <section id="portals" className="bg-white border-t border-slate-200 py-16">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-brand-teal-soft/55 border border-teal-200 rounded-2xl p-7 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-brand-teal-dark mb-2">For Students</div>
                  <h3 className="text-xl font-bold text-brand-navy">
                    Report issues &amp; validate peer observations
                  </h3>
                  <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                    Submit structured campus issues with real photo evidence, pinpoint exact rooms on
                    the map, confirm ongoing bottlenecks, and receive status notifications.
                  </p>
                </div>
                <div className="mt-6">
                  <button
                    onClick={onEnterAsStudent}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-teal hover:bg-brand-teal-dark text-white text-sm font-semibold transition cursor-pointer"
                  >
                    Open Student Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-brand-navy text-white rounded-2xl p-7 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-brand-amber mb-2">
                    For Campus Administration
                  </div>
                  <h3 className="text-xl font-bold">
                    Triage priorities, inspect the map &amp; resolve fast
                  </h3>
                  <p className="text-sm text-slate-200 mt-2 leading-relaxed">
                    Inspect charts of issue categories and priority queues in Admin Overview, jump to
                    the Campus Map View, moderate flagged reports, and update status.
                  </p>
                </div>
                <div className="mt-6">
                  <button
                    onClick={onEnterAsAdmin}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-brand-navy text-sm font-semibold transition cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-brand-teal" />
                    Open Admin Command Center
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer (No AFS Formula) */}
      <footer className="bg-white border-t border-slate-200 py-7 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <span>Making everyday campus problems impossible to ignore.</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={onOpenMap} className="hover:text-brand-navy transition cursor-pointer">
              Campus Map
            </button>
            <button onClick={onEnterAsStudent} className="hover:text-brand-navy transition cursor-pointer">
              Student Portal
            </button>
            <button onClick={onEnterAsAdmin} className="hover:text-brand-navy transition cursor-pointer">
              Admin Overview
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
