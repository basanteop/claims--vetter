import { VettingRuleRecord } from '../types/nhis';

export interface HistoricalBatchTrendItem {
  batchId: string;
  batchLabel: string;
  period: string;
  submissionDate: string;
  reportDate: string;
  totalClaims: number;
  flaggedClaims: number;
  complianceRate: number;
  submittedValueGhs: number;
  adjustedValueGhs: number;
  netApprovedGhs: number;
  rulesTriggeredCount: number;
}

// Authentic 9-Month Vetted Claims Report History extracted directly from the attached NHIS PDFs (July 2025 – May 2026)
export const HISTORICAL_AUDITED_BATCHES: HistoricalBatchTrendItem[] = [
  {
    batchId: 'NHIS-2025-07 (03-BA-00415)',
    batchLabel: 'July 2025',
    period: 'Jul 2025',
    submissionDate: '10th Oct 2025',
    reportDate: '24th Oct 2025',
    totalClaims: 6212,
    flaggedClaims: 578,
    complianceRate: 90.7,
    submittedValueGhs: 540484.22,
    adjustedValueGhs: 29405.34,
    netApprovedGhs: 511078.88,
    rulesTriggeredCount: 16,
  },
  {
    batchId: 'NHIS-2025-08 (03-BA-00415)',
    batchLabel: 'August 2025',
    period: 'Aug 2025',
    submissionDate: '30th Sep 2025',
    reportDate: '6th Nov 2025',
    totalClaims: 5710,
    flaggedClaims: 416,
    complianceRate: 92.7,
    submittedValueGhs: 517511.16,
    adjustedValueGhs: 26348.61,
    netApprovedGhs: 491162.55,
    rulesTriggeredCount: 12,
  },
  {
    batchId: 'NHIS-2025-09 (03-BA-00415)',
    batchLabel: 'September 2025',
    period: 'Sep 2025',
    submissionDate: '6th Nov 2025',
    reportDate: '4th Dec 2025',
    totalClaims: 5580,
    flaggedClaims: 500,
    complianceRate: 91.0,
    submittedValueGhs: 466295.42,
    adjustedValueGhs: 18065.11,
    netApprovedGhs: 448230.31,
    rulesTriggeredCount: 15,
  },
  {
    batchId: 'NHIS-2025-10 (03-BA-00415)',
    batchLabel: 'October 2025',
    period: 'Oct 2025',
    submissionDate: '25th Nov 2025',
    reportDate: '12th Jan 2026',
    totalClaims: 6110,
    flaggedClaims: 672,
    complianceRate: 89.0,
    submittedValueGhs: 518108.97,
    adjustedValueGhs: 33246.41,
    netApprovedGhs: 484862.56,
    rulesTriggeredCount: 17,
  },
  {
    batchId: 'NHIS-2025-11 (03-BA-00415)',
    batchLabel: 'November 2025',
    period: 'Nov 2025',
    submissionDate: '30th Dec 2025',
    reportDate: '10th Feb 2026',
    totalClaims: 6405,
    flaggedClaims: 359,
    complianceRate: 94.4,
    submittedValueGhs: 516313.77,
    adjustedValueGhs: 19202.78,
    netApprovedGhs: 497110.99,
    rulesTriggeredCount: 18,
  },
  {
    batchId: 'NHIS-2025-12 (03-BA-00415)',
    batchLabel: 'December 2025',
    period: 'Dec 2025',
    submissionDate: '12th Mar 2026',
    reportDate: '21st Apr 2026',
    totalClaims: 5873,
    flaggedClaims: 449,
    complianceRate: 92.4,
    submittedValueGhs: 512058.19,
    adjustedValueGhs: 19156.66,
    netApprovedGhs: 492901.53,
    rulesTriggeredCount: 18,
  },
  {
    batchId: 'NHIS-2026-01 (03-BA-00415)',
    batchLabel: 'January 2026',
    period: 'Jan 2026',
    submissionDate: '10th Apr 2026',
    reportDate: '25th May 2026',
    totalClaims: 5758,
    flaggedClaims: 189,
    complianceRate: 96.7,
    submittedValueGhs: 460449.32,
    adjustedValueGhs: 12011.71,
    netApprovedGhs: 448437.61,
    rulesTriggeredCount: 12,
  },
  {
    batchId: 'NHIS-2026-02 (03-BA-00415)',
    batchLabel: 'February 2026',
    period: 'Feb 2026',
    submissionDate: '17th Apr 2026',
    reportDate: '5th Jun 2026',
    totalClaims: 5406,
    flaggedClaims: 300,
    complianceRate: 94.5,
    submittedValueGhs: 411413.85,
    adjustedValueGhs: 17226.42,
    netApprovedGhs: 394187.43,
    rulesTriggeredCount: 16,
  },
  {
    batchId: 'NHIS-2026-03 (03-BA-00415)',
    batchLabel: 'March 2026',
    period: 'Mar 2026',
    submissionDate: '13th May 2026',
    reportDate: '18th Jun 2026',
    totalClaims: 5808,
    flaggedClaims: 125,
    complianceRate: 97.8,
    submittedValueGhs: 463886.07,
    adjustedValueGhs: 5501.74,
    netApprovedGhs: 458384.33,
    rulesTriggeredCount: 10,
  },
  {
    batchId: 'NHIS-2026-04 (03-BA-00415)',
    batchLabel: 'April 2026',
    period: 'Apr 2026',
    submissionDate: '24th Jun 2026',
    reportDate: '24th Jul 2026',
    totalClaims: 6256,
    flaggedClaims: 259,
    complianceRate: 95.9,
    submittedValueGhs: 476250.12,
    adjustedValueGhs: 17493.83,
    netApprovedGhs: 458756.29,
    rulesTriggeredCount: 11,
  },
  {
    batchId: 'NHIS-2026-05 (03-BA-00415)',
    batchLabel: 'May 2026',
    period: 'May 2026',
    submissionDate: '7th Aug 2026',
    reportDate: '4th Sep 2026',
    totalClaims: 6527,
    flaggedClaims: 372,
    complianceRate: 94.3,
    submittedValueGhs: 565794.54,
    adjustedValueGhs: 15707.23,
    netApprovedGhs: 550087.31,
    rulesTriggeredCount: 15,
  },
];

export const PDF_SOURCE_METADATA = {
  documentTitle: 'CONSOLIDATED NHIS REPORTS ON VETTED CLAIMS — ST JOHN OF GOD HOSPITAL (DUAYAW NKWANTA)',
  providerCode: '03-BA-00415',
  claimMonth: 'JULY 2025 – MAY 2026 (9 REPORTS)',
  submissionDate: 'Oct 2025 – Aug 2026',
  reportDate: 'Oct 2025 – Sep 2026',
  issuer: 'NHIA, ECLAIMS',
  grandTotalAttendance: 59645,
  grandTotalSubmittedGhs: 5448565.63,
  grandTotalAdjustedGhs: 213365.84,
  grandTotalDueGhs: 5235199.79,
};

