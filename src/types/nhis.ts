export type UserRole = 'admin' | 'senior_auditor' | 'claims_officer' | 'viewer';

export type RuleCategory = 'Clinical' | 'Tariff' | 'Membership' | 'Pharmacy' | 'Documentation';
export type RuleSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface VettingRuleRecord {
  ruleId: string;
  code: string;
  title: string;
  category: RuleCategory;
  severity: RuleSeverity;
  description: string;
  criteriaSummary: string;
  sourceDocument: string;
  isActive: boolean;
  pdfAffectedCount?: number;
  pdfTotalCostGhs?: number;
  authorId?: string;
}

export interface ClaimTreatment {
  date: string;
  type: string; // Diagnosis | Procedure | Investigation
  treatmentCode: string;
  icdCode: string;
  tariff: number;
}

export interface ClaimMedicine {
  medicineCode: string;
  quantity: number;
  unitPrice: number;
  medicineTotal: number;
  medicineDate: string;
  dose: string;
  frequency: number;
  duration: number;
  customText: string;
}

export interface ParsedNhisClaim {
  claimId: string;
  claimCheckCode: string;
  surname: string;
  otherName: string;
  fullName: string;
  initials: string;
  dateOfBirth: string;
  ageYears: number;
  infant: string;
  memberNumber: string;
  hospitalRecordNumber: string;
  gender: string;
  serviceType: 'INP' | 'OUT' | string;
  pharmacyIncluded: string;
  allInclusive: string;
  outcomeType: string;
  admissionType: string;
  durationLength: number;
  specialityCode: string;
  admissionDate: string;
  dischargeDate: string;
  outPatientTariffAmount: number;
  inPatientTariffAmount: number;
  inPatientCode: string;
  outPatientCode: string;
  totalServiceCost: number;
  totalMedicineCost: number;
  grandTotalCost: number;
  treatmentsCount: number;
  medicinesCount: number;
  referralNo: string;
  treatments: ClaimTreatment[];
  medicines: ClaimMedicine[];
}

export interface ClaimDiscrepancy {
  id: string;
  claimId: string;
  memberNumber: string;
  hospitalRecordNumber: string;
  patientInitials: string;
  patientFullName: string;
  attendanceDate: string;
  specialityCode: string;
  serviceType: string;
  ruleId: string;
  ruleCode: string;
  ruleTitle: string;
  category: RuleCategory;
  severity: RuleSeverity;
  specificFinding: string;
  evidenceDetail: string;
  recommendedAction: string;
  financialAdjustmentGhs: number;
  adjustmentType: 'Service' | 'Medicine' | 'Full Claim Rejection';
}

export interface SpecialtyVettingRow {
  specialty: string;
  serviceType: 'OUT-PATIENT' | 'IN-PATIENT';
  attendanceCount: number;
  submittedServiceGhs: number;
  submittedMedicineGhs: number;
  submittedTotalGhs: number;
  adjustedServiceGhs: number;
  adjustedMedicineGhs: number;
  adjustedTotalGhs: number;
  dueServiceGhs: number;
  dueMedicineGhs: number;
  dueTotalGhs: number;
}

export interface VettedBatchResult {
  reportId: string;
  batchNumber: string;
  facilityName: string;
  facilityCode: string;
  serviceMonth: string;
  serviceYear: string;
  creationDate: string;
  declaredClaimsCount: number;
  parsedClaimsCount: number;
  declaredBatchAmountGhs: number;
  calculatedSubmittedServiceGhs: number;
  calculatedSubmittedMedicineGhs: number;
  calculatedSubmittedTotalGhs: number;
  totalAdjustedServiceGhs: number;
  totalAdjustedMedicineGhs: number;
  totalAdjustedGhs: number;
  netAmountDueGhs: number;
  flaggedClaimsCount: number;
  cleanClaimsCount: number;
  criticalAlertsCount: number;
  complianceScorePercent: number;
  hipaaEncryptionHash: string;
  claims: ParsedNhisClaim[];
  discrepancies: ClaimDiscrepancy[];
  specialtySummary: SpecialtyVettingRow[];
  ruleBreakdown: {
    ruleCode: string;
    ruleTitle: string;
    category: RuleCategory;
    severity: RuleSeverity;
    affectedClaimsCount: number;
    totalCostGhs: number;
    discrepancies: ClaimDiscrepancy[];
  }[];
}
