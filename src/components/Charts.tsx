import React, { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Flag,
  Layers,
  ShieldAlert,
  TrendingUp
} from 'lucide-react';
import {
  CATEGORIES,
  PriorityMeta,
  SEVERITY_LEVELS,
  STATUS_META,
  getBuildingHotspotMeta,
  getBuildingName
} from '../domain/friction';

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || STATUS_META['Pending Review'];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap ${meta.badgeClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: number }) {
  const meta = SEVERITY_LEVELS.find((s) => s.value === Number(severity)) || SEVERITY_LEVELS[0];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap ${meta.badgeClass}`}>
      {meta.short}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: PriorityMeta }) {
  return (
    <span
      title={priority.reason}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border whitespace-nowrap ${priority.badgeClass}`}
    >
      {priority.tier === 'Critical' ? (
        <AlertTriangle className="w-3 h-3 shrink-0" />
      ) : priority.tier === 'High' ? (
        <TrendingUp className="w-3 h-3 shrink-0" />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: priority.barColor }} />
      )}
      <span>{priority.label}</span>
    </span>
  );
}

interface EnrichedIssue {
  id: string;
  refId: string;
  title: string;
  buildingId: string;
  category: string;
  status: string;
  metrics: {
    R: number;
    V: number;
    S: number;
    priorityScore: number;
    priority: PriorityMeta;
  };
}

/**
 * Interactive Horizontal Priority Impact Chart replacing the raw stats table.
 */