// Complete Master Set of 19 Vetting Rules extracted across all 9 attached NHIS PDF Reports (July 2025 – May 2026)
export const DEFAULT_PDF_VETTING_RULES: VettingRuleRecord[] = [
  {
    ruleId: 'rule_nhis_01',
    code: 'NHIS-R01',
    title: 'AGE TREATMENT MISMATCH',
    category: 'Clinical',
    severity: 'high',
    description:
      'Treatments, G-DRG age suffixes, or medicine formulations dispensed did not match the ages of respective patients.',
    criteriaSummary:
      '• Carbocisteine Paediatric Syrup (125mg/5mL) prescribed for children ≤2 years or for adults.\n• Albendazole Syrup (100mg/5mL) prescribed for a 1-year-old child.\n• Amoxicillin + Clavulanic Acid Suspension, Metronidazole Suspension, Artemether + Lumefantrine Suspension, or Multivitamin Syrup prescribed for adults (≥18 yrs).\n• Artemether + Lumefantrine paediatric pack (12s) prescribed for an elderly adult (75 yrs), or Adult G-DRG suffix (A) applied to paediatric patients (<12 yrs).',
    sourceDocument: 'Extracted from Jul, Aug, Sep, Oct, Dec 2025 & Jan, Feb, May 2026 PDFs',
    isActive: true,
    pdfAffectedCount: 87,
    pdfTotalCostGhs: 1291.39,
  },
  {
    ruleId: 'rule_nhis_02',
    code: 'NHIS-R02',
    title: 'BENEFIT NOT COVERED UNDER NHIS',
    category: 'Clinical',
    severity: 'critical',
    description:
      'Diagnoses stated on the claim form are excluded from the benefit package covered under the NHIS.',
    criteriaSummary:
      '• Billed for Female Infertility (ICD-10 N97.9), which is not part of the NHIS benefits package.\n• Billed for Tuberculosis (covered under Vertical National TB Control Programme, not NHIS claims reimbursement).',
    sourceDocument: 'Extracted from Jul, Sep, Oct, Nov, Dec 2025 & May 2026 PDFs',
    isActive: true,
    pdfAffectedCount: 25,
    pdfTotalCostGhs: 665.71,
  },
  {
    ruleId: 'rule_nhis_03',
    code: 'NHIS-R03',
    title: 'DUPLICATION OF MEDICINES',
    category: 'Pharmacy',
    severity: 'high',
    description:
      'Medicines prescribed were duplicated on the same claim form, same attendance date, or overlapping episode.',
    criteriaSummary:
      '• Paracetamol 500mg (1g tds x 5), Amoxicillin + Clavulanic Acid 625mg (bd x 7), or Ciprofloxacin 500mg (bd x 7) billed twice on the same claim/date.\n• Ciprofloxacin Infusion (400mg bd x 2), Amoxicillin + Clavulanic Acid Injection 1.2g, Cefuroxime Injection 750mg, Ceftriaxone Injection 1g, Cefotaxime Injection 1g, Clindamycin Injection, or Hyoscine Butylbromide Injection billed twice on the same day.\n• Clindamycin capsule 150mg (300mg qid x 7) repeated within 3 days.\n• Normal Saline 0.9%, Ringer Lactate, Dextrose in Normal Saline, Diclofenac Gel, Aspirin 75mg, or Soluble Insulin HM duplicated on the same claim.',
    sourceDocument: 'Extracted from Jul, Aug, Sep, Oct, Nov, Dec 2025 & Jan, Feb, Apr, May 2026 PDFs',
    isActive: true,
    pdfAffectedCount: 147,
    pdfTotalCostGhs: 6040.82,
  },
  {
    ruleId: 'rule_nhis_04',
    code: 'NHIS-R04',
    title: 'INACTIVE MEMBER',
    category: 'Membership',
    severity: 'critical',
    description:
      'NHIS membership numbers submitted for reimbursement were not active subscribers at the time of service. All such claims are rejected in full.',
    criteriaSummary:
      '• Full rejection of claims where MemberNumber is an expired/unverified 10-digit legacy subscriber ID (starting with "00") or inactive NHIA membership record.',
    sourceDocument: 'Extracted from Jul, Sep, Oct, Nov, Dec 2025 & Jan, Feb, Mar, Apr, May 2026 PDFs',
    isActive: true,
    pdfAffectedCount: 54,
    pdfTotalCostGhs: 13467.57,
  },
  {
    ruleId: 'rule_nhis_05',
    code: 'NHIS-R05',
    title: 'INAPPROPRIATE PRESCRIPTION',
    category: 'Pharmacy',
    severity: 'critical',
    description:
      'Medicines prescribed were clinically inappropriate or violated NHIS Standard Treatment Guidelines (STG) for the stated diagnosis.',
    criteriaSummary:
      '• Metronidazole (Tablet/Injection) or Ciprofloxacin + Tinidazole prescribed for Typhoid/Enteric Fever (A01.0).\n• Amoxicillin + Clavulanic Acid or Azithromycin prescribed for Peptic Ulcer Disease (K25.3/K27.9) or H. pylori.\n• Systemic antibiotics (Amoxicillin, Clarithromycin, Cefuroxime, Ciprofloxacin, Metronidazole, Azithromycin) prescribed for Gastritis (K29.*), Acute Bronchitis, Rhinitis, or Vaginal Candidiasis without protocol adherence.\n• Carbocisteine Syrup prescribed for Cough, Common Cold (J00.00), URTI (J06.9), Rhinitis, or LRTI.\n• IV Infusions (Sodium Chloride 0.9% SODCHLIN3) or injectable Artesunate/Artemether prescribed at routine OPD without 24h admission + 3-day oral ACT.\n• Cefuroxime Tablet or Metronidazole Tablet prescribed for routine Antenatal Care (Z36.9).\n• Fluconazole prescribed for Fever/Gastritis; Omeprazole for Enteritis; Iron Polymaltose Suspension for UTI.',
    sourceDocument: 'Extracted from all 9 NHIS PDF Reports (Jul 2025 – May 2026)',
    isActive: true,
    pdfAffectedCount: 1884,
    pdfTotalCostGhs: 67930.56,
  },
  {
    ruleId: 'rule_nhis_06',
    code: 'NHIS-R06',
    title: 'MULTIPLE ATTENDANCE',
    category: 'Tariff',
    severity: 'high',
    description:
      'Multiple separate outpatient or procedural claims billed for the same member on the same visit or consecutive days.',
    criteriaSummary:
      '• Billed OPDC06A (UTI/General OPD) and OPDC02A (Antenatal Screening) separately on the same visit.\n• Billed Osteoarthritis (ORTH14A) and Physiotherapy (OPDC13A) on the same day, or repeated OPDC06A on consecutive days.\n• Billed Talipes Equinovarus (ORTH04C) repeatedly within days (e.g. 24/04/26 and 29/04/26).\n• Billed ZOOM02A (Anemia) and MEDI38A separately on the same date.',
    sourceDocument: 'Extracted from Jul, Aug, Oct, Nov, Dec 2025 & Feb, Apr, May 2026 PDFs',
    isActive: true,
    pdfAffectedCount: 36,
    pdfTotalCostGhs: 2880.19,
  },
  {
    ruleId: 'rule_nhis_07',
    code: 'NHIS-R07',
    title: 'MULTIPLE CHRONIC VISIT',
    category: 'Tariff',
    severity: 'medium',
    description:
      'Multiple chronic illness visits billed within a single month contrary to the NHIS Tariff Operation Manual.',
    criteriaSummary:
      '• Flags repeat outpatient claims in the same calendar month for the same MemberNumber for chronic hypertension, diabetes, stroke rehabilitation (OPDC13A), or wound dressing (ZOOM05A).',
    sourceDocument: 'Extracted from Sep, Oct, Nov, Dec 2025 & Jan, Feb, May 2026 PDFs',
    isActive: true,
    pdfAffectedCount: 18,
    pdfTotalCostGhs: 455.92,
  },
  {
    ruleId: 'rule_nhis_08',
    code: 'NHIS-R08',
    title: 'MISAPPLICATION OF TARIFFS',
    category: 'Tariff',
    severity: 'high',
    description:
      'G-DRG tariff quoted for a service rendered was wrongfully applied to an ineligible diagnosis or procedure rule.',
    criteriaSummary:
      '• Applied Physiotherapy tariff (OPDC13A) to non-physiotherapy medical conditions such as Cough, Diabetes (E11.*), Headache, Hypertension, Dry Eye Syndrome (H04.*), Pinguecula (H11.*), Insomnia (F51.*), or Candidiasis (B37.3).\n• Applied additional 20% of ORTH08A to ORTH08A for fracture of lower end of right tibia.\n• Applied 20% of OBGY20A for Hysterectomy after Cesarean Section, or billed next-day visits with same diagnosis.',
    sourceDocument: 'Extracted from Jul, Aug, Oct, Nov 2025 & Jan, Mar, May 2026 PDFs',
    isActive: true,
    pdfAffectedCount: 30,
    pdfTotalCostGhs: 2700.40,
  },
  {
    ruleId: 'rule_nhis_09',
    code: 'NHIS-R09',
    title: 'NO ATTACHMENT FOR PHYSIOTHERAPY CLAIMS',
    category: 'Documentation',
    severity: 'medium',
    description:
      'Billed for Physiotherapy (OPDC13A / OPDC13C) without Physiotherapy request forms attached to the claims.',
    criteriaSummary:
      '• Disallows OPDC13A and OPDC13C claims where ReferralNo / Physiotherapy request form attachment is missing.',
    sourceDocument: 'Extracted from Sep, Oct, Nov, Dec 2025 & Feb, May 2026 PDFs',
    isActive: true,
    pdfAffectedCount: 45,
    pdfTotalCostGhs: 1379.00,
  },
  {
    ruleId: 'rule_nhis_10',
    code: 'NHIS-R10',
    title: 'OVER PRESCRIPTION OF DRUG',
    category: 'Pharmacy',
    severity: 'high',
    description:
      'Prescribed medicine strength, daily frequency, or duration exceeded NHIS clinical protocol for the stated condition.',
    criteriaSummary:
      '• Billed Oxytocin Injection 10 units/mL (OXYTOCIN2): 2, 4, 5, or 6 ampoules instead of 1 ampoule (10 IU) for Spontaneous Vaginal Delivery (OBGY34A).\n• Prescribed Fluconazole 150mg (FLUCONCA1) daily for 3–7 days instead of a single 150mg stat dose for Vaginal Candidiasis.\n• Prescribed Hyoscine Butylbromide 10mg (20mg tds x 5–7 days) for Gastritis.\n• Prescribed Supp. Diclofenac 200mg daily instead of 150mg max daily, or Aspirin 75mg (ACETYLDT1) for Lower Back Pain.\n• Prescribed Iron (III) Polymaltose Capsule (100mg bd x 60) at ANC, or invalid dosage units (1000 mL Paracetamol, 500 L Saline, 1000 g Metformin, 2 g Glimepiride).',
    sourceDocument: 'Extracted from Jul, Aug, Sep, Oct, Nov, Dec 2025 & Feb, Apr, May 2026 PDFs',
    isActive: true,
    pdfAffectedCount: 495,
    pdfTotalCostGhs: 11266.31,
  },
  {
    ruleId: 'rule_nhis_11',
    code: 'NHIS-R11',
    title: 'OVER SUPPLY OF MEDICINES',
    category: 'Pharmacy',
    severity: 'critical',
    description:
      'The quantity of medicines dispensed was higher than the prescribed regimen (Frequency × Duration).',
    criteriaSummary:
      '• Supplied 8, 12, 16, or 24 bottles of Ciprofloxacin Infusion (2mg/mL in 100mL, CIPROFIN1) exceeding Frequency × Duration.\n• Supplied 8, 14, 16, 18, 24, or 32 vials of Clindamycin Injection (150mg/mL in 2mL, CLINDAIN1) exceeding Frequency × Duration.\n• Supplied excess bags of Sodium Chloride 0.9% (500mL per bag, SODCHLIN3) compared to prescribed liters.\n• Supplied excess vials of Metronidazole Injection, Ceftriaxone Injection, Co-amoxiclav Injection, Omeprazole Injection, Morphine Injection, or Premixed Insulin (30/70).\n• Supplied 2 bottles of Cefuroxime/Co-amoxiclav/Iron Suspension or 2 courses of Artemether-Lumefantrine / Clotrimazole.',
    sourceDocument: 'Extracted from all 9 NHIS PDF Reports (Jul 2025 – May 2026)',
    isActive: true,
    pdfAffectedCount: 288,
    pdfTotalCostGhs: 30760.97,
  },
  {
    ruleId: 'rule_nhis_12',
    code: 'NHIS-R12',
    title: 'POLYPHARMACY',
    category: 'Pharmacy',
    severity: 'medium',
    description:
      'Concurrent prescription of redundant or overlapping pharmacological classes on the same claim.',
    criteriaSummary:
      '• Prescribed Fluconazole Capsule (150mg) and Miconazole/Clotrimazole Ovule concurrently for Vaginal Candidiasis.\n• Prescribed Losartan (ARB) and Lisinopril (ACEi) concurrently for Hypertension.\n• Prescribed Ferrous Sulphate Tablet (60mg) and Iron (III) Polymaltose Complex Capsule together for Antenatal Care.\n• Prescribed Cefuroxime Tablet and Amoxicillin + Clavulanic Acid Tablet concurrently for Tonsillitis, or Ciprofloxacin + Cefuroxime + Co-amoxiclav for Stress Fracture, or dual NSAIDs.',
    sourceDocument: 'Extracted from Jul, Oct, Nov, Dec 2025 & Mar, Apr, May 2026 PDFs',
    isActive: true,
    pdfAffectedCount: 101,
    pdfTotalCostGhs: 2125.96,
  },
  {
    ruleId: 'rule_nhis_13',
    code: 'NHIS-R13',
    title: 'TREATMENT TO DIAGNOSIS MISMATCH',
    category: 'Clinical',
    severity: 'high',
    description:
      'Medicines or treatments prescribed did not match any clinical diagnosis stated on the claim form.',
    criteriaSummary:
      '• Prescribed Antihypertensives (Losartan, Nifedipine, Amlodipine, Methyldopa) for Asthma, UTI, Headache, Epistaxis, Myalgia, Bronchitis, Delivery, or routine ANC without hypertension.\n• Prescribed Antidiabetics (Glimepiride, Metformin) for Hypertension without Diabetes.\n• Prescribed Artemether + Lumefantrine for Essential Hypertension, Typhoid Fever, or routine Antenatal Care without Malaria.\n• Prescribed Ciprofloxacin Eye Drops for Diabetes, or Methyl Cellulose Eye Drops for Myalgia.\n• Prescribed Lactulose Liquid for Sepsis without constipation; or Ciprofloxacin for Hypertension/Anorexia.',
    sourceDocument: 'Extracted from all 9 NHIS PDF Reports (Jul 2025 – May 2026)',
    isActive: true,
    pdfAffectedCount: 91,
    pdfTotalCostGhs: 2705.23,
  },
  {
    ruleId: 'rule_nhis_14',
    code: 'NHIS-R14',
    title: 'NON-SPECIFIC / UNCLEAR DIAGNOSIS',
    category: 'Clinical',
    severity: 'high',
    description:
      'No specific etiological diagnosis was stated on the claim form to justify systemic antimicrobial therapy.',
    criteriaSummary:
      '• Prescribed systemic antibiotics (Ciprofloxacin, Cefuroxime, Co-amoxiclav, Metronidazole, Flucloxacillin) for generalized/unclear diagnoses such as Gastroenteritis unspecified (A09.0/A09.9), Lower/Upper Respiratory Tract Infection, Unspecified Bacterial Infection (A49.9), Skin Rash (R21.00), Acute Vaginitis (N76.0), or Unspecified Surgical Procedure (Z48.9).',
    sourceDocument: 'Extracted from all 9 NHIS PDF Reports (Jul 2025 – May 2026)',
    isActive: true,
    pdfAffectedCount: 441,
    pdfTotalCostGhs: 15276.69,
  },
  {
    ruleId: 'rule_nhis_15',
    code: 'NHIS-R15',
    title: 'WRONG APPLICATION OF TARIFFS',
    category: 'Tariff',
    severity: 'critical',
    description:
      'In-patient or procedural G-DRG code billed does not match the primary clinical diagnosis or length of stay.',
    criteriaSummary:
      '• Billed ORTH04C and/or ORTH23C instead of OPDC13C for Talipes Equinovarus managed within 24 hours (1-day stay).\n• Billed MEDI03A instead of MEDI02A (Simple Diabetes), MEDI32A (Hypertension), MEDI31A (Cellulitis/Myalgia), or MEDI30A (Sepsis).\n• Billed MEDI30A instead of MEDI32A (Hypertension), MEDI31A (Pneumonia/Cellulitis), or MEDI23A (Gastroenteritis).\n• Billed MEDI31A instead of ZOOM02A (Myalgia/Pain) or MEDI28A (Malaria); or MEDI16A/OBGY09A instead of MEDI28A (Malaria).\n• Billed PAED39C/PAED34C instead of PAED36C (Malaria), or PAED38C/PAED14C for Newborn/Paediatric Sepsis discharged within 2–4 days.',
    sourceDocument: 'Extracted from all 9 NHIS PDF Reports (Jul 2025 – May 2026)',
    isActive: true,
    pdfAffectedCount: 251,
    pdfTotalCostGhs: 42686.44,
  },
  {
    ruleId: 'rule_nhis_16',
    code: 'NHIS-R16',
    title: 'MEDICINES DISPENSED OUTSIDE ADMISSION PERIOD',
    category: 'Pharmacy',
    severity: 'high',
    description:
      'Inpatient parenteral medicines or multi-day IV infusions were billed outside the admission window or on the day of discharge.',
    criteriaSummary:
      '• Prescribed multi-day IV Ceftriaxone, Clindamycin, Metronidazole, Amoxicillin + Clavulanic Acid, or 5L Normal Saline on the last day of admission / discharge date, or for an admission lasting less than 24 hours.',
    sourceDocument: 'Extracted from Jul, Aug, Sep, Oct, Nov, Dec 2025 & Feb 2026 PDFs',
    isActive: true,
    pdfAffectedCount: 27,
    pdfTotalCostGhs: 2737.87,
  },
  {
    ruleId: 'rule_nhis_17',
    code: 'NHIS-R17',
    title: 'DUPLICATION OF CLAIMS',
    category: 'Tariff',
    severity: 'critical',
    description:
      'Duplicate claim submissions for the same patient, date, and diagnosis or same NHIS number across multiple claims.',
    criteriaSummary:
      '• Billed the same G-DRG twice on the same date for the same member, or billed two incompatible G-DRGs (e.g. MEDI30A and ZOOM02A) on the same date.',
    sourceDocument: 'Extracted from Jul, Sep, Oct, Nov 2025 & Jan, Feb, Mar 2026 PDFs',
    isActive: true,
    pdfAffectedCount: 23,
    pdfTotalCostGhs: 1173.53,
  },
  {
    ruleId: 'rule_nhis_18',
    code: 'NHIS-R18',
    title: 'MULTIPLE ANC VISIT',
    category: 'Tariff',
    severity: 'medium',
    description:
      'Multiple routine Antenatal Care (ANC) visits billed within a single month contrary to the NHIS Tariff Operation Manual.',
    criteriaSummary:
      '• Routine ANC visits (OPDC02A / Z36.9) are capped at six (6) per pregnancy and should not be billed multiple times within the same calendar month.',
    sourceDocument: 'Extracted from Jul, Oct, Nov, Dec 2025 & Mar, Apr 2026 PDFs',
    isActive: true,
    pdfAffectedCount: 14,
    pdfTotalCostGhs: 241.92,
  },
  {
    ruleId: 'rule_nhis_19',
    code: 'NHIS-R19',
    title: 'NO DIAGNOSTIC REPORT EVIDENT / PART OF TARIFF',
    category: 'Documentation',
    severity: 'medium',
    description:
      'Lipid-lowering agents billed without attached laboratory lipid profile, or unbundled/extra 20% surgical tariff billed.',
    criteriaSummary:
      '• Prescribed Atorvastatin Tablet 20mg/40mg (ATORVATA1/2) without attaching a lipid profile investigation (INVE75D).\n• Applied an extra 20% markup to ORTH17A (Fracture of Tibia) or ORTH05A (Debridement), or billed separate OPDC06C for a newborn immediately after normal delivery.',
    sourceDocument: 'Extracted from Aug, Sep, Nov, Dec 2025 & Jan, Feb 2026 PDFs',
    isActive: true,
    pdfAffectedCount: 19,
    pdfTotalCostGhs: 830.26,
  },
];

