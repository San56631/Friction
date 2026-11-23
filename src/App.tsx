import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Flag,
  GitMerge,
  History,
  Home,
  LayoutDashboard,
  Map as MapIcon,
  MapPin,
  Menu,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  ThumbsUp,
  Unlink,
  UserCheck,
  X
} from 'lucide-react';
import { AccountMenu, useAuth } from './auth';
import * as remoteStore from './lib/remoteStore';
import {
  CAMPUS_BUILDINGS,
  CATEGORIES,
  DEMO_USERS,
  SEVERITY_LEVELS,
  STATUS_META,
  formatRelativeTime,
  frictionService,
  getBuildingHotspotMeta,
  getBuildingName,
  getCategoryMeta
} from './domain/friction';
import {
  BuildingPressureChart,
  CategoryDonutChart,
  PriorityBadge,
  PriorityQueueChart,
  SeverityBadge,
  StatusAndSeverityChart,
  StatusBadge,
  StudentResolutionSummaryBar
} from './components/Charts';
import { BrandLogo } from './components/BrandLogo';
import { CampusMapView } from './components/CampusMap';
import { LandingPage } from './components/LandingPage';

// ============================================================================
// 1. APPLICATION CONTEXT
// ============================================================================

const WORKSPACE_ENTRY_KEY = 'friction_workspace_entered';

const FrictionContext = createContext<any>(null);