export function PriorityQueueChart({
  issues,
  onSelectIssue,
  onManageAll
}: {
  issues: EnrichedIssue[];
  onSelectIssue: (id: string) => void;
  onManageAll: () => void;
}) {
  const maxImpact = Math.max(...issues.map((i) => i.metrics.priorityScore), 1);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h2 className="text-base font-bold text-brand-navy">
            Highest-Priority Campus Issues
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Ranked visually by combined report volume, peer confirmations, and severity impact. Click any bar to inspect.
          </p>
        </div>
        <button
          onClick={onManageAll}
          className="text-xs font-semibold text-brand-teal-dark hover:text-brand-navy transition whitespace-nowrap cursor-pointer self-start sm:self-auto"
        >
          Open moderation queue →
        </button>
      </div>

      {issues.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          All open issues have been resolved or closed.
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((iss, idx) => {
            const pct = Math.max(10, Math.round((iss.metrics.priorityScore / maxImpact) * 100));
            const totalVoices = iss.metrics.R + iss.metrics.V;
            const reportShare = totalVoices > 0 ? Math.round((iss.metrics.R / totalVoices) * 100) : 50;

            return (
              <button
                key={iss.id}
                type="button"
                onClick={() => onSelectIssue(iss.id)}
                className="w-full text-left p-3.5 rounded-xl bg-slate-50/70 hover:bg-brand-navy-soft/40 border border-slate-200 hover:border-brand-teal/40 transition group cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 mb-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="font-mono text-brand-navy font-semibold tabular-nums">
                        #{idx + 1} · {iss.refId}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{getBuildingName(iss.buildingId)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{iss.category}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 group-hover:text-brand-navy truncate">
                      {iss.title}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <StatusBadge status={iss.status} />
                    <PriorityBadge priority={iss.metrics.priority} />
                  </div>
                </div>

                {/* Proportional Visual Bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 bg-slate-200/80 rounded-full overflow-hidden flex">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, #0B2559 0%, #0B2559 ${reportShare}%, ${iss.metrics.priority.barColor} ${reportShare}%, ${iss.metrics.priority.barColor} 100%)`
                      }}
                    />
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 tabular-nums whitespace-nowrap shrink-0">
                    {iss.metrics.R} {iss.metrics.R === 1 ? 'report' : 'reports'} · {iss.metrics.V} confirms
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-5 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-brand-navy" />
          Independent reports
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-brand-teal" />
          Peer confirmations &amp; severity weight
        </span>
      </div>
    </div>
  );
}

/**
 * SVG Donut Chart for Issue Categories
 */
export function CategoryDonutChart({
  categoryStats
}: {
  categoryStats: Array<{ id: string; label: string; color: string; count: number }>;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const nonZero = categoryStats.filter((c) => c.count > 0);
  const total = nonZero.reduce((sum, c) => sum + c.count, 0);

  const size = 152;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const slices = nonZero.map((cat) => {
    const fraction = total > 0 ? cat.count / total : 0;
    const length = fraction * circumference;
    const offset = cumulativeOffset;
    cumulativeOffset += length;
    return { ...cat, fraction, length, offset };
  });

  const activeSlice = slices.find((s) => s.id === hoveredId) || null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 min-w-0 overflow-hidden">
      <div>
        <h3 className="text-sm font-bold text-brand-navy flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-brand-teal shrink-0" />
          <span className="truncate">Category Share</span>
        </h3>
        <p className="text-xs text-slate-500">Active and resolved reports by domain</p>
      </div>

      <div className="flex flex-col items-center gap-4 w-full min-w-0">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
            />
            {slices.map((slice) => (
              <circle
                key={slice.id}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={hoveredId === slice.id ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${Math.max(0, slice.length - 1.5)} ${circumference}`}
                strokeDashoffset={-slice.offset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredId(slice.id)}
                onMouseLeave={() => setHoveredId(null)}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
            <span className="text-2xl font-extrabold text-brand-navy tabular-nums leading-none">
              {activeSlice ? activeSlice.count : total}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 truncate max-w-[92px]">
              {activeSlice ? activeSlice.label : 'Total reports'}
            </span>
          </div>
        </div>

        <div className="w-full min-w-0 space-y-1">
          {categoryStats.slice(0, 6).map((cat) => {
            const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
            return (
              <div
                key={cat.id}
                onMouseEnter={() => setHoveredId(cat.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`flex items-center justify-between gap-2 text-xs px-2 py-1 rounded-lg transition cursor-default min-w-0 ${
                  hoveredId === cat.id ? 'bg-slate-100' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-slate-700 truncate">{cat.label}</span>
                </div>
                <span className="font-mono text-slate-700 tabular-nums shrink-0 whitespace-nowrap">
                  {cat.count} <span className="text-slate-400">({pct}%)</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const ZONE_RING_PALETTE = ['#0B2559', '#009E96', '#EAB308', '#0284C7', '#EA580C', '#7C3AED', '#64748B'];

/**
 * Building Pressure Donut Chart + Clickable Zone Bars
 */
export function BuildingPressureChart({
  locationStats,
  onSelectBuilding
}: {
  locationStats: Array<{ id: string; shortName: string; count: number; totalScore: number }>;
  onSelectBuilding: (id: string) => void;
}) {
  const [hoveredBuildingId, setHoveredBuildingId] = useState<string | null>(null);
  const activeZones = locationStats.filter((l) => l.count > 0);
  const displayZones = locationStats.slice(0, 5);
  const maxScore = Math.max(...activeZones.map((l) => l.totalScore), 1);
  const totalZoneIssues = activeZones.reduce((sum, z) => sum + z.count, 0);
  const totalBuildings = Math.max(locationStats.length, 1);
  const quietCount = Math.max(0, totalBuildings - activeZones.length);

  // Donut geometry matching Category Share
  const size = 152;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Portion of ring occupied by active zones across campus (minimum visual arc when >=1 active)
  const activeRingFraction = activeZones.length > 0 ? Math.max(activeZones.length / totalBuildings, 0.12) : 0;
  let cumulativeOffset = 0;
  const zoneSlices = activeZones.map((zone, idx) => {
    const shareOfActive = totalZoneIssues > 0 ? zone.count / totalZoneIssues : 0;
    const ringFraction = shareOfActive * activeRingFraction;
    const length = ringFraction * circumference;
    const offset = cumulativeOffset;
    cumulativeOffset += length;
    return {
      ...zone,
      color: ZONE_RING_PALETTE[idx % ZONE_RING_PALETTE.length],
      pctOfIssues: Math.round(shareOfActive * 100),
      length,
      offset
    };
  });

  const hoveredSlice = zoneSlices.find((s) => s.id === hoveredBuildingId) || null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 min-w-0 overflow-hidden">
      <div>
        <h3 className="text-sm font-bold text-brand-navy flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-brand-teal shrink-0" />
          <span className="truncate">Building Friction Pressure</span>
        </h3>
        <p className="text-xs text-slate-500">
          {activeZones.length} of {totalBuildings} zones active · click to inspect on map
        </p>
      </div>

      {/* Zone Coverage Donut */}
      <div className="flex flex-col items-center gap-4 w-full min-w-0">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
            />
            {zoneSlices.map((slice) => (
              <circle
                key={slice.id}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={hoveredBuildingId === slice.id ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${Math.max(2, slice.length - 1.5)} ${circumference}`}
                strokeDashoffset={-slice.offset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredBuildingId(slice.id)}
                onMouseLeave={() => setHoveredBuildingId(null)}
                onClick={() => onSelectBuilding(slice.id)}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
            <span className="text-2xl font-extrabold text-brand-navy tabular-nums leading-none">
              {hoveredSlice ? hoveredSlice.count : `${activeZones.length}/${totalBuildings}`}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 truncate max-w-[96px]">
              {hoveredSlice ? hoveredSlice.shortName : 'Active zones'}
            </span>
          </div>
        </div>

        {/* Summary Legend Strip */}
        <div className="w-full flex items-center justify-between text-[11px] text-slate-600 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-navy shrink-0" />
            <strong className="font-mono text-brand-navy tabular-nums">{activeZones.length}</strong> active
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
            <strong className="font-mono text-slate-700 tabular-nums">{quietCount}</strong> clear zones
          </span>
        </div>

        {/* Top 5 Campus Zones Bars (Active + Clear) */}
        <div className="w-full space-y-2.5 min-w-0">
          {displayZones.map((loc) => {
            const isActive = loc.count > 0;
            const pct = isActive ? Math.max(12, Math.round((loc.totalScore / maxScore) * 100)) : 0;
            const meta = getBuildingHotspotMeta(loc.totalScore, loc.count);
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => onSelectBuilding(loc.id)}
                onMouseEnter={() => isActive && setHoveredBuildingId(loc.id)}
                onMouseLeave={() => setHoveredBuildingId(null)}
                className="w-full text-left group cursor-pointer min-w-0"
              >
                <div className="flex items-center justify-between gap-2 text-xs mb-1 min-w-0">
                  <span className="font-medium text-slate-800 group-hover:text-brand-navy truncate min-w-0">
                    {loc.shortName}
                  </span>
                  <span className="font-mono text-slate-600 tabular-nums shrink-0 whitespace-nowrap">
                    {isActive
                      ? `${loc.count} ${loc.count === 1 ? 'issue' : 'issues'} · ${meta.label}`
                      : 'Clear · 0 issues'}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  {isActive && (
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${meta.barClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Stacked Proportional Status & Severity Charts
 */
export function StatusAndSeverityChart({
  issues
}: {
  issues: Array<{ status: string; severity: number; parentCanonicalId?: string | null }>;
}) {
  const canonical = issues.filter((i) => !i.parentCanonicalId && i.status !== 'Rejected');
  const totalCanonical = Math.max(canonical.length, 1);

  const statusOrder = ['Published', 'In Progress', 'Pending Review', 'Needs Clarification', 'Resolved'];
  const statusBuckets = statusOrder.map((st) => ({
    status: st,
    count: canonical.filter((i) => i.status === st).length,
    color: STATUS_META[st]?.color || '#64748B'
  }));

  const severityBuckets = [
    { label: 'Critical', value: 3, color: '#E11D48' },
    { label: 'Disruptive', value: 2, color: '#EAB308' },
    { label: 'Minor', value: 1, color: '#009E96' }
  ].map((s) => ({
    ...s,
    count: canonical.filter((i) => Number(i.severity) === s.value).length
  }));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-5 min-w-0 overflow-hidden">
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-brand-navy flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-brand-teal shrink-0" />
          <span className="truncate">Resolution Pipeline</span>
        </h3>
        <p className="text-xs text-slate-500 mb-3">Live distribution across lifecycle stages</p>

        {/* Segmented Pipeline Bar */}
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex mb-3">
          {statusBuckets.map((b) => {
            if (b.count === 0) return null;
            const widthPct = (b.count / totalCanonical) * 100;
            return (
              <div
                key={b.status}
                title={`${b.status}: ${b.count}`}
                style={{ width: `${widthPct}%`, backgroundColor: b.color }}
                className="h-full border-r border-white last:border-r-0"
              />
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 min-w-0">
          {statusBuckets.map((b) => (
            <div key={b.status} className="flex items-center justify-between gap-1.5 text-xs min-w-0">
              <span className="inline-flex items-center gap-1.5 text-slate-700 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                <span className="truncate">{b.status}</span>
              </span>
              <span className="font-mono font-semibold text-slate-800 tabular-nums shrink-0">{b.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <div className="text-xs font-bold text-brand-navy mb-2.5 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-brand-amber-dark shrink-0" />
          Severity Mix
        </div>
        <div className="grid grid-cols-3 gap-2">
          {severityBuckets.map((s) => {
            const pct = Math.round((s.count / totalCanonical) * 100);
            return (
              <div key={s.label} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center min-w-0">
                <div className="text-lg font-extrabold tabular-nums" style={{ color: s.color }}>
                  {s.count}
                </div>
                <div className="text-[11px] font-medium text-slate-700 truncate">{s.label}</div>
                <div className="text-[10px] font-mono text-slate-400 tabular-nums">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Student Dashboard Compact Category Breakdown Visual Strip
 */
export function StudentResolutionSummaryBar({
  stats
}: {
  stats: { active: number; awaitingReview: number; resolved: number; highPriority: number };
}) {
  const total = Math.max(stats.active + stats.awaitingReview + stats.resolved, 1);
  const segments = [
    { label: 'Active & Triaged', count: stats.active, color: '#009E96', icon: AlertTriangle },
    { label: 'Awaiting Review', count: stats.awaitingReview, color: '#EAB308', icon: Flag },
    { label: 'Resolved', count: stats.resolved, color: '#0B2559', icon: CheckCircle2 }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <span className="text-xs font-bold text-brand-navy">Campus Resolution Progress</span>
        <span className="text-xs text-slate-500 tabular-nums">
          {Math.round((stats.resolved / total) * 100)}% resolved across active campus queue
        </span>
      </div>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex mb-3">
        {segments.map((seg) => (
          <div
            key={seg.label}
            style={{ width: `${(seg.count / total) * 100}%`, backgroundColor: seg.color }}
            className="h-full border-r border-white last:border-r-0 transition-all duration-300"
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-slate-600">
        {segments.map((seg) => (
          <span key={seg.label} className="inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
            <span>{seg.label}</span>
            <strong className="font-mono text-brand-navy tabular-nums">{seg.count}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
