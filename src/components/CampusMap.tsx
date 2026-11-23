import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Building2, CheckCircle2, Map as MapIcon, MapPin, PlusCircle, Search, ShieldCheck } from 'lucide-react';
import {
  CAMPUS_BUILDINGS,
  CATEGORIES,
  CampusBuilding,
  frictionService,
  getBuildingHotspotMeta
} from '../domain/friction';
import { PriorityBadge, StatusBadge } from './Charts';

function distanceInMeters(latA: number, lngA: number, latB: number, lngB: number) {
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRadians(latB - latA);
  const dLng = toRadians(lngB - lngA);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

function guessBuildingId(
  placeName: string,
  latitude: number,
  longitude: number,
  buildingCoords: Record<string, [number, number]>
) {
  const place = (placeName || '').toLowerCase();
  if (place.length > 3) {
    const byName = CAMPUS_BUILDINGS.find((b) => {
      const names = [b.name.toLowerCase(), b.shortName.toLowerCase()];
      return names.some((n) => place.includes(n) || n.includes(place));
    });
    if (byName) return byName.id;
  }
  let nearestId = '';
  let nearestDistance = 60;
  CAMPUS_BUILDINGS.forEach((b) => {
    const point = buildingCoords[b.id];
    if (!point) return;
    const meters = distanceInMeters(latitude, longitude, point[0], point[1]);
    if (meters < nearestDistance) {
      nearestDistance = meters;
      nearestId = b.id;
    }
  });
  return nearestId;
}

export function LeafletCampusMap({
  buildings,
  coords,
  summaries,
  selectedId,
  onSelect,
  pinTargetId,
  onPick,
  issuePins,
  onSelectIssue,
  droppedPin,
  onDrop,
  heightClass = 'h-[460px]'
}: {
  buildings: CampusBuilding[];
  coords: Record<string, [number, number]>;
  summaries: Record<string, { count: number; totalScore: number }>;
  selectedId: string;
  onSelect: (id: string) => void;
  pinTargetId: string | null;
  onPick: (lat: number, lng: number) => void;
  issuePins: any[];
  onSelectIssue: (id: string) => void;
  droppedPin: { latitude: number; longitude: number } | null;
  onDrop: (lat: number, lng: number) => void;
  heightClass?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const buildingLayerRef = useRef<L.LayerGroup | null>(null);
  const issueLayerRef = useRef<L.LayerGroup | null>(null);
  const dropLayerRef = useRef<L.LayerGroup | null>(null);
  const pinTargetRef = useRef(pinTargetId);
  const onPickRef = useRef(onPick);
  const onDropRef = useRef(onDrop);
  pinTargetRef.current = pinTargetId;
  onPickRef.current = onPick;
  onDropRef.current = onDrop;

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true, maxZoom: 19 });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    buildingLayerRef.current = L.layerGroup().addTo(map);
    issueLayerRef.current = L.layerGroup().addTo(map);
    dropLayerRef.current = L.layerGroup().addTo(map);
    const pinnedPoints = Object.values(coords);
    if (pinnedPoints.length > 0) {
      map.fitBounds(L.latLngBounds(pinnedPoints), { padding: [50, 50], maxZoom: 18 });
    } else {
      map.setView([28.6645, 77.2327], 17);
    }
    map.on('click', (event: L.LeafletMouseEvent) => {
      if (pinTargetRef.current) onPickRef.current(event.latlng.lat, event.latlng.lng);
      else onDropRef.current(event.latlng.lat, event.latlng.lng);
    });
    mapRef.current = map;
    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    const layer = buildingLayerRef.current;
    if (!layer || !containerRef.current) return;
    layer.clearLayers();
    containerRef.current.style.cursor = 'crosshair';
    buildings.forEach((building) => {
      const point = coords[building.id];
      if (!point) return;
      const summary = summaries[building.id];
      const issueCount = summary?.count || 0;
      const hotspot = getBuildingHotspotMeta(summary?.totalScore || 0, issueCount);
      const isSelected = building.id === selectedId;
      const icon = L.divIcon({
        className: '',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        html: `<div style="width:34px;height:34px;border-radius:17px;background:${hotspot.hex};color:#fff;font:700 13px 'Plus Jakarta Sans',system-ui;display:flex;align-items:center;justify-content:center;border:3px solid ${
          isSelected ? '#0B2559' : '#fff'
        };box-shadow:0 2px 8px rgba(11,37,89,.35)">${issueCount > 0 ? issueCount : '&bull;'}</div>`
      });
      const marker = L.marker(point, {
        icon,
        interactive: !pinTargetId,
        keyboard: true,
        title: building.name
      });
      marker.bindTooltip(
        `${building.shortName}${issueCount ? ` · ${issueCount} open (${hotspot.label})` : ''}`,
        { direction: 'top', offset: [0, -16] }
      );
      marker.on('click', () => onSelect(building.id));
      marker.addTo(layer);
    });
  }, [buildings, coords, summaries, selectedId, pinTargetId, onSelect]);

  useEffect(() => {
    const layer = issueLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    issuePins.forEach((issue) => {
      const fillColor =
        Number(issue.severity) === 3 ? '#E11D48' : Number(issue.severity) === 2 ? '#EAB308' : '#009E96';
      const dot = L.circleMarker([issue.latitude, issue.longitude], {
        radius: 8,
        color: '#fff',
        weight: 2,
        fillColor,
        fillOpacity: 1,
        interactive: !pinTargetId,
        bubblingMouseEvents: false
      });
      dot.bindTooltip(`${issue.refId} · ${issue.title}`, { direction: 'top' });
      dot.on('click', () => onSelectIssue(issue.id));
      dot.addTo(layer);
    });
  }, [issuePins, pinTargetId, onSelectIssue]);

  useEffect(() => {
    const layer = dropLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!droppedPin) return;
    const icon = L.divIcon({
      className: '',
      iconSize: [30, 40],
      iconAnchor: [15, 40],
      html: '<svg width="30" height="40" viewBox="0 0 30 40"><path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 25 15 25s15-14 15-25C30 6.7 23.3 0 15 0z" fill="#0B2559" stroke="#fff" stroke-width="2"/><circle cx="15" cy="15" r="5.5" fill="#EAB308"/></svg>'
    });
    L.marker([droppedPin.latitude, droppedPin.longitude], { icon, interactive: false }).addTo(layer);
  }, [droppedPin]);

  return (
    <div
      ref={containerRef}
      className={`w-full ${heightClass}`}
      role="application"
      aria-label="Interactive campus map"
    />
  );
}

