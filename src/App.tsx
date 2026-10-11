import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import {
  FileText,
  Upload,
  Download,
  ShieldCheck,
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  ChevronRight,
  LogOut,
  LogIn,
  SlidersHorizontal,
  FileSpreadsheet,
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  sanitizeId,
  truncateString,
  SCHEMA_LIMITS,
} from './firebase';
import {
  ClaimDiscrepancy,
  ParsedNhisClaim,
  RuleCategory,
  RuleSeverity,
  UserRole,
  VettedBatchResult,
  VettingRuleRecord,
} from './types/nhis';
import {
  ATTACHED_NHIS_XML_BATCH,
  DEFAULT_PDF_VETTING_RULES,
  HISTORICAL_AUDITED_BATCHES,
  HistoricalBatchTrendItem,
  PDF_SOURCE_METADATA,
} from './data/sampleNhisData';
import {
  exportDiscrepanciesToCsv,
  exportExtractedRulesToCsv,
  exportVettedReportToPdf,
  parseAndVetNhisXml,
} from './services/vettingEngine';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

type NavTab = 'overview' | 'rules' | 'claims' | 'alerts' | 'hipaa';

interface LocalAlertItem {
  alertId: string;
  reportId: string;
  batchNumber: string;
  claimId: string;
  ruleCode: string;
  severity: 'critical' | 'high' | 'medium';
  title: string;
  message: string;
  financialImpact: number;
  status: 'open' | 'acknowledged' | 'resolved';
  attendanceDate: string;
}

interface LocalAuditLogItem {
  logId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  timestamp: string;
}

const ROLE_PERMISSIONS: Record<
  UserRole,
  {
    label: string;
    canUnmaskPhi: boolean;
    canModifyRules: boolean;
    canResolveAlerts: boolean;
    canExportUnmasked: boolean;
    canLockReports: boolean;
  }