// Verbatim NHIS XML Batch from the user's attached XML file covering all 19 consolidated PDF rules
export const ATTACHED_NHIS_XML_BATCH = `<?xml version="1.0" encoding="UTF-8"?>
<Batch><GeneralInformation><VersionInformation><XMLFormatVersion>1</XMLFormatVersion><MedicineVersion>1</MedicineVersion><GDRGVersion>1</GDRGVersion><TariffVersion>1</TariffVersion><ICDVersion>1</ICDVersion><OpenHDDVersion>1</OpenHDDVersion></VersionInformation><BatchInformation><BatchNumber>NHIS-CLA2610173035/1209/830</BatchNumber><BatchAmount>52352.96</BatchAmount><BatchCurrency>GHC</BatchCurrency><ClaimsCount>1209</ClaimsCount><CreationDate>09/10/2026</CreationDate><ServiceYear>2026</ServiceYear><ServiceMonth>03</ServiceMonth><IDPayer/></BatchInformation><ProviderInformation><ProviderAccreditationNumber>03-BA-00415</ProviderAccreditationNumber><eClaimAuthorizationNumber>NHIA-2026-03</eClaimAuthorizationNumber></ProviderInformation></GeneralInformation><Patients>
<PatientData><Surname>SARFO</Surname><OtherName>GYAMAA</OtherName><DateOfBirth>25/02/2026</DateOfBirth><Infant>Yes</Infant><MemberNumber>26511002</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/229789</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-197899</ClaimIdentificationNumber><ClaimCheckCode>49856</ClaimCheckCode><ServiceType>INP</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength>5</DurationLength><SpecialityCode>PAED</SpecialityCode><AdmissionDate>25/02/2026</AdmissionDate><DischargeDate>02/03/2026</DischargeDate><OutPatientTariffAmount/><InPatientTariffAmount>301.25</InPatientTariffAmount><InPatientCode>PAED14C</InPatientCode><OutPatientCode/><InvestigationCode/><TotalCost>301.25</TotalCost><TreatmentsCount>2</TreatmentsCount><MedicinesCount>2</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>PAED14C</TreatmentCode><ICDCode>P36.9:Bacterial sepsis of newborn, unspecified</ICDCode><Tariff>301.25</Tariff></Treatment><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>PAED39C</TreatmentCode><ICDCode>P03.82:Meconium passage during delivery</ICDCode><Tariff>0.00</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>BENZYLIN1</MedicineCode><Quantity>4</Quantity><UnitPrice>3.30</UnitPrice><MedicineTotal>13.20</MedicineTotal><MedicineDate>25/02/2026</MedicineDate><Prescription><Dose>0.30 Mu</Dose><Frequency>4</Frequency><Duration>3</Duration><CustomText>Dosages of 0.30 Mu dose for 3 days with frequency of 4 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>GENTAMIN1</MedicineCode><Quantity>1</Quantity><UnitPrice>2.75</UnitPrice><MedicineTotal>2.75</MedicineTotal><MedicineDate>25/02/2026</MedicineDate><Prescription><Dose>12 MG</Dose><Frequency>1</Frequency><Duration>3</Duration><CustomText>Dosages of 12 MG dose for 3 days with frequency of 1 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>FOSUAH</Surname><OtherName>JANET</OtherName><DateOfBirth>29/11/1969</DateOfBirth><Infant>No</Infant><MemberNumber>10327803</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/230488</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-197927</ClaimIdentificationNumber><ClaimCheckCode>17857</ClaimCheckCode><ServiceType>INP</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength>6</DurationLength><SpecialityCode>MEDI</SpecialityCode><AdmissionDate>24/02/2026</AdmissionDate><DischargeDate>02/03/2026</DischargeDate><OutPatientTariffAmount/><InPatientTariffAmount>481.82</InPatientTariffAmount><InPatientCode>MEDI03A</InPatientCode><OutPatientCode/><InvestigationCode/><TotalCost>481.82</TotalCost><TreatmentsCount>6</TreatmentsCount><MedicinesCount>14</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>MEDI31A</TreatmentCode><ICDCode>L03.116:Cellulitis of left lower limb</ICDCode><Tariff>481.82</Tariff></Treatment><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>MEDI03A</TreatmentCode><ICDCode>E10.65:Type 1 diabetes mellitus with hyperglycemia</ICDCode><Tariff>0.00</Tariff></Treatment><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>MEDI31A</TreatmentCode><ICDCode>M89.9:Disorder of bone, unspecified</ICDCode><Tariff>0.00</Tariff></Treatment><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>MEDI26A</TreatmentCode><ICDCode>K59.0:Constipation</ICDCode><Tariff>0.00</Tariff></Treatment><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>MEDI26A</TreatmentCode><ICDCode>R12.00:Heartburn</ICDCode><Tariff>0.00</Tariff></Treatment><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>MEDI31A</TreatmentCode><ICDCode>M25.5:Pain in joint</ICDCode><Tariff>0.00</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>CLINDAIN1</MedicineCode><Quantity>8</Quantity><UnitPrice>29.17</UnitPrice><MedicineTotal>233.36</MedicineTotal><MedicineDate>24/02/2026</MedicineDate><Prescription><Dose>300 MG</Dose><Frequency>4</Frequency><Duration>1</Duration><CustomText>Dosages of 300 MG dose for 1 days with frequency of 4 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>CIPROFIN1</MedicineCode><Quantity>4</Quantity><UnitPrice>9.35</UnitPrice><MedicineTotal>37.40</MedicineTotal><MedicineDate>24/02/2026</MedicineDate><Prescription><Dose>400 MG</Dose><Frequency>2</Frequency><Duration>1</Duration><CustomText>Dosages of 400 MG dose for 1 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>SODCHLIN3</MedicineCode><Quantity>6</Quantity><UnitPrice>14.37</UnitPrice><MedicineTotal>86.22</MedicineTotal><MedicineDate>24/02/2026</MedicineDate><Prescription><Dose>3.0 L</Dose><Frequency>1</Frequency><Duration>1</Duration><CustomText>Dosages of 3.0 L dose for 1 days with frequency of 1 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>CIPROFIN1</MedicineCode><Quantity>8</Quantity><UnitPrice>9.35</UnitPrice><MedicineTotal>74.80</MedicineTotal><MedicineDate>01/03/2026</MedicineDate><Prescription><Dose>400 MG</Dose><Frequency>2</Frequency><Duration>2</Duration><CustomText>Dosages of 400 MG dose for 2 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>CLINDAIN1</MedicineCode><Quantity>8</Quantity><UnitPrice>29.17</UnitPrice><MedicineTotal>233.36</MedicineTotal><MedicineDate>01/03/2026</MedicineDate><Prescription><Dose>300 MG</Dose><Frequency>4</Frequency><Duration>2</Duration><CustomText>Dosages of 300 MG dose for 2 days with frequency of 4 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>YEBOAH</Surname><OtherName>ANDREWS</OtherName><DateOfBirth>03/02/1987</DateOfBirth><Infant>No</Infant><MemberNumber>0021197006</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/230396</HospitalRecordNumber><CardSerialNumber/><Gender>M</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-197933</ClaimIdentificationNumber><ClaimCheckCode>72470</ClaimCheckCode><ServiceType>INP</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength>5</DurationLength><SpecialityCode>MEDI</SpecialityCode><AdmissionDate>25/02/2026</AdmissionDate><DischargeDate>02/03/2026</DischargeDate><OutPatientTariffAmount/><InPatientTariffAmount>481.82</InPatientTariffAmount><InPatientCode>MEDI03A</InPatientCode><OutPatientCode/><InvestigationCode/><TotalCost>481.82</TotalCost><TreatmentsCount>8</TreatmentsCount><MedicinesCount>9</MedicinesCount><ReferralNo/><Treatments><Treatment><Date>28/02/2026</Date><Type>Investigation</Type><TreatmentCode>INVE94D</TreatmentCode><ICDCode/><Tariff>0.00</Tariff></Treatment><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>MEDI30A</TreatmentCode><ICDCode>A41.81:Sepsis due to Enterococcus</ICDCode><Tariff>481.82</Tariff></Treatment><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>MEDI03A</TreatmentCode><ICDCode>E08.0:Diabetes mellitus due to underlying condition with hyperosmolarity without nonketotic hyperglycemic-hyperosmolar coma (NKHHC)</ICDCode><Tariff>0.00</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>CIPROFIN1</MedicineCode><Quantity>4</Quantity><UnitPrice>9.35</UnitPrice><MedicineTotal>37.40</MedicineTotal><MedicineDate>26/02/2026</MedicineDate><Prescription><Dose>400 MG</Dose><Frequency>2</Frequency><Duration>1</Duration><CustomText>Dosages of 400 MG dose for 1 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>METRONIN1</MedicineCode><Quantity>3</Quantity><UnitPrice>9.01</UnitPrice><MedicineTotal>27.03</MedicineTotal><MedicineDate>26/02/2026</MedicineDate><Prescription><Dose>500 MG</Dose><Frequency>3</Frequency><Duration>1</Duration><CustomText>Dosages of 500 MG dose for 1 days with frequency of 3 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>ANSAH</Surname><OtherName>FLORENCE</OtherName><DateOfBirth>26/12/2023</DateOfBirth><Infant>No</Infant><MemberNumber>42403470</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/230536</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-198010</ClaimIdentificationNumber><ClaimCheckCode>49490</ClaimCheckCode><ServiceType>INP</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength>2</DurationLength><SpecialityCode>PAED</SpecialityCode><AdmissionDate>28/02/2026</AdmissionDate><DischargeDate>02/03/2026</DischargeDate><OutPatientTariffAmount/><InPatientTariffAmount>129.22</InPatientTariffAmount><InPatientCode>PAED39C</InPatientCode><OutPatientCode/><InvestigationCode/><TotalCost>129.22</TotalCost><TreatmentsCount>3</TreatmentsCount><MedicinesCount>6</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>PAED39C</TreatmentCode><ICDCode>A41.9:Sepsis, unspecified</ICDCode><Tariff>129.22</Tariff></Treatment><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>PAED31C</TreatmentCode><ICDCode>A09.9:Gastroenteritis and colitis of unspecified origin</ICDCode><Tariff>0.00</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>CEFUROIN1</MedicineCode><Quantity>1</Quantity><UnitPrice>13.20</UnitPrice><MedicineTotal>13.20</MedicineTotal><MedicineDate>28/02/2026</MedicineDate><Prescription><Dose>170 MG</Dose><Frequency>3</Frequency><Duration>2</Duration><CustomText>Dosages of 170 MG dose for 2 days with frequency of 3 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>CEFUROSU1</MedicineCode><Quantity>1</Quantity><UnitPrice>20.56</UnitPrice><MedicineTotal>20.56</MedicineTotal><MedicineDate>02/03/2026</MedicineDate><Prescription><Dose>5 mL</Dose><Frequency>2</Frequency><Duration>7</Duration><CustomText>Dosages of 5 mL dose for 7 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>KWARTEMAA</Surname><OtherName>AMMA</OtherName><DateOfBirth>15/04/1939</DateOfBirth><Infant>No</Infant><MemberNumber>26476299</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/226040</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-198537</ClaimIdentificationNumber><ClaimCheckCode>43690</ClaimCheckCode><ServiceType>INP</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength>22</DurationLength><SpecialityCode>MEDI</SpecialityCode><AdmissionDate>09/02/2026</AdmissionDate><DischargeDate>03/03/2026</DischargeDate><OutPatientTariffAmount/><InPatientTariffAmount>382.95</InPatientTariffAmount><InPatientCode>MEDI07A</InPatientCode><OutPatientCode/><InvestigationCode/><TotalCost>382.95</TotalCost><TreatmentsCount>12</TreatmentsCount><MedicinesCount>18</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>MEDI31A</TreatmentCode><ICDCode>M79.1:Myalgia</ICDCode><Tariff>382.95</Tariff></Treatment><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>MEDI07A</TreatmentCode><ICDCode>I50.0:Congestive heart failure</ICDCode><Tariff>0.00</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>CLINDAIN1</MedicineCode><Quantity>8</Quantity><UnitPrice>29.17</UnitPrice><MedicineTotal>233.36</MedicineTotal><MedicineDate>10/02/2026</MedicineDate><Prescription><Dose>300 MG</Dose><Frequency>4</Frequency><Duration>1</Duration><CustomText>Dosages of 300 MG dose for 1 days with frequency of 4 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>CIPROFIN1</MedicineCode><Quantity>4</Quantity><UnitPrice>9.35</UnitPrice><MedicineTotal>37.40</MedicineTotal><MedicineDate>10/02/2026</MedicineDate><Prescription><Dose>400 MG</Dose><Frequency>2</Frequency><Duration>1</Duration><CustomText>Dosages of 400 MG dose for 1 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>CLINDAIN1</MedicineCode><Quantity>16</Quantity><UnitPrice>29.17</UnitPrice><MedicineTotal>466.72</MedicineTotal><MedicineDate>11/02/2026</MedicineDate><Prescription><Dose>300 MG</Dose><Frequency>4</Frequency><Duration>2</Duration><CustomText>Dosages of 300 MG dose for 2 days with frequency of 4 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>TWUMASI</Surname><OtherName>VERONICA</OtherName><DateOfBirth>20/06/1992</DateOfBirth><Infant>No</Infant><MemberNumber>29198925</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/229807</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-198542</ClaimIdentificationNumber><ClaimCheckCode>36560</ClaimCheckCode><ServiceType>INP</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength>7</DurationLength><SpecialityCode>ORTH</SpecialityCode><AdmissionDate>24/02/2026</AdmissionDate><DischargeDate>03/03/2026</DischargeDate><OutPatientTariffAmount/><InPatientTariffAmount>891.54</InPatientTariffAmount><InPatientCode>ORTH17A</InPatientCode><OutPatientCode/><InvestigationCode/><TotalCost>891.54</TotalCost><TreatmentsCount>2</TreatmentsCount><MedicinesCount>10</MedicinesCount><ReferralNo/><Treatments><Treatment><Date>24/02/2026</Date><Type>Procedure</Type><TreatmentCode>ORTH17A</TreatmentCode><ICDCode/><Tariff>891.54</Tariff></Treatment><Treatment><Date>27/02/2026</Date><Type>Investigation</Type><TreatmentCode>INVE52D</TreatmentCode><ICDCode/><Tariff>0.00</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>CIPROFIN1</MedicineCode><Quantity>12</Quantity><UnitPrice>9.35</UnitPrice><MedicineTotal>112.20</MedicineTotal><MedicineDate>25/02/2026</MedicineDate><Prescription><Dose>400 MG</Dose><Frequency>2</Frequency><Duration>3</Duration><CustomText>Dosages of 400 MG dose for 3 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>CIPROFTA2</MedicineCode><Quantity>14</Quantity><UnitPrice>0.61</UnitPrice><MedicineTotal>8.54</MedicineTotal><MedicineDate>01/03/2026</MedicineDate><Prescription><Dose>500 MG</Dose><Frequency>2</Frequency><Duration>7</Duration><CustomText>Dosages of 500 MG dose for 7 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>COAMOXTA1</MedicineCode><Quantity>14</Quantity><UnitPrice>2.31</UnitPrice><MedicineTotal>32.34</MedicineTotal><MedicineDate>01/03/2026</MedicineDate><Prescription><Dose>500 MG</Dose><Frequency>2</Frequency><Duration>7</Duration><CustomText>Dosages of 500 MG dose for 7 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>CIPROFTA2</MedicineCode><Quantity>14</Quantity><UnitPrice>0.61</UnitPrice><MedicineTotal>8.54</MedicineTotal><MedicineDate>03/03/2026</MedicineDate><Prescription><Dose>500 MG</Dose><Frequency>2</Frequency><Duration>7</Duration><CustomText>Dosages of 500 MG dose for 7 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>COAMOXTA1</MedicineCode><Quantity>14</Quantity><UnitPrice>2.31</UnitPrice><MedicineTotal>32.34</MedicineTotal><MedicineDate>03/03/2026</MedicineDate><Prescription><Dose>500 MG</Dose><Frequency>2</Frequency><Duration>7</Duration><CustomText>Dosages of 500 MG dose for 7 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>APPIAH</Surname><OtherName>VIDA</OtherName><DateOfBirth>03/07/1979</DateOfBirth><Infant>No</Infant><MemberNumber>25519588</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/230426</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-198662</ClaimIdentificationNumber><ClaimCheckCode>93980</ClaimCheckCode><ServiceType>INP</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength>6</DurationLength><SpecialityCode>MEDI</SpecialityCode><AdmissionDate>27/02/2026</AdmissionDate><DischargeDate>05/03/2026</DischargeDate><OutPatientTariffAmount/><InPatientTariffAmount>336.74</InPatientTariffAmount><InPatientCode>MEDI30A</InPatientCode><OutPatientCode/><InvestigationCode/><TotalCost>336.74</TotalCost><TreatmentsCount>3</TreatmentsCount><MedicinesCount>8</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>MEDI32A</TreatmentCode><ICDCode>I10.00:Essential (primary) hypertension</ICDCode><Tariff>336.74</Tariff></Treatment><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>MEDI30A</TreatmentCode><ICDCode>A01.0:Typhoid fever</ICDCode><Tariff>0.00</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>CIPROFIN1</MedicineCode><Quantity>4</Quantity><UnitPrice>9.35</UnitPrice><MedicineTotal>37.40</MedicineTotal><MedicineDate>27/02/2026</MedicineDate><Prescription><Dose>400 MG</Dose><Frequency>2</Frequency><Duration>1</Duration><CustomText>Dosages of 400 MG dose for 1 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>METRONIN1</MedicineCode><Quantity>3</Quantity><UnitPrice>9.01</UnitPrice><MedicineTotal>27.03</MedicineTotal><MedicineDate>27/02/2026</MedicineDate><Prescription><Dose>500 MG</Dose><Frequency>3</Frequency><Duration>1</Duration><CustomText>Dosages of 500 MG dose for 1 days with frequency of 3 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>CIPROFIN1</MedicineCode><Quantity>8</Quantity><UnitPrice>9.35</UnitPrice><MedicineTotal>74.80</MedicineTotal><MedicineDate>28/02/2026</MedicineDate><Prescription><Dose>400 MG</Dose><Frequency>2</Frequency><Duration>2</Duration><CustomText>Dosages of 400 MG dose for 2 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>ABU</Surname><OtherName>ABRAS</OtherName><DateOfBirth>17/01/1970</DateOfBirth><Infant>No</Infant><MemberNumber>49612668</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/230824</HospitalRecordNumber><CardSerialNumber/><Gender>M</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-198842</ClaimIdentificationNumber><ClaimCheckCode>91203</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>02/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>24.09</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>OPDC06A</OutPatientCode><InvestigationCode/><TotalCost>24.09</TotalCost><TreatmentsCount>5</TreatmentsCount><MedicinesCount>3</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>B98.0:Helicobacter pylori [H.pylori] as the cause of diseases classified to other chapters</ICDCode><Tariff>24.09</Tariff></Treatment><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>K27.9:Peptic ulcer, site unspecified: Unspecified as acute or chronic, without haemorrhage or perforation</ICDCode><Tariff>0.00</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>AMOXICCA1</MedicineCode><Quantity>112</Quantity><UnitPrice>0.47</UnitPrice><MedicineTotal>52.64</MedicineTotal><MedicineDate>02/03/2026</MedicineDate><Prescription><Dose>1000 MG</Dose><Frequency>2</Frequency><Duration>14</Duration><CustomText>Dosages of 1000 MG dose for 14 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>CLARITCA1</MedicineCode><Quantity>56</Quantity><UnitPrice>3.08</UnitPrice><MedicineTotal>172.48</MedicineTotal><MedicineDate>02/03/2026</MedicineDate><Prescription><Dose>500 MG</Dose><Frequency>2</Frequency><Duration>14</Duration><CustomText>Dosages of 500 MG dose for 14 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>OMEPRATA1</MedicineCode><Quantity>28</Quantity><UnitPrice>0.23</UnitPrice><MedicineTotal>6.44</MedicineTotal><MedicineDate>02/03/2026</MedicineDate><Prescription><Dose>20 MG</Dose><Frequency>2</Frequency><Duration>14</Duration><CustomText>Dosages of 20 MG dose for 14 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>ADU</Surname><OtherName>ACHIAA</OtherName><DateOfBirth>02/01/1982</DateOfBirth><Infant>No</Infant><MemberNumber>26486943</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/231371</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-198845</ClaimIdentificationNumber><ClaimCheckCode>47763</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>04/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>24.09</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>OPDC06A</OutPatientCode><InvestigationCode/><TotalCost>24.09</TotalCost><TreatmentsCount>4</TreatmentsCount><MedicinesCount>4</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>A09.0:Other and unspecified gastroenteritis and colitis of infectious origin</ICDCode><Tariff>24.09</Tariff></Treatment><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>A01.0:Typhoid fever</ICDCode><Tariff>0.00</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>METRONTA1</MedicineCode><Quantity>42</Quantity><UnitPrice>0.13</UnitPrice><MedicineTotal>5.46</MedicineTotal><MedicineDate>04/03/2026</MedicineDate><Prescription><Dose>400 MG</Dose><Frequency>3</Frequency><Duration>7</Duration><CustomText>Dosages of 400 MG dose for 7 days with frequency of 3 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>CIPROFTA2</MedicineCode><Quantity>14</Quantity><UnitPrice>0.61</UnitPrice><MedicineTotal>8.54</MedicineTotal><MedicineDate>04/03/2026</MedicineDate><Prescription><Dose>500 MG</Dose><Frequency>2</Frequency><Duration>7</Duration><CustomText>Dosages of 500 MG dose for 7 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>SALIFU</Surname><OtherName>AJARA</OtherName><DateOfBirth>01/01/1970</DateOfBirth><Infant>No</Infant><MemberNumber>15420017</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/230869</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-198867</ClaimIdentificationNumber><ClaimCheckCode>86852</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>02/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>24.09</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>OPDC06A</OutPatientCode><InvestigationCode/><TotalCost>24.09</TotalCost><TreatmentsCount>6</TreatmentsCount><MedicinesCount>3</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>A01.0:Typhoid fever</ICDCode><Tariff>24.09</Tariff></Treatment><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>B37.3:Candidiasis of vulva and vagina</ICDCode><Tariff>0.00</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>CLOTRIVP2</MedicineCode><Quantity>1</Quantity><UnitPrice>24.20</UnitPrice><MedicineTotal>24.20</MedicineTotal><MedicineDate>02/03/2026</MedicineDate><Prescription><Dose>200 MG</Dose><Frequency>1</Frequency><Duration>6</Duration><CustomText>Dosages of 200 MG dose for 6 days with frequency of 1 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>FLUCONCA1</MedicineCode><Quantity>1</Quantity><UnitPrice>10.67</UnitPrice><MedicineTotal>10.67</MedicineTotal><MedicineDate>02/03/2026</MedicineDate><Prescription><Dose>150 MG</Dose><Frequency>1</Frequency><Duration>1</Duration><CustomText>Dosages of 150 MG dose for 1 days with frequency of 1 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>KUSI</Surname><OtherName>APPIAH</OtherName><DateOfBirth>21/12/2004</DateOfBirth><Infant>No</Infant><MemberNumber>27269743</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/230504</HospitalRecordNumber><CardSerialNumber/><Gender>M</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-198875</ClaimIdentificationNumber><ClaimCheckCode>89672</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>01/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>24.09</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>OPDC06A</OutPatientCode><InvestigationCode/><TotalCost>24.09</TotalCost><TreatmentsCount>4</TreatmentsCount><MedicinesCount>2</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>K29.1:Other acute gastritis</ICDCode><Tariff>24.09</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>PARACETA1</MedicineCode><Quantity>30</Quantity><UnitPrice>0.12</UnitPrice><MedicineTotal>3.60</MedicineTotal><MedicineDate>01/03/2026</MedicineDate><Prescription><Dose>1000 mL</Dose><Frequency>3</Frequency><Duration>5</Duration><CustomText>Dosages of 1000 mL dose for 5 days with frequency of 3 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>KISIWAA</Surname><OtherName>CHRISTIANA</OtherName><DateOfBirth>16/05/1932</DateOfBirth><Infant>No</Infant><MemberNumber>26508605</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/231545</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-198915</ClaimIdentificationNumber><ClaimCheckCode>93468</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>05/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>24.09</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>OPDC06A</OutPatientCode><InvestigationCode/><TotalCost>24.09</TotalCost><TreatmentsCount>2</TreatmentsCount><MedicinesCount>4</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>I10.00:Essential (primary) hypertension</ICDCode><Tariff>24.09</Tariff></Treatment><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>E11.9:Type 2 diabetes mellitus without complications</ICDCode><Tariff>0.00</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>GLIMEPTA2</MedicineCode><Quantity>60</Quantity><UnitPrice>0.19</UnitPrice><MedicineTotal>11.40</MedicineTotal><MedicineDate>05/03/2026</MedicineDate><Prescription><Dose>2 g</Dose><Frequency>1</Frequency><Duration>60</Duration><CustomText>Dosages of 2 g dose for 60 days with frequency of 1 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>ASMAH</Surname><OtherName>FLORENCE</OtherName><DateOfBirth>16/08/2002</DateOfBirth><Infant>No</Infant><MemberNumber>10831635</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/230817</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-198939</ClaimIdentificationNumber><ClaimCheckCode>67478</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>02/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>24.09</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>OPDC06A</OutPatientCode><InvestigationCode/><TotalCost>24.09</TotalCost><TreatmentsCount>5</TreatmentsCount><MedicinesCount>3</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>K29.1:Other acute gastritis</ICDCode><Tariff>24.09</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>OMEPRATA1</MedicineCode><Quantity>20</Quantity><UnitPrice>0.23</UnitPrice><MedicineTotal>4.60</MedicineTotal><MedicineDate>02/03/2026</MedicineDate><Prescription><Dose>200 MG</Dose><Frequency>2</Frequency><Duration>1</Duration><CustomText>Dosages of 200 MG dose for 1 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>OTCHERE</Surname><OtherName>FOSTER</OtherName><DateOfBirth>11/03/1994</DateOfBirth><Infant>No</Infant><MemberNumber>0021917032</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/231316</HospitalRecordNumber><CardSerialNumber/><Gender>M</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-198943</ClaimIdentificationNumber><ClaimCheckCode>62054</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>04/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>24.09</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>OPDC06A</OutPatientCode><InvestigationCode/><TotalCost>24.09</TotalCost><TreatmentsCount>2</TreatmentsCount><MedicinesCount>3</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>I42.8:Other cardiomyopathies</ICDCode><Tariff>24.09</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>ACETYLDT1</MedicineCode><Quantity>30</Quantity><UnitPrice>0.33</UnitPrice><MedicineTotal>9.90</MedicineTotal><MedicineDate>04/03/2026</MedicineDate><Prescription><Dose>75 MG</Dose><Frequency>1</Frequency><Duration>30</Duration><CustomText>Dosages of 75 MG dose for 30 days with frequency of 1 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>BOAAH</Surname><OtherName>SALOMEY</OtherName><DateOfBirth>11/11/1950</DateOfBirth><Infant>No</Infant><MemberNumber>26495685</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/231535</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-199046</ClaimIdentificationNumber><ClaimCheckCode>81063</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>05/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>24.09</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>OPDC06A</OutPatientCode><InvestigationCode/><TotalCost>24.09</TotalCost><TreatmentsCount>3</TreatmentsCount><MedicinesCount>5</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>I11.0:Hypertensive heart disease with (congestive) heart failure</ICDCode><Tariff>24.09</Tariff></Treatment><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>E11.9:Type 2 diabetes mellitus without complications</ICDCode><Tariff>0.00</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>ATORVATA2</MedicineCode><Quantity>120</Quantity><UnitPrice>0.30</UnitPrice><MedicineTotal>36.00</MedicineTotal><MedicineDate>05/03/2026</MedicineDate><Prescription><Dose>40 MG</Dose><Frequency>1</Frequency><Duration>60</Duration><CustomText>Dosages of 40 MG dose for 60 days with frequency of 1 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>AMPONSAH</Surname><OtherName>VERONICA</OtherName><DateOfBirth>10/04/1993</DateOfBirth><Infant>No</Infant><MemberNumber>10134947</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/230863</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-199074</ClaimIdentificationNumber><ClaimCheckCode>58873</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>02/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>24.09</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>OPDC06A</OutPatientCode><InvestigationCode/><TotalCost>24.09</TotalCost><TreatmentsCount>8</TreatmentsCount><MedicinesCount>3</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>N39.0:Urinary tract infection, site not specified</ICDCode><Tariff>24.09</Tariff></Treatment><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>O09.31:Supervision of pregnancy with insufficient antenatal care, first trimester</ICDCode><Tariff>0.00</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>IBUPROTA1</MedicineCode><Quantity>30</Quantity><UnitPrice>0.22</UnitPrice><MedicineTotal>6.60</MedicineTotal><MedicineDate>02/03/2026</MedicineDate><Prescription><Dose>400 MG</Dose><Frequency>3</Frequency><Duration>5</Duration><CustomText>Dosages of 400 MG dose for 5 days with frequency of 3 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>CEFUROTA2</MedicineCode><Quantity>28</Quantity><UnitPrice>2.17</UnitPrice><MedicineTotal>60.76</MedicineTotal><MedicineDate>02/03/2026</MedicineDate><Prescription><Dose>500 MG</Dose><Frequency>2</Frequency><Duration>7</Duration><CustomText>Dosages of 500 MG dose for 7 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>SERWAA</Surname><OtherName>COMFORT</OtherName><DateOfBirth>09/03/1976</DateOfBirth><Infant>No</Infant><MemberNumber>26490931</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/231521</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-199345</ClaimIdentificationNumber><ClaimCheckCode>41238</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>05/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>24.09</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>OPDC06A</OutPatientCode><InvestigationCode/><TotalCost>24.09</TotalCost><TreatmentsCount>3</TreatmentsCount><MedicinesCount>2</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>R05.00:Cough</ICDCode><Tariff>24.09</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>CARBOCSY2</MedicineCode><Quantity>1</Quantity><UnitPrice>11.06</UnitPrice><MedicineTotal>11.06</MedicineTotal><MedicineDate>05/03/2026</MedicineDate><Prescription><Dose>10 mL</Dose><Frequency>3</Frequency><Duration>5</Duration><CustomText>Dosages of 10 mL dose for 5 days with frequency of 3 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>TUOYIRE</Surname><OtherName>LETICIA</OtherName><DateOfBirth>03/05/1995</DateOfBirth><Infant>No</Infant><MemberNumber>94706089</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/230992</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-199444</ClaimIdentificationNumber><ClaimCheckCode>13596</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>03/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>24.09</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>OPDC06A</OutPatientCode><InvestigationCode/><TotalCost>24.09</TotalCost><TreatmentsCount>2</TreatmentsCount><MedicinesCount>3</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>I10.00:Essential (primary) hypertension</ICDCode><Tariff>24.09</Tariff></Treatment><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>J00.00:Acute nasopharyngitis [common cold]</ICDCode><Tariff>0.00</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>METHYLTA1</MedicineCode><Quantity>240</Quantity><UnitPrice>0.93</UnitPrice><MedicineTotal>223.20</MedicineTotal><MedicineDate>03/03/2026</MedicineDate><Prescription><Dose>500 MG</Dose><Frequency>2</Frequency><Duration>60</Duration><CustomText>Dosages of 500 MG dose for 60 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>NYARKO</Surname><OtherName>COMFORT</OtherName><DateOfBirth>13/10/2001</DateOfBirth><Infant>No</Infant><MemberNumber>26487867</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/231722</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-199470</ClaimIdentificationNumber><ClaimCheckCode>74872</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>05/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>24.09</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>OPDC06A</OutPatientCode><InvestigationCode/><TotalCost>24.09</TotalCost><TreatmentsCount>2</TreatmentsCount><MedicinesCount>3</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>B37.3:Candidiasis of vulva and vagina</ICDCode><Tariff>24.09</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>FLUCONCA1</MedicineCode><Quantity>3</Quantity><UnitPrice>10.67</UnitPrice><MedicineTotal>32.01</MedicineTotal><MedicineDate>05/03/2026</MedicineDate><Prescription><Dose>150 MG</Dose><Frequency>1</Frequency><Duration>3</Duration><CustomText>Dosages of 150 MG dose for 3 days with frequency of 1 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>AGYEMANG</Surname><OtherName>AGARTHA</OtherName><DateOfBirth>05/02/1967</DateOfBirth><Infant>No</Infant><MemberNumber>59085596</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>666429</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-199973</ClaimIdentificationNumber><ClaimCheckCode>75541</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>NO</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>03/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>30.76</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>OPDC13A</OutPatientCode><InvestigationCode/><TotalCost>30.76</TotalCost><TreatmentsCount>1</TreatmentsCount><MedicinesCount>0</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC13A</TreatmentCode><ICDCode>F51.01:Primary insomnia</ICDCode><Tariff>30.76</Tariff></Treatment></Treatments></Claim></Claims></PatientData>
<PatientData><Surname>TAKYI</Surname><OtherName>ALBERT</OtherName><DateOfBirth>04/02/1972</DateOfBirth><Infant>No</Infant><MemberNumber>26509826</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>666176</HospitalRecordNumber><CardSerialNumber/><Gender>M</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-199983</ClaimIdentificationNumber><ClaimCheckCode>15609</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>NO</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>02/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>30.76</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>OPDC13A</OutPatientCode><InvestigationCode/><TotalCost>30.76</TotalCost><TreatmentsCount>1</TreatmentsCount><MedicinesCount>0</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC13A</TreatmentCode><ICDCode>E11.9:Type 2 diabetes mellitus without complications</ICDCode><Tariff>30.76</Tariff></Treatment></Treatments></Claim></Claims></PatientData>
<PatientData><Surname>KORANG</Surname><OtherName>CHARLOTTE</OtherName><DateOfBirth>11/06/1947</DateOfBirth><Infant>No</Infant><MemberNumber>26476645</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>666736</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-200099</ClaimIdentificationNumber><ClaimCheckCode>83695</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>NO</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>03/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>30.76</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>OPDC13A</OutPatientCode><InvestigationCode/><TotalCost>30.76</TotalCost><TreatmentsCount>1</TreatmentsCount><MedicinesCount>0</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC13A</TreatmentCode><ICDCode>H04.123:Dry eye syndrome of bilateral lacrimal glands</ICDCode><Tariff>30.76</Tariff></Treatment></Treatments></Claim></Claims></PatientData>
<PatientData><Surname>TAKYIWAA</Surname><OtherName>ABIGAIL</OtherName><DateOfBirth>05/08/2004</DateOfBirth><Infant>No</Infant><MemberNumber>12383129</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/230483</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-200186</ClaimIdentificationNumber><ClaimCheckCode>37528</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>NO</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>01/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>24.09</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>OPDC06A</OutPatientCode><InvestigationCode/><TotalCost>24.09</TotalCost><TreatmentsCount>6</TreatmentsCount><MedicinesCount>0</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>R10.10:Upper abdominal pain, unspecified</ICDCode><Tariff>24.09</Tariff></Treatment></Treatments></Claim></Claims></PatientData>
<PatientData><Surname>TAKYIWAA</Surname><OtherName>ABIGAIL</OtherName><DateOfBirth>05/08/2004</DateOfBirth><Infant>No</Infant><MemberNumber>12383129</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>665448</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-200636</ClaimIdentificationNumber><ClaimCheckCode>62975</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>CRO</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>02/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>38.22</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>OPDC02A</OutPatientCode><InvestigationCode/><TotalCost>38.22</TotalCost><TreatmentsCount>2</TreatmentsCount><MedicinesCount>1</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC02A</TreatmentCode><ICDCode>Z36.9:Antenatal screening, unspecified</ICDCode><Tariff>38.22</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>IROPOLCA1</MedicineCode><Quantity>30</Quantity><UnitPrice>0.28</UnitPrice><MedicineTotal>8.40</MedicineTotal><MedicineDate>02/03/2026</MedicineDate><Prescription><Dose>100 MG</Dose><Frequency>1</Frequency><Duration>30</Duration><CustomText>Dosages of 100 MG dose for 30 days with frequency of 1 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>DANSOWAA</Surname><OtherName>COMFORT</OtherName><DateOfBirth>02/06/1995</DateOfBirth><Infant>No</Infant><MemberNumber>83752589</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>665455</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-202039</ClaimIdentificationNumber><ClaimCheckCode>67596</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>NO</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>02/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>24.09</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>OPDC06A</OutPatientCode><InvestigationCode/><TotalCost>24.09</TotalCost><TreatmentsCount>1</TreatmentsCount><MedicinesCount>0</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>N97.9:Female infertility, unspecified</ICDCode><Tariff>24.09</Tariff></Treatment></Treatments></Claim></Claims></PatientData>
<PatientData><Surname>DZAMASI</Surname><OtherName>KINGSLEY</OtherName><DateOfBirth>19/08/2025</DateOfBirth><Infant>No</Infant><MemberNumber>44086543</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/230832</HospitalRecordNumber><CardSerialNumber/><Gender>M</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-200854</ClaimIdentificationNumber><ClaimCheckCode>87046</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>02/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>24.09</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>OPDC06C</OutPatientCode><InvestigationCode/><TotalCost>24.09</TotalCost><TreatmentsCount>3</TreatmentsCount><MedicinesCount>3</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06C</TreatmentCode><ICDCode>J12.8:Other viral pneumonia</ICDCode><Tariff>24.09</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>CARBOCSY1</MedicineCode><Quantity>1</Quantity><UnitPrice>14.30</UnitPrice><MedicineTotal>14.30</MedicineTotal><MedicineDate>02/03/2026</MedicineDate><Prescription><Dose>2.5 mL</Dose><Frequency>3</Frequency><Duration>7</Duration><CustomText>Dosages of 2.5 mL dose for 7 days with frequency of 3 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>NJEMBA</Surname><OtherName>JULIET</OtherName><DateOfBirth>25/06/2024</DateOfBirth><Infant>No</Infant><MemberNumber>41809443</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/231634</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-201091</ClaimIdentificationNumber><ClaimCheckCode>89632</ClaimCheckCode><ServiceType>INP</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength>2</DurationLength><SpecialityCode>PAED</SpecialityCode><AdmissionDate>03/03/2026</AdmissionDate><DischargeDate>05/03/2026</DischargeDate><OutPatientTariffAmount/><InPatientTariffAmount>129.22</InPatientTariffAmount><InPatientCode>PAED39C</InPatientCode><OutPatientCode/><InvestigationCode/><TotalCost>129.22</TotalCost><TreatmentsCount>5</TreatmentsCount><MedicinesCount>7</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>PAED36C</TreatmentCode><ICDCode>B50.9:Plasmodium falciparum malaria, unspecified</ICDCode><Tariff>129.22</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>ARTESUIN1</MedicineCode><Quantity>3</Quantity><UnitPrice>3.18</UnitPrice><MedicineTotal>9.54</MedicineTotal><MedicineDate>03/03/2026</MedicineDate><Prescription><Dose>30 MG</Dose><Frequency>3</Frequency><Duration>1</Duration><CustomText>Dosages of 30 MG dose for 1 days with frequency of 3 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>AFIRIYIE</Surname><OtherName>RACHEAL</OtherName><DateOfBirth>17/05/2006</DateOfBirth><Infant>No</Infant><MemberNumber>11909383</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/230928</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-201098</ClaimIdentificationNumber><ClaimCheckCode>18450</ClaimCheckCode><ServiceType>INP</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength>2</DurationLength><SpecialityCode>OBGY</SpecialityCode><AdmissionDate>02/03/2026</AdmissionDate><DischargeDate>04/03/2026</DischargeDate><OutPatientTariffAmount/><InPatientTariffAmount>170.04</InPatientTariffAmount><InPatientCode>OBGY34A</InPatientCode><OutPatientCode/><InvestigationCode/><TotalCost>170.04</TotalCost><TreatmentsCount>2</TreatmentsCount><MedicinesCount>7</MedicinesCount><ReferralNo/><Treatments><Treatment><Date>02/03/2026</Date><Type>Procedure</Type><TreatmentCode>OBGY34A</TreatmentCode><ICDCode/><Tariff>170.04</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>OXYTOCIN2</MedicineCode><Quantity>2</Quantity><UnitPrice>10.19</UnitPrice><MedicineTotal>20.38</MedicineTotal><MedicineDate>03/03/2026</MedicineDate><Prescription><Dose>10 IU</Dose><Frequency>1</Frequency><Duration>1</Duration><CustomText>Dosages of 10 IU dose for 1 days with frequency of 1 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>SODCHLIN3</MedicineCode><Quantity>1</Quantity><UnitPrice>14.37</UnitPrice><MedicineTotal>14.37</MedicineTotal><MedicineDate>03/03/2026</MedicineDate><Prescription><Dose>500 L</Dose><Frequency>1</Frequency><Duration>2</Duration><CustomText>Dosages of 500 L dose for 2 days with frequency of 1 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>ESTHER</Surname><OtherName>MENSAH</OtherName><DateOfBirth>29/04/1992</DateOfBirth><Infant>No</Infant><MemberNumber>17706369</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/231499</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-201520</ClaimIdentificationNumber><ClaimCheckCode>38918</ClaimCheckCode><ServiceType>INP</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength>1</DurationLength><SpecialityCode>OBGY</SpecialityCode><AdmissionDate>05/03/2026</AdmissionDate><DischargeDate>05/03/2026</DischargeDate><OutPatientTariffAmount/><InPatientTariffAmount>170.04</InPatientTariffAmount><InPatientCode>OBGY34A</InPatientCode><OutPatientCode/><InvestigationCode/><TotalCost>170.04</TotalCost><TreatmentsCount>2</TreatmentsCount><MedicinesCount>7</MedicinesCount><ReferralNo/><Treatments><Treatment><Date>05/03/2026</Date><Type>Procedure</Type><TreatmentCode>OBGY34A</TreatmentCode><ICDCode/><Tariff>170.04</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>OXYTOCIN2</MedicineCode><Quantity>5</Quantity><UnitPrice>10.19</UnitPrice><MedicineTotal>50.95</MedicineTotal><MedicineDate>05/03/2026</MedicineDate><Prescription><Dose>10 IU</Dose><Frequency>1</Frequency><Duration>1</Duration><CustomText>Dosages of 10 IU dose for 1 days with frequency of 1 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>BOAKYE</Surname><OtherName>KELVIN</OtherName><DateOfBirth>13/04/2009</DateOfBirth><Infant>No</Infant><MemberNumber>47898819</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/231766</HospitalRecordNumber><CardSerialNumber/><Gender>M</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-203219</ClaimIdentificationNumber><ClaimCheckCode>39451</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>05/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>46.39</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>ZOOM02A</OutPatientCode><InvestigationCode/><TotalCost>46.39</TotalCost><TreatmentsCount>10</TreatmentsCount><MedicinesCount>2</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>ZOOM02A</TreatmentCode><ICDCode>R63.0:Anorexia</ICDCode><Tariff>46.39</Tariff></Treatment><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>ZOOM02A</TreatmentCode><ICDCode>B50.9:Plasmodium falciparum malaria, unspecified</ICDCode><Tariff>0.00</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>ARTESUIN3</MedicineCode><Quantity>3</Quantity><UnitPrice>6.25</UnitPrice><MedicineTotal>18.75</MedicineTotal><MedicineDate>05/03/2026</MedicineDate><Prescription><Dose>120 MG</Dose><Frequency>3</Frequency><Duration>1</Duration><CustomText>Dosages of 120 MG dose for 1 days with frequency of 3 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>DESOCHIN2</MedicineCode><Quantity>4</Quantity><UnitPrice>12.93</UnitPrice><MedicineTotal>51.72</MedicineTotal><MedicineDate>05/03/2026</MedicineDate><Prescription><Dose>2000 mL</Dose><Frequency>1</Frequency><Duration>1</Duration><CustomText>Dosages of 2000 mL dose for 1 days with frequency of 1 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>MENSAH</Surname><OtherName>TINA</OtherName><DateOfBirth>04/07/1988</DateOfBirth><Infant>No</Infant><MemberNumber>43148767</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/230922</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-204688</ClaimIdentificationNumber><ClaimCheckCode>37761</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>03/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>24.09</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>OPDC06A</OutPatientCode><InvestigationCode/><TotalCost>24.09</TotalCost><TreatmentsCount>2</TreatmentsCount><MedicinesCount>2</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>Z36.9:Antenatal screening, unspecified</ICDCode><Tariff>24.09</Tariff></Treatment><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>OPDC06A</TreatmentCode><ICDCode>N39.0:Urinary tract infection, site not specified</ICDCode><Tariff>0.00</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>CEFUROTA2</MedicineCode><Quantity>28</Quantity><UnitPrice>2.17</UnitPrice><MedicineTotal>60.76</MedicineTotal><MedicineDate>03/03/2026</MedicineDate><Prescription><Dose>500 MG</Dose><Frequency>2</Frequency><Duration>7</Duration><CustomText>Dosages of 500 MG dose for 7 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>SARPONG</Surname><OtherName>ANGELA</OtherName><DateOfBirth>24/06/1982</DateOfBirth><Infant>No</Infant><MemberNumber>21500469</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/231148</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-205964</ClaimIdentificationNumber><ClaimCheckCode>93018</ClaimCheckCode><ServiceType>OUT</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength/><SpecialityCode>OPDC</SpecialityCode><AdmissionDate>03/03/2026</AdmissionDate><DischargeDate/><OutPatientTariffAmount>46.39</OutPatientTariffAmount><InPatientTariffAmount/><InPatientCode/><OutPatientCode>ZOOM02A</OutPatientCode><InvestigationCode/><TotalCost>46.39</TotalCost><TreatmentsCount>4</TreatmentsCount><MedicinesCount>5</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>ZOOM02A</TreatmentCode><ICDCode>K29.1:Other acute gastritis</ICDCode><Tariff>46.39</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>HYOBUTTA1</MedicineCode><Quantity>30</Quantity><UnitPrice>0.99</UnitPrice><MedicineTotal>29.70</MedicineTotal><MedicineDate>03/03/2026</MedicineDate><Prescription><Dose>20 MG</Dose><Frequency>3</Frequency><Duration>5</Duration><CustomText>Dosages of 20 MG dose for 5 days with frequency of 3 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>Adinkrah</Surname><OtherName>Daniel</OtherName><DateOfBirth>09/12/2020</DateOfBirth><Infant>No</Infant><MemberNumber>30640663</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/220941</HospitalRecordNumber><CardSerialNumber/><Gender>M</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-205983</ClaimIdentificationNumber><ClaimCheckCode>42961</ClaimCheckCode><ServiceType>INP</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength>47</DurationLength><SpecialityCode>RSUR</SpecialityCode><AdmissionDate>15/01/2026</AdmissionDate><DischargeDate>03/03/2026</DischargeDate><OutPatientTariffAmount/><InPatientTariffAmount>1021.06</InPatientTariffAmount><InPatientCode>RSUR02C</InPatientCode><OutPatientCode/><InvestigationCode/><TotalCost>1021.06</TotalCost><TreatmentsCount>2</TreatmentsCount><MedicinesCount>4</MedicinesCount><ReferralNo/><Treatments><Treatment><Date>15/01/2026</Date><Type>Procedure</Type><TreatmentCode>ORTH03C</TreatmentCode><ICDCode/><Tariff>1021.06</Tariff></Treatment><Treatment><Date>10/02/2026</Date><Type>Procedure</Type><TreatmentCode>RSUR02C</TreatmentCode><ICDCode/><Tariff>0.00</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>COAMOXIN1</MedicineCode><Quantity>9</Quantity><UnitPrice>18.70</UnitPrice><MedicineTotal>168.30</MedicineTotal><MedicineDate>16/01/2026</MedicineDate><Prescription><Dose>600 MG</Dose><Frequency>3</Frequency><Duration>3</Duration><CustomText>Dosages of 600 MG dose for 3 days with frequency of 3 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
<PatientData><Surname>DEBZIE</Surname><OtherName>ROSINA</OtherName><DateOfBirth>12/07/2024</DateOfBirth><Infant>No</Infant><MemberNumber>41458843</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>691479</HospitalRecordNumber><CardSerialNumber/><Gender>F</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-206157</ClaimIdentificationNumber><ClaimCheckCode>65268</ClaimCheckCode><ServiceType>INP</ServiceType><PharmacyIncluded>NO</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength>1</DurationLength><SpecialityCode>ORTH</SpecialityCode><AdmissionDate>04/03/2026</AdmissionDate><DischargeDate>04/03/2026</DischargeDate><OutPatientTariffAmount/><InPatientTariffAmount>418.12</InPatientTariffAmount><InPatientCode>ORTH04C</InPatientCode><OutPatientCode/><InvestigationCode/><TotalCost>418.12</TotalCost><TreatmentsCount>1</TreatmentsCount><MedicinesCount>0</MedicinesCount><ReferralNo/><Treatments><Treatment><Date>04/03/2026</Date><Type>Procedure</Type><TreatmentCode>ORTH04C</TreatmentCode><ICDCode/><Tariff>418.12</Tariff></Treatment></Treatments></Claim></Claims></PatientData>
<PatientData><Surname>OSMAN</Surname><OtherName>ABDUL</OtherName><DateOfBirth>12/02/2003</DateOfBirth><Infant>No</Infant><MemberNumber>10016923</MemberNumber><TemporaryCardNumber/><HospitalRecordNumber>PBL-26/231666</HospitalRecordNumber><CardSerialNumber/><Gender>M</Gender><Claims><Claim><ClaimIdentificationNumber>CLA-209473</ClaimIdentificationNumber><ClaimCheckCode>92508</ClaimCheckCode><ServiceType>INP</ServiceType><PharmacyIncluded>YES</PharmacyIncluded><AllInclusive>YES</AllInclusive><OutcomeType>DIS</OutcomeType><AdmissionType>EME</AdmissionType><DurationLength>2</DurationLength><SpecialityCode>MEDI</SpecialityCode><AdmissionDate>03/03/2026</AdmissionDate><DischargeDate>05/03/2026</DischargeDate><OutPatientTariffAmount/><InPatientTariffAmount>335.50</InPatientTariffAmount><InPatientCode>MEDI16A</InPatientCode><OutPatientCode/><InvestigationCode/><TotalCost>335.50</TotalCost><TreatmentsCount>3</TreatmentsCount><MedicinesCount>10</MedicinesCount><ReferralNo/><Treatments><Treatment><Date/><Type>Diagnosis</Type><TreatmentCode>MEDI16A</TreatmentCode><ICDCode>D57.0:Sickle-cell anaemia with crisis</ICDCode><Tariff>335.50</Tariff></Treatment></Treatments><Medicines><Medicine><MedicineCode>DICLOFRE2</MedicineCode><Quantity>20</Quantity><UnitPrice>0.96</UnitPrice><MedicineTotal>19.20</MedicineTotal><MedicineDate>03/03/2026</MedicineDate><Prescription><Dose>100 MG</Dose><Frequency>2</Frequency><Duration>10</Duration><CustomText>Dosages of 100 MG dose for 10 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine><Medicine><MedicineCode>CEFUROTA2</MedicineCode><Quantity>28</Quantity><UnitPrice>2.17</UnitPrice><MedicineTotal>60.76</MedicineTotal><MedicineDate>05/03/2026</MedicineDate><Prescription><Dose>250 MG</Dose><Frequency>2</Frequency><Duration>14</Duration><CustomText>Dosages of 250 MG dose for 14 days with frequency of 2 quantity in a day</CustomText></Prescription></Medicine></Medicines></Claim></Claims></PatientData>
</Patients></Batch>`;