function FrictionProvider({ children }: { children: React.ReactNode }) {
  const { authUser, demoMode, enterDemoMode } = useAuth();
  const [data, setData] = useState<any>(() =>
    authUser ? remoteStore.emptyState() : frictionService.loadState()
  );
  const [currentUserId, setCurrentUserId] = useState('stu-1');
  const [enteredWorkspace, setEnteredWorkspace] = useState<boolean>(() => {
    if (authUser) return true;
    try {
      return sessionStorage.getItem(WORKSPACE_ENTRY_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [activeTab, setActiveTab] = useState<string>(() =>
    authUser?.role === 'admin' ? 'admin-overview' : 'dashboard'
  );
  const [selectedBuildingId, setSelectedBuildingId] = useState('cse-ece-block');
  const [buildingCoords, setBuildingCoords] = useState<Record<string, [number, number]>>(() =>
    Object.fromEntries(
      CAMPUS_BUILDINGS.filter((b) => b.latitude !== null && b.longitude !== null).map((b) => [
        b.id,
        [b.latitude as number, b.longitude as number]
      ])
    )
  );
  const [reportPrefillBuilding, setReportPrefillBuilding] = useState('');
  const [reportPrefillSpot, setReportPrefillSpot] = useState<any>(null);
  const [dailyLimit, setDailyLimit] = useState(3);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState<{ id: number; message: string; type: string } | null>(null);

  useEffect(() => {
    if (!authUser) frictionService.saveState(data);
  }, [data, authUser]);

  useEffect(() => {
    if (authUser) {
      setEnteredWorkspace(true);
    }
  }, [authUser]);

  const currentUser = useMemo(() => {
    if (authUser) {
      return {
        id: authUser.id,
        name: authUser.name,
        role: authUser.role as 'student' | 'admin',
        department:
          authUser.role === 'admin'
            ? 'Campus Facilities & Operations'
            : 'IGDTUW Student Portal',
        rollNo: '',
        avatar: authUser.initials
      };
    }
    return DEMO_USERS.find((u) => u.id === currentUserId) || DEMO_USERS[0];
  }, [authUser, currentUserId]);

  const enterWorkspace = (targetRole?: 'student' | 'admin', targetTab?: string) => {
    if (!authUser && !demoMode) {
      enterDemoMode();
    }
    if (!authUser && targetRole === 'admin') {
      setCurrentUserId('admin-1');
      setActiveTab(targetTab || 'admin-overview');
    } else if (!authUser && targetRole === 'student') {
      setCurrentUserId('stu-1');
      setActiveTab(targetTab || 'dashboard');
    } else if (targetTab) {
      setActiveTab(targetTab);
    }
    try {
      sessionStorage.setItem(WORKSPACE_ENTRY_KEY, '1');
    } catch {}
    setEnteredWorkspace(true);
  };

  const exitToLanding = () => {
    try {
      sessionStorage.removeItem(WORKSPACE_ENTRY_KEY);
    } catch {}
    setEnteredWorkspace(false);
  };

  const showToast = (message: string, type = 'success') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast((prev) => (prev && Date.now() - prev.id >= 3200 ? null : prev));
    }, 3400);
  };

  const refresh = async () => {
    if (!authUser) return;
    const next = await remoteStore.loadRemoteState(authUser.id);
    if (next) setData(next);
  };

  const runRemote = async (action: PromiseLike<{ error?: any }>, successMessage?: string) => {
    const { error } = await action;
    if (error) {
      showToast(remoteStore.friendlyError(error), 'error');
      return false;
    }
    if (successMessage) showToast(successMessage);
    await refresh();
    return true;
  };

  useEffect(() => {
    if (!authUser) return;
    refresh();
    const pollTimer = setInterval(refresh, 20000);
    return () => clearInterval(pollTimer);
  }, [authUser?.id, authUser?.role]);

  useEffect(() => {
    if (currentUser.role === 'admin' && ['dashboard', 'my-reports', 'report'].includes(activeTab)) {
      setActiveTab('admin-overview');
    }
    if (currentUser.role === 'student' && activeTab.startsWith('admin-')) {
      setActiveTab('dashboard');
    }
  }, [currentUser.role, activeTab]);

  useEffect(() => {
    if (!authUser) return;
    remoteStore.loadBuildingCoords().then((rows) => {
      if (rows.length === 0) return;
      setBuildingCoords((prev) => ({
        ...prev,
        ...Object.fromEntries(rows.map((r: any) => [r.id, [r.latitude, r.longitude]]))
      }));
    });
  }, [authUser?.id]);

  useEffect(() => {
    if (!authUser) return;
    remoteStore.getDailyLimit().then((limit) => {
      frictionService.dailyLimit = limit;
      setDailyLimit(limit);
    });
  }, [authUser?.id]);

  const updateDailyLimit = async (limit: number) => {
    const { error } = await remoteStore.saveDailyLimit(limit);
    if (error) {
      showToast(remoteStore.friendlyError(error), 'error');
      return false;
    }
    frictionService.dailyLimit = limit;
    setDailyLimit(limit);
    showToast('Daily report limit updated.');
    return true;
  };

  const recordAbuse = async (targetUserId: string, note: string) => {
    if (!authUser) {
      showToast('Abuse enforcement needs the database. Sign in as an administrator.', 'error');
      return;
    }
    await runRemote(remoteStore.recordAbuse(targetUserId, note), 'Strike recorded and the student was notified.');
  };

  const pinBuilding = async (buildingId: string, latitude: number, longitude: number) => {
    if (authUser) {
      const { error } = await remoteStore.updateBuildingCoordinates(buildingId, latitude, longitude);
      if (error) return showToast(remoteStore.friendlyError(error), 'error');
    }
    setBuildingCoords((prev) => ({ ...prev, [buildingId]: [latitude, longitude] }));
    showToast('Building pin saved.');
  };

  const switchUser = (userId: string) => {
    const target = DEMO_USERS.find((u) => u.id === userId);
    if (!target) return;
    setCurrentUserId(userId);
    if (target.role === 'admin' && ['dashboard', 'my-reports', 'report'].includes(activeTab)) {
      setActiveTab('admin-overview');
    } else if (target.role === 'student' && activeTab.startsWith('admin-')) {
      setActiveTab('dashboard');
    }
    showToast(
      `Switched active persona to ${target.name} (${target.role === 'admin' ? 'Administrator' : 'Student'})`,
      'info'
    );
  };

  const pushNotification = (
    draftData: any,
    { userId, issueId, title, message, type }: { userId: string; issueId: string; title: string; message: string; type: string }
  ) => {
    const newNotif = {
      id: `NTF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      issueId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    return {
      ...draftData,
      notifications: [newNotif, ...draftData.notifications]
    };
  };

  // Create new issue report with automatic backend duplicate & group detection
  const submitReport = async ({ title, description, category, buildingId, floorRoom, severity, imageUrl, spot }: any) => {
    if (currentUser.role !== 'student') {
      return {
        ok: false,
        error: 'Administrator accounts moderate and resolve issues. Only student accounts can submit complaints.'
      };
    }

    if (authUser) {
      const { data: row, error } = await remoteStore.submitIssue(
        {
          title: title.trim(),
          description: description.trim(),
          category,
          buildingId,
          floorRoom: floorRoom.trim(),
          severity: Number(severity),
          imageUrl,
          spot
        },
        currentUser.id
      );
      if (error) return { ok: false, error: remoteStore.friendlyError(error) };
      await refresh();
      return { ok: true, issue: remoteStore.mapIssueRow(row) };
    }

    const quota = frictionService.getUserDailySubmissionStats(currentUser.id, data.issues);
    if (quota.remaining <= 0) {
      return {
        ok: false,
        error: 'Daily allowance reached (3 reports per rolling 24 hours). Please wait before submitting another report.'
      };
    }

    const refNum = data.nextRefNumber || 114;
    const newId = `ISS-${refNum}`;
    const refId = `FRC-2026-${refNum}`;
    const nowIso = new Date().toISOString();

    // Automatic backend duplicate / independent grouping
    const autoGroup = frictionService.findAutoGroupCandidate(
      {
        title: title.trim(),
        description: description.trim(),
        category,
        buildingId,
        floorRoom: floorRoom.trim()
      },
      data.issues
    );

    const historyEntries = [
      {
        action: `Submitted by ${currentUser.name}`,
        actor: currentUser.name,
        at: nowIso
      }
    ];

    if (autoGroup) {
      historyEntries.push({
        action:
          autoGroup.linkType === 'true_duplicate'
            ? `Automatically matched as duplicate of ${autoGroup.canonical.refId}`
            : `Automatically grouped as related report under ${autoGroup.canonical.refId}`,
        actor: 'Auto-Grouping Engine',
        at: nowIso
      });
    }

    const newIssue = {
      id: newId,
      refId,
      title: title.trim(),
      description: description.trim(),
      category,
      buildingId,
      floorRoom: floorRoom.trim(),
      severity: Number(severity),
      status: autoGroup ? 'Published' : 'Pending Review',
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      createdAt: nowIso,
      confirmedByUserIds: [currentUser.id],
      parentCanonicalId: autoGroup ? autoGroup.canonical.id : null,
      linkType: autoGroup ? autoGroup.linkType : null,
      imageUrl: imageUrl || null,
      latitude: spot?.latitude ?? null,
      longitude: spot?.longitude ?? null,
      placeName: spot?.placeName || null,
      adminNotes: [],
      history: historyEntries
    };

    setData((prev: any) => {
      let updatedIssues = [newIssue, ...prev.issues];
      if (autoGroup) {
        updatedIssues = updatedIssues.map((item: any) => {
          if (item.id !== autoGroup.canonical.id) return item;
          return {
            ...item,
            confirmedByUserIds: Array.from(new Set([...(item.confirmedByUserIds || []), currentUser.id])),
            history: [
              ...item.history,
              {
                action: `Automatically grouped ${refId} (${autoGroup.linkType === 'true_duplicate' ? 'duplicate' : 'related report'})`,
                actor: 'Auto-Grouping Engine',
                at: nowIso
              }
            ]
          };
        });
      }

      let nextState = {
        ...prev,
        issues: updatedIssues,
        nextRefNumber: refNum + 1
      };

      if (autoGroup) {
        nextState = pushNotification(nextState, {
          userId: currentUser.id,
          issueId: autoGroup.canonical.id,
          title: 'Report Automatically Grouped',
          message: `Your report ${refId} was automatically grouped with ${autoGroup.canonical.refId} (${autoGroup.canonical.title}) so confirmations stay unified.`,
          type: 'update'
        });
      }

      return nextState;
    });

    return { ok: true, issue: newIssue, autoGroupedWith: autoGroup?.canonical || null };
  };

  const confirmIssue = (issueId: string) => {
    if (authUser) {
      const target = data.issues.find((i: any) => i.id === issueId);
      runRemote(
        remoteStore.confirmIssue(target?.parentCanonicalId || issueId, currentUser.id),
        'Confirmation recorded! Issue priority updated.'
      );
      return;
    }
    if (currentUser.role !== 'student') {
      showToast('Only student accounts can submit issue confirmations.', 'error');
      return;
    }
    setData((prev: any) => {
      const target = prev.issues.find((i: any) => i.id === issueId);
      if (!target) return prev;
      const canonicalId = target.parentCanonicalId || target.id;
      const metrics = frictionService.computeIssueMetrics(target, prev.issues);
      if (metrics.uniqueConfirmers.includes(currentUser.id)) {
        return prev;
      }

      const updatedIssues = prev.issues.map((item: any) => {
        if (item.id === canonicalId) {
          return {
            ...item,
            confirmedByUserIds: Array.from(new Set([...(item.confirmedByUserIds || []), currentUser.id])),
            history: [
              ...item.history,
              {
                action: `Confirmed ("Experiencing this too") by ${currentUser.name}`,
                actor: currentUser.name,
                at: new Date().toISOString()
              }
            ]
          };
        }
        return item;
      });

      return { ...prev, issues: updatedIssues };
    });
    showToast('Confirmation recorded! Issue priority updated.');
  };

  const submitClarificationResponse = (issueId: string, responseText: string) => {
    if (!responseText.trim()) return;
    if (authUser) {
      runRemote(
        remoteStore.respondToClarification(issueId, responseText),
        'Clarification submitted and returned to Admin review queue.'
      );
      return;
    }
    setData((prev: any) => {
      const updatedIssues = prev.issues.map((item: any) => {
        if (item.id !== issueId) return item;
        return {
          ...item,
          status: 'Pending Review',
          description: `${item.description}\n\n[Student Clarification]: ${responseText.trim()}`,
          history: [
            ...item.history,
            {
              action: `Student clarification added by ${currentUser.name}; returned to Pending Review`,
              actor: currentUser.name,
              at: new Date().toISOString()
            }
          ]
        };
      });
      return { ...prev, issues: updatedIssues };
    });
    showToast('Clarification submitted and returned to Admin review queue.');
  };

  const flagIssue = (issueId: string, reason: string, details: string) => {
    if (authUser) {
      runRemote(
        remoteStore.flagIssue(issueId, currentUser.id, reason, details.trim()),
        'Report flagged for administrator review.'
      );
      return;
    }
    const newFlag = {
      id: `FLG-${Date.now()}`,
      issueId,
      flaggedByUserId: currentUser.id,
      flaggedByName: currentUser.name,
      reason,
      details: details.trim(),
      status: 'open',
      createdAt: new Date().toISOString()
    };

    setData((prev: any) => ({
      ...prev,
      flags: [newFlag, ...prev.flags],
      issues: prev.issues.map((i: any) =>
        i.id === issueId
          ? {
              ...i,
              history: [
                ...i.history,
                {
                  action: `Flagged for moderation (${reason}) by ${currentUser.name}`,
                  actor: currentUser.name,
                  at: new Date().toISOString()
                }
              ]
            }
          : i
      )
    }));
    showToast('Report flagged for administrator review.');
  };

  const moderateIssue = (
    issueId: string,
    { status, severity, adminNote, notifyType, notifyTitle, notifyMessage }: any
  ) => {
    if (authUser) {
      const target = data.issues.find((i: any) => i.id === issueId);
      (async () => {
        const patch: any = {};
        if (status && status !== target.status) {
          patch.status = status;
          patch.status_reason =
            status === 'Rejected' || status === 'Needs Clarification'
              ? (adminNote || '').replace(/^(Rejected|Clarification Requested):\s*/, '')
              : null;
        }
        if (severity && Number(severity) !== Number(target.severity)) patch.severity = Number(severity);
        if (Object.keys(patch).length > 0) {
          const { error } = await remoteStore.updateIssue(issueId, patch);
          if (error) return showToast(remoteStore.friendlyError(error), 'error');
        }
        if (adminNote && adminNote.trim()) {
          await remoteStore.addNote(issueId, currentUser.id, currentUser.name, adminNote.trim());
        }
        if (!patch.status && notifyTitle) {
          await remoteStore.notifyUser(target.reporterId, issueId, notifyTitle, notifyMessage, notifyType || 'update');
        }
        showToast('Moderation update applied and synced.');
        refresh();
      })();
      return;
    }

    setData((prev: any) => {
      const target = prev.issues.find((i: any) => i.id === issueId);
      if (!target) return prev;
      const nowIso = new Date().toISOString();

      const historyEntries: any[] = [];
      if (status && status !== target.status) {
        historyEntries.push({
          action: `Status updated from ${target.status} to ${status}`,
          actor: currentUser.name,
          at: nowIso
        });
      }
      if (severity && Number(severity) !== Number(target.severity)) {
        const sevLabel = SEVERITY_LEVELS.find((l) => l.value === Number(severity))?.short || `Level ${severity}`;
        historyEntries.push({
          action: `Severity updated to ${sevLabel}`,
          actor: currentUser.name,
          at: nowIso
        });
      }
      if (adminNote && adminNote.trim()) {
        historyEntries.push({
          action: `Admin Note: "${adminNote.trim()}"`,
          actor: currentUser.name,
          at: nowIso
        });
      }

      const updatedIssues = prev.issues.map((item: any) => {
        if (item.id !== issueId) return item;
        return {
          ...item,
          status: status || item.status,
          severity: severity ? Number(severity) : item.severity,
          adminNotes:
            adminNote && adminNote.trim()
              ? [
                  ...item.adminNotes,
                  {
                    id: `note-${Date.now()}`,
                    author: currentUser.name,
                    text: adminNote.trim(),
                    createdAt: nowIso
                  }
                ]
              : item.adminNotes,
          history: [...item.history, ...historyEntries]
        };
      });

      let nextState = { ...prev, issues: updatedIssues };

      if (notifyTitle && target.reporterId) {
        nextState = pushNotification(nextState, {
          userId: target.reporterId,
          issueId: target.id,
          title: notifyTitle,
          message: notifyMessage,
          type: notifyType || 'update'
        });
      }

      return nextState;
    });
    showToast('Moderation update applied and synced.');
  };

  const unlinkIssue = (childIssueId: string) => {
    if (authUser) {
      runRemote(
        remoteStore.updateIssue(childIssueId, { parent_id: null, link_type: null }),
        'Report separated into a standalone issue.'
      );
      return;
    }
    setData((prev: any) => {
      const child = prev.issues.find((i: any) => i.id === childIssueId);
      if (!child || !child.parentCanonicalId) return prev;
      const nowIso = new Date().toISOString();

      const updatedIssues = prev.issues.map((item: any) => {
        if (item.id === childIssueId) {
          return {
            ...item,
            parentCanonicalId: null,
            linkType: null,
            history: [
              ...item.history,
              {
                action: 'Separated from auto-group into standalone issue',
                actor: currentUser.name,
                at: nowIso
              }
            ]
          };
        }
        return item;
      });

      return { ...prev, issues: updatedIssues };
    });
    showToast('Report separated into a standalone issue.');
  };

  const resolveFlag = (flagId: string, resolutionStatus: string) => {
    if (authUser) {
      runRemote(
        remoteStore.resolveFlag(flagId, resolutionStatus),
        resolutionStatus === 'dismissed' ? 'Flag dismissed.' : 'Flag marked as actioned.'
      );
      return;
    }
    setData((prev: any) => ({
      ...prev,
      flags: prev.flags.map((f: any) =>
        f.id === flagId ? { ...f, status: resolutionStatus, resolvedAt: new Date().toISOString() } : f
      )
    }));
    showToast(resolutionStatus === 'dismissed' ? 'Flag dismissed.' : 'Flag marked as actioned.');
  };

  const markNotificationRead = (notifId: string) => {
    if (authUser) {
      runRemote(remoteStore.markRead([notifId]));
      return;
    }
    setData((prev: any) => ({
      ...prev,
      notifications: prev.notifications.map((n: any) => (n.id === notifId ? { ...n, read: true } : n))
    }));
  };

  const markAllNotificationsRead = () => {
    if (authUser) {
      runRemote(remoteStore.markRead(data.notifications.filter((n: any) => !n.read).map((n: any) => n.id)));
      return;
    }
    setData((prev: any) => ({
      ...prev,
      notifications: prev.notifications.map((n: any) =>
        n.userId === currentUser.id ? { ...n, read: true } : n
      )
    }));
  };

  const resetDemoData = () => {
    const fresh = frictionService.resetState();
    setData(fresh);
    setSelectedIssueId(null);
    showToast('Demo dataset restored to initial campus state.', 'info');
  };

  const navigateToReportWithBuilding = (buildingId = '') => {
    if (currentUser.role !== 'student') {
      showToast('Administrators moderate reports and do not submit complaints.', 'error');
      return;
    }
    setReportPrefillBuilding(buildingId);
    setActiveTab('report');
  };

  const navigateToReportWithSpot = (spot: any) => {
    if (currentUser.role !== 'student') {
      showToast('Administrators moderate reports and do not submit complaints.', 'error');
      return;
    }
    setReportPrefillSpot(spot);
    setActiveTab('report');
  };

  const navigateToBuildingOnMap = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    setActiveTab('map');
  };

  return (
    <FrictionContext.Provider
      value={{
        data,
        currentUser,
        switchUser,
        enteredWorkspace,
        enterWorkspace,
        exitToLanding,
        activeTab,
        setActiveTab,
        selectedBuildingId,
        setSelectedBuildingId,
        reportPrefillBuilding,
        setReportPrefillBuilding,
        selectedIssueId,
        setSelectedIssueId,
        notificationsOpen,
        setNotificationsOpen,
        submitReport,
        confirmIssue,
        submitClarificationResponse,
        flagIssue,
        moderateIssue,
        unlinkIssue,
        resolveFlag,
        markNotificationRead,
        markAllNotificationsRead,
        resetDemoData,
        navigateToReportWithBuilding,
        navigateToBuildingOnMap,
        buildingCoords,
        pinBuilding,
        reportPrefillSpot,
        setReportPrefillSpot,
        navigateToReportWithSpot,
        dailyLimit,
        updateDailyLimit,
        recordAbuse,
        toast,
        showToast
      }}
    >
      {children}
    </FrictionContext.Provider>
  );
}

function useFriction() {
  return useContext(FrictionContext);
}

function CategoryLabel({ category }: { category: string }) {
  const meta = getCategoryMeta(category);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
      <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: meta.color }} />
      <span>{meta.label}</span>
    </span>
  );
}

// ============================================================================
// 2. STUDENT HOME DASHBOARD (4-ITEM LIMIT + VIEW ALL / SHOW MORE)
// ============================================================================

function StudentDashboard() {
  const {
    data,
    currentUser,
    setActiveTab,
    setSelectedIssueId,
    confirmIssue,
    navigateToReportWithBuilding,
    navigateToBuildingOnMap
  } = useFriction();

  const [showAllHotspots, setShowAllHotspots] = useState(false);
  const [showAllReports, setShowAllReports] = useState(false);

  const canonicalIssues = useMemo(
    () => data.issues.filter((i: any) => !i.parentCanonicalId),
    [data.issues]
  );

  const enrichedCanonical = useMemo(
    () =>
      canonicalIssues.map((issue: any) => ({
        ...issue,
        metrics: frictionService.computeIssueMetrics(issue, data.issues)
      })),
    [canonicalIssues, data.issues]
  );

  const stats = useMemo(() => {
    const total = data.issues.length;
    const active = canonicalIssues.filter((i: any) => ['Published', 'In Progress'].includes(i.status)).length;
    const resolved = canonicalIssues.filter((i: any) => i.status === 'Resolved').length;
    const awaitingReview = data.issues.filter((i: any) =>
      ['Pending Review', 'Needs Clarification', 'Flagged'].includes(i.status)
    ).length;
    const highPriority = enrichedCanonical.filter(
      (i: any) => i.status !== 'Rejected' && i.status !== 'Resolved' && i.metrics.isHighPriority
    ).length;

    return { total, active, resolved, awaitingReview, highPriority };
  }, [data.issues, canonicalIssues, enrichedCanonical]);

  const buildingHotspots = useMemo(() => {
    return CAMPUS_BUILDINGS.map((bld) => {
      const bldIssues = enrichedCanonical.filter(
        (i: any) => i.buildingId === bld.id && i.status !== 'Rejected' && i.status !== 'Resolved'
      );
      const totalScore = bldIssues.reduce((acc: number, item: any) => acc + item.metrics.priorityScore, 0);
      return {
        ...bld,
        activeCount: bldIssues.length,
        totalScore: Math.round(totalScore * 10) / 10,
        hotspotMeta: getBuildingHotspotMeta(totalScore, bldIssues.length)
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }, [enrichedCanonical]);

  const recentPublicIssues = useMemo(() => {
    return enrichedCanonical
      .filter((i: any) => i.status !== 'Rejected')
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [enrichedCanonical]);

  const visibleHotspots = showAllHotspots ? buildingHotspots : buildingHotspots.slice(0, 4);
  const visibleReports = showAllReports ? recentPublicIssues : recentPublicIssues.slice(0, 4);

  const quota = frictionService.getUserDailySubmissionStats(currentUser.id, data.issues);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-semibold text-brand-teal-dark">
              {currentUser.department}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-navy">
              Welcome back, {currentUser.name.split(' ')[0]}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Spot campus bottlenecks, confirm active issues reported by peers, and track repair progress from report to resolution.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigateToReportWithBuilding('')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-teal hover:bg-brand-teal-dark text-white font-semibold text-sm transition cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                Report an Issue
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-navy-soft hover:bg-slate-200 text-brand-navy border border-slate-200 font-semibold text-sm transition cursor-pointer whitespace-nowrap"
              >
                <MapIcon className="w-4 h-4 text-brand-teal" />
                Explore Campus Map
              </button>
            </div>
            <div className="text-xs text-slate-600 flex items-center gap-1.5 tabular-nums">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Daily allowance:{' '}
              <span className="font-semibold text-brand-navy">
                {quota.remaining} of {quota.maxPerDay} remaining
              </span>{' '}
              (rolling 24h)
            </div>
          </div>
        </div>
      </div>

      {/* Live KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Total Reports</span>
            <FileText className="w-4 h-4 text-brand-navy" />
          </div>
          <div className="text-2xl font-bold text-brand-navy tabular-nums">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across {CAMPUS_BUILDINGS.length} campus zones</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Active Issues</span>
            <AlertCircle className="w-4 h-4 text-brand-teal" />
          </div>
          <div className="text-2xl font-bold text-brand-teal-dark tabular-nums">{stats.active}</div>
          <div className="text-[11px] text-slate-500 mt-1">Published &amp; In Progress</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Urgent Priority</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 tabular-nums">{stats.highPriority}</div>
          <div className="text-[11px] text-slate-500 mt-1">Critical &amp; High priority</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Awaiting Review</span>
            <Clock className="w-4 h-4 text-brand-amber-dark" />
          </div>
          <div className="text-2xl font-bold text-brand-amber-dark tabular-nums">{stats.awaitingReview}</div>
          <div className="text-[11px] text-slate-500 mt-1">Pending admin verification</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 tabular-nums">{stats.resolved}</div>
          <div className="text-[11px] text-slate-500 mt-1">Fixed &amp; verified</div>
        </div>
      </div>

      {/* Resolution Progress Visual Bar */}
      <StudentResolutionSummaryBar stats={stats} />

      {/* Main Split: Campus Hotspots (Top 4 + Show More) & Recent Campus Reports (Top 4 + View All) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Campus Friction Hotspots */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-brand-navy flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-teal" />
                Campus Friction Hotspots
              </h2>
              <button
                onClick={() => setActiveTab('map')}
                className="text-xs text-brand-teal-dark hover:text-brand-navy font-semibold flex items-center gap-1 cursor-pointer"
              >
                Open Map <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Buildings ranked by live issue priority and student impact. Click any zone to inspect on the map.
            </p>

            <div className="space-y-2.5">
              {visibleHotspots.map((bld, idx) => {
                const maxScore = Math.max(...buildingHotspots.map((b) => b.totalScore), 1);
                const pct = Math.min(100, Math.round((bld.totalScore / maxScore) * 100));
                return (
                  <button
                    key={bld.id}
                    onClick={() => navigateToBuildingOnMap(bld.id)}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-brand-navy-soft/50 border border-slate-200 transition group cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono text-slate-500 tabular-nums w-5">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-sm font-semibold text-brand-navy group-hover:text-brand-teal-dark transition truncate">
                          {bld.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-600 tabular-nums">
                          {bld.activeCount} {bld.activeCount === 1 ? 'issue' : 'issues'}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap ${bld.hotspotMeta.badgeClass}`}
                        >
                          {bld.hotspotMeta.label}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${bld.hotspotMeta.barClass}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {buildingHotspots.length > 4 && (
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 tabular-nums">
                Showing {visibleHotspots.length} of {buildingHotspots.length} campus zones
              </span>
              <button
                onClick={() => setShowAllHotspots((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-navy hover:text-brand-teal-dark transition cursor-pointer"
              >
                {showAllHotspots ? 'Show top 4' : `View all ${buildingHotspots.length} zones`}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllHotspots ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Recent Campus Reports */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-brand-navy">Recent Campus Reports</h2>
              <button
                onClick={() => setActiveTab('map')}
                className="text-xs font-medium text-slate-600 hover:text-brand-navy transition cursor-pointer"
              >
                Filter all on map →
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Confirm issues you have also experienced to raise their priority for resolution.
            </p>

            <div className="space-y-3">
              {visibleReports.map((issue: any) => {
                const { metrics } = issue;
                const hasConfirmed = metrics.uniqueConfirmers.includes(currentUser.id);

                return (
                  <div
                    key={issue.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-brand-teal/40 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono text-brand-navy font-semibold">{issue.refId}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatRelativeTime(issue.createdAt)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={issue.status} />
                        <PriorityBadge priority={metrics.priority} />
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedIssueId(issue.id)}
                      className="text-left block w-full group cursor-pointer"
                    >
                      <h3 className="text-sm sm:text-base font-semibold text-brand-navy group-hover:text-brand-teal-dark transition mb-1">
                        {issue.title}
                      </h3>
                    </button>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 mb-3">
                      <span>{getBuildingName(issue.buildingId)}</span>
                      {issue.floorRoom && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{issue.floorRoom}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{issue.category}</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-200">
                      <div className="flex items-center gap-2 text-xs text-slate-600 tabular-nums">
                        <span>
                          <strong className="text-brand-navy">{metrics.R}</strong>{' '}
                          {metrics.R === 1 ? 'report' : 'reports'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          <strong className="text-brand-navy">{metrics.V}</strong>{' '}
                          {metrics.V === 1 ? 'confirmation' : 'confirmations'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => confirmIssue(issue.id)}
                          disabled={hasConfirmed || currentUser.role !== 'student'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            hasConfirmed
                              ? 'bg-brand-teal-soft text-brand-teal-dark border border-teal-200 cursor-default'
                              : 'bg-white hover:bg-brand-teal hover:text-white text-brand-navy border border-slate-200 cursor-pointer'
                          }`}
                        >
                          {hasConfirmed ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Confirmed ({metrics.V})
                            </>
                          ) : (
                            <>
                              <ThumbsUp className="w-3.5 h-3.5" />
                              I&apos;m experiencing this too
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setSelectedIssueId(issue.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
                        >
                          Details
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {recentPublicIssues.length > 4 && (
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 tabular-nums">
                Showing {visibleReports.length} of {recentPublicIssues.length} campus reports
              </span>
              <button
                onClick={() => setShowAllReports((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-navy hover:text-brand-teal-dark transition cursor-pointer"
              >
                {showAllReports ? 'Show fewer' : `View all ${recentPublicIssues.length} reports`}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllReports ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. REPORT AN ISSUE FLOW (NO SAMPLE IMAGES, AUTO-GROUPING AWARE)
// ============================================================================

function ReportIssueView() {
  const {
    data,
    currentUser,
    reportPrefillBuilding,
    setReportPrefillBuilding,
    submitReport,
    setActiveTab,
    setSelectedIssueId,
    navigateToBuildingOnMap,
    confirmIssue,
    reportPrefillSpot,
    setReportPrefillSpot
  } = useFriction();
  const [spot, setSpot] = useState<any>(null);
  const { authUser } = useAuth();
  const [similarIssues, setSimilarIssues] = useState<any[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [buildingId, setBuildingId] = useState(reportPrefillBuilding || CAMPUS_BUILDINGS[0].id);
  const [floorRoom, setFloorRoom] = useState('');
  const [severity, setSeverity] = useState(2);
  const [imageUrl, setImageUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedResult, setSubmittedResult] = useState<any>(null);

  useEffect(() => {
    if (reportPrefillBuilding) {
      setBuildingId(reportPrefillBuilding);
      setReportPrefillBuilding('');
    }
  }, [reportPrefillBuilding, setReportPrefillBuilding]);

  useEffect(() => {
    if (!reportPrefillSpot) return;
    setSpot(reportPrefillSpot);
    if (reportPrefillSpot.buildingId) setBuildingId(reportPrefillSpot.buildingId);
    setReportPrefillSpot(null);
  }, [reportPrefillSpot, setReportPrefillSpot]);

  const quota = frictionService.getUserDailySubmissionStats(currentUser.id, data.issues);

  // Live similarity hint (local or remote)
  useEffect(() => {
    const searchText = `${title} ${description}`.trim();
    if (searchText.length < 12) {
      setSimilarIssues([]);
      return;
    }
    const debounceTimer = setTimeout(async () => {
      if (authUser) {
        const { data: matches } = await remoteStore.findSimilar(buildingId, category, searchText);
        setSimilarIssues(matches || []);
      } else {
        const candidate = frictionService.findAutoGroupCandidate(
          { title, description, category, buildingId, floorRoom },
          data.issues
        );
        if (candidate) {
          const m = frictionService.computeIssueMetrics(candidate.canonical, data.issues);
          setSimilarIssues([
            {
              id: candidate.canonical.id,
              ref_number: candidate.canonical.refId.replace('FRC-2026-', ''),
              title: candidate.canonical.title,
              status: candidate.canonical.status,
              confirmations: m.V
            }
          ]);
        } else {
          setSimilarIssues([]);
        }
      }
    }, 350);
    return () => clearTimeout(debounceTimer);
  }, [authUser, buildingId, category, title, description, floorRoom, data.issues]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 8) {
      nextErrors.title = 'Please provide a clear issue title (at least 8 characters).';
    }
    if (!description.trim() || description.trim().length < 15) {
      nextErrors.description = 'Please describe the problem and its impact (at least 15 characters).';
    }
    if (!floorRoom.trim()) {
      nextErrors.floorRoom = 'Please enter the room number or floor (for example Lab 204, 2nd floor).';
    }
    if (!category) {
      nextErrors.category = 'Please select an issue category.';
    }
    if (!buildingId) {
      nextErrors.buildingId = 'Please select a campus building/location.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await submitReport({
      title,
      description,
      category,
      buildingId,
      floorRoom,
      severity,
      imageUrl,
      spot
    });

    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }

    setSubmittedResult(result);
    setTitle('');
    setDescription('');
    setFloorRoom('');
    setImageUrl('');
    setSpot(null);
    setErrors({});
  };

  if (submittedResult?.issue) {
    const submittedIssue = submittedResult.issue;
    return (
      <div className="max-w-2xl mx-auto bg-white border border-brand-teal/40 rounded-2xl p-6 sm:p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-brand-teal-soft border border-teal-200 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-brand-teal-dark" />
        </div>
        <div className="space-y-1.5">
          <div className="text-xs font-mono font-semibold text-brand-teal-dark">
            Reference ID: {submittedIssue.refId}
          </div>
          <h2 className="text-2xl font-bold text-brand-navy">Report Logged Successfully</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            {submittedResult.autoGroupedWith
              ? `Your report was automatically grouped with an active ${submittedResult.autoGroupedWith.refId} thread so student impact stays unified.`
              : submittedIssue.status === 'Published'
              ? 'Your report passed integrity checks and is live on the campus map for peer confirmation.'
              : `Your report is queued for administrator verification. ${submittedIssue.statusReason || ''}`}
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-slate-600">Title:</span>
            <span className="text-brand-navy font-medium text-right">{submittedIssue.title}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-600">Location:</span>
            <span className="text-slate-800">
              {getBuildingName(submittedIssue.buildingId)}
              {submittedIssue.floorRoom ? ` (${submittedIssue.floorRoom})` : ''}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-600">Severity:</span>
            <SeverityBadge severity={submittedIssue.severity} />
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-600">Status:</span>
            <StatusBadge status={submittedIssue.status} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              setSelectedIssueId(submittedIssue.id);
              setSubmittedResult(null);
            }}
            className="px-4 py-2.5 rounded-xl bg-brand-navy hover:bg-brand-navy-dark text-white font-semibold text-xs transition cursor-pointer"
          >
            Open Issue Details
          </button>
          <button
            onClick={() => {
              navigateToBuildingOnMap(submittedIssue.buildingId);
              setSubmittedResult(null);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-brand-navy border border-slate-200 font-medium text-xs transition cursor-pointer"
          >
            View on Campus Map
          </button>
          <button
            onClick={() => {
              setActiveTab('my-reports');
              setSubmittedResult(null);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-brand-navy border border-slate-200 font-medium text-xs transition cursor-pointer"
          >
            Go to My Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-navy flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-brand-teal" />
            Report a Campus Issue
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Provide clear location details so peers can confirm and facilities teams can act rapidly.
          </p>
        </div>

        <div
          className={`px-4 py-2.5 rounded-xl border text-xs shrink-0 tabular-nums ${
            quota.remaining > 0
              ? 'bg-brand-teal-soft border-teal-200 text-brand-teal-dark'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <div className="font-semibold">
            Daily Allowance: {quota.remaining} / {quota.maxPerDay} left
          </div>
          <div className="text-[11px] opacity-80">Rolling 24-hour anti-spam limit</div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5"
      >
        {errors.form && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        <div>
          <label htmlFor="report-title" className="block text-xs font-semibold text-brand-navy mb-1.5">
            Issue Title <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            id="report-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Projector flickering & no HDMI audio in Room 302"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-teal"
          />
          {errors.title && <p className="text-xs text-rose-600 mt-1">{errors.title}</p>}
        </div>

        {spot && (
          <div className="p-3.5 rounded-xl bg-brand-teal-soft border border-teal-200 flex items-start justify-between gap-3 text-xs">
            <div className="text-brand-navy">
              <div className="font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-teal-dark" />
                Pinned on map: {spot.placeName || 'Dropped pin'}
              </div>
              <div className="text-slate-600 mt-0.5 tabular-nums">
                {spot.latitude.toFixed(5)}, {spot.longitude.toFixed(5)}. Add the room number below.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSpot(null)}
              className="shrink-0 font-semibold text-brand-navy hover:underline cursor-pointer"
            >
              Remove pin
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="report-category" className="block text-xs font-semibold text-brand-navy mb-1.5">
              Category <span className="text-rose-600">*</span>
            </label>
            <select
              id="report-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-brand-teal"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.id}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-rose-600 mt-1">{errors.category}</p>}
          </div>

          <div>
            <label htmlFor="report-building" className="block text-xs font-semibold text-brand-navy mb-1.5">
              Campus Building / Location <span className="text-rose-600">*</span>
            </label>
            <select
              id="report-building"
              value={buildingId}
              onChange={(e) => setBuildingId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-brand-teal"
            >
              {CAMPUS_BUILDINGS.map((bld) => (
                <option key={bld.id} value={bld.id}>
                  {bld.name} ({bld.zone})
                </option>
              ))}
            </select>
            {errors.buildingId && <p className="text-xs text-rose-600 mt-1">{errors.buildingId}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="report-room" className="block text-xs font-semibold text-brand-navy mb-1.5">
            Room number / Floor <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            id="report-room"
            value={floorRoom}
            onChange={(e) => setFloorRoom(e.target.value)}
            placeholder="e.g., 2nd Floor, Lab 204 or Near North Water Fountain"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-teal"
          />
          {errors.floorRoom && <p className="text-xs text-rose-600 mt-1">{errors.floorRoom}</p>}
        </div>

        <div>
          <label htmlFor="report-description" className="block text-xs font-semibold text-brand-navy mb-1.5">
            Detailed Description <span className="text-rose-600">*</span>
          </label>
          <textarea
            rows={4}
            id="report-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what is broken, when it occurs, and how it impacts students..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-teal"
          />
          {errors.description && <p className="text-xs text-rose-600 mt-1">{errors.description}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-navy mb-2">
            Impact Severity <span className="text-rose-600">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SEVERITY_LEVELS.map((lvl) => {
              const selected = Number(severity) === lvl.value;
              return (
                <button
                  type="button"
                  key={lvl.value}
                  onClick={() => setSeverity(lvl.value)}
                  className={`text-left p-3.5 rounded-xl border transition cursor-pointer ${
                    selected
                      ? 'bg-brand-teal-soft border-brand-teal text-brand-navy'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{lvl.label}</span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selected ? 'border-brand-teal bg-brand-teal' : 'border-slate-300'
                      }`}
                    >
                      {selected && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{lvl.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Real Photo Upload Only (No Sample Images) */}
        <div>
          <label className="block text-xs font-semibold text-brand-navy mb-1.5">
            Attach Photo Evidence <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-brand-navy cursor-pointer transition">
              <Camera className="w-4 h-4 text-brand-teal" />
              <span>Upload Image File</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="text-xs text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                Remove Photo
              </button>
            )}
          </div>

          {imageUrl && (
            <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 max-w-md">
              <img
                src={imageUrl}
                alt="Attached evidence preview"
                referrerPolicy="no-referrer"
                className="w-full h-40 object-cover"
              />
            </div>
          )}
        </div>

        {similarIssues.length > 0 && (
          <div
            className="p-4 rounded-xl bg-brand-navy-soft border border-blue-200 space-y-3"
            role="region"
            aria-label="Possible existing issues"
          >
            <div className="text-xs font-semibold text-brand-navy">
              Similar active {similarIssues.length === 1 ? 'issue' : 'issues'} already open at this location
            </div>
            {similarIssues.map((match) => (
              <div
                key={match.id}
                className="p-3 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="text-xs">
                  <div className="font-semibold text-brand-navy">{match.title}</div>
                  <div className="text-slate-600 mt-0.5">
                    FRC-{match.ref_number} · {match.status} · {match.confirmations}{' '}
                    {Number(match.confirmations) === 1 ? 'student has' : 'students have'} confirmed this
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => confirmIssue(match.id)}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-semibold cursor-pointer"
                >
                  I&apos;m experiencing this too
                </button>
              </div>
            ))}
            <p className="text-[11px] text-slate-600">
              If you still submit, our backend grouping engine will automatically associate related reports.
            </p>
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-600">
            Submitting as <strong className="text-brand-navy">{currentUser.name}</strong>
          </span>
          <button
            type="submit"
            disabled={quota.remaining <= 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-navy hover:bg-brand-navy-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Submit Issue Report
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// 4. MY REPORTS VIEW
// ============================================================================

function MyReportsView() {
  const {
    data,
    currentUser,
    setSelectedIssueId,
    submitClarificationResponse,
    navigateToReportWithBuilding
  } = useFriction();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [clarifyDrafts, setClarifyDrafts] = useState<Record<string, string>>({});

  const myReports = useMemo(() => {
    return data.issues
      .filter((i: any) => i.reporterId === currentUser.id)
      .map((issue: any) => ({
        ...issue,
        metrics: frictionService.computeIssueMetrics(issue, data.issues)
      }))
      .filter((issue: any) => {
        if (statusFilter !== 'ALL' && issue.status !== statusFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            issue.title.toLowerCase().includes(q) ||
            issue.refId.toLowerCase().includes(q) ||
            getBuildingName(issue.buildingId).toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data.issues, currentUser.id, statusFilter, search]);

  const statuses = [
    'ALL',
    'Pending Review',
    'Published',
    'In Progress',
    'Resolved',
    'Needs Clarification',
    'Rejected'
  ];

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-navy">My Submitted Reports</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Track moderation reviews, admin notes, and resolution status for reports filed by {currentUser.name}.
          </p>
        </div>

        <button
          onClick={() => navigateToReportWithBuilding('')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-teal hover:bg-brand-teal-dark text-white font-semibold text-xs transition self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          New Report
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-brand-navy text-white font-semibold'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Reports' : st}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your reports..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-teal"
          />
        </div>
      </div>

      {myReports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-800">No reports match your current filter</p>
          <p className="text-xs text-slate-600 mt-1">
            Try clearing the status filter or submit a new campus issue report.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {myReports.map((issue: any) => {
            const { metrics } = issue;
            const statusInfo = STATUS_META[issue.status];
            return (
              <div
                key={issue.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono text-brand-navy font-semibold">{issue.refId}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatRelativeTime(issue.createdAt)}</span>
                    {issue.parentCanonicalId && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-brand-teal-dark font-medium">
                          Auto-grouped with {metrics.canonicalIssue.refId}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={issue.status} />
                    <PriorityBadge priority={metrics.priority} />
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => setSelectedIssueId(issue.id)}
                    className="text-left text-base font-semibold text-brand-navy hover:text-brand-teal-dark transition cursor-pointer"
                  >
                    {issue.title}
                  </button>
                  <p className="text-xs text-slate-600 mt-1">
                    {getBuildingName(issue.buildingId)}
                    {issue.floorRoom ? ` · ${issue.floorRoom}` : ''} · {issue.category}
                  </p>
                </div>

                {statusInfo && (
                  <div className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-700">Status Note:</span> {statusInfo.description}
                    {issue.statusReason ? ` ${issue.statusReason}.` : ''}
                  </div>
                )}

                {issue.adminNotes.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <div className="font-semibold text-amber-800 mb-0.5">
                      Latest Note from {issue.adminNotes[issue.adminNotes.length - 1].author}:
                    </div>
                    <p>{issue.adminNotes[issue.adminNotes.length - 1].text}</p>
                  </div>
                )}

                {issue.status === 'Needs Clarification' && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-orange-300 space-y-2">
                    <div className="text-xs font-semibold text-orange-800">
                      Action Required: Provide requested details to resume verification
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={clarifyDrafts[issue.id] || ''}
                        onChange={(e) =>
                          setClarifyDrafts((prev) => ({ ...prev, [issue.id]: e.target.value }))
                        }
                        placeholder="Enter exact room number, timing, or clarification..."
                        className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-teal"
                      />
                      <button
                        onClick={() => {
                          submitClarificationResponse(issue.id, clarifyDrafts[issue.id] || '');
                          setClarifyDrafts((prev) => ({ ...prev, [issue.id]: '' }));
                        }}
                        className="px-4 py-2 rounded-lg bg-brand-teal hover:bg-brand-teal-dark text-white font-semibold text-xs transition cursor-pointer"
                      >
                        Send Clarification
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 tabular-nums">
                    {metrics.V} student confirmations · {metrics.R} {metrics.R === 1 ? 'report' : 'reports'}
                  </span>
                  <button
                    onClick={() => setSelectedIssueId(issue.id)}
                    className="text-brand-teal-dark hover:text-brand-navy font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    Full Timeline &amp; Details <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 5. ISSUE DETAILS MODAL (PRIORITY BREAKDOWN, NO AFS FORMULA)
// ============================================================================

function IssueDetailsModal() {
  const {
    data,
    currentUser,
    selectedIssueId,
    setSelectedIssueId,
    confirmIssue,
    flagIssue,
    moderateIssue,
    unlinkIssue
  } = useFriction();

  const [flagOpen, setFlagOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('Duplicate of an existing issue');
  const [flagDetails, setFlagDetails] = useState('');
  const [adminQuickNote, setAdminQuickNote] = useState('');

  if (!selectedIssueId) return null;

  const issue = data.issues.find((i: any) => i.id === selectedIssueId);
  if (!issue) return null;

  const metrics = frictionService.computeIssueMetrics(issue, data.issues);
  const canonical = metrics.canonicalIssue;
  const hasConfirmed = metrics.uniqueConfirmers.includes(currentUser.id);
  const issueFlags = data.flags.filter((f: any) => f.issueId === issue.id);
  const severityLabel = SEVERITY_LEVELS.find((s) => s.value === metrics.S)?.short || 'Moderate';

  const handleFlagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    flagIssue(issue.id, flagReason, flagDetails);
    setFlagOpen(false);
    setFlagDetails('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 text-brand-navy font-semibold border border-slate-200">
              {issue.refId}
            </span>
            <StatusBadge status={issue.status} />
            <SeverityBadge severity={issue.severity} />
          </div>
          <button
            onClick={() => {
              setSelectedIssueId(null);
              setFlagOpen(false);
            }}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-brand-navy transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {issue.parentCanonicalId && (
            <div className="p-3.5 rounded-xl bg-brand-navy-soft border border-blue-200 text-xs text-brand-navy flex flex-wrap items-center justify-between gap-2">
              <div>
                Automatically grouped as a{' '}
                <strong>
                  {issue.linkType === 'true_duplicate' ? 'duplicate observation' : 'related report'}
                </strong>{' '}
                under <strong>{canonical.refId}</strong> ({canonical.title}).
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedIssueId(canonical.id)}
                  className="shrink-0 px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 text-brand-navy font-semibold cursor-pointer"
                >
                  View Main Issue
                </button>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => unlinkIssue(issue.id)}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-medium cursor-pointer"
                  >
                    <Unlink className="w-3 h-3" />
                    Separate
                  </button>
                )}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-brand-navy leading-snug">{issue.title}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-slate-600">
              <CategoryLabel category={issue.category} />
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-brand-teal" />
                {getBuildingName(issue.buildingId)}
                {issue.floorRoom ? ` · ${issue.floorRoom}` : ''}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Reported by <strong className="text-brand-navy">{issue.reporterName}</strong> (
                {formatRelativeTime(issue.createdAt)})
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-slate-500 mb-1.5">
              Problem Description
            </div>
            <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
              {issue.description}
            </p>
            {issue.imageUrl && (
              <div className="mt-4 rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={issue.imageUrl}
                  alt="Submitted evidence"
                  referrerPolicy="no-referrer"
                  className="w-full max-h-60 object-cover"
                />
              </div>
            )}
          </div>

          {/* Priority & Impact Card (No AFS formula) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <div className="text-xs font-bold text-brand-navy">
                  Issue Priority &amp; Community Impact
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{metrics.priority.reason}</p>
              </div>
              <PriorityBadge priority={metrics.priority} />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3.5">
              <div className="bg-white rounded-xl p-3 border border-slate-200">
                <div className="text-[11px] text-slate-500">Independent Reports</div>
                <div className="text-xl font-bold text-brand-navy tabular-nums mt-0.5">{metrics.R}</div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-slate-200">
                <div className="text-[11px] text-slate-500">Peer Confirmations</div>
                <div className="text-xl font-bold text-brand-teal-dark tabular-nums mt-0.5">{metrics.V}</div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-slate-200">
                <div className="text-[11px] text-slate-500">Impact Level</div>
                <div className="text-base font-bold text-brand-navy mt-1">{severityLabel}</div>
              </div>
            </div>
          </div>

          {currentUser.role === 'student' && issue.status !== 'Rejected' && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <button
                onClick={() => confirmIssue(issue.id)}
                disabled={hasConfirmed}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                  hasConfirmed
                    ? 'bg-brand-teal-soft text-brand-teal-dark border border-teal-200 cursor-default'
                    : 'bg-brand-teal hover:bg-brand-teal-dark text-white cursor-pointer'
                }`}
              >
                {hasConfirmed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmed by you ({metrics.V} total)
                  </>
                ) : (
                  <>
                    <ThumbsUp className="w-4 h-4" />
                    I&apos;m experiencing this too
                  </>
                )}
              </button>

              <button
                onClick={() => setFlagOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 text-xs font-medium transition cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                Flag Issue
              </button>
            </div>
          )}

          {flagOpen && (
            <form
              onSubmit={handleFlagSubmit}
              className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3"
            >
              <div className="text-xs font-semibold text-rose-800">
                Flag this report for Administrator review
              </div>
              <select
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900"
              >
                <option value="Duplicate of an existing issue">Duplicate of an existing issue</option>
                <option value="Incorrect building or room location">Incorrect building or room location</option>
                <option value="Spam, fake, or non-campus issue">Spam, fake, or non-campus issue</option>
                <option value="Inappropriate or offensive language">Inappropriate or offensive language</option>
              </select>
              <input
                type="text"
                value={flagDetails}
                onChange={(e) => setFlagDetails(e.target.value)}
                placeholder="Optional context for the moderator..."
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFlagOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs cursor-pointer"
                >
                  Submit Flag
                </button>
              </div>
            </form>
          )}

          {currentUser.role === 'admin' && (
            <div className="p-4 rounded-xl bg-brand-navy-soft border border-blue-200 space-y-3">
              <div className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-teal" />
                Administrator Quick Actions
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Update Status</label>
                  <select
                    value={issue.status}
                    onChange={(e) =>
                      moderateIssue(issue.id, {
                        status: e.target.value,
                        notifyType: e.target.value === 'Resolved' ? 'resolved' : 'progress',
                        notifyTitle: `Status Updated: ${e.target.value}`,
                        notifyMessage: `Your report ${issue.refId} (${issue.title}) is now marked as ${e.target.value}.`
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900"
                  >
                    {Object.keys(STATUS_META).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Reviewed Impact Level</label>
                  <select
                    value={issue.severity}
                    onChange={(e) =>
                      moderateIssue(issue.id, {
                        severity: Number(e.target.value),
                        notifyType: 'update',
                        notifyTitle: 'Issue Priority Updated',
                        notifyMessage: `Impact severity for ${issue.refId} was updated by Campus Admin.`
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900"
                  >
                    <option value={1}>Minor Inconvenience</option>
                    <option value={2}>Disruptive Issue</option>
                    <option value={3}>Critical Issue</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={adminQuickNote}
                  onChange={(e) => setAdminQuickNote(e.target.value)}
                  placeholder="Append official administrative note..."
                  className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900"
                />
                <button
                  onClick={() => {
                    if (!adminQuickNote.trim()) return;
                    moderateIssue(issue.id, {
                      adminNote: adminQuickNote,
                      notifyType: 'update',
                      notifyTitle: 'New Admin Note on Your Report',
                      notifyMessage: `Admin note added to ${issue.refId}: "${adminQuickNote.trim()}"`
                    });
                    setAdminQuickNote('');
                  }}
                  className="px-3.5 py-2 rounded-lg bg-brand-navy hover:bg-brand-navy-dark text-white font-semibold text-xs cursor-pointer"
                >
                  Post Note
                </button>
              </div>
            </div>
          )}

          {metrics.linkedChildren.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
                <GitMerge className="w-3.5 h-3.5 text-brand-teal" />
                Auto-Grouped Reports ({metrics.linkedChildren.length})
              </h3>
              <div className="space-y-2">
                {metrics.linkedChildren.map((child: any) => (
                  <div
                    key={child.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-slate-500 mr-2">{child.refId}</span>
                      <span className="text-brand-navy font-medium">{child.title}</span>
                      <span className="text-slate-500 ml-2">by {child.reporterName}</span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-600 shrink-0">
                      {child.linkType === 'true_duplicate' ? 'Duplicate' : 'Related report'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-brand-teal" />
              Moderation &amp; Status History
            </h3>

            {issue.adminNotes.length > 0 && (
              <div className="space-y-2">
                {issue.adminNotes.map((note: any) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span className="font-semibold text-brand-navy">{note.author}</span>
                      <span>{formatRelativeTime(note.createdAt)}</span>
                    </div>
                    <p className="text-slate-800">{note.text}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="border-l border-slate-200 ml-2 pl-4 space-y-2.5">
              {issue.history.map((entry: any, idx: number) => (
                <div key={idx} className="text-xs">
                  <div className="text-slate-800 font-medium">{entry.action}</div>
                  <div className="text-[11px] text-slate-500">
                    {entry.actor} · {formatRelativeTime(entry.at)}
                  </div>
                </div>
              ))}
            </div>

            {issueFlags.length > 0 && (
              <div className="pt-2 text-xs text-rose-700">
                {issueFlags.length} community flag(s) recorded on this report.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. NOTIFICATIONS DRAWER
// ============================================================================

function NotificationsDrawer() {
  const {
    data,
    currentUser,
    notificationsOpen,
    setNotificationsOpen,
    markNotificationRead,
    markAllNotificationsRead,
    setSelectedIssueId
  } = useFriction();

  if (!notificationsOpen) return null;

  const userNotifs = data.notifications.filter((n: any) => n.userId === currentUser.id);
  const unreadCount = userNotifs.filter((n: any) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-brand-navy flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-teal" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-brand-navy text-white text-xs font-bold tabular-nums">
                  {unreadCount}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-600">Updates for {currentUser.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-xs text-brand-teal-dark hover:text-brand-navy font-semibold cursor-pointer"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setNotificationsOpen(false)}
              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-brand-navy cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {userNotifs.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              No notifications yet for {currentUser.name}.
            </div>
          ) : (
            userNotifs.map((n: any) => (
              <div
                key={n.id}
                onClick={() => {
                  markNotificationRead(n.id);
                  if (n.issueId) {
                    setSelectedIssueId(n.issueId);
                    setNotificationsOpen(false);
                  }
                }}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  n.read
                    ? 'bg-slate-50 border-slate-200 opacity-75'
                    : 'bg-brand-teal-soft border-brand-teal/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-brand-navy flex items-center gap-1.5">
                    {!n.read && <span className="w-2 h-2 rounded-full bg-brand-teal" />}
                    {n.title}
                  </span>
                  <span className="text-[11px] text-slate-500">{formatRelativeTime(n.createdAt)}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. ADMINISTRATOR OVERVIEW (CHARTS + EMBEDDED CAMPUS MAP, NO AFS, NO DUPLICATES TAB)
// ============================================================================

function AdminDashboard({ section }: { section: string }) {
  if (section === 'admin-moderation') return <AdminModerationView />;
  if (section === 'admin-flags') return <AdminFlagsView />;
  if (section === 'admin-settings') return <AdminSettingsView />;
  return <AdminOverviewView />;
}

function AdminOverviewView() {
  const {
    data,
    setActiveTab,
    setSelectedIssueId,
    navigateToBuildingOnMap
  } = useFriction();

  const canonicalIssues = useMemo(
    () =>
      data.issues
        .filter((i: any) => !i.parentCanonicalId)
        .map((i: any) => ({ ...i, metrics: frictionService.computeIssueMetrics(i, data.issues) })),
    [data.issues]
  );

  const metrics = useMemo(() => {
    const total = data.issues.length;
    const pending = data.issues.filter((i: any) => i.status === 'Pending Review').length;
    const published = canonicalIssues.filter((i: any) => i.status === 'Published').length;
    const inProgress = canonicalIssues.filter((i: any) => i.status === 'In Progress').length;
    const resolved = canonicalIssues.filter((i: any) => i.status === 'Resolved').length;
    const openFlags = data.flags.filter((f: any) => f.status === 'open').length;
    const highPriority = canonicalIssues.filter(
      (i: any) => !['Rejected', 'Resolved'].includes(i.status) && i.metrics.isHighPriority
    ).length;

    return { total, pending, published, inProgress, resolved, openFlags, highPriority };
  }, [data.issues, data.flags, canonicalIssues]);

  const categoryStats = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const count = data.issues.filter((i: any) => i.category === cat.id && i.status !== 'Rejected').length;
      return { ...cat, count };
    }).sort((a, b) => b.count - a.count);
  }, [data.issues]);

  const locationStats = useMemo(() => {
    return CAMPUS_BUILDINGS.map((bld) => {
      const bldIssues = canonicalIssues.filter((i: any) => i.buildingId === bld.id && i.status !== 'Rejected');
      const totalScore = bldIssues.reduce((sum: number, i: any) => sum + i.metrics.priorityScore, 0);
      return { ...bld, count: bldIssues.length, totalScore: Math.round(totalScore * 10) / 10 };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }, [canonicalIssues]);

  const topPriorityIssues = useMemo(() => {
    return canonicalIssues
      .filter((i: any) => !['Rejected', 'Resolved'].includes(i.status))
      .sort((a: any, b: any) => b.metrics.priorityScore - a.metrics.priorityScore)
      .slice(0, 6);
  }, [canonicalIssues]);

  const recentActivity = useMemo(() => {
    const entries: any[] = [];
    data.issues.forEach((iss: any) => {
      iss.history.forEach((h: any) => {
        entries.push({ ...h, refId: iss.refId, issueId: iss.id });
      });
    });
    return entries
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 6);
  }, [data.issues]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-brand-teal-dark mb-1">
            Campus Facilities Command Center
          </div>
          <h1 className="text-2xl font-bold text-brand-navy">Administrator Operations Overview</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time triage charts, spatial campus map telemetry, and priority-ranked issue queues.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setActiveTab('admin-moderation')}
            className="px-4 py-2.5 rounded-xl bg-brand-navy hover:bg-brand-navy-dark text-white font-semibold text-xs transition cursor-pointer whitespace-nowrap"
          >
            Review Pending ({metrics.pending})
          </button>
          <button
            onClick={() => setActiveTab('admin-flags')}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-brand-navy border border-slate-200 font-semibold text-xs transition cursor-pointer whitespace-nowrap"
          >
            Open Flags ({metrics.openFlags})
          </button>
        </div>
      </div>

      {/* 7 Live Admin KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total Reports', value: metrics.total, accent: 'text-brand-navy' },
          { label: 'Pending Review', value: metrics.pending, accent: 'text-brand-amber-dark' },
          { label: 'Published', value: metrics.published, accent: 'text-sky-700' },
          { label: 'In Progress', value: metrics.inProgress, accent: 'text-brand-navy' },
          { label: 'Resolved', value: metrics.resolved, accent: 'text-emerald-700' },
          { label: 'Open Flags', value: metrics.openFlags, accent: 'text-rose-700' },
          { label: 'Urgent Priority', value: metrics.highPriority, accent: 'text-brand-teal-dark' }
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-slate-200 rounded-xl p-3.5">
            <div className="text-[11px] text-slate-500">{kpi.label}</div>
            <div className={`text-2xl font-bold tabular-nums mt-1 ${kpi.accent}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Stats Expressed as Charts (Replacing Table) */}
      <PriorityQueueChart
        issues={topPriorityIssues}
        onSelectIssue={setSelectedIssueId}
        onManageAll={() => setActiveTab('admin-moderation')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <CategoryDonutChart categoryStats={categoryStats} />
        <BuildingPressureChart
          locationStats={locationStats}
          onSelectBuilding={(id) => navigateToBuildingOnMap(id)}
        />
        <div className="md:col-span-2 xl:col-span-1 min-w-0">
          <StatusAndSeverityChart issues={data.issues} />
        </div>
      </div>

      {/* Recent Audit Activity */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-brand-navy mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-brand-teal" />
          Recent Campus Audit Activity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {recentActivity.map((act, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIssueId(act.issueId)}
              className="text-left p-3 rounded-xl bg-slate-50 hover:bg-brand-navy-soft/40 border border-slate-200 text-xs transition cursor-pointer"
            >
              <span className="font-mono font-semibold text-brand-teal-dark mr-1.5">{act.refId}</span>
              <span className="text-slate-800">{act.action}</span>
              <span className="text-slate-500 ml-1.5">· {formatRelativeTime(act.at)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 8. ADMIN MODERATION QUEUE
// ============================================================================

function AdminModerationView() {
  const { data, moderateIssue, setSelectedIssueId, recordAbuse } = useFriction();
  const [filter, setFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [actionModal, setActionModal] = useState<any>(null);
  const [inputText, setInputText] = useState('');

  const filteredIssues = useMemo(() => {
    return data.issues
      .map((i: any) => ({ ...i, metrics: frictionService.computeIssueMetrics(i, data.issues) }))
      .filter((i: any) => {
        if (filter === 'PENDING' && !['Pending Review', 'Needs Clarification', 'Flagged'].includes(i.status)) {
          return false;
        }
        if (filter !== 'ALL' && filter !== 'PENDING' && i.status !== filter) {
          return false;
        }
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            i.title.toLowerCase().includes(q) ||
            i.refId.toLowerCase().includes(q) ||
            i.reporterName.toLowerCase().includes(q) ||
            getBuildingName(i.buildingId).toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a: any, b: any) => b.metrics.priorityScore - a.metrics.priorityScore);
  }, [data.issues, filter, search]);

  const executeModalAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    const { issue, mode } = actionModal;
    if (!inputText.trim()) return;

    if (mode === 'reject') {
      moderateIssue(issue.id, {
        status: 'Rejected',
        adminNote: `Rejected: ${inputText.trim()}`,
        notifyType: 'rejected',
        notifyTitle: 'Report Rejected by Moderation',
        notifyMessage: `Your report ${issue.refId} (${issue.title}) was rejected: ${inputText.trim()}`
      });
    } else if (mode === 'clarify') {
      moderateIssue(issue.id, {
        status: 'Needs Clarification',
        adminNote: `Clarification Requested: ${inputText.trim()}`,
        notifyType: 'clarification',
        notifyTitle: 'Clarification Requested on Your Report',
        notifyMessage: `Admin requested details on ${issue.refId}: "${inputText.trim()}"`
      });
    } else if (mode === 'abuse') {
      recordAbuse(issue.reporterId, inputText.trim());
    } else if (mode === 'note') {
      moderateIssue(issue.id, {
        adminNote: inputText.trim(),
        notifyType: 'update',
        notifyTitle: 'Official Note Added to Your Report',
        notifyMessage: `Admin note on ${issue.refId}: "${inputText.trim()}"`
      });
    }

    setActionModal(null);
    setInputText('');
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-navy">Report Moderation &amp; Triage Queue</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Verify pending submissions, calibrate impact severity, update resolution status, and notify students.
          </p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by ID, student, title..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-teal"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[
          { id: 'PENDING', label: 'Needs Triage (Pending / Clarification)' },
          { id: 'ALL', label: 'All Reports' },
          { id: 'Published', label: 'Published' },
          { id: 'In Progress', label: 'In Progress' },
          { id: 'Resolved', label: 'Resolved' },
          { id: 'Rejected', label: 'Rejected' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filter === tab.id
                ? 'bg-brand-navy text-white font-semibold'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3.5">
        {filteredIssues.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-600">
            No reports match this moderation queue filter.
          </div>
        ) : (
          filteredIssues.map((issue: any) => {
            const { metrics } = issue;
            return (
              <div
                key={issue.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-brand-navy">{issue.refId}</span>
                      <StatusBadge status={issue.status} />
                      <SeverityBadge severity={issue.severity} />
                      <PriorityBadge priority={metrics.priority} />
                    </div>
                    <button
                      onClick={() => setSelectedIssueId(issue.id)}
                      className="text-left text-base font-bold text-brand-navy hover:text-brand-teal-dark transition cursor-pointer"
                    >
                      {issue.title}
                    </button>
                    <p className="text-xs text-slate-600">
                      {getBuildingName(issue.buildingId)}
                      {issue.floorRoom ? ` · ${issue.floorRoom}` : ''} · {issue.category} · Submitted by{' '}
                      <strong className="text-brand-navy">{issue.reporterName}</strong> (
                      {formatRelativeTime(issue.createdAt)})
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Impact Severity"
                      value={issue.severity}
                      onChange={(e) =>
                        moderateIssue(issue.id, {
                          severity: Number(e.target.value),
                          notifyType: 'update',
                          notifyTitle: 'Issue Priority Updated',
                          notifyMessage: `Severity for ${issue.refId} was updated by Campus Admin.`
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800"
                    >
                      <option value={1}>Minor Impact</option>
                      <option value={2}>Disruptive</option>
                      <option value={3}>Critical</option>
                    </select>

                    <select
                      aria-label="Issue Status"
                      value={issue.status}
                      onChange={(e) =>
                        moderateIssue(issue.id, {
                          status: e.target.value,
                          notifyType: e.target.value === 'Resolved' ? 'resolved' : 'progress',
                          notifyTitle: `Issue Status: ${e.target.value}`,
                          notifyMessage: `Your report ${issue.refId} (${issue.title}) was updated to ${e.target.value}.`
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800"
                    >
                      {Object.keys(STATUS_META).map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {issue.statusReason && issue.status === 'Pending Review' && (
                  <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2">
                    {issue.statusReason}
                  </p>
                )}

                <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                  {issue.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="text-xs text-slate-600 tabular-nums">
                    {metrics.R} {metrics.R === 1 ? 'report' : 'reports'} · {metrics.V} peer confirmations
                    {issue.parentCanonicalId ? ' · Auto-grouped' : ''}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {issue.status !== 'Published' && issue.status !== 'In Progress' && issue.status !== 'Resolved' && (
                      <button
                        onClick={() =>
                          moderateIssue(issue.id, {
                            status: 'Published',
                            notifyType: 'approved',
                            notifyTitle: 'Report Approved & Published',
                            notifyMessage: `Your report ${issue.refId} (${issue.title}) has been verified and published to the campus map.`
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-teal hover:bg-brand-teal-dark text-white font-semibold text-xs transition cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve &amp; Publish
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setActionModal({ issue, mode: 'clarify' });
                        setInputText('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-medium transition cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Request Clarification
                    </button>

                    <button
                      onClick={() => {
                        setActionModal({ issue, mode: 'note' });
                        setInputText('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-brand-navy border border-slate-200 text-xs font-medium transition cursor-pointer"
                    >
                      Add Note
                    </button>

                    <button
                      onClick={() => {
                        setActionModal({ issue, mode: 'abuse' });
                        setInputText('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium transition cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Confirm abuse
                    </button>

                    {issue.status !== 'Rejected' && (
                      <button
                        onClick={() => {
                          setActionModal({ issue, mode: 'reject' });
                          setInputText('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {actionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <form
            onSubmit={executeModalAction}
            className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-brand-navy">
              {actionModal.mode === 'abuse'
                ? `Confirm misuse by ${actionModal.issue.reporterName}`
                : actionModal.mode === 'reject'
                ? `Reject Report ${actionModal.issue.refId}`
                : actionModal.mode === 'clarify'
                ? `Request Clarification (${actionModal.issue.refId})`
                : `Add Official Admin Note (${actionModal.issue.refId})`}
            </h3>
            <p className="text-xs text-slate-600">
              {actionModal.mode === 'abuse'
                ? 'Records a strike on the reporter: 1st is a warning, 2nd restricts new reports for 24 hours, 3rd for 7 days. Use only for confirmed misuse.'
                : actionModal.mode === 'reject'
                ? 'Provide a clear reason for declining this submission. The student will be notified.'
                : actionModal.mode === 'clarify'
                ? 'Specify what missing location, timing, or diagnostic details the student should provide.'
                : 'This note will be logged on the public issue audit timeline.'}
            </p>
            <textarea
              rows={3}
              required
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter message..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-brand-teal"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-brand-navy hover:bg-brand-navy-dark text-white font-semibold text-xs cursor-pointer"
              >
                Confirm &amp; Notify
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 9. ADMIN SETTINGS & FLAGS
// ============================================================================

function AdminSettingsView() {
  const { authUser } = useAuth();
  const { dailyLimit, updateDailyLimit, showToast } = useFriction();
  const [limitInput, setLimitInput] = useState(String(dailyLimit));
  const [restrictedUsers, setRestrictedUsers] = useState<any[]>([]);

  const loadRestrictedUsers = async () => setRestrictedUsers(await remoteStore.listFlaggedUsers());
  const [rules, setRules] = useState({ autoPublish: true, blockedWords: '', flagThreshold: 3 });

  useEffect(() => {
    if (authUser) remoteStore.getModerationSettings().then(setRules);
  }, [authUser?.id]);

  const isThresholdValid =
    Number.isInteger(rules.flagThreshold) && rules.flagThreshold >= 1 && rules.flagThreshold <= 20;

  const saveRules = async () => {
    const { error } = await remoteStore.saveModerationSettings(rules);
    if (error) showToast(remoteStore.friendlyError(error), 'error');
    else showToast('Moderation rules saved.');
  };

  useEffect(() => setLimitInput(String(dailyLimit)), [dailyLimit]);
  useEffect(() => {
    if (authUser) loadRestrictedUsers();
  }, [authUser?.id]);

  const limitValue = Number(limitInput);
  const isLimitValid = Number.isInteger(limitValue) && limitValue >= 1 && limitValue <= 20;

  const liftRestriction = async (userId: string) => {
    const { error } = await remoteStore.liftRestriction(userId);
    if (error) return showToast(remoteStore.friendlyError(error), 'error');
    showToast('Restriction lifted.');
    loadRestrictedUsers();
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h1 className="text-xl font-bold text-brand-navy flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-brand-teal" />
          Anti-spam Settings &amp; Account Restrictions
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Configure reporting limits and automated backend moderation checks. Duplicate and related report grouping runs automatically on submission.
        </p>
      </div>

      {!authUser ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900">
          Database settings require a signed-in administrator account. In demo mode, automatic backend similarity grouping and the 3-reports/24h quota remain active.
        </div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-brand-navy mb-3">New reports per student</h2>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="daily-limit" className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Maximum per rolling 24 hours (1 to 20)
                </label>
                <input
                  id="daily-limit"
                  type="number"
                  min={1}
                  max={20}
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  className="w-32 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-brand-teal"
                />
              </div>
              <button
                onClick={() => updateDailyLimit(limitValue)}
                disabled={!isLimitValid || limitValue === dailyLimit}
                className="px-5 py-2.5 rounded-xl bg-brand-navy hover:bg-brand-navy-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm cursor-pointer"
              >
                Save limit
              </button>
            </div>
            {!isLimitValid && <p className="text-xs text-rose-600 mt-2">Enter a whole number from 1 to 20.</p>}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-brand-navy">Automatic publishing &amp; content checks</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Reports that pass every check go live immediately and auto-group with similar issues.
              </p>
            </div>
            <label htmlFor="auto-publish" className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer">
              <input
                id="auto-publish"
                type="checkbox"
                checked={rules.autoPublish}
                onChange={(e) => setRules({ ...rules, autoPublish: e.target.checked })}
                className="w-4 h-4 accent-brand-teal"
              />
              Publish reports automatically when they pass checks
            </label>
            <div>
              <label htmlFor="blocked-words" className="block text-xs font-semibold text-slate-800 mb-1.5">
                Blocked words (comma separated)
              </label>
              <textarea
                id="blocked-words"
                rows={2}
                value={rules.blockedWords}
                onChange={(e) => setRules({ ...rules, blockedWords: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-brand-teal"
              />
            </div>
            <div>
              <label htmlFor="flag-threshold" className="block text-xs font-semibold text-slate-800 mb-1.5">
                Open flags that move a published report back to review (1 to 20)
              </label>
              <input
                id="flag-threshold"
                type="number"
                min={1}
                max={20}
                value={rules.flagThreshold}
                onChange={(e) => setRules({ ...rules, flagThreshold: Number(e.target.value) })}
                className="w-32 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-brand-teal"
              />
              {!isThresholdValid && <p className="text-xs text-rose-600 mt-1">Enter a whole number from 1 to 20.</p>}
            </div>
            <button
              onClick={saveRules}
              disabled={!isThresholdValid}
              className="px-5 py-2.5 rounded-xl bg-brand-navy hover:bg-brand-navy-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm cursor-pointer"
            >
              Save moderation rules
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-brand-navy mb-1">Accounts with strikes or restrictions</h2>
            <p className="text-[11px] text-slate-500 mb-3">
              1st strike is a warning, 2nd restricts new reports for 24 hours, 3rd and later for 7 days.
            </p>
            {restrictedUsers.length === 0 ? (
              <p className="text-xs text-slate-600 py-4">No accounts have strikes or active restrictions.</p>
            ) : (
              <div className="space-y-2.5">
                {restrictedUsers.map((user) => {
                  const isRestricted = user.restricted_until && new Date(user.restricted_until) > new Date();
                  return (
                    <div
                      key={user.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-brand-navy">{user.full_name || user.email}</div>
                        <div className="text-slate-600">
                          {user.abuse_strikes} {user.abuse_strikes === 1 ? 'strike' : 'strikes'} ·{' '}
                          {isRestricted
                            ? `Restricted until ${new Date(user.restricted_until).toLocaleString()}`
                            : 'No active restriction'}
                        </div>
                      </div>
                      {isRestricted && (
                        <button
                          onClick={() => liftRestriction(user.id)}
                          className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-brand-navy font-medium cursor-pointer"
                        >
                          Lift restriction
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function AdminFlagsView() {
  const { data, resolveFlag, moderateIssue, setSelectedIssueId } = useFriction();

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h1 className="text-xl font-bold text-brand-navy flex items-center gap-2">
          <Flag className="w-5 h-5 text-rose-600" />
          Community Flag Review Queue
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Student flags trigger human review without auto-deleting reports. Dismiss invalid flags or request clarification.
        </p>
      </div>

      <div className="space-y-3">
        {data.flags.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-600">
            No flags have been submitted.
          </div>
        ) : (
          data.flags.map((flg: any) => {
            const issue = data.issues.find((i: any) => i.id === flg.issueId);
            if (!issue) return null;

            return (
              <div
                key={flg.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase border ${
                        flg.status === 'open'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {flg.status}
                    </span>
                    <span className="text-xs font-semibold text-rose-700">{flg.reason}</span>
                    <span className="text-xs text-slate-500">
                      Flagged by {flg.flaggedByName} · {formatRelativeTime(flg.createdAt)}
                    </span>
                  </div>

                  {flg.details && <p className="text-xs text-slate-700">&ldquo;{flg.details}&rdquo;</p>}

                  <div className="pt-1 text-xs text-slate-600">
                    Target Report:{' '}
                    <button
                      onClick={() => setSelectedIssueId(issue.id)}
                      className="text-brand-teal-dark hover:underline font-semibold cursor-pointer"
                    >
                      {issue.refId} — {issue.title}
                    </button>{' '}
                    ({issue.status})
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedIssueId(issue.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-brand-navy border border-slate-200 text-xs font-medium cursor-pointer"
                  >
                    Inspect Issue
                  </button>

                  {flg.status === 'open' && (
                    <>
                      <button
                        onClick={() => resolveFlag(flg.id, 'dismissed')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium cursor-pointer"
                      >
                        Dismiss Flag
                      </button>
                      <button
                        onClick={() => {
                          moderateIssue(issue.id, {
                            status: 'Needs Clarification',
                            adminNote: `Flagged for review (${flg.reason}): Please verify report details.`,
                            notifyType: 'clarification',
                            notifyTitle: 'Clarification Requested After Review',
                            notifyMessage: `Your report ${issue.refId} requires additional verification details.`
                          });
                          resolveFlag(flg.id, 'actioned');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-medium cursor-pointer"
                      >
                        Request Clarification
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 10. PROFILE VIEW
// ============================================================================

function ProfileView() {
  const { data, currentUser, setSelectedIssueId, setActiveTab } = useFriction();
  const { authUser, profile, profileError, refreshProfile, signOut } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const myReports = useMemo(
    () =>
      data.issues
        .filter((i: any) => i.reporterId === currentUser.id)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [data.issues, currentUser.id]
  );
  const confirmationsGiven = useMemo(
    () =>
      data.issues.filter(
        (i: any) =>
          !i.parentCanonicalId &&
          i.reporterId !== currentUser.id &&
          (i.confirmedByUserIds || []).includes(currentUser.id)
      ).length,
    [data.issues, currentUser.id]
  );
  const flagsRaised = data.flags.filter((f: any) => f.flaggedByUserId === currentUser.id).length;
  const quota = frictionService.getUserDailySubmissionStats(currentUser.id, data.issues);
  const resolvedCount = myReports.filter((i: any) => i.status === 'Resolved').length;
  const awaitingCount = myReports.filter((i: any) =>
    ['Pending Review', 'Needs Clarification'].includes(i.status)
  ).length;
  const isRestricted = profile?.restricted_until && new Date(profile.restricted_until) > new Date();
  const isAdmin = currentUser.role === 'admin';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProfile();
    setIsRefreshing(false);
  };

  const statTiles = isAdmin
    ? [
        {
          label: 'Awaiting review',
          value: data.issues.filter((i: any) =>
            ['Pending Review', 'Needs Clarification', 'Flagged'].includes(i.status)
          ).length
        },
        { label: 'Open flags', value: data.flags.filter((f: any) => f.status === 'open').length },
        { label: 'Total reports', value: data.issues.length },
        { label: 'Resolved', value: data.issues.filter((i: any) => i.status === 'Resolved').length }
      ]
    : [
        { label: 'Reports submitted', value: myReports.length },
        { label: 'Resolved', value: resolvedCount },
        { label: 'Awaiting review', value: awaitingCount },
        { label: 'Issues confirmed', value: confirmationsGiven }
      ];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-5">
        {authUser?.avatarUrl ? (
          <img
            src={authUser.avatarUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="w-20 h-20 rounded-2xl object-cover border border-slate-200"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-brand-navy text-white text-2xl font-bold flex items-center justify-center">
            {currentUser.avatar}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-brand-navy truncate">{currentUser.name}</h1>
          <p className="text-sm text-slate-600 truncate">
            {authUser ? authUser.email : currentUser.department}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                isAdmin
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-brand-teal-soft text-brand-teal-dark border-teal-200'
              }`}
            >
              {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
              {isAdmin ? 'Administrator' : 'Student'}
            </span>
            {authUser && profile?.created_at && (
              <span className="text-xs text-slate-500">
                Member since {new Date(profile.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        {authUser && (
          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-medium text-brand-navy cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh role
            </button>
            <button
              onClick={signOut}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-xs font-medium text-slate-800 hover:text-rose-700 cursor-pointer"
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {profileError && (
        <div role="alert" className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <strong>Could not read your profile from the database:</strong> {profileError} The app is treating you as a student until this is fixed.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statTiles.map((tile) => (
          <div key={tile.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-[11px] text-slate-500">{tile.label}</div>
            <div className="text-2xl font-bold text-brand-navy tabular-nums mt-1">{tile.value}</div>
          </div>
        ))}
      </div>

      {!isAdmin && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2.5 text-xs">
          <h2 className="text-sm font-bold text-brand-navy">Reporting status</h2>
          <div className="flex justify-between">
            <span className="text-slate-600">Reports left today</span>
            <span className="font-semibold text-brand-navy tabular-nums">
              {quota.remaining} of {quota.maxPerDay} (rolling 24 hours)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Flags you have raised</span>
            <span className="font-semibold text-brand-navy tabular-nums">{flagsRaised}</span>
          </div>
          {authUser && (
            <div className="flex justify-between">
              <span className="text-slate-600">Account standing</span>
              <span className={`font-semibold ${isRestricted ? 'text-rose-700' : 'text-emerald-700'}`}>
                {isRestricted
                  ? `Restricted until ${new Date(profile.restricted_until).toLocaleString()}`
                  : profile?.abuse_strikes > 0
                  ? `Good, with ${profile.abuse_strikes} recorded ${
                      profile.abuse_strikes === 1 ? 'warning' : 'strikes'
                    }`
                  : 'Good'}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-brand-navy">
            {isAdmin ? 'Quick links' : 'Your recent reports'}
          </h2>
          {!isAdmin && myReports.length > 0 && (
            <button
              onClick={() => setActiveTab('my-reports')}
              className="text-xs text-brand-teal-dark hover:underline font-medium cursor-pointer"
            >
              View all
            </button>
          )}
        </div>
        {isAdmin ? (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('admin-moderation')}
              className="px-3.5 py-2 rounded-xl bg-brand-navy hover:bg-brand-navy-dark text-white text-xs font-semibold cursor-pointer"
            >
              Moderation queue
            </button>
            <button
              onClick={() => setActiveTab('admin-flags')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-medium text-brand-navy cursor-pointer"
            >
              Flag management
            </button>
            <button
              onClick={() => setActiveTab('admin-settings')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-medium text-brand-navy cursor-pointer"
            >
              Settings &amp; abuse
            </button>
          </div>
        ) : myReports.length === 0 ? (
          <p className="text-xs text-slate-600 py-4">You have not submitted any reports yet.</p>
        ) : (
          <div className="space-y-2">
            {myReports.slice(0, 5).map((issue: any) => (
              <button
                key={issue.id}
                onClick={() => setSelectedIssueId(issue.id)}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-xs font-mono text-slate-500">{issue.refId}</div>
                  <div className="text-sm font-medium text-brand-navy truncate">{issue.title}</div>
                </div>
                <StatusBadge status={issue.status} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 11. SIDEBAR WORKSPACE SHELL (NO TOPBAR NAV, NO HCI LINE, NO AFS FOOTER)
// ============================================================================

function FrictionAppShell() {
  const {
    data,
    currentUser,
    switchUser,
    enteredWorkspace,
    enterWorkspace,
    exitToLanding,
    activeTab,
    setActiveTab,
    setNotificationsOpen,
    resetDemoData,
    selectedBuildingId,
    setSelectedBuildingId,
    setSelectedIssueId,
    confirmIssue,
    navigateToReportWithBuilding,
    buildingCoords,
    pinBuilding,
    navigateToReportWithSpot,
    toast
  } = useFriction();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { authUser, demoMode, authError, signInWithGoogle } = useAuth();

  if (!enteredWorkspace || (!authUser && !demoMode)) {
    return (
      <LandingPage
        authUser={authUser}
        authError={authError}
        onSignInWithGoogle={signInWithGoogle}
        onEnterAsStudent={() => enterWorkspace('student', 'dashboard')}
        onEnterAsAdmin={() => enterWorkspace('admin', 'admin-overview')}
        onOpenMap={() => enterWorkspace('student', 'map')}
      />
    );
  }

  const unreadNotifCount = data.notifications.filter(
    (n: any) => n.userId === currentUser.id && !n.read
  ).length;

  const pendingCount = data.issues.filter((i: any) =>
    ['Pending Review', 'Needs Clarification', 'Flagged'].includes(i.status)
  ).length;

  const openFlagsCount = data.flags.filter((f: any) => f.status === 'open').length;

  const studentNav: Array<{ id: string; label: string; icon: any; badge?: number }> = [
    { id: 'dashboard', label: 'Home Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Campus Map', icon: MapIcon },
    { id: 'report', label: 'Report an Issue', icon: PlusCircle },
    { id: 'my-reports', label: 'My Reports', icon: FileText }
  ];

  // Note: Duplicates & Groups tab removed — handled automatically in backend!
  const adminNav: Array<{ id: string; label: string; icon: any; badge?: number }> = [
    { id: 'admin-overview', label: 'Admin Overview', icon: BarChart3 },
    { id: 'admin-moderation', label: 'Moderation Queue', icon: ShieldCheck, badge: pendingCount },
    { id: 'admin-flags', label: 'Flag Management', icon: Flag, badge: openFlagsCount },
    { id: 'admin-settings', label: 'Settings & Abuse', icon: SlidersHorizontal },
    { id: 'map', label: 'Campus Map View', icon: MapIcon }
  ];

  const navItems = currentUser.role === 'admin' ? adminNav : studentNav;
  const currentNavLabel =
    activeTab === 'profile'
      ? 'Profile'
      : navItems.find((n) => n.id === activeTab)?.label || 'Workspace';

  const SidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Lockup */}
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
        <button
          onClick={exitToLanding}
          title="Back to Friction Landing Page"
          className="flex items-center cursor-pointer text-left"
        >
          <BrandLogo size="md" />
        </button>
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-brand-navy hover:bg-slate-100 cursor-pointer"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="Primary Sidebar Navigation">
        <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400">
          {currentUser.role === 'admin' ? 'Administration' : 'Student Portal'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-brand-navy text-white font-semibold'
                  : 'text-slate-700 hover:text-brand-navy hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-amber' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold tabular-nums shrink-0 ${
                    isActive ? 'bg-brand-teal text-white' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 mt-4 border-t border-slate-100 space-y-1">
          <button
            onClick={exitToLanding}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-brand-navy hover:bg-slate-100 transition cursor-pointer whitespace-nowrap"
          >
            <Home className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Landing Overview</span>
          </button>
          {!authUser && (
            <button
              onClick={resetDemoData}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-brand-teal-dark hover:bg-slate-100 transition cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Reset Campus Data</span>
            </button>
          )}
        </div>
      </nav>

      {/* Sidebar User / Persona Switcher Footer */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/70 shrink-0">
        {authUser ? (
          <AccountMenu onOpenProfile={() => setActiveTab('profile')} />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 px-1">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  currentUser.role === 'admin'
                    ? 'bg-brand-navy text-white'
                    : 'bg-brand-teal text-white'
                }`}
              >
                {currentUser.avatar}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-brand-navy truncate">{currentUser.name}</div>
                <div className="text-[11px] text-slate-500">
                  {currentUser.role === 'admin' ? 'Campus Administrator' : 'Student Reporter'}
                </div>
              </div>
            </div>
            <select
              aria-label="Switch Active Persona"
              value={currentUser.id}
              onChange={(e) => switchUser(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-brand-navy focus:outline-none focus:border-brand-teal cursor-pointer"
            >
              <optgroup label="Student Personas">
                {DEMO_USERS.filter((u) => u.role === 'student').map((u) => (
                  <option key={u.id} value={u.id}>
                    Student: {u.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Campus Administration">
                {DEMO_USERS.filter((u) => u.role === 'admin').map((u) => (
                  <option key={u.id} value={u.id}>
                    Admin: {u.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile Slide-Over Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-10">{SidebarContent}</aside>
        </div>
      )}

      {/* Right Main Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Contextual Workspace Header (No Topbar Nav Pills) */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-slate-100 text-brand-navy hover:bg-slate-200 cursor-pointer"
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <BrandLogo size="sm" showWordmark={false} className="lg:hidden" />
            <div className="flex items-center gap-2 text-xs sm:text-sm truncate">
              <span className="text-slate-400 hidden sm:inline">Friction</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-bold text-brand-navy truncate">{currentNavLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {currentUser.role === 'student' && activeTab !== 'report' && (
              <button
                onClick={() => navigateToReportWithBuilding('')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Report Issue
              </button>
            )}

            <button
              onClick={() => setNotificationsOpen(true)}
              aria-label="Open Notifications"
              className="relative p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-brand-navy transition cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-teal text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadNotifCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
          {activeTab === 'dashboard' && <StudentDashboard />}
          {activeTab === 'map' && (
            <CampusMapView
              data={data}
              currentUser={currentUser}
              selectedBuildingId={selectedBuildingId}
              setSelectedBuildingId={setSelectedBuildingId}
              setSelectedIssueId={setSelectedIssueId}
              confirmIssue={confirmIssue}
              navigateToReportWithBuilding={navigateToReportWithBuilding}
              buildingCoords={buildingCoords}
              pinBuilding={pinBuilding}
              navigateToReportWithSpot={navigateToReportWithSpot}
            />
          )}
          {activeTab === 'report' && currentUser.role === 'student' && <ReportIssueView />}
          {activeTab === 'my-reports' && <MyReportsView />}
          {activeTab === 'profile' && <ProfileView />}
          {activeTab.startsWith('admin-') && <AdminDashboard section={activeTab} />}
        </main>

        {/* Quiet Footer (AFS formula removed) */}
        <footer className="border-t border-slate-200 bg-white py-4 px-4 sm:px-6 text-xs text-slate-500">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <strong className="text-brand-navy">Friction</strong> — Making everyday campus problems impossible to ignore.
            </div>
            <div>
              IGDTUW Campus Issue Intelligence
            </div>
          </div>
        </footer>
      </div>

      {/* Global Modals & Overlays */}
      <IssueDetailsModal />
      <NotificationsDrawer />

      {/* Live Toast Feedback */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 max-w-sm bg-white border px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs ${
            toast.type === 'error'
              ? 'border-rose-300 text-rose-800'
              : 'border-brand-teal/40 text-brand-navy'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <FrictionProvider>
      <FrictionAppShell />
    </FrictionProvider>
  );
}