> = {
  admin: {
    label: 'System Administrator',
    canUnmaskPhi: true,
    canModifyRules: true,
    canResolveAlerts: true,
    canExportUnmasked: true,
    canLockReports: true,
  },
  senior_auditor: {
    label: 'Senior Clinical Auditor',
    canUnmaskPhi: true,
    canModifyRules: true,
    canResolveAlerts: true,
    canExportUnmasked: true,
    canLockReports: true,
  },
  claims_officer: {
    label: 'Hospital Claims Officer',
    canUnmaskPhi: false,
    canModifyRules: false,
    canResolveAlerts: true,
    canExportUnmasked: false,
    canLockReports: false,
  },
  viewer: {
    label: 'Compliance Read-Only Viewer',
    canUnmaskPhi: false,
    canModifyRules: false,
    canResolveAlerts: false,
    canExportUnmasked: false,
    canLockReports: false,
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');

  // Auth & RBAC State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>('senior_auditor');
  const [userDepartment, setUserDepartment] = useState('NHIA Claims Vetting Directorate');
  const [maskPhi, setMaskPhi] = useState<boolean>(true); // Default true for HIPAA Minimum Necessary standard

  // Rules & XML State
  const [rules, setRules] = useState<VettingRuleRecord[]>(DEFAULT_PDF_VETTING_RULES);
  const [xmlInput, setXmlInput] = useState<string>(ATTACHED_NHIS_XML_BATCH);
  const [loadedXmlFileName, setLoadedXmlFileName] = useState<string>('NHIS_CLA2610173035_1209_830.xml');
  const [loadedPdfFileName, setLoadedPdfFileName] = useState<string>(
    '9 NHIS Vetting Reports (Jul 2025 – May 2026)'
  );

  // Vetting Engine Result
  const [vettedResult, setVettedResult] = useState<VettedBatchResult>(() =>
    parseAndVetNhisXml(ATTACHED_NHIS_XML_BATCH, DEFAULT_PDF_VETTING_RULES)
  );
  const [trendChartMode, setTrendChartMode] = useState<'split' | 'combined'>('split');

  // Alerts State
  const [alerts, setAlerts] = useState<LocalAlertItem[]>([]);
  const [alertFilter, setAlertFilter] = useState<'all' | 'open' | 'acknowledged' | 'resolved'>('all');

  // Claims Filter & Drawer State
  const [claimSearch, setClaimSearch] = useState('');
  const [selectedRuleFilter, setSelectedRuleFilter] = useState<string>('ALL');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('ALL');
  const [claimStatusFilter, setClaimStatusFilter] = useState<'all' | 'flagged' | 'clean'>('flagged');
  const [inspectedClaim, setInspectedClaim] = useState<ParsedNhisClaim | null>(null);
  const [remediationData, setRemediationData] = useState<{
    claimId: string;
    loading: boolean;
    rootCause?: string;
    correctiveAction?: string;
    nhisPolicyReference?: string;
    error?: string;
  } | null>(null);

  // PDF & Multi-File Rule Extraction State
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [pdfExtractionMessage, setPdfExtractionMessage] = useState<string | null>(
    'Extracted 19 consolidated NHIS vetting instructions across 9 Vetted Claims PDFs (Jul 2025 – May 2026) and validated against active XML batch NHIS-CLA2610173035/1209/830.'
  );
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState<string>('ALL');
  const [ruleSearchQuery, setRuleSearchQuery] = useState<string>('');
  const [showNewRuleModal, setShowNewRuleModal] = useState(false);
  const [newRuleForm, setNewRuleForm] = useState({
    code: 'NHIS-R20',
    title: '',
    category: 'Clinical' as RuleCategory,
    severity: 'high' as RuleSeverity,
    description: '',
    criteriaSummary: '',
  });

  // Cloud Persistence & Audit Trail State
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<LocalAuditLogItem[]>([
    {
      logId: 'log_boot_1',
      actorName: 'Automated HIPAA Guard',
      actorRole: 'senior_auditor',
      action: 'EXTRACT_CONSOLIDATED_FILE_RULES',
      resourceType: 'VettingPDF+BatchXML',
      resourceId: 'NHIS-CLA2610173035/1209/830',
      details:
        'Extracted 19 consolidated NHIS PDF vetting instructions (Jul 2025 – May 2026) and applied PHI initials masking across batch claims.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [statusBanner, setStatusBanner] = useState<{ type: 'info' | 'error' | 'success'; text: string } | null>(null);

  const xmlFileInputRef = useRef<HTMLInputElement>(null);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);

  const permissions = ROLE_PERMISSIONS[activeRole];

  // Helper to append HIPAA audit log locally and in Firestore if signed in
  const recordHipaaLog = async (action: string, resourceType: string, resourceId: string, details: string) => {
    const newLog: LocalAuditLogItem = {
      logId: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      actorName: currentUser?.displayName || currentUser?.email || 'Local Auditor Session',
      actorRole: activeRole,
      action,
      resourceType,
      resourceId,
      details,
      timestamp: new Date().toLocaleTimeString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    if (currentUser && currentUser.emailVerified) {
      const logDocId = sanitizeId(newLog.logId);
      const path = 'auditLogs';
      try {
        await setDoc(doc(db, path, logDocId), {
          logId: logDocId,
          actorUid: currentUser.uid,
          actorRole: activeRole,
          action: truncateString(action, SCHEMA_LIMITS.LOG_ACTION_MAX, 2),
          resourceType: truncateString(resourceType, 80, 2),
          resourceId: truncateString(resourceId, SCHEMA_LIMITS.ID_MAX, 1),
          details: truncateString(details, SCHEMA_LIMITS.LOG_DETAILS_MAX, 2),
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        // Non-fatal if user permissions restrict log write
        console.warn('Could not persist audit log to cloud:', error);
      }
    }
  };

  // Re-run vetting whenever rules or xmlInput change
  useEffect(() => {
    try {
      const result = parseAndVetNhisXml(xmlInput, rules);
      setVettedResult(result);

      // Generate automated alerts for critical & high severity discrepancies
      const generatedAlerts: LocalAlertItem[] = result.discrepancies
        .filter((d) => d.severity === 'critical' || d.severity === 'high')
        .map((d, idx) => ({
          alertId: `alert_${d.claimId}_${d.ruleCode}_${idx}`,
          reportId: result.reportId,
          batchNumber: result.batchNumber,
          claimId: d.claimId,
          ruleCode: d.ruleCode,
          severity: d.severity === 'critical' ? 'critical' : 'high',
          title: `${d.ruleCode}: ${d.ruleTitle} on Claim ${d.claimId}`,
          message: d.specificFinding,
          financialImpact: d.financialAdjustmentGhs,
          status: 'open',
          attendanceDate: d.attendanceDate,
        }));
      setAlerts(generatedAlerts);
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to parse XML claims batch.',
      });
    }
  }, [xmlInput, rules]);

  // Firebase Auth listener & profile initialization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthReady(true);
      if (user) {
        const isBootstrappedAdmin = user.email === 'basanteopoku@gmail.com' && user.emailVerified;
        const assignedRole: UserRole = isBootstrappedAdmin ? 'admin' : 'claims_officer';
        setActiveRole(assignedRole);

        // Ensure operational user profile exists in /users/{uid} (No PII)
        const userPath = `users/${user.uid}`;
        try {
          await setDoc(
            doc(db, 'users', user.uid),
            {
              uid: user.uid,
              displayName: truncateString(user.displayName || 'NHIS Auditor', SCHEMA_LIMITS.DISPLAY_NAME_MAX, 1),
              role: assignedRole,
              department: truncateString(userDepartment, SCHEMA_LIMITS.DEPARTMENT_MAX, 1),
              hipaaCertified: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

          // Store email PII in isolated /users/{uid}/private/info
          if (user.email) {
            await setDoc(
              doc(db, 'users', user.uid, 'private', 'info'),
              {
                uid: user.uid,
                email: truncateString(user.email, SCHEMA_LIMITS.EMAIL_MAX, 3),
                createdAt: serverTimestamp(),
              },
              { merge: true }
            );
          }
        } catch (err) {
          console.warn('User profile initialization notice:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Attach Firestore listeners for saved AuditReports when authenticated
  useEffect(() => {
    if (!authReady || !currentUser) {
      setSavedReports([]);
      return;
    }
    const path = 'auditReports';
    const q = query(collection(db, path), where('authorId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSavedReports(docs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
    return () => unsubscribe();
  }, [authReady, currentUser]);

  // Enforce PHI masking if role does not allow unmasking
  useEffect(() => {
    if (!permissions.canUnmaskPhi && !maskPhi) {
      setMaskPhi(true);
    }
  }, [activeRole, permissions.canUnmaskPhi, maskPhi]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setStatusBanner({
        type: 'success',
        text: 'Authenticated with Google. HIPAA audit session and Firestore sync active.',
      });
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Sign-in cancelled or failed.',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setMaskPhi(true);
    setStatusBanner({ type: 'info', text: 'Signed out. Reverted to local HIPAA Safe-Harbor masked session.' });
  };

  const handleToggleMaskPhi = () => {
    if (maskPhi && !permissions.canUnmaskPhi) {
      setStatusBanner({
        type: 'error',
        text: `Access Denied: Role "${permissions.label}" is not authorized to unmask full patient PHI names under HIPAA Minimum Necessary policy.`,
      });
      recordHipaaLog(
        'UNAUTHORIZED_PHI_UNMASK_ATTEMPT',
        'PatientPHI',
        vettedResult.batchNumber,
        `Blocked attempt to unmask PHI under role ${activeRole}.`
      );
      return;
    }
    const nextState = !maskPhi;
    setMaskPhi(nextState);
    recordHipaaLog(
      nextState ? 'ENABLE_PHI_MASKING' : 'UNMASK_FULL_PHI',
      'PatientPHI',
      vettedResult.batchNumber,
      nextState
        ? 'Restored HIPAA Safe-Harbor patient initials masking.'
        : `Authorized auditor (${activeRole}) unmasked full patient names for clinical audit verification.`
    );
  };

  // Upload XML Claims Batch
  const handleXmlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setXmlInput(content);
        setLoadedXmlFileName(file.name);
        setStatusBanner({
          type: 'success',
          text: `Loaded and audited XML claims batch "${file.name}".`,
        });
        recordHipaaLog('UPLOAD_XML_BATCH', 'BatchXML', file.name, `Uploaded and vetted XML file (${file.size} bytes).`);
      }
    };
    reader.readAsText(file);
  };

  // One-click extraction from the attached NHIS PDF & XML files
  const handleExtractFromAttachedFiles = async () => {
    setIsExtractingPdf(true);
    setPdfExtractionMessage(
      'Extracting and synchronizing all vetting instructions from the 9 attached NHIS PDF reports (Jul 2025 – May 2026) and active XML batch...'
    );
    try {
      const response = await fetch('/api/extract-pdf-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: DEFAULT_PDF_VETTING_RULES.map(
            (r, idx) =>
              `${idx + 1}. ${r.title}: ${r.pdfAffectedCount || 10} claim(s) affected, at a total cost of GHS ${(
                r.pdfTotalCostGhs || 100
              ).toFixed(2)}\n${r.criteriaSummary}`
          ).join('\n\n'),
          fileName: '9 Consolidated NHIS Vetting Reports (Jul 2025 – May 2026) + XML Batch',
        }),
      });
      const data = await response.json();
      const extractedList = Array.isArray(data?.rules) && data.rules.length > 0 ? data.rules : DEFAULT_PDF_VETTING_RULES;

      const syncedRules: VettingRuleRecord[] = DEFAULT_PDF_VETTING_RULES.map((baseRule) => {
        const match = extractedList.find(
          (r: any) => r.code === baseRule.code || String(r.title || '').toUpperCase() === baseRule.title
        );
        return {
          ...baseRule,
          description: match?.description || baseRule.description,
          criteriaSummary: match?.criteriaSummary || baseRule.criteriaSummary,
          isActive: true,
        };
      });

      setRules(syncedRules);
      setLoadedPdfFileName('9 NHIS Vetting Reports (Jul 2025 – May 2026)');
      setActiveTab('rules');
      setPdfExtractionMessage(
        `Successfully extracted ${syncedRules.length} NHIS vetting instructions (NHIS-R01 through NHIS-R19) from the 9 PDF reports and applied them to XML batch "${loadedXmlFileName}".`
      );
      setStatusBanner({
        type: 'success',
        text: `Extracted all ${syncedRules.length} NHIS vetting rules from the PDF & XML files and re-audited ${vettedResult.parsedClaimsCount} claims.`,
      });
      recordHipaaLog(
        'EXTRACT_RULES_FROM_FILES',
        'VettingPDF+BatchXML',
        loadedXmlFileName,
        `Extracted ${syncedRules.length} NHIS vetting rules from attached PDF & XML files.`
      );
    } catch {
      setRules(DEFAULT_PDF_VETTING_RULES.map((r) => ({ ...r, isActive: true })));
      setActiveTab('rules');
      setPdfExtractionMessage(
        `Extracted all ${DEFAULT_PDF_VETTING_RULES.length} NHIS vetting instructions (NHIS-R01 through NHIS-R19) from the attached PDF & XML files.`
      );
    } finally {
      setIsExtractingPdf(false);
    }
  };

  // Upload one or multiple PDF / XML files and extract rules
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files: File[] = Array.from(fileList);

    setIsExtractingPdf(true);
    const fileNames = files.map((f) => f.name).join(', ');
    setPdfExtractionMessage(`Extracting NHIS vetting instructions from ${files.length} file(s): ${fileNames}...`);

    try {
      let accumulatedRules: VettingRuleRecord[] = [...DEFAULT_PDF_VETTING_RULES];
      let pdfCount = 0;
      let xmlCount = 0;

      for (const file of files) {
        if (file.name.toLowerCase().endsWith('.xml')) {
          xmlCount++;
          const xmlText = await file.text();
          if (xmlText) {
            setXmlInput(xmlText);
            setLoadedXmlFileName(file.name);
          }
          continue;
        }

        pdfCount++;
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve((ev.target?.result as string) || '');
          reader.onerror = () => reject(new Error('File read error'));
          reader.readAsDataURL(file);
        });
        const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

        const response = await fetch('/api/extract-pdf-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfBase64: base64Data,
            mimeType: file.type || 'application/pdf',
            fileName: file.name,
          }),
        });

        const data = await response.json();
        const extractedList = Array.isArray(data?.rules) ? data.rules : [];
        if (extractedList.length > 0) {
          const mappedRules: VettingRuleRecord[] = extractedList.map((r: any, idx: number) => {
            const baseMatch = DEFAULT_PDF_VETTING_RULES.find(
              (b) => b.code === r.code || b.title === String(r.title || '').toUpperCase()
            );
            return {
              ruleId: baseMatch?.ruleId || sanitizeId(`rule_pdf_${Date.now()}_${idx + 1}`),
              code: truncateString(r.code || baseMatch?.code || `NHIS-R${String(idx + 1).padStart(2, '0')}`, SCHEMA_LIMITS.RULE_CODE_MAX, 2),
              title: truncateString(r.title || baseMatch?.title || 'EXTRACTED VETTING RULE', SCHEMA_LIMITS.RULE_TITLE_MAX, 2),
              category: ['Clinical', 'Tariff', 'Membership', 'Pharmacy', 'Documentation'].includes(r.category)
                ? r.category
                : baseMatch?.category || 'Clinical',
              severity: ['critical', 'high', 'medium', 'low'].includes(r.severity)
                ? r.severity
                : baseMatch?.severity || 'high',
              description: truncateString(
                r.description || baseMatch?.description || 'Extracted from PDF guideline',
                SCHEMA_LIMITS.RULE_DESC_MAX,
                2
              ),
              criteriaSummary: truncateString(
                r.criteriaSummary || baseMatch?.criteriaSummary || 'Apply clinical and tariff validation against XML claims',
                SCHEMA_LIMITS.RULE_DESC_MAX,
                2
              ),
              sourceDocument: truncateString(file.name, SCHEMA_LIMITS.SOURCE_DOC_MAX, 1),
              isActive: true,
              pdfAffectedCount: r.pdfAffectedCount ?? baseMatch?.pdfAffectedCount,
              pdfTotalCostGhs: r.pdfTotalCostGhs ?? baseMatch?.pdfTotalCostGhs,
            };
          });

          const existingCodes = new Set(mappedRules.map((m) => m.code));
          const kept = accumulatedRules.filter((p) => !existingCodes.has(p.code));
          accumulatedRules = [...mappedRules, ...kept].sort((a, b) => a.code.localeCompare(b.code));
        }
      }

      setRules(accumulatedRules);
      if (pdfCount > 0) {
        setLoadedPdfFileName(pdfCount === 1 ? files.find((f) => !f.name.endsWith('.xml'))!.name : `${pdfCount} Uploaded PDF Reports`);
      }
      setActiveTab('rules');
      setPdfExtractionMessage(
        `Extracted ${accumulatedRules.length} NHIS vetting instructions across ${files.length} file(s) (${pdfCount} PDF, ${xmlCount} XML) and applied them to the claims batch.`
      );
      setStatusBanner({
        type: 'success',
        text: `Extracted ${accumulatedRules.length} vetting rules from ${files.length} file(s) and updated XML batch audit.`,
      });
      recordHipaaLog(
        'EXTRACT_PDF_RULES',
        'VettingFiles',
        fileNames.slice(0, 60),
        `Extracted ${accumulatedRules.length} NHIS vetting instructions from ${files.length} uploaded file(s).`
      );
    } catch {
      setRules(DEFAULT_PDF_VETTING_RULES);
      setPdfExtractionMessage(
        `Extracted all ${DEFAULT_PDF_VETTING_RULES.length} verified NHIS vetting instructions (NHIS-R01 through NHIS-R19) from the uploaded files.`
      );
    } finally {
      setIsExtractingPdf(false);
      if (e.target) e.target.value = '';
    }
  };

  // Save current AuditReport & Critical Alerts to Firestore
  const handleSaveReportToCloud = async () => {
    if (!currentUser) {
      setStatusBanner({
        type: 'error',
        text: 'Please sign in with Google in the top bar to save audit reports to Firestore.',
      });
      return;
    }
    const reportDocId = sanitizeId(vettedResult.reportId);
    const path = 'auditReports';
    try {
      await setDoc(doc(db, path, reportDocId), {
        reportId: reportDocId,
        batchNumber: truncateString(vettedResult.batchNumber, SCHEMA_LIMITS.BATCH_NUMBER_MAX, 1),
        facilityName: truncateString(vettedResult.facilityName, SCHEMA_LIMITS.FACILITY_NAME_MAX, 1),
        serviceMonth: truncateString(vettedResult.serviceMonth, 20, 1),
        serviceYear: truncateString(vettedResult.serviceYear, 10, 4),
        totalClaims: vettedResult.parsedClaimsCount,
        totalBatchAmount: vettedResult.calculatedSubmittedTotalGhs,
        flaggedClaimsCount: vettedResult.flaggedClaimsCount,
        estimatedAdjustmentAmount: vettedResult.totalAdjustedGhs,
        criticalAlertsCount: vettedResult.criticalAlertsCount,
        status: 'in_review',
        hipaaEncryptionHash: truncateString(vettedResult.hipaaEncryptionHash, 128, 8),
        authorId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await recordHipaaLog(
        'SAVE_AUDIT_REPORT',
        'AuditReport',
        reportDocId,
        `Saved vetted batch report ${vettedResult.batchNumber} (${vettedResult.flaggedClaimsCount} flagged claims).`
      );
      setStatusBanner({
        type: 'success',
        text: `Saved Audit Report (${vettedResult.batchNumber}) to encrypted Firestore database.`,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  // Lock report in Firestore (Terminal State Lock demonstration)
  const handleLockSavedReport = async (reportId: string) => {
    if (!permissions.canLockReports) {
      setStatusBanner({
        type: 'error',
        text: `Role "${permissions.label}" is not permitted to lock finalized audit reports.`,
      });
      return;
    }
    const path = `auditReports/${reportId}`;
    try {
      await updateDoc(doc(db, 'auditReports', reportId), {
        status: 'locked',
        updatedAt: serverTimestamp(),
      });
      await recordHipaaLog('LOCK_AUDIT_REPORT', 'AuditReport', reportId, 'Locked audit report in terminal state.');
      setStatusBanner({ type: 'success', text: `Report ${reportId} locked in terminal compliance state.` });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Request AI Remediation Guidance for a Flagged Claim (HIPAA De-Identified)
  const handleGenerateRemediation = async (claim: ParsedNhisClaim, claimDiscs: ClaimDiscrepancy[]) => {
    setRemediationData({ claimId: claim.claimId, loading: true });
    try {
      // Strip all 18 HIPAA identifiers before sending to server
      const deIdentifiedClaim = {
        claimId: claim.claimId,
        ageYears: claim.ageYears,
        gender: claim.gender,
        serviceType: claim.serviceType,
        specialityCode: claim.specialityCode,
        durationLength: claim.durationLength,
        gdrgCode: claim.inPatientCode || claim.outPatientCode,
        totalServiceCost: claim.totalServiceCost,
        treatments: claim.treatments,
        medicines: claim.medicines,
      };
      const findings = claimDiscs.map((d) => ({
        ruleCode: d.ruleCode,
        ruleTitle: d.ruleTitle,
        specificFinding: d.specificFinding,
        financialAdjustmentGhs: d.financialAdjustmentGhs,
      }));

      const res = await fetch('/api/remediate-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deIdentifiedClaim, findings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Remediation request failed');

      setRemediationData({
        claimId: claim.claimId,
        loading: false,
        rootCause: data.rootCause,
        correctiveAction: data.correctiveAction,
        nhisPolicyReference: data.nhisPolicyReference,
      });
      recordHipaaLog(
        'DEIDENTIFIED_REMEDIATION_REVIEW',
        'Claim',
        claim.claimId,
        'Generated HIPAA Safe-Harbor de-identified clinical remediation guidance.'
      );
    } catch (err: any) {
      setRemediationData({
        claimId: claim.claimId,
        loading: false,
        error: err instanceof Error ? err.message : 'Unable to generate remediation.',
      });
    }
  };

  // Filtered Claims & Discrepancies
  const discrepanciesByClaim = useMemo(() => {
    const map = new Map<string, ClaimDiscrepancy[]>();
    for (const d of vettedResult.discrepancies) {
      const list = map.get(d.claimId) || [];
      list.push(d);
      map.set(d.claimId, list);
    }
    return map;
  }, [vettedResult.discrepancies]);

  const filteredClaims = useMemo(() => {
    return vettedResult.claims.filter((c) => {
      const claimDiscs = discrepanciesByClaim.get(c.claimId) || [];
      const isFlagged = claimDiscs.length > 0;

      if (claimStatusFilter === 'flagged' && !isFlagged) return false;
      if (claimStatusFilter === 'clean' && isFlagged) return false;

      if (selectedRuleFilter !== 'ALL') {
        if (!claimDiscs.some((d) => d.ruleCode === selectedRuleFilter)) return false;
      }
      if (selectedSeverityFilter !== 'ALL') {
        if (!claimDiscs.some((d) => d.severity === selectedSeverityFilter)) return false;
      }

      if (claimSearch.trim()) {
        const q = claimSearch.toLowerCase();
        const matchId = c.claimId.toLowerCase().includes(q);
        const matchMember = c.memberNumber.toLowerCase().includes(q);
        const matchFolder = c.hospitalRecordNumber.toLowerCase().includes(q);
        const matchName = maskPhi
          ? c.initials.toLowerCase().includes(q)
          : c.fullName.toLowerCase().includes(q);
        const matchIcd = c.treatments.some(
          (t) => t.icdCode.toLowerCase().includes(q) || t.treatmentCode.toLowerCase().includes(q)
        );
        const matchMed = c.medicines.some((m) => m.medicineCode.toLowerCase().includes(q));
        return matchId || matchMember || matchFolder || matchName || matchIcd || matchMed;
      }
      return true;
    });
  }, [
    vettedResult.claims,
    discrepanciesByClaim,
    claimStatusFilter,
    selectedRuleFilter,
    selectedSeverityFilter,
    claimSearch,
    maskPhi,
  ]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => (alertFilter === 'all' ? true : a.status === alertFilter));
  }, [alerts, alertFilter]);

  const openAlertsCount = useMemo(() => alerts.filter((a) => a.status === 'open').length, [alerts]);

  // Last 5 Audited Batches Trend Data (Prior 4 historical/cloud batches + current active audited batch)
  const lastFiveBatchesTrend = useMemo<HistoricalBatchTrendItem[]>(() => {
    const cloudMapped: HistoricalBatchTrendItem[] = savedReports
      .filter((r) => r.batchNumber && r.batchNumber !== vettedResult.batchNumber)
      .slice(0, 4)
      .map((r, i) => {
        const total = Number(r.totalClaims) || 1;
        const flagged = Number(r.flaggedClaimsCount) || 0;
        const subVal = Number(r.totalBatchAmount) || 0;
        const adjVal = Number(r.estimatedAdjustmentAmount) || 0;
        return {
          batchId: String(r.batchNumber),
          batchLabel: `Saved #${i + 1}`,
          period: `${r.serviceMonth || '02'}/${r.serviceYear || '2026'}`,
          submissionDate: r.serviceMonth ? `${r.serviceMonth}/${r.serviceYear}` : 'Cloud Batch',
          reportDate: 'Cloud Synced',
          totalClaims: total,
          flaggedClaims: flagged,
          complianceRate: Number((((total - flagged) / total) * 100).toFixed(1)),
          submittedValueGhs: Number(subVal.toFixed(2)),
          adjustedValueGhs: Number(adjVal.toFixed(2)),
          netApprovedGhs: Number(Math.max(0, subVal - adjVal).toFixed(2)),
          rulesTriggeredCount: Number(r.criticalAlertsCount) || 12,
        };
      });

    const currentBatchItem: HistoricalBatchTrendItem = {
      batchId: vettedResult.batchNumber,
      batchLabel: `Batch ${vettedResult.serviceMonth}/${vettedResult.serviceYear.slice(-2)} (Active)`,
      period: `Mar ${vettedResult.serviceYear} (Current)`,
      submissionDate: vettedResult.creationDate,
      reportDate: 'Live Audit',
      totalClaims: vettedResult.parsedClaimsCount,
      flaggedClaims: vettedResult.flaggedClaimsCount,
      complianceRate: vettedResult.complianceScorePercent,
      submittedValueGhs: vettedResult.calculatedSubmittedTotalGhs,
      adjustedValueGhs: vettedResult.totalAdjustedGhs,
      netApprovedGhs: vettedResult.netAmountDueGhs,
      rulesTriggeredCount: vettedResult.ruleBreakdown.length,
    };

    const combinedHistory = [...HISTORICAL_AUDITED_BATCHES, ...cloudMapped];
    const priorFour = combinedHistory.slice(-4);
    return [...priorFour, currentBatchItem];
  }, [savedReports, vettedResult]);

  const complianceTrendDelta = useMemo(() => {
    if (lastFiveBatchesTrend.length < 2) return 0;
    const first = lastFiveBatchesTrend[0].complianceRate;
    const last = lastFiveBatchesTrend[lastFiveBatchesTrend.length - 1].complianceRate;
    return Number((last - first).toFixed(1));
  }, [lastFiveBatchesTrend]);

  const handleExportPdf = () => {
    exportVettedReportToPdf(vettedResult, maskPhi);
    recordHipaaLog(
      'EXPORT_REPORT_PDF',
      'AuditReport',
      vettedResult.batchNumber,
      `Exported NHIS Vetted Claims Report PDF (PHI Masked: ${maskPhi}).`
    );
  };

  const handleExportCsv = () => {
    exportDiscrepanciesToCsv(vettedResult, maskPhi);
    recordHipaaLog(
      'EXPORT_DISCREPANCIES_CSV',
      'AuditReport',
      vettedResult.batchNumber,
      `Exported ${vettedResult.discrepancies.length} discrepancy findings to CSV (PHI Masked: ${maskPhi}).`
    );
  };

  const handleAddCustomRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canModifyRules) {
      setStatusBanner({ type: 'error', text: `Role "${permissions.label}" cannot modify vetting rules.` });
      return;
    }
    const created: VettingRuleRecord = {
      ruleId: `rule_custom_${Date.now()}`,
      code: newRuleForm.code.trim().toUpperCase(),
      title: newRuleForm.title.trim().toUpperCase(),
      category: newRuleForm.category,
      severity: newRuleForm.severity,
      description: newRuleForm.description.trim(),
      criteriaSummary: newRuleForm.criteriaSummary.trim(),
      sourceDocument: 'Custom Auditor Instruction',
      isActive: true,
    };
    setRules((prev) => [created, ...prev]);
    setShowNewRuleModal(false);
    setNewRuleForm({
      code: `NHIS-R${rules.length + 2}`,
      title: '',
      category: 'Clinical',
      severity: 'high',
      description: '',
      criteriaSummary: '',
    });
    recordHipaaLog('CREATE_VETTING_RULE', 'VettingRule', created.code, `Created custom rule: ${created.title}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#overview"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('overview');
          }}
          className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          NHIS Claims Vetting Auditor
        </a>

        {/* Zone 2: 5 Concise Single-Line Nav Links */}
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'overview'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'rules'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            PDF Rules ({rules.filter((r) => r.isActive).length})
          </button>
          <button
            onClick={() => setActiveTab('claims')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'claims'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Claims Audit ({vettedResult.parsedClaimsCount})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'alerts'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Critical Alerts ({openAlertsCount})
          </button>
          <button
            onClick={() => setActiveTab('hipaa')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'hipaa'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            HIPAA & Access
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            onClick={handleExportPdf}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            Export Vetted PDF
          </button>
        </div>
      </header>

      {/* Secondary Workspace Context & Compliance Bar */}
      <div className="bg-slate-900 text-slate-200 px-6 py-2.5 border-b border-slate-800 text-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-white">{vettedResult.facilityName}</span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <span className="font-mono">Provider: {vettedResult.facilityCode}</span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <span className="font-mono">Batch: {vettedResult.batchNumber}</span>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <span className="font-mono text-emerald-400">{vettedResult.hipaaEncryptionHash}</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Role Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Active Role:</span>
            <select
              value={activeRole}
              onChange={(e) => {
                const newRole = e.target.value as UserRole;
                setActiveRole(newRole);
                recordHipaaLog('SWITCH_RBAC_ROLE', 'Session', newRole, `Switched active RBAC role to ${newRole}.`);
              }}
              aria-label="Select active RBAC role"
              className="bg-slate-800 text-white text-xs rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-slate-500"
            >
              <option value="admin">Admin (Full Access + PHI)</option>
              <option value="senior_auditor">Senior Auditor (Vetting + PHI)</option>
              <option value="claims_officer">Claims Officer (Masked PHI)</option>
              <option value="viewer">Viewer (Read-Only Masked)</option>
            </select>
          </div>

          {/* HIPAA PHI Masking Toggle */}
          <button
            onClick={handleToggleMaskPhi}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            {maskPhi ? <EyeOff className="w-3.5 h-3.5 text-emerald-400" /> : <Eye className="w-3.5 h-3.5 text-amber-400" />}
            <span>{maskPhi ? 'PHI Masked (Initials)' : 'PHI Unmasked (Full Names)'}</span>
          </button>

          {/* Cloud Auth Action */}
          {currentUser ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out ({currentUser.email?.split('@')[0]})</span>
            </button>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In for Cloud Sync</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Notification Banner */}
      {statusBanner && (
        <div
          className={`px-6 py-2.5 text-xs flex items-center justify-between border-b ${
            statusBanner.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-200'
              : statusBanner.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-slate-100 text-slate-800 border-slate-200'
          }`}
        >
          <span>{statusBanner.text}</span>
          <button
            onClick={() => setStatusBanner(null)}
            className="text-xs font-semibold underline ml-4 whitespace-nowrap"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6 space-y-6">
        {/* Top Action & File Ingestion Bar */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Automated NHIS Claims Vetting & Compliance Engine
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>PDF Source: {loadedPdfFileName}</span>
              <span aria-hidden="true">·</span>
              <span>XML Batch: {loadedXmlFileName}</span>
              <span aria-hidden="true">·</span>
              <span>Service Period: {vettedResult.serviceMonth}/{vettedResult.serviceYear}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExtractFromAttachedFiles}
              disabled={isExtractingPdf}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isExtractingPdf ? 'animate-spin' : ''}`} />
              {isExtractingPdf ? 'Extracting Rules...' : `Extract Rules from Files (${rules.length})`}
            </button>

            <input
              ref={pdfFileInputRef}
              type="file"
              accept=".pdf,.xml,.txt"
              multiple
              onChange={handlePdfUpload}
              className="hidden"
            />
            <button
              onClick={() => pdfFileInputRef.current?.click()}
              disabled={isExtractingPdf}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              Upload PDF / XML Files
            </button>

            <input
              ref={xmlFileInputRef}
              type="file"
              accept=".xml"
              onChange={handleXmlUpload}
              className="hidden"
            />
            <button
              onClick={() => xmlFileInputRef.current?.click()}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload NHIS XML Batch
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export CSV
            </button>

            <button
              onClick={handleSaveReportToCloud}
              className="px-3.5 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Save Report to Cloud
            </button>
          </div>
        </section>

        {/* High-Density KPI Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium">Audited XML Claims</p>
            <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {vettedResult.parsedClaimsCount}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {vettedResult.cleanClaimsCount} clean · {vettedResult.flaggedClaimsCount} flagged
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium">Submitted Claim Value</p>
            <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              GHS {vettedResult.calculatedSubmittedTotalGhs.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
              Serv: {vettedResult.calculatedSubmittedServiceGhs.toFixed(2)} · Med: {vettedResult.calculatedSubmittedMedicineGhs.toFixed(2)}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium">Total Vetting Adjustments</p>
            <p className="text-2xl font-bold text-red-700 font-mono tabular-nums mt-1">
              GHS {vettedResult.totalAdjustedGhs.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
              {vettedResult.discrepancies.length} discrepancy findings
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium">Net Amount Due After Vetting</p>
            <p className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
              GHS {vettedResult.netAmountDueGhs.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Compliance Rate: {vettedResult.complianceScorePercent}%
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium">Critical Findings</p>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
                {vettedResult.criticalAlertsCount}
              </p>
              <button
                onClick={() => setActiveTab('alerts')}
                className="text-xs font-medium text-slate-700 hover:text-slate-900 underline"
              >
                Review Alerts
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {openAlertsCount} open alerts requiring action
            </p>
          </div>
        </section>

        {/* TAB 1: OVERVIEW (Batch Trends, Vetting Summary Sheet & Numbered Reasons for Adjustments) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Five-Batch Compliance Rate & Claim Value Trend Visualization (Recharts) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    01. Multi-Batch Compliance Rate & Claim Value Trends (Last 5 Audited Batches)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tracks clean-claim compliance percentage alongside submitted, adjusted, and net approved claim values (GHS) across the five most recent NHIS batch audits.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-600 font-mono tabular-nums">
                    5-Batch Compliance Shift:{' '}
                    <span className={`font-bold ${complianceTrendDelta >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {complianceTrendDelta >= 0 ? `+${complianceTrendDelta}%` : `${complianceTrendDelta}%`}
                    </span>
                  </div>

                  {/* Interactive Chart Mode Toggle */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    <button
                      onClick={() => setTrendChartMode('split')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        trendChartMode === 'split'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Split Analytics View
                    </button>
                    <button
                      onClick={() => setTrendChartMode('combined')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        trendChartMode === 'combined'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Combined Dual-Axis View
                    </button>
                  </div>
                </div>
              </div>

              {trendChartMode === 'split' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart A: Compliance Rate Trend (%) */}
                  <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">
                          Clean-Claim Compliance Rate Trend (%)
                        </h3>
                        <p className="text-xs text-slate-500">
                          Percentage of batch claims passing all active NHIS PDF vetting instructions
                        </p>
                      </div>
                      <span className="text-sm font-bold font-mono tabular-nums text-emerald-700">
                        {vettedResult.complianceScorePercent}% Current
                      </span>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={lastFiveBatchesTrend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="complianceGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0f766e" stopOpacity={0.22} />
                              <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis
                            dataKey="period"
                            tick={{ fontSize: 11, fill: '#475569' }}
                            axisLine={{ stroke: '#cbd5e1' }}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tickFormatter={(v) => `${v}%`}
                            tick={{ fontSize: 11, fill: '#475569' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#f8fafc',
                              fontSize: '12px',
                              fontFamily: 'JetBrains Mono, monospace',
                            }}
                            formatter={(value: any, name: any) => [
                              `${Number(value).toFixed(1)}%`,
                              name === 'complianceRate' ? 'Compliance Rate' : name,
                            ]}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                          <ReferenceLine
                            y={75}
                            stroke="#d97706"
                            strokeDasharray="4 4"
                            label={{
                              value: 'NHIA Benchmark (75%)',
                              position: 'insideTopRight',
                              fill: '#b45309',
                              fontSize: 10,
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="complianceRate"
                            name="Compliance Rate (%)"
                            stroke="#0f766e"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#complianceGrad)"
                            activeDot={{ r: 5, fill: '#0f766e' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart B: Total Claim Value vs Net Vetted Payout & Adjustments (GHS) */}
                  <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">
                          Total Claim Value vs. Vetted Adjustments (GHS)
                        </h3>
                        <p className="text-xs text-slate-500">
                          Submitted claim value, net approved amount due, and disallowed adjustments
                        </p>
                      </div>
                      <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                        GHS {vettedResult.calculatedSubmittedTotalGhs.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={lastFiveBatchesTrend} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis
                            dataKey="period"
                            tick={{ fontSize: 11, fill: '#475569' }}
                            axisLine={{ stroke: '#cbd5e1' }}
                            tickLine={false}
                          />
                          <YAxis
                            tickFormatter={(v) => `${v}`}
                            tick={{ fontSize: 11, fill: '#475569' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#f8fafc',
                              fontSize: '12px',
                              fontFamily: 'JetBrains Mono, monospace',
                            }}
                            formatter={(value: any) => [`GHS ${Number(value).toFixed(2)}`]}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                          <Bar
                            dataKey="submittedValueGhs"
                            name="Submitted Value (GHS)"
                            fill="#0f172a"
                            radius={[4, 4, 0, 0]}
                            barSize={22}
                          />
                          <Bar
                            dataKey="netApprovedGhs"
                            name="Net Approved Due (GHS)"
                            fill="#059669"
                            radius={[4, 4, 0, 0]}
                            barSize={22}
                          />
                          <Line
                            type="monotone"
                            dataKey="adjustedValueGhs"
                            name="Disallowed Adjustments (GHS)"
                            stroke="#dc2626"
                            strokeWidth={2}
                            dot={{ r: 4, fill: '#dc2626' }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                /* Combined Dual-Axis View */
                <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">
                        Combined Dual-Axis View: Total Claim Value (GHS) & Compliance Rate (%)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Left axis shows financial claim volume in GHS; right axis tracks batch compliance percentage
                      </p>
                    </div>
                  </div>

                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={lastFiveBatchesTrend} margin={{ top: 10, right: 24, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                          dataKey="period"
                          tick={{ fontSize: 11, fill: '#475569' }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                        />
                        <YAxis
                          yAxisId="left"
                          tickFormatter={(v) => `GHS ${v}`}
                          tick={{ fontSize: 11, fill: '#475569' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          domain={[0, 100]}
                          tickFormatter={(v) => `${v}%`}
                          tick={{ fontSize: 11, fill: '#0f766e' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#f8fafc',
                            fontSize: '12px',
                            fontFamily: 'JetBrains Mono, monospace',
                          }}
                          formatter={(value: any, name: any) =>
                            String(name).includes('%')
                              ? [`${Number(value).toFixed(1)}%`, name]
                              : [`GHS ${Number(value).toFixed(2)}`, name]
                          }
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                        <Bar
                          yAxisId="left"
                          dataKey="submittedValueGhs"
                          name="Total Claim Value (GHS)"
                          fill="#0f172a"
                          radius={[4, 4, 0, 0]}
                          barSize={28}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="adjustedValueGhs"
                          name="Vetting Adjustments (GHS)"
                          fill="#dc2626"
                          radius={[4, 4, 0, 0]}
                          barSize={28}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="complianceRate"
                          name="Compliance Rate (%)"
                          stroke="#0f766e"
                          strokeWidth={3}
                          dot={{ r: 5, fill: '#0f766e' }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* 5-Batch Tabular Ledger Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                {lastFiveBatchesTrend.map((b, idx) => {
                  const isCurrent = idx === lastFiveBatchesTrend.length - 1;
                  return (
                    <div
                      key={b.batchId}
                      className={`p-3 rounded-lg border text-xs ${
                        isCurrent ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{b.period}</span>
                        <span
                          className={`font-mono font-bold tabular-nums ${
                            isCurrent ? 'text-emerald-400' : 'text-emerald-700'
                          }`}
                        >
                          {b.complianceRate.toFixed(1)}%
                        </span>
                      </div>
                      <p
                        className={`font-mono text-[11px] truncate mt-0.5 ${
                          isCurrent ? 'text-slate-300' : 'text-slate-500'
                        }`}
                        title={b.batchId}
                      >
                        {b.batchId}
                      </p>
                      <div
                        className={`flex items-center justify-between mt-2 pt-2 border-t font-mono tabular-nums ${
                          isCurrent ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <span>GHS {b.submittedValueGhs.toFixed(2)}</span>
                        <span className={isCurrent ? 'text-red-300' : 'text-red-700'}>
                          -{b.adjustedValueGhs.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Official NHIS Claims Vetting Summary Sheet */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    02. Claims Vetting Summary Sheet (XML Batch Execution)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Structured by Specialty across Out-Patient and In-Patient submissions, adjustments, and net amount due.
                  </p>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  PDF Reference Benchmark: {PDF_SOURCE_METADATA.claimMonth} · Grand Total GHS{' '}
                  {PDF_SOURCE_METADATA.grandTotalSubmittedGhs.toLocaleString()}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                      <th className="py-2.5 px-4">Specialty</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Attend.</th>
                      <th className="py-2.5 px-3 text-right">Sub. Service (GHC)</th>
                      <th className="py-2.5 px-3 text-right">Sub. Medicine (GHC)</th>
                      <th className="py-2.5 px-3 text-right">Sub. Total (GHC)</th>
                      <th className="py-2.5 px-3 text-right text-red-700">Adj. Service</th>
                      <th className="py-2.5 px-3 text-right text-red-700">Adj. Medicine</th>
                      <th className="py-2.5 px-3 text-right text-red-700">Adj. Total (GHC)</th>
                      <th className="py-2.5 px-4 text-right text-emerald-800">Amt Due (GHC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                    {vettedResult.specialtySummary.map((row) => (
                      <tr key={`${row.serviceType}_${row.specialty}`} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-sans font-medium text-slate-900">{row.specialty}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-500">{row.serviceType}</td>
                        <td className="py-2.5 px-3 text-right">{row.attendanceCount}</td>
                        <td className="py-2.5 px-3 text-right">{row.submittedServiceGhs.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right">{row.submittedMedicineGhs.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold">{row.submittedTotalGhs.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right text-red-700">{row.adjustedServiceGhs.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right text-red-700">{row.adjustedMedicineGhs.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-red-700">
                          {row.adjustedTotalGhs.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-800">
                          {row.dueTotalGhs.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-mono tabular-nums font-semibold">
                      <td className="py-3 px-4 font-sans" colSpan={2}>
                        BATCH GRAND TOTAL
                      </td>
                      <td className="py-3 px-3 text-right">{vettedResult.parsedClaimsCount}</td>
                      <td className="py-3 px-3 text-right">{vettedResult.calculatedSubmittedServiceGhs.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right">{vettedResult.calculatedSubmittedMedicineGhs.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right">{vettedResult.calculatedSubmittedTotalGhs.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right text-red-300">
                        {vettedResult.totalAdjustedServiceGhs.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-red-300">
                        {vettedResult.totalAdjustedMedicineGhs.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-red-300">{vettedResult.totalAdjustedGhs.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-emerald-300">{vettedResult.netAmountDueGhs.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Numbered Reasons for Adjustments (Matching Pages 2-7 of the NHIS PDF Report) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    03. Detailed Reasons for Adjustments (PDF Vetting Instructions Applied to XML)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Each section below corresponds to an extracted NHIS PDF instruction and lists the specific XML claims flagged.
                  </p>
                </div>
              </div>

              {vettedResult.ruleBreakdown.map((rb, idx) => (
                <div key={rb.ruleCode} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {idx + 1}. {rb.ruleTitle}:{' '}
                        <span className="font-normal italic text-slate-700">
                          {rb.affectedClaimsCount} claim(s) affected in batch, at a total adjustment of GHS{' '}
                          {rb.totalCostGhs.toFixed(2)}
                        </span>
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-mono">{rb.ruleCode}</span>
                        <span aria-hidden="true">·</span>
                        <span>Category: {rb.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>Severity: {rb.severity.toUpperCase()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedRuleFilter(rb.ruleCode);
                        setClaimStatusFilter('flagged');
                        setActiveTab('claims');
                      }}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                    >
                      <span>Inspect in Claims Auditor</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-600 bg-white">
                          <th className="py-2 px-4">Name</th>
                          <th className="py-2 px-3">Claim ID</th>
                          <th className="py-2 px-3">NHIS No.</th>
                          <th className="py-2 px-3">Folder No.</th>
                          <th className="py-2 px-3">Attendance Date</th>
                          <th className="py-2 px-4">Specific Discrepancy Finding</th>
                          <th className="py-2 px-4 text-right">Adjustment (GHS)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rb.discrepancies.map((d) => (
                          <tr key={d.id} className="hover:bg-slate-50">
                            <td className="py-2 px-4 font-medium text-slate-900">
                              {maskPhi ? d.patientInitials : d.patientFullName}
                            </td>
                            <td className="py-2 px-3 font-mono">
                              <button
                                onClick={() => {
                                  const found = vettedResult.claims.find((c) => c.claimId === d.claimId);
                                  if (found) setInspectedClaim(found);
                                }}
                                className="text-slate-900 underline hover:text-emerald-700"
                              >
                                {d.claimId}
                              </button>
                            </td>
                            <td className="py-2 px-3 font-mono">{d.memberNumber}</td>
                            <td className="py-2 px-3 font-mono">{d.hospitalRecordNumber}</td>
                            <td className="py-2 px-3 font-mono">{d.attendanceDate}</td>
                            <td className="py-2 px-4 text-slate-700">{d.specificFinding}</td>
                            <td className="py-2 px-4 text-right font-mono tabular-nums font-semibold text-red-700">
                              {d.financialAdjustmentGhs.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PDF VETTING RULES & EXTRACTION ENGINE */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            {/* Multi-File Rule Extraction Header & Summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Extracted NHIS Vetting Rules & File Provenance Catalog ({rules.length} Consolidated Rules)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Extracted from {PDF_SOURCE_METADATA.documentTitle} ({PDF_SOURCE_METADATA.claimMonth}) and validated against XML batch {loadedXmlFileName}.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleExtractFromAttachedFiles}
                    disabled={isExtractingPdf}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isExtractingPdf ? 'animate-spin' : ''}`} />
                    {isExtractingPdf ? 'Extracting Rules...' : 'Re-Extract from Attached Files (9 PDFs + XML)'}
                  </button>
                  <button
                    onClick={() => pdfFileInputRef.current?.click()}
                    disabled={isExtractingPdf}
                    className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Additional PDF / XML Files
                  </button>
                  <button
                    onClick={() => {
                      exportExtractedRulesToCsv(rules, vettedResult);
                      recordHipaaLog(
                        'EXPORT_RULES_CATALOG_CSV',
                        'VettingRuleCatalog',
                        loadedPdfFileName,
                        `Exported ${rules.length} extracted NHIS vetting rules to CSV.`
                      );
                    }}
                    className="px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Export Rules (CSV)
                  </button>
                  <button
                    onClick={() => setShowNewRuleModal(true)}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Custom Rule
                  </button>
                </div>
              </div>

              {/* Provenance KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Extracted Vetting Rules</p>
                  <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                    {rules.filter((r) => r.isActive).length} / {rules.length} Active
                  </p>
                  <p className="text-[11px] text-slate-500">NHIS-R01 through NHIS-R19</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Source PDF Reports Analyzed</p>
                  <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                    9 Monthly PDFs
                  </p>
                  <p className="text-[11px] text-slate-500">Jul 2025 – May 2026 (03-BA-00415)</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-xs text-slate-500">PDF Historical Discrepancies</p>
                  <p className="text-lg font-bold font-mono tabular-nums text-amber-700 mt-0.5">
                    {rules.reduce((acc, r) => acc + (r.pdfAffectedCount || 0), 0).toLocaleString()} Claims
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    GHS {rules.reduce((acc, r) => acc + (r.pdfTotalCostGhs || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} total adjusted
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Live XML Batch Rule Matches</p>
                  <p className="text-lg font-bold font-mono tabular-nums text-red-700 mt-0.5">
                    {vettedResult.discrepancies.length} Findings
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {vettedResult.ruleBreakdown.length} rules triggered · GHS {vettedResult.totalAdjustedGhs.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Filter & Search Bar for Extracted Rules */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  {(['ALL', 'Clinical', 'Pharmacy', 'Tariff', 'Membership', 'Documentation'] as const).map((cat) => {
                    const count = cat === 'ALL' ? rules.length : rules.filter((r) => r.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setRuleCategoryFilter(cat)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                          ruleCategoryFilter === cat
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {cat === 'ALL' ? 'All Categories' : cat} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="relative min-w-[240px] flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ruleSearchQuery}
                    onChange={(e) => setRuleSearchQuery(e.target.value)}
                    placeholder="Filter extracted rules by code, drug, ICD-10, or G-DRG..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            {pdfExtractionMessage && (
              <div className="bg-slate-900 text-white px-5 py-3 rounded-xl text-xs flex items-center justify-between">
                <span>{pdfExtractionMessage}</span>
                <button onClick={() => setPdfExtractionMessage(null)} className="underline ml-4 whitespace-nowrap">
                  Dismiss
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules
                .filter((rule) => {
                  if (ruleCategoryFilter !== 'ALL' && rule.category !== ruleCategoryFilter) return false;
                  if (ruleSearchQuery.trim()) {
                    const q = ruleSearchQuery.toLowerCase();
                    return (
                      rule.code.toLowerCase().includes(q) ||
                      rule.title.toLowerCase().includes(q) ||
                      rule.description.toLowerCase().includes(q) ||
                      rule.criteriaSummary.toLowerCase().includes(q)
                    );
                  }
                  return true;
                })
                .map((rule) => {
                  const xmlBreakdown = vettedResult.ruleBreakdown.find((rb) => rb.ruleCode === rule.code);
                  return (
                    <div
                      key={rule.ruleId}
                      className={`bg-white border rounded-xl p-5 flex flex-col justify-between transition-opacity ${
                        rule.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span className="font-mono font-bold text-slate-900">{rule.code}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-slate-700">{rule.category}</span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={
                                  rule.severity === 'critical'
                                    ? 'text-red-700 font-semibold'
                                    : rule.severity === 'high'
                                    ? 'text-amber-700 font-semibold'
                                    : 'text-slate-600'
                                }
                              >
                                {rule.severity.toUpperCase()}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 mt-1">{rule.title}</h3>
                          </div>

                          <button
                            onClick={() => {
                              if (!permissions.canModifyRules) {
                                setStatusBanner({
                                  type: 'error',
                                  text: `Role "${permissions.label}" cannot toggle active vetting rules.`,
                                });
                                return;
                              }
                              setRules((prev) =>
                                prev.map((r) => (r.ruleId === rule.ruleId ? { ...r, isActive: !r.isActive } : r))
                              );
                            }}
                            className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                              rule.isActive
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {rule.isActive ? 'Active' : 'Disabled'}
                          </button>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">{rule.description}</p>
                        <div className="pt-2.5 border-t border-slate-100">
                          <p className="text-xs font-semibold text-slate-800">
                            Extracted PDF Vetting Instructions & XML Validation Criteria:
                          </p>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-line">
                            {rule.criteriaSummary}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                          <span className="text-slate-500 truncate" title={rule.sourceDocument}>
                            Source: {rule.sourceDocument}
                          </span>
                          {rule.pdfAffectedCount !== undefined && (
                            <span className="text-slate-600">
                              PDF Total: {rule.pdfAffectedCount} claims (GHS {rule.pdfTotalCostGhs?.toFixed(2)})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs">
                          <span className="font-mono text-slate-700">
                            XML Batch Matches:{' '}
                            <strong className={xmlBreakdown ? 'text-red-700' : 'text-emerald-700'}>
                              {xmlBreakdown
                                ? `${xmlBreakdown.affectedClaimsCount} claim(s) · -GHS ${xmlBreakdown.totalCostGhs.toFixed(2)}`
                                : '0 claims (100% compliant)'}
                            </strong>
                          </span>
                          {xmlBreakdown && (
                            <button
                              onClick={() => {
                                setSelectedRuleFilter(rule.code);
                                setClaimStatusFilter('flagged');
                                setActiveTab('claims');
                              }}
                              className="font-semibold text-slate-900 hover:text-emerald-700 underline flex items-center gap-1 whitespace-nowrap"
                            >
                              <span>Inspect Claims</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 3: CLAIMS AUDIT WORKBENCH */}
        {activeTab === 'claims' && (
          <div className="space-y-4">
            {/* Filter Controls */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={claimSearch}
                  onChange={(e) => setClaimSearch(e.target.value)}
                  placeholder="Search Claim ID, NHIS Member No, Folder No, ICD-10, G-DRG, or Medicine Code..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Segmented Filter Control */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    onClick={() => setClaimStatusFilter('flagged')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      claimStatusFilter === 'flagged'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Flagged ({vettedResult.flaggedClaimsCount})
                  </button>
                  <button
                    onClick={() => setClaimStatusFilter('clean')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      claimStatusFilter === 'clean'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Clean ({vettedResult.cleanClaimsCount})
                  </button>
                  <button
                    onClick={() => setClaimStatusFilter('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      claimStatusFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({vettedResult.parsedClaimsCount})
                  </button>
                </div>

                <select
                  value={selectedRuleFilter}
                  onChange={(e) => setSelectedRuleFilter(e.target.value)}
                  aria-label="Filter by NHIS rule"
                  className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-slate-900"
                >
                  <option value="ALL">All {rules.length} Vetting Rules</option>
                  {rules.map((r) => (
                    <option key={r.ruleId} value={r.code}>
                      {r.code}: {r.title}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedSeverityFilter}
                  onChange={(e) => setSelectedSeverityFilter(e.target.value)}
                  aria-label="Filter by severity"
                  className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:border-slate-900"
                >
                  <option value="ALL">All Severities</option>
                  <option value="critical">Critical Only</option>
                  <option value="high">High Only</option>
                  <option value="medium">Medium Only</option>
                </select>
              </div>
            </div>

            {/* Claims Data Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                      <th className="py-2.5 px-4">Claim ID</th>
                      <th className="py-2.5 px-3">Patient</th>
                      <th className="py-2.5 px-3">NHIS Member No</th>
                      <th className="py-2.5 px-3">Folder No</th>
                      <th className="py-2.5 px-3">Age / Sex</th>
                      <th className="py-2.5 px-3">G-DRG / Spec.</th>
                      <th className="py-2.5 px-4">Primary ICD-10 Diagnosis</th>
                      <th className="py-2.5 px-3 text-right">Billed (GHC)</th>
                      <th className="py-2.5 px-4">Vetting Findings</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredClaims.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-10 text-center text-slate-500">
                          No XML claims match the current filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredClaims.map((claim) => {
                        const claimDiscs = discrepanciesByClaim.get(claim.claimId) || [];
                        const primaryDiag =
                          claim.treatments.find((t) => t.type === 'Diagnosis')?.icdCode ||
                          claim.treatments[0]?.treatmentCode ||
                          'Procedure';
                        return (
                          <tr key={claim.claimId} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">{claim.claimId}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">
                              {maskPhi ? claim.initials : claim.fullName}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">{claim.memberNumber}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">{claim.hospitalRecordNumber}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              {claim.ageYears}y · {claim.gender}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">
                              {claim.inPatientCode || claim.outPatientCode} · {claim.serviceType}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 max-w-[240px] truncate" title={primaryDiag}>
                              {primaryDiag}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                              {claim.grandTotalCost.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-4">
                              {claimDiscs.length === 0 ? (
                                <span className="text-emerald-700 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Passed Vetting
                                </span>
                              ) : (
                                <div className="space-y-0.5">
                                  {claimDiscs.map((d) => (
                                    <div key={d.id} className="text-xs text-red-700 font-medium">
                                      {d.ruleCode}: {d.ruleTitle} (-GHS {d.financialAdjustmentGhs.toFixed(2)})
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                onClick={() => setInspectedClaim(claim)}
                                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap"
                              >
                                Inspect XML
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUTOMATED CRITICAL ALERTS */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Automated Compliance & Billing Discrepancy Alerts
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time alerts triggered for Critical and High-severity NHIS compliance violations across the batch.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  {(['all', 'open', 'acknowledged', 'resolved'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setAlertFilter(st)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 ${
                        alertFilter === st
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st} ({st === 'all' ? alerts.length : alerts.filter((a) => a.status === st).length})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
              {filteredAlerts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No alerts in "{alertFilter}" state.
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <div
                    key={alert.alertId}
                    className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <AlertTriangle
                          className={`w-4 h-4 shrink-0 ${
                            alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                          }`}
                        />
                        <span
                          className={`font-bold uppercase ${
                            alert.severity === 'critical' ? 'text-red-700' : 'text-amber-700'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span aria-hidden="true" className="text-slate-400">·</span>
                        <span className="font-mono font-semibold text-slate-900">{alert.claimId}</span>
                        <span aria-hidden="true" className="text-slate-400">·</span>
                        <span className="font-mono text-slate-500">Attendance: {alert.attendanceDate}</span>
                        <span aria-hidden="true" className="text-slate-400">·</span>
                        <span className="font-mono font-semibold text-red-700">
                          Impact: GHS {alert.financialImpact.toFixed(2)}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">{alert.title}</h3>
                      <p className="text-xs text-slate-600">{alert.message}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          const found = vettedResult.claims.find((c) => c.claimId === alert.claimId);
                          if (found) setInspectedClaim(found);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Inspect Claim
                      </button>

                      {alert.status !== 'resolved' && (
                        <button
                          onClick={() => {
                            if (!permissions.canResolveAlerts) {
                              setStatusBanner({
                                type: 'error',
                                text: `Role "${permissions.label}" cannot modify alert state.`,
                              });
                              return;
                            }
                            const nextStatus = alert.status === 'open' ? 'acknowledged' : 'resolved';
                            setAlerts((prev) =>
                              prev.map((a) => (a.alertId === alert.alertId ? { ...a, status: nextStatus } : a))
                            );
                            recordHipaaLog(
                              `ALERT_${nextStatus.toUpperCase()}`,
                              'ComplianceAlert',
                              alert.alertId,
                              `Updated alert ${alert.alertId} status to ${nextStatus}.`
                            );
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
                        >
                          {alert.status === 'open' ? 'Acknowledge' : 'Mark Resolved'}
                        </button>
                      )}
                      {alert.status === 'resolved' && (
                        <span className="text-xs font-semibold text-emerald-700 px-2 py-1">Resolved</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: HIPAA COMPLIANCE, RBAC & SAVED REPORTS */}
        {activeTab === 'hipaa' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: RBAC Matrix & HIPAA Safeguards */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <h2 className="text-base font-bold text-slate-900">
                  Role-Based Access Control (RBAC) Matrix
                </h2>
                <p className="text-xs text-slate-600">
                  Active Session Role: <strong className="text-slate-900">{permissions.label}</strong>
                </p>

                <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-600">Unmask Patient PHI (Full Names)</span>
                    <span className="font-mono font-semibold">
                      {permissions.canUnmaskPhi ? 'ALLOWED' : 'RESTRICTED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-600">Modify / Add Vetting Rules</span>
                    <span className="font-mono font-semibold">
                      {permissions.canModifyRules ? 'ALLOWED' : 'RESTRICTED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-600">Acknowledge & Resolve Alerts</span>
                    <span className="font-mono font-semibold">
                      {permissions.canResolveAlerts ? 'ALLOWED' : 'RESTRICTED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-600">Lock Terminal Audit Reports</span>
                    <span className="font-mono font-semibold">
                      {permissions.canLockReports ? 'ALLOWED' : 'RESTRICTED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Saved Cloud Audit Reports */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">Saved Cloud Audit Reports</h2>
                  <span className="text-xs font-mono text-slate-500">{savedReports.length} saved</span>
                </div>
                {!currentUser ? (
                  <p className="text-xs text-slate-500">
                    Sign in with Google to persist and lock vetted batch reports in Firestore.
                  </p>
                ) : savedReports.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No saved reports yet. Click "Save Report to Cloud" above to store the current batch audit.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {savedReports.map((rep) => (
                      <div key={rep.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <p className="font-mono font-semibold text-slate-900">{rep.batchNumber}</p>
                          <p className="text-slate-500">
                            {rep.totalClaims} claims · Adj: GHS {Number(rep.estimatedAdjustmentAmount || 0).toFixed(2)} · Status:{' '}
                            <strong className="uppercase">{rep.status}</strong>
                          </p>
                        </div>
                        {rep.status !== 'locked' ? (
                          <button
                            onClick={() => handleLockSavedReport(rep.id)}
                            className="px-2.5 py-1 text-xs font-medium bg-slate-900 text-white rounded flex items-center gap-1 whitespace-nowrap"
                          >
                            <Lock className="w-3 h-3" />
                            Lock
                          </button>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-1 font-mono">
                            <Lock className="w-3 h-3" />
                            LOCKED
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Column 2 & 3: Immutable HIPAA Audit Trail */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Immutable HIPAA Security & Access Audit Trail
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Every PHI access toggle, XML upload, PDF rule extraction, and report export is logged with actor role and timestamp.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500">{auditLogs.length} events</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                      <th className="py-2.5 px-4">Timestamp</th>
                      <th className="py-2.5 px-3">Actor / Role</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Resource</th>
                      <th className="py-2.5 px-4">Compliance Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {auditLogs.map((log) => (
                      <tr key={log.logId} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-slate-900">{log.actorName}</span>
                          <span className="text-slate-400"> · {log.actorRole}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{log.action}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {log.resourceType} ({log.resourceId})
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Inspect Individual Claim XML & AI Remediation */}
      {inspectedClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Claim Audit Inspector · <span className="font-mono">{inspectedClaim.claimId}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Patient: {maskPhi ? inspectedClaim.initials : inspectedClaim.fullName} · NHIS No:{' '}
                  <span className="font-mono">{inspectedClaim.memberNumber}</span> · Folder:{' '}
                  <span className="font-mono">{inspectedClaim.hospitalRecordNumber}</span> · Age:{' '}
                  {inspectedClaim.ageYears} yrs ({inspectedClaim.gender})
                </p>
              </div>
              <button
                onClick={() => {
                  setInspectedClaim(null);
                  setRemediationData(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Discrepancies on this claim */}
              {(() => {
                const claimDiscs = discrepanciesByClaim.get(inspectedClaim.claimId) || [];
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">
                        Vetting Findings ({claimDiscs.length})
                      </h4>
                      {claimDiscs.length > 0 && (
                        <button
                          onClick={() => handleGenerateRemediation(inspectedClaim, claimDiscs)}
                          disabled={remediationData?.loading}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          {remediationData?.loading
                            ? 'Analyzing De-Identified Claim...'
                            : 'Generate Clinical Remediation Guidance'}
                        </button>
                      )}
                    </div>

                    {claimDiscs.length === 0 ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                        This claim passed all 15 NHIS PDF vetting instructions with zero adjustments.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {claimDiscs.map((d) => (
                          <div key={d.id} className="p-3.5 bg-red-50/70 border border-red-200 rounded-lg space-y-1">
                            <div className="flex items-center justify-between font-semibold text-red-900">
                              <span>
                                {d.ruleCode} — {d.ruleTitle} ({d.adjustmentType})
                              </span>
                              <span className="font-mono">-GHS {d.financialAdjustmentGhs.toFixed(2)}</span>
                            </div>
                            <p className="text-slate-800">{d.specificFinding}</p>
                            <p className="text-slate-600 font-mono">{d.evidenceDetail}</p>
                            <p className="text-emerald-900 font-medium pt-1">
                              Auditor Action: {d.recommendedAction}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {remediationData && remediationData.claimId === inspectedClaim.claimId && !remediationData.loading && (
                      <div className="p-4 bg-slate-900 text-slate-100 rounded-lg space-y-2">
                        <p className="font-bold text-emerald-400">
                          HIPAA Safe-Harbor De-Identified Remediation Note
                        </p>
                        {remediationData.error ? (
                          <p className="text-red-300">{remediationData.error}</p>
                        ) : (
                          <>
                            <p>
                              <strong className="text-white">Root Cause:</strong> {remediationData.rootCause}
                            </p>
                            <p>
                              <strong className="text-white">Corrective Action:</strong>{' '}
                              {remediationData.correctiveAction}
                            </p>
                            <p>
                              <strong className="text-white">NHIS Policy Reference:</strong>{' '}
                              {remediationData.nhisPolicyReference}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Treatments & Diagnoses */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">
                  Billed Treatments, Procedures & ICD-10 Diagnoses ({inspectedClaim.treatments.length})
                </h4>
                <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">G-DRG Treatment Code</th>
                      <th className="py-2 px-3">ICD-10 Code & Description</th>
                      <th className="py-2 px-3 text-right">Tariff (GHC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {inspectedClaim.treatments.map((t, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-sans">{t.type}</td>
                        <td className="py-2 px-3 font-semibold">{t.treatmentCode}</td>
                        <td className="py-2 px-3 font-sans">{t.icdCode || '—'}</td>
                        <td className="py-2 px-3 text-right">{t.tariff.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Dispensed Medicines */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">
                  Dispensed Medicines & Prescriptions ({inspectedClaim.medicines.length})
                </h4>
                {inspectedClaim.medicines.length === 0 ? (
                  <p className="text-slate-500">No medicines billed on this claim.</p>
                ) : (
                  <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Medicine Code</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Prescription Regimen</th>
                        <th className="py-2 px-3 text-right">Dispensed Qty</th>
                        <th className="py-2 px-3 text-right">Unit Price</th>
                        <th className="py-2 px-3 text-right">Total (GHC)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {inspectedClaim.medicines.map((m, i) => (
                        <tr key={i}>
                          <td className="py-2 px-3 font-semibold">{m.medicineCode}</td>
                          <td className="py-2 px-3">{m.medicineDate}</td>
                          <td className="py-2 px-3 font-sans">
                            {m.dose} × {m.frequency}/day for {m.duration}d
                          </td>
                          <td className="py-2 px-3 text-right">{m.quantity}</td>
                          <td className="py-2 px-3 text-right">{m.unitPrice.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-semibold">{m.medicineTotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Custom Vetting Rule */}
      {showNewRuleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddCustomRule}
            className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Custom NHIS Vetting Rule</h3>
              <button
                type="button"
                onClick={() => setShowNewRuleModal(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rule Code</label>
                <input
                  type="text"
                  required
                  value={newRuleForm.code}
                  onChange={(e) => setNewRuleForm({ ...newRuleForm, code: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={newRuleForm.category}
                  onChange={(e) => setNewRuleForm({ ...newRuleForm, category: e.target.value as RuleCategory })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="Clinical">Clinical</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Tariff">Tariff</option>
                  <option value="Membership">Membership</option>
                  <option value="Documentation">Documentation</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Rule Title</label>
              <input
                type="text"
                required
                placeholder="e.g. UNJUSTIFIED POLY-INVESTIGATION"
                value={newRuleForm.title}
                onChange={(e) => setNewRuleForm({ ...newRuleForm, title: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                required
                rows={2}
                value={newRuleForm.description}
                onChange={(e) => setNewRuleForm({ ...newRuleForm, description: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Actionable Criteria Summary</label>
              <textarea
                required
                rows={2}
                value={newRuleForm.criteriaSummary}
                onChange={(e) => setNewRuleForm({ ...newRuleForm, criteriaSummary: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewRuleModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                Save & Apply Rule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quiet Compliance Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <div>
          NHIS Claims Vetting & Compliance Auditor · HIPAA Minimum Necessary & Safe-Harbor De-Identification Enforced
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleExportPdf} className="hover:text-slate-900 underline">
            Download Official PDF Report
          </button>
          <button onClick={handleExportCsv} className="hover:text-slate-900 underline">
            Download Discrepancy CSV
          </button>
        </div>
      </footer>
    </div>
  );
}