export function CampusMapView({
  data,
  currentUser,
  selectedBuildingId,
  setSelectedBuildingId,
  setSelectedIssueId,
  confirmIssue,
  navigateToReportWithBuilding,
  buildingCoords,
  pinBuilding,
  navigateToReportWithSpot,
  embeddedInAdmin = false,
  onOpenModeration
}: {
  data: any;
  currentUser: { id: string; role: 'student' | 'admin' };
  selectedBuildingId: string;
  setSelectedBuildingId: (id: string) => void;
  setSelectedIssueId: (id: string) => void;
  confirmIssue: (id: string) => void;
  navigateToReportWithBuilding: (id: string) => void;
  buildingCoords: Record<string, [number, number]>;
  pinBuilding: (id: string, lat: number, lng: number) => void;
  navigateToReportWithSpot: (spot: any) => void;
  embeddedInAdmin?: boolean;
  onOpenModeration?: () => void;
}) {
  const isAdmin = currentUser.role === 'admin';
  const [pinTargetId, setPinTargetId] = useState<string | null>(null);
  const [droppedPin, setDroppedPin] = useState<any>(null);

  const handleDrop = async (latitude: number, longitude: number) => {
    setDroppedPin({
      latitude,
      longitude,
      placeName: '',
      isLookingUp: true,
      buildingId: guessBuildingId('', latitude, longitude, buildingCoords)
    });
    let placeName = '';
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&lat=${latitude}&lon=${longitude}`
      );
      const result = await response.json();
      placeName = result.name || result.address?.building || '';
    } catch {
      placeName = '';
    }
    const matchedBuildingId = guessBuildingId(placeName, latitude, longitude, buildingCoords);
    setDroppedPin((current: any) =>
      current && current.latitude === latitude && current.longitude === longitude
        ? { ...current, placeName, isLookingUp: false, buildingId: matchedBuildingId }
        : current
    );
    if (matchedBuildingId) setSelectedBuildingId(matchedBuildingId);
  };

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCanonicalIssues = useMemo(() => {
    return data.issues
      .filter((i: any) => !i.parentCanonicalId && i.status !== 'Rejected')
      .map((issue: any) => ({
        ...issue,
        metrics: frictionService.computeIssueMetrics(issue, data.issues)
      }))
      .filter((issue: any) => {
        if (categoryFilter !== 'ALL' && issue.category !== categoryFilter) return false;
        if (severityFilter !== 'ALL' && Number(issue.metrics.S) !== Number(severityFilter)) return false;
        if (statusFilter === 'ACTIVE') {
          if (!['Published', 'In Progress', 'Pending Review', 'Needs Clarification'].includes(issue.status)) {
            return false;
          }
        } else if (statusFilter !== 'ALL' && issue.status !== statusFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            issue.title.toLowerCase().includes(q) ||
            issue.refId.toLowerCase().includes(q) ||
            issue.category.toLowerCase().includes(q) ||
            (issue.floorRoom && issue.floorRoom.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      });
  }, [data.issues, categoryFilter, severityFilter, statusFilter, searchQuery]);

  const buildingSummaries = useMemo(() => {
    const map: Record<string, { building: CampusBuilding; issues: any[]; count: number; totalScore: number; topCategory: string | null }> = {};
    CAMPUS_BUILDINGS.forEach((bld) => {
      const issues = filteredCanonicalIssues
        .filter((i: any) => i.buildingId === bld.id)
        .sort((a: any, b: any) => b.metrics.priorityScore - a.metrics.priorityScore);
      const totalScore = issues.reduce((acc: number, i: any) => acc + i.metrics.priorityScore, 0);
      map[bld.id] = {
        building: bld,
        issues,
        count: issues.length,
        totalScore: Math.round(totalScore * 10) / 10,
        topCategory: issues[0]?.category || null
      };
    });
    return map;
  }, [filteredCanonicalIssues]);

  const activeBuilding = CAMPUS_BUILDINGS.find((b) => b.id === selectedBuildingId) || CAMPUS_BUILDINGS[0];
  const activeSummary = buildingSummaries[activeBuilding.id] || {
    building: activeBuilding,
    issues: [],
    count: 0,
    totalScore: 0
  };
  const hotspotMeta = getBuildingHotspotMeta(activeSummary.totalScore, activeSummary.count);

  const resetFilters = () => {
    setCategoryFilter('ALL');
    setSeverityFilter('ALL');
    setStatusFilter('ACTIVE');
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className={`${embeddedInAdmin ? 'text-base' : 'text-lg'} font-bold text-brand-navy flex items-center gap-2`}>
              <MapIcon className="w-5 h-5 text-brand-teal" />
              {embeddedInAdmin ? 'Live Campus Spatial Map' : 'Interactive Campus Friction Map'}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {isAdmin
                ? 'Inspect building hotspots, review localized issues, and position building coordinates.'
                : 'Select any campus building or drop a pin to inspect localized issues and priority levels.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search room, keyword..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-teal"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-brand-teal"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-brand-teal"
            >
              <option value="ALL">All Severities</option>
              <option value="3">Critical</option>
              <option value="2">Disruptive</option>
              <option value="1">Minor Impact</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-brand-teal"
            >
              <option value="ACTIVE">Open &amp; Active</option>
              <option value="ALL">All Statuses</option>
              <option value="Published">Published</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Resolved">Resolved</option>
            </select>

            {(categoryFilter !== 'ALL' ||
              severityFilter !== 'ALL' ||
              statusFilter !== 'ACTIVE' ||
              searchQuery) && (
              <button
                onClick={resetFilters}
                className="px-2.5 py-1.5 rounded-lg text-xs text-slate-600 hover:text-brand-navy bg-slate-100 border border-slate-200 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Map + Side Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Critical Hotspot
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                High Priority
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-teal" />
                Active Zone
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                Clear
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
              {filteredCanonicalIssues.length} matching issues
            </span>
          </div>

          <div className="isolate rounded-xl overflow-hidden border border-slate-200">
            <LeafletCampusMap
              buildings={CAMPUS_BUILDINGS}
              coords={buildingCoords}
              summaries={buildingSummaries}
              selectedId={selectedBuildingId}
              onSelect={setSelectedBuildingId}
              issuePins={filteredCanonicalIssues.filter((i: any) => i.latitude != null)}
              onSelectIssue={setSelectedIssueId}
              droppedPin={droppedPin}
              onDrop={handleDrop}
              pinTargetId={pinTargetId}
              onPick={(latitude, longitude) => {
                if (pinTargetId) pinBuilding(pinTargetId, latitude, longitude);
                setPinTargetId(null);
              }}
              heightClass={embeddedInAdmin ? 'h-[380px]' : 'h-[460px]'}
            />
          </div>

          {/* Dropped pin bar: Student gets Report button; Admin gets inspection/pinning info only */}
          {droppedPin && !pinTargetId && (
            <div
              role="status"
              className="mt-3 p-3.5 rounded-xl bg-brand-teal-soft border border-brand-teal/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="text-xs text-brand-navy">
                <div className="font-semibold">
                  {droppedPin.isLookingUp ? 'Looking up this spot…' : droppedPin.placeName || 'Selected map spot'}
                </div>
                <div className="text-slate-600 mt-0.5 tabular-nums">
                  {droppedPin.latitude.toFixed(5)}, {droppedPin.longitude.toFixed(5)}
                  {!droppedPin.isLookingUp && (
                    <>
                      {' · '}
                      {droppedPin.buildingId
                        ? `Matched to ${CAMPUS_BUILDINGS.find((b) => b.id === droppedPin.buildingId)?.name}`
                        : 'Outside existing building pins'}
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {!isAdmin && (
                  <button
                    onClick={() => navigateToReportWithSpot(droppedPin)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-semibold cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Report an issue here
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => {
                      pinBuilding(activeBuilding.id, droppedPin.latitude, droppedPin.longitude);
                      setDroppedPin(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-navy hover:bg-brand-navy-dark text-white text-xs font-semibold cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Set as {activeBuilding.shortName} Pin
                  </button>
                )}
                <button
                  onClick={() => setDroppedPin(null)}
                  className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {!droppedPin && !pinTargetId && (
            <p className="mt-3 text-[11px] text-slate-500">
              {isAdmin
                ? 'Click any building marker to inspect open reports, or click the map to reposition a building pin.'
                : 'Tip: Click anywhere on the map to drop a pin at the exact problem location.'}
            </p>
          )}

          {pinTargetId && (
            <div
              role="status"
              className="mt-3 px-3.5 py-2.5 rounded-xl bg-brand-navy-soft border border-brand-navy/20 text-xs text-brand-navy flex items-center justify-between gap-2"
            >
              <span>
                Click the map to place <strong>{CAMPUS_BUILDINGS.find((b) => b.id === pinTargetId)?.name}</strong>.
              </span>
              <button onClick={() => setPinTargetId(null)} className="font-semibold hover:underline cursor-pointer">
                Cancel
              </button>
            </div>
          )}

          {isAdmin && !pinTargetId && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setPinTargetId(activeBuilding.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-xs font-medium text-brand-navy cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-brand-teal" />
                {buildingCoords[activeBuilding.id] ? 'Move pin' : 'Place pin'} for {activeBuilding.shortName}
              </button>
            </div>
          )}

          {/* Building Quick Selector */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {CAMPUS_BUILDINGS.map((bld) => {
              const cnt = buildingSummaries[bld.id]?.count || 0;
              const active = bld.id === selectedBuildingId;
              return (
                <button
                  key={bld.id}
                  onClick={() => setSelectedBuildingId(bld.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-brand-navy text-white font-semibold'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{bld.shortName}</span>
                  {cnt > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums ${
                        active ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Building Inspector */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 text-xs text-brand-teal-dark font-mono mb-1">
                  <span>{activeBuilding.code}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeBuilding.zone}</span>
                </div>
                <h3 className="text-xl font-bold text-brand-navy">{activeBuilding.name}</h3>
                <p className="text-xs text-slate-600 mt-1">{activeBuilding.description}</p>
              </div>
              {!isAdmin ? (
                <button
                  onClick={() => navigateToReportWithBuilding(activeBuilding.id)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-teal hover:bg-brand-teal-dark text-white font-semibold text-xs transition cursor-pointer whitespace-nowrap"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Report Here
                </button>
              ) : (
                onOpenModeration && (
                  <button
                    onClick={onOpenModeration}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-navy-soft hover:bg-slate-200 text-brand-navy font-semibold text-xs transition cursor-pointer whitespace-nowrap"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-teal" />
                    Triage Queue
                  </button>
                )
              )}
            </div>

            <div className="grid grid-cols-3 gap-2.5 my-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-[11px] text-slate-500">Matching Issues</div>
                <div className="text-lg font-bold text-brand-navy tabular-nums mt-0.5">{activeSummary.count}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-[11px] text-slate-500">Priority Level</div>
                <div className="text-sm font-bold text-brand-navy mt-1">{hotspotMeta.label}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-[11px] text-slate-500">Map Pin</div>
                <div className="text-xs font-semibold text-slate-700 mt-1.5">
                  {buildingCoords[activeBuilding.id] ? 'Pinned' : 'Not pinned'}
                </div>
              </div>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {activeSummary.issues.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600/70 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-800">
                    No matching issues in {activeBuilding.name}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 mb-4">
                    {isAdmin
                      ? 'Try adjusting map filters or selecting another campus building.'
                      : 'Try clearing map filters or report a new problem at this location.'}
                  </p>
                  {!isAdmin && (
                    <button
                      onClick={() => navigateToReportWithBuilding(activeBuilding.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-brand-teal hover:text-white text-slate-800 text-xs font-medium transition cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Report Issue at {activeBuilding.shortName}
                    </button>
                  )}
                </div>
              ) : (
                activeSummary.issues.map((issue: any) => {
                  const { metrics } = issue;
                  const hasConfirmed = metrics.uniqueConfirmers.includes(currentUser.id);

                  return (
                    <div
                      key={issue.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-brand-teal/50 transition"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-600">{issue.refId}</span>
                          <StatusBadge status={issue.status} />
                        </div>
                        <PriorityBadge priority={metrics.priority} />
                      </div>

                      <button
                        onClick={() => setSelectedIssueId(issue.id)}
                        className="text-left block w-full cursor-pointer"
                      >
                        <h4 className="text-sm font-semibold text-brand-navy hover:text-brand-teal-dark transition">
                          {issue.title}
                        </h4>
                      </button>

                      <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                        <span>{issue.category}</span>
                        {issue.floorRoom && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-700">{issue.floorRoom}</span>
                          </>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-600 tabular-nums">
                          {metrics.R} {metrics.R === 1 ? 'report' : 'reports'} · {metrics.V} confirmations
                        </span>
                        <div className="flex items-center gap-2">
                          {!isAdmin && (
                            <button
                              onClick={() => confirmIssue(issue.id)}
                              disabled={hasConfirmed}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                                hasConfirmed
                                  ? 'bg-brand-teal-soft text-brand-teal-dark border border-teal-200'
                                  : 'bg-slate-100 hover:bg-brand-teal hover:text-white text-slate-800 cursor-pointer'
                              }`}
                            >
                              {hasConfirmed ? `Confirmed (${metrics.V})` : '+ Confirm'}
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedIssueId(issue.id)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-white hover:bg-slate-100 text-brand-navy border border-slate-200 cursor-pointer"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
