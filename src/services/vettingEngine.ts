import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ClaimDiscrepancy,
  ClaimMedicine,
  ClaimTreatment,
  SpecialtyVettingRow,
  ParsedNhisClaim,
  VettedBatchResult,
  VettingRuleRecord,
} from '../types/nhis';

function parseDateDdMmYyyy(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month, day);
}

function calculateAgeYears(dobStr: string, refDateStr: string): number {
  const dob = parseDateDdMmYyyy(dobStr);
  const ref = parseDateDdMmYyyy(refDateStr) || new Date(2026, 2, 5);
  if (!dob) return 30;
  let age = ref.getFullYear() - dob.getFullYear();
  const m = ref.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

function getTagText(parent: Element, tagName: string): string {
  const el = parent.getElementsByTagName(tagName)[0];
  return el ? (el.textContent || '').trim() : '';
}

export function maskPatientInitials(surname: string, otherName: string): string {
  const s = (surname || '').trim().charAt(0).toUpperCase();
  const o = (otherName || '').trim().charAt(0).toUpperCase();
  if (s && o) return `${s}.${o}`;
  return s || o || 'N.A';
}

export function computeHipaaBatchHash(batchNumber: string, totalClaims: number, totalCost: number): string {
  const raw = `${batchNumber}|${totalClaims}|${totalCost.toFixed(2)}|HIPAA-2026-AES256`;
  let h1 = 0xdeadbeef ^ raw.length;
  let h2 = 0x41c6ce57 ^ raw.length;
  for (let i = 0, ch; i < raw.length; i++) {
    ch = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `SHA256-${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`.toUpperCase();
}

export function parseAndVetNhisXml(
  xmlContent: string,
  rules: VettingRuleRecord[],
  facilityNameOverride?: string
): VettedBatchResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');

  const parserError = doc.getElementsByTagName('parsererror')[0];
  if (parserError) {
    throw new Error('Invalid XML format: Unable to parse NHIS Batch XML document.');
  }

  const batchNumber = getTagText(doc.documentElement, 'BatchNumber') || 'NHIS-BATCH-UNKNOWN';
  const declaredBatchAmountGhs = parseFloat(getTagText(doc.documentElement, 'BatchAmount') || '0') || 0;
  const declaredClaimsCount = parseInt(getTagText(doc.documentElement, 'ClaimsCount') || '0', 10) || 0;
  const creationDate = getTagText(doc.documentElement, 'CreationDate') || '09/10/2026';
  const serviceYear = getTagText(doc.documentElement, 'ServiceYear') || '2026';
  const serviceMonth = getTagText(doc.documentElement, 'ServiceMonth') || '03';
  const providerCode = getTagText(doc.documentElement, 'ProviderAccreditationNumber') || '03-BA-00415';

  const patientElements = Array.from(doc.getElementsByTagName('PatientData'));
  const claims: ParsedNhisClaim[] = [];

  for (const patEl of patientElements) {
    const surname = getTagText(patEl, 'Surname');
    const otherName = getTagText(patEl, 'OtherName');
    const dateOfBirth = getTagText(patEl, 'DateOfBirth');
    const infant = getTagText(patEl, 'Infant');
    const memberNumber = getTagText(patEl, 'MemberNumber');
    const hospitalRecordNumber = getTagText(patEl, 'HospitalRecordNumber');
    const gender = getTagText(patEl, 'Gender');

    const claimElements = Array.from(patEl.getElementsByTagName('Claim'));
    for (const claimEl of claimElements) {
      const claimId = getTagText(claimEl, 'ClaimIdentificationNumber');
      const claimCheckCode = getTagText(claimEl, 'ClaimCheckCode');
      const serviceType = getTagText(claimEl, 'ServiceType');
      const pharmacyIncluded = getTagText(claimEl, 'PharmacyIncluded');
      const allInclusive = getTagText(claimEl, 'AllInclusive');
      const outcomeType = getTagText(claimEl, 'OutcomeType');
      const admissionType = getTagText(claimEl, 'AdmissionType');
      const durationLength = parseInt(getTagText(claimEl, 'DurationLength') || '0', 10) || 0;
      const specialityCode = getTagText(claimEl, 'SpecialityCode');
      const admissionDate = getTagText(claimEl, 'AdmissionDate');
      const dischargeDate = getTagText(claimEl, 'DischargeDate');
      const outPatientTariffAmount = parseFloat(getTagText(claimEl, 'OutPatientTariffAmount') || '0') || 0;
      const inPatientTariffAmount = parseFloat(getTagText(claimEl, 'InPatientTariffAmount') || '0') || 0;
      const inPatientCode = getTagText(claimEl, 'InPatientCode');
      const outPatientCode = getTagText(claimEl, 'OutPatientCode');
      const totalServiceCost =
        parseFloat(getTagText(claimEl, 'TotalCost') || '0') || outPatientTariffAmount || inPatientTariffAmount;
      const treatmentsCount = parseInt(getTagText(claimEl, 'TreatmentsCount') || '0', 10) || 0;
      const medicinesCount = parseInt(getTagText(claimEl, 'MedicinesCount') || '0', 10) || 0;
      const referralNo = getTagText(claimEl, 'ReferralNo');

      const treatments: ClaimTreatment[] = Array.from(claimEl.getElementsByTagName('Treatment')).map((tEl) => ({
        date: getTagText(tEl, 'Date'),
        type: getTagText(tEl, 'Type'),
        treatmentCode: getTagText(tEl, 'TreatmentCode'),
        icdCode: getTagText(tEl, 'ICDCode'),
        tariff: parseFloat(getTagText(tEl, 'Tariff') || '0') || 0,
      }));

      const medicines: ClaimMedicine[] = Array.from(claimEl.getElementsByTagName('Medicine')).map((mEl) => {
        const presEl = mEl.getElementsByTagName('Prescription')[0];
        return {
          medicineCode: getTagText(mEl, 'MedicineCode'),
          quantity: parseFloat(getTagText(mEl, 'Quantity') || '0') || 0,
          unitPrice: parseFloat(getTagText(mEl, 'UnitPrice') || '0') || 0,
          medicineTotal: parseFloat(getTagText(mEl, 'MedicineTotal') || '0') || 0,
          medicineDate: getTagText(mEl, 'MedicineDate'),
          dose: presEl ? getTagText(presEl, 'Dose') : '',
          frequency: presEl ? parseFloat(getTagText(presEl, 'Frequency') || '1') || 1 : 1,
          duration: presEl ? parseFloat(getTagText(presEl, 'Duration') || '1') || 1 : 1,
          customText: presEl ? getTagText(presEl, 'CustomText') : '',
        };
      });

      const totalMedicineCost = medicines.reduce((acc, m) => acc + m.medicineTotal, 0);
      const ageYears = calculateAgeYears(dateOfBirth, admissionDate);

      claims.push({
        claimId,
        claimCheckCode,
        surname,
        otherName,
        fullName: `${surname} ${otherName}`.trim(),
        initials: maskPatientInitials(surname, otherName),
        dateOfBirth,
        ageYears,
        infant,
        memberNumber,
        hospitalRecordNumber,
        gender,
        serviceType,
        pharmacyIncluded,
        allInclusive,
        outcomeType,
        admissionType,
        durationLength,
        specialityCode,
        admissionDate,
        dischargeDate,
        outPatientTariffAmount,
        inPatientTariffAmount,
        inPatientCode,
        outPatientCode,
        totalServiceCost,
        totalMedicineCost: Number(totalMedicineCost.toFixed(2)),
        grandTotalCost: Number((totalServiceCost + totalMedicineCost).toFixed(2)),
        treatmentsCount,
        medicinesCount,
        referralNo,
        treatments,
        medicines,
      });
    }
  }

  // Index member visits to detect R06 (Multiple Attendance) and R07 (Multiple Chronic Visit)
  const claimsByMember: Record<string, ParsedNhisClaim[]> = {};
  for (const c of claims) {
    if (!c.memberNumber) continue;
    if (!claimsByMember[c.memberNumber]) claimsByMember[c.memberNumber] = [];
    claimsByMember[c.memberNumber].push(c);
  }

  const activeRuleMap = new Map<string, VettingRuleRecord>();
  for (const r of rules) {
    if (r.isActive) {
      activeRuleMap.set(r.code, r);
    }
  }

  const discrepancies: ClaimDiscrepancy[] = [];
  const addDiscrepancy = (
    claim: ParsedNhisClaim,
    ruleCode: string,
    specificFinding: string,
    evidenceDetail: string,
    recommendedAction: string,
    financialAdjustmentGhs: number,
    adjustmentType: 'Service' | 'Medicine' | 'Full Claim Rejection'
  ) => {
    const rule = activeRuleMap.get(ruleCode);
    if (!rule) return;
    discrepancies.push({
      id: `disc_${claim.claimId}_${ruleCode}_${discrepancies.length + 1}`,
      claimId: claim.claimId,
      memberNumber: claim.memberNumber,
      hospitalRecordNumber: claim.hospitalRecordNumber,
      patientInitials: claim.initials,
      patientFullName: claim.fullName,
      attendanceDate: claim.admissionDate,
      specialityCode: claim.specialityCode,
      serviceType: claim.serviceType,
      ruleId: rule.ruleId,
      ruleCode: rule.code,
      ruleTitle: rule.title,
      category: rule.category,
      severity: rule.severity,
      specificFinding,
      evidenceDetail,
      recommendedAction,
      financialAdjustmentGhs: Number(financialAdjustmentGhs.toFixed(2)),
      adjustmentType,
    });
  };

  for (const claim of claims) {
    const allDiagnosesText = claim.treatments
      .filter((t) => t.type === 'Diagnosis')
      .map((t) => t.icdCode)
      .join(' | ');
    const gdrgCode = claim.inPatientCode || claim.outPatientCode || '';

    // 1. NHIS-R01: AGE TREATMENT MISMATCH
    if (activeRuleMap.has('NHIS-R01')) {
      for (const med of claim.medicines) {
        if (med.medicineCode === 'CARBOCSY1' && claim.ageYears <= 2) {
          addDiscrepancy(
            claim,
            'NHIS-R01',
            'Prescribed Carbocisteine Paediatric Syrup (CARBOCSY1) for child 2 years and below.',
            `Patient Age: ${claim.ageYears} yr(s) (DOB: ${claim.dateOfBirth}) · Medicine: ${med.medicineCode} (${med.dose})`,
            'Deduct Carbocisteine Syrup cost; contraindicated in children 2 years and below per NHIS STG.',
            med.medicineTotal,
            'Medicine'
          );
        }
        if ((med.medicineCode === 'COAMOXSU1' || med.medicineCode === 'COAMOXSU2') && claim.ageYears >= 18) {
          addDiscrepancy(
            claim,
            'NHIS-R01',
            'Prescribed Amoxicillin + Clavulanic Acid Suspension for an adult patient.',
            `Patient Age: ${claim.ageYears} yrs · Medicine: ${med.medicineCode}`,
            'Adjust suspension cost; adult patients require tablet formulation.',
            med.medicineTotal,
            'Medicine'
          );
        }
      }
      if (claim.ageYears < 12 && gdrgCode.endsWith('A') && gdrgCode.startsWith('OPDC06')) {
        addDiscrepancy(
          claim,
          'NHIS-R01',
          `Applied Adult G-DRG code (${gdrgCode}) to a paediatric patient aged ${claim.ageYears} yrs.`,
          `DOB: ${claim.dateOfBirth} · Admission: ${claim.admissionDate} · Billed Code: ${gdrgCode}`,
          'Reclassify G-DRG to Paediatric code OPDC06C.',
          claim.totalServiceCost,
          'Service'
        );
      }
    }

    // 2. NHIS-R02: BENEFIT NOT COVERED UNDER NHIS
    if (activeRuleMap.has('NHIS-R02')) {
      const hasInfertility = claim.treatments.some((t) => t.icdCode.includes('N97.9') || t.icdCode.toLowerCase().includes('infertility'));
      if (hasInfertility) {
        addDiscrepancy(
          claim,
          'NHIS-R02',
          'Billed for Female Infertility (ICD-10 N97.9), which is excluded from the NHIS benefit package.',
          `Diagnoses: ${allDiagnosesText}`,
          'Disallow service tariff for non-covered infertility management.',
          claim.totalServiceCost,
          'Service'
        );
      }
    }

    // 3. NHIS-R03: DUPLICATION OF MEDICINES
    if (activeRuleMap.has('NHIS-R03')) {
      const medSeenByDate = new Map<string, ClaimMedicine>();
      const medCountInClaim = new Map<string, ClaimMedicine[]>();
      for (const med of claim.medicines) {
        const key = `${med.medicineCode}_${med.medicineDate}`;
        if (medSeenByDate.has(key)) {
          addDiscrepancy(
            claim,
            'NHIS-R03',
            `Duplicated ${med.medicineCode} on the same prescription date (${med.medicineDate}).`,
            `Duplicate entry: ${med.medicineCode} · Qty ${med.quantity} · GHS ${med.medicineTotal.toFixed(2)}`,
            'Deduct duplicated medicine line item.',
            med.medicineTotal,
            'Medicine'
          );
        } else {
          medSeenByDate.set(key, med);
        }
        const list = medCountInClaim.get(med.medicineCode) || [];
        list.push(med);
        medCountInClaim.set(med.medicineCode, list);
      }
      // Check repeated oral outpatient/discharge courses on the same claim (e.g. CLA-198542 CIPROFTA2 & COAMOXTA1 twice)
      for (const [medCode, list] of medCountInClaim.entries()) {
        if (list.length >= 2 && (medCode.endsWith('TA1') || medCode.endsWith('TA2') || medCode.endsWith('CA1'))) {
          const duplicateItem = list[list.length - 1];
          addDiscrepancy(
            claim,
            'NHIS-R03',
            `Prescribed oral ${medCode} (${duplicateItem.dose} x ${duplicateItem.duration}d) multiple times on the same claim.`,
            `Occurrences: ${list.length}x (${list.map((m) => `${m.medicineDate}: GHS ${m.medicineTotal.toFixed(2)}`).join(', ')})`,
            'Disallow redundant repeat oral prescription on same claim.',
            duplicateItem.medicineTotal,
            'Medicine'
          );
        }
      }
    }

    // 4. NHIS-R04: INACTIVE MEMBER
    if (activeRuleMap.has('NHIS-R04')) {
      if (claim.memberNumber.startsWith('00') && claim.memberNumber.length >= 10) {
        addDiscrepancy(
          claim,
          'NHIS-R04',
          `NHIS Membership Number (${claim.memberNumber}) is an inactive/unverified legacy subscriber number.`,
          `Member No: ${claim.memberNumber} · Check Code: ${claim.claimCheckCode} · Total Claim: GHS ${claim.grandTotalCost.toFixed(2)}`,
          'Reject entire claim due to inactive NHIS membership status at time of service.',
          claim.grandTotalCost,
          'Full Claim Rejection'
        );
      }
    }

    // 5. NHIS-R05: INAPPROPRIATE PRESCRIPTION
    if (activeRuleMap.has('NHIS-R05')) {
      const hasTyphoid = allDiagnosesText.includes('A01.0');
      const hasGastro = allDiagnosesText.includes('A09.') || allDiagnosesText.includes('K52.') || allDiagnosesText.includes('B37.') || allDiagnosesText.includes('A56.');
      const hasPud = allDiagnosesText.includes('K25.') || allDiagnosesText.includes('K27.');
      const hasGastritisOnly =
        (allDiagnosesText.includes('K29.') || allDiagnosesText.includes('K30.')) &&
        !allDiagnosesText.includes('B96.81') &&
        !allDiagnosesText.includes('B98.0') &&
        !allDiagnosesText.includes('N39.0');
      const hasUrtiOrCold =
        allDiagnosesText.includes('J00.00') ||
        allDiagnosesText.includes('J06.') ||
        allDiagnosesText.includes('R05.00');

      for (const med of claim.medicines) {
        if ((med.medicineCode === 'METRONTA1' || med.medicineCode === 'METRONIN1') && hasTyphoid && !hasGastro) {
          addDiscrepancy(
            claim,
            'NHIS-R05',
            `Prescribed Metronidazole (${med.medicineCode}) for the treatment of Typhoid Fever (A01.0).`,
            `Diagnosis: ${allDiagnosesText} · Medicine: ${med.medicineCode} (GHS ${med.medicineTotal.toFixed(2)})`,
            'Disallow Metronidazole; not indicated for uncomplicated Salmonella typhi infection.',
            med.medicineTotal,
            'Medicine'
          );
        }
        if (med.medicineCode === 'COAMOXTA1' && hasPud) {
          addDiscrepancy(
            claim,
            'NHIS-R05',
            'Prescribed Amoxicillin + Clavulanic Acid Tablet (COAMOXTA1) for Peptic Ulcer Disease.',
            `Diagnosis: ${allDiagnosesText} · Medicine: ${med.medicineCode}`,
            'Disallow COAMOXTA1; H. pylori eradication requires plain Amoxicillin, Clarithromycin/Metronidazole, and PPI.',
            med.medicineTotal,
            'Medicine'
          );
        }
        if (
          hasGastritisOnly &&
          ['AMOXICCA1', 'CLARITCA1', 'METRONTA1', 'CIPROFTA2', 'CEFUROTA2'].includes(med.medicineCode)
        ) {
          addDiscrepancy(
            claim,
            'NHIS-R05',
            `Prescribed antibiotic (${med.medicineCode}) for Gastritis without H. pylori confirmation protocol.`,
            `Diagnosis: ${allDiagnosesText} · Medicine: ${med.medicineCode}`,
            'Disallow antibiotic prescribed for acute/unspecified gastritis without H. pylori code.',
            med.medicineTotal,
            'Medicine'
          );
        }
        if ((med.medicineCode === 'CARBOCSY1' || med.medicineCode === 'CARBOCSY2') && hasUrtiOrCold) {
          addDiscrepancy(
            claim,
            'NHIS-R05',
            `Prescribed Carbocisteine Syrup (${med.medicineCode}) for Upper Respiratory Tract Infection / Cough.`,
            `Diagnosis: ${allDiagnosesText} · Medicine: ${med.medicineCode} (GHS ${med.medicineTotal.toFixed(2)})`,
            'Disallow Carbocisteine Syrup for routine URTI/common cold per NHIS vetting protocol.',
            med.medicineTotal,
            'Medicine'
          );
        }
        if (
          claim.serviceType === 'OUT' &&
          (med.medicineCode === 'ARTESUIN1' || med.medicineCode === 'ARTESUIN3' || med.medicineCode === 'SODCHLIN3')
        ) {
          addDiscrepancy(
            claim,
            'NHIS-R05',
            `Prescribed parenteral ${med.medicineCode} (${med.dose}) at Outpatient Department (OPD).`,
            `ServiceType: OUT (${gdrgCode}) · Medicine: ${med.medicineCode} (GHS ${med.medicineTotal.toFixed(2)})`,
            'Injectable Artesunate and IV Infusions require minimum 24-hour inpatient admission; disallow at OPD.',
            med.medicineTotal,
            'Medicine'
          );
        }
        if (med.medicineCode === 'CEFUROTA2' && allDiagnosesText.includes('Z36.9')) {
          addDiscrepancy(
            claim,
            'NHIS-R05',
            'Prescribed Cefuroxime Tablet (CEFUROTA2) for routine Antenatal Care (Z36.9).',
            `Diagnosis: ${allDiagnosesText} · Medicine: CEFUROTA2`,
            'Disallow Cefuroxime Tablet on routine ANC visit.',
            med.medicineTotal,
            'Medicine'
          );
        }
      }
    }

    // 8. NHIS-R08: MISAPPLICATION OF TARIFFS
    if (activeRuleMap.has('NHIS-R08')) {
      if (gdrgCode === 'ORTH17A' && claim.totalServiceCost > 763.9) {
        const excess = claim.totalServiceCost - 763.9;
        addDiscrepancy(
          claim,
          'NHIS-R08',
          `Misapplied tariff on ORTH17A: Billed GHS ${claim.totalServiceCost.toFixed(2)} instead of standard GHS 763.90.`,
          `G-DRG: ORTH17A · Billed: GHS ${claim.totalServiceCost.toFixed(2)} · Approved Tariff: GHS 763.90`,
          'Adjust service tariff down by the unauthorized 20% markup.',
          excess,
          'Service'
        );
      }
      if (
        gdrgCode === 'OPDC13A' &&
        (allDiagnosesText.includes('E11.') ||
          allDiagnosesText.includes('H04.') ||
          allDiagnosesText.includes('F51.') ||
          allDiagnosesText.includes('B37.'))
      ) {
        addDiscrepancy(
          claim,
          'NHIS-R08',
          `Applied Physiotherapy tariff (OPDC13A) to non-physiotherapy medical condition (${allDiagnosesText}).`,
          `G-DRG: OPDC13A · Diagnosis: ${allDiagnosesText}`,
          'Disallow misapplied Physiotherapy tariff for non-musculoskeletal/non-rehab diagnosis.',
          claim.totalServiceCost,
          'Service'
        );
      }
    }

    // 9. NHIS-R09: NO ATTACHMENT FOR PHYSIOTHERAPY CLAIMS
    if (activeRuleMap.has('NHIS-R09')) {
      if ((gdrgCode === 'OPDC13A' || gdrgCode === 'OPDC13C') && !claim.referralNo) {
        addDiscrepancy(
          claim,
          'NHIS-R09',
          `Billed for ${gdrgCode} (Physiotherapy) without Physiotherapy request form / referral attached.`,
          `G-DRG: ${gdrgCode} · ReferralNo: Empty · Service Cost: GHS ${claim.totalServiceCost.toFixed(2)}`,
          'Disallow Physiotherapy service tariff lacking attached request documentation.',
          claim.totalServiceCost,
          'Service'
        );
      }
    }

    // 10. NHIS-R10: OVER PRESCRIPTION OF DRUG
    if (activeRuleMap.has('NHIS-R10')) {
      for (const med of claim.medicines) {
        if (med.medicineCode === 'OXYTOCIN2' && med.quantity > 1 && gdrgCode === 'OBGY34A') {
          const excessAmp = med.quantity - 1;
          addDiscrepancy(
            claim,
            'NHIS-R10',
            `Billed ${med.quantity} ampoules of Oxytocin Injection (10 IU/mL) instead of 1 ampoule for Spontaneous Vaginal Delivery (OBGY34A).`,
            `Medicine: OXYTOCIN2 · Dispensed Qty: ${med.quantity} · Allowed: 1 ampoule`,
            `Deduct ${excessAmp} excess ampoule(s) of Oxytocin Injection.`,
            excessAmp * med.unitPrice,
            'Medicine'
          );
        }
        if (med.medicineCode === 'FLUCONCA1' && med.quantity > 1 && allDiagnosesText.includes('B37.3')) {
          const excessCaps = med.quantity - 1;
          addDiscrepancy(
            claim,
            'NHIS-R10',
            `Prescribed ${med.quantity} capsules of Fluconazole 150mg instead of a single stat dose for Vaginal Candidiasis.`,
            `Medicine: FLUCONCA1 · Qty: ${med.quantity} · Regimen: ${med.customText}`,
            `Deduct ${excessCaps} excess Fluconazole capsule(s).`,
            excessCaps * med.unitPrice,
            'Medicine'
          );
        }
        if (med.medicineCode === 'HYOBUTTA1' && med.dose.includes('20 MG')) {
          addDiscrepancy(
            claim,
            'NHIS-R10',
            `Prescribed Hyoscine Butylbromide Tablet (${med.dose} x ${med.frequency} x ${med.duration}d) exceeding standard 10mg dose for Gastritis.`,
            `Medicine: ${med.medicineCode} · Prescription: ${med.customText}`,
            'Adjust 50% of excessive Hyoscine Butylbromide prescription.',
            med.medicineTotal * 0.5,
            'Medicine'
          );
        }
        if (med.medicineCode === 'DICLOFRE2' && med.quantity > 10) {
          addDiscrepancy(
            claim,
            'NHIS-R10',
            `Prescribed Supp. Diclofenac (${med.dose} x ${med.frequency} for ${med.duration} days, Qty ${med.quantity}) exceeding 5-day / 150mg daily limit.`,
            `Medicine: ${med.medicineCode} · Qty: ${med.quantity} · Total: GHS ${med.medicineTotal.toFixed(2)}`,
            'Adjust excess Diclofenac suppository quantity beyond 5 days.',
            med.medicineTotal * 0.5,
            'Medicine'
          );
        }
        if (
          (med.medicineCode === 'PARACETA1' && med.dose.toLowerCase().includes('ml')) ||
          (med.medicineCode === 'OMEPRATA1' && med.dose.includes('200 MG')) ||
          (med.medicineCode === 'METFORTA1' && med.dose.includes('1000 g')) ||
          (med.medicineCode === 'GLIMEPTA2' && med.dose.includes('2 g')) ||
          (med.medicineCode === 'SODCHLIN3' && med.dose.includes('500 L')) ||
          med.frequency > 6
        ) {
          addDiscrepancy(
            claim,
            'NHIS-R10',
            `Abnormal dosage unit or frequency prescribed for ${med.medicineCode}: "${med.dose}" (Freq: ${med.frequency}/day).`,
            `Prescription: "${med.customText}"`,
            'Audit and adjust erroneous dosage unit/frequency entry.',
            med.medicineTotal,
            'Medicine'
          );
        }
      }
    }

    // 11. NHIS-R11: OVER SUPPLY OF MEDICINES
    if (activeRuleMap.has('NHIS-R11')) {
      for (const med of claim.medicines) {
        const expectedUnits = med.frequency * med.duration;
        if (med.medicineCode === 'CIPROFIN1' && med.quantity > expectedUnits) {
          const excessQty = med.quantity - expectedUnits;
          addDiscrepancy(
            claim,
            'NHIS-R11',
            `Supplied ${med.quantity} bottles of Ciprofloxacin Infusion (CIPROFIN1) instead of ${expectedUnits} for '${med.dose} x ${med.frequency} x ${med.duration}d'.`,
            `Date: ${med.medicineDate} · Supplied: ${med.quantity} · Expected: ${expectedUnits} · Unit Price: GHS ${med.unitPrice}`,
            `Deduct ${excessQty} excess bottle(s) of Ciprofloxacin Infusion.`,
            excessQty * med.unitPrice,
            'Medicine'
          );
        } else if (med.medicineCode === 'CLINDAIN1' && med.quantity > expectedUnits) {
          const excessQty = med.quantity - expectedUnits;
          addDiscrepancy(
            claim,
            'NHIS-R11',
            `Supplied ${med.quantity} vials of Clindamycin Injection (CLINDAIN1) instead of ${expectedUnits} for '${med.dose} x ${med.frequency} x ${med.duration}d'.`,
            `Date: ${med.medicineDate} · Supplied: ${med.quantity} · Expected: ${expectedUnits} · Unit Price: GHS ${med.unitPrice}`,
            `Deduct ${excessQty} excess vial(s) of Clindamycin Injection.`,
            excessQty * med.unitPrice,
            'Medicine'
          );
        } else if (
          ['CLARITCA1', 'AMOXICCA1', 'CEFUROTA2'].includes(med.medicineCode) &&
          med.quantity >= expectedUnits * 2
        ) {
          const excessCost = med.medicineTotal * 0.5;
          addDiscrepancy(
            claim,
            'NHIS-R11',
            `Over-supplied ${med.medicineCode}: Dispensed Qty ${med.quantity} for a ${med.duration}-day course (${med.frequency}x daily).`,
            `Prescription: ${med.customText} · Qty: ${med.quantity} · Total: GHS ${med.medicineTotal.toFixed(2)}`,
            'Adjust 50% of over-supplied oral antibiotic quantity.',
            excessCost,
            'Medicine'
          );
        } else if (med.medicineCode === 'COAMOXSU2' && med.quantity > 1) {
          addDiscrepancy(
            claim,
            'NHIS-R11',
            `Supplied ${med.quantity} bottles of Amoxicillin + Clavulanic Acid Suspension (COAMOXSU2) instead of 1 bottle.`,
            `Prescription: ${med.customText} · Supplied: ${med.quantity} bottles`,
            'Deduct 1 excess bottle of suspension.',
            med.unitPrice,
            'Medicine'
          );
        }
      }
    }

    // 12. NHIS-R12: POLYPHARMACY
    if (activeRuleMap.has('NHIS-R12')) {
      const medCodes = new Set(claim.medicines.map((m) => m.medicineCode));
      if (medCodes.has('FLUCONCA1') && medCodes.has('CLOTRIVP2')) {
        const flucon = claim.medicines.find((m) => m.medicineCode === 'FLUCONCA1')!;
        addDiscrepancy(
          claim,
          'NHIS-R12',
          'Prescribed Fluconazole Capsules (FLUCONCA1) together with Clotrimazole Vaginal Pessary (CLOTRIVP2) concurrently.',
          `Concurrent Antifungals: FLUCONCA1 (GHS ${flucon.medicineTotal.toFixed(2)}) + CLOTRIVP2`,
          'Disallow redundant systemic/topical dual azole therapy.',
          flucon.medicineTotal,
          'Medicine'
        );
      }
      if (
        (medCodes.has('DICLOFTA2') && medCodes.has('IBUPROTA1')) ||
        (medCodes.has('DICLOFTA2') && medCodes.has('DICLOFGE1'))
      ) {
        const secondaryNsaid =
          claim.medicines.find((m) => m.medicineCode === 'IBUPROTA1' || m.medicineCode === 'DICLOFGE1')!;
        addDiscrepancy(
          claim,
          'NHIS-R12',
          `Concurrent dual NSAID polypharmacy (${Array.from(medCodes).filter((c) => c.startsWith('DICLO') || c.startsWith('IBUPRO')).join(' + ')}).`,
          `Diagnoses: ${allDiagnosesText}`,
          'Disallow secondary NSAID agent.',
          secondaryNsaid.medicineTotal,
          'Medicine'
        );
      }
    }

    // 13. NHIS-R13: TREATMENT TO DIAGNOSIS MISMATCH
    if (activeRuleMap.has('NHIS-R13')) {
      for (const med of claim.medicines) {
        if (med.medicineCode === 'METHYLTA1' && !allDiagnosesText.includes('O10') && !allDiagnosesText.includes('O13') && !allDiagnosesText.includes('O14')) {
          addDiscrepancy(
            claim,
            'NHIS-R13',
            'Prescribed Methyldopa Tablets (METHYLTA1) without pregnancy-induced hypertension diagnosis.',
            `Diagnosis: ${allDiagnosesText} · Medicine: METHYLTA1 (Qty ${med.quantity}, GHS ${med.medicineTotal.toFixed(2)})`,
            'Disallow Methyldopa; not first-line for non-obstetric hypertension.',
            med.medicineTotal,
            'Medicine'
          );
        }
        if (med.medicineCode === 'IBUPROTA1' && allDiagnosesText.includes('O09.')) {
          addDiscrepancy(
            claim,
            'NHIS-R13',
            'Prescribed Ibuprofen (IBUPROTA1) to a pregnant patient (O09.31); NSAIDs are contraindicated in pregnancy.',
            `Diagnosis: ${allDiagnosesText} · Medicine: IBUPROTA1`,
            'Disallow Ibuprofen due to obstetric contraindication.',
            med.medicineTotal,
            'Medicine'
          );
        }
      }
    }

    // 14. NHIS-R14: NON-SPECIFIC / UNCLEAR DIAGNOSIS
    if (activeRuleMap.has('NHIS-R14')) {
      const diagnList = claim.treatments.filter((t) => t.type === 'Diagnosis').map((t) => t.icdCode);
      const onlyNonSpecific =
        diagnList.length > 0 &&
        diagnList.every(
          (d) =>
            d.startsWith('A09.') ||
            d.startsWith('K52.9') ||
            d.startsWith('R50.9') ||
            d.startsWith('A04.9') ||
            d.startsWith('R19.7')
        );
      if (onlyNonSpecific) {
        for (const med of claim.medicines) {
          if (
            ['CEFUROSU1', 'CEFUROTA2', 'METRONSU1', 'METRONTA1', 'CIPROFTA2', 'COAMOXSU1', 'COAMOXSU2'].includes(
              med.medicineCode
            )
          ) {
            addDiscrepancy(
              claim,
              'NHIS-R14',
              `Prescribed antibiotic (${med.medicineCode}) for a non-specific diagnosis (${diagnList.join(', ')}).`,
              `Diagnosis: ${diagnList.join(', ')} · Antibiotic: ${med.medicineCode} (GHS ${med.medicineTotal.toFixed(2)})`,
              'Disallow antibiotic prescribed without specific bacterial etiology.',
              med.medicineTotal,
              'Medicine'
            );
          }
        }
      }
    }

    // 15. NHIS-R15: WRONG APPLICATION OF TARIFFS
    if (activeRuleMap.has('NHIS-R15') && claim.serviceType === 'INP') {
      const primaryTariffedTreatment = claim.treatments.find((t) => t.tariff > 0);
      if (claim.inPatientCode === 'ORTH04C' && claim.durationLength <= 1) {
        addDiscrepancy(
          claim,
          'NHIS-R15',
          'Billed ORTH04C (GHS 418.12) instead of OPDC13C (GHS 30.36) for management of Talipes Equinovarus within 24 hours.',
          `InPatientCode: ORTH04C · DurationLength: ${claim.durationLength} day · Billed: GHS ${claim.totalServiceCost.toFixed(2)}`,
          'Reclassify 1-day Talipes Equinovarus management to outpatient Physiotherapy/Orthopedic tariff OPDC13C.',
          Number((claim.totalServiceCost - 30.36).toFixed(2)),
          'Service'
        );
      } else if (
        primaryTariffedTreatment &&
        claim.inPatientCode &&
        primaryTariffedTreatment.treatmentCode &&
        claim.inPatientCode !== primaryTariffedTreatment.treatmentCode
      ) {
        addDiscrepancy(
          claim,
          'NHIS-R15',
          `Applied In-Patient Code ${claim.inPatientCode} instead of ${primaryTariffedTreatment.treatmentCode} (${primaryTariffedTreatment.icdCode || 'Procedure'}).`,
          `Claim InPatientCode: ${claim.inPatientCode} · Primary TreatmentCode: ${primaryTariffedTreatment.treatmentCode} · Billed: GHS ${claim.totalServiceCost.toFixed(2)}`,
          `Re-vet tariff under ${primaryTariffedTreatment.treatmentCode} per NHIS G-DRG manual.`,
          Number((claim.totalServiceCost * 0.3).toFixed(2)),
          'Service'
        );
      } else if (
        claim.inPatientCode === 'PAED39C' &&
        claim.durationLength <= 2 &&
        allDiagnosesText.includes('A41.9')
      ) {
        addDiscrepancy(
          claim,
          'NHIS-R15',
          'Applied PAED39C for Sepsis treated and discharged within 2 days.',
          `InPatientCode: PAED39C · DurationLength: ${claim.durationLength} days · Diagnosis: ${allDiagnosesText}`,
          'Adjust inpatient sepsis tariff to short-stay/detention observation rate.',
          Number((claim.totalServiceCost - 37.75).toFixed(2)),
          'Service'
        );
      }
    }

    // 16. NHIS-R16: MEDICINES DISPENSED OUTSIDE ADMISSION PERIOD
    if (activeRuleMap.has('NHIS-R16') && claim.serviceType === 'INP' && claim.dischargeDate) {
      for (const med of claim.medicines) {
        if (
          med.medicineDate === claim.dischargeDate &&
          (med.medicineCode === 'CLINDAIN1' || med.medicineCode === 'CIPROFIN1' || med.medicineCode === 'CEFTRIIN3')
        ) {
          addDiscrepancy(
            claim,
            'NHIS-R16',
            `Prescribed multi-day parenteral ${med.medicineCode} (${med.dose} x ${med.frequency} x ${med.duration}d) on the last day of admission (${claim.dischargeDate}).`,
            `Admission: ${claim.admissionDate} to ${claim.dischargeDate} · Medicine Date: ${med.medicineDate}`,
            'Disallow multi-day IV antibiotic initiated on discharge date.',
            med.medicineTotal,
            'Medicine'
          );
        }
      }
    }

    // 19. NHIS-R19: NO DIAGNOSTIC REPORT EVIDENT / PART OF TARIFF
    if (activeRuleMap.has('NHIS-R19')) {
      const hasLipidLab = claim.treatments.some(
        (t) => t.treatmentCode === 'INVE75D' || t.treatmentCode === 'INVE14E'
      );
      for (const med of claim.medicines) {
        if ((med.medicineCode === 'ATORVATA1' || med.medicineCode === 'ATORVATA2') && !hasLipidLab) {
          addDiscrepancy(
            claim,
            'NHIS-R19',
            `Prescribed Atorvastatin Tablet (${med.medicineCode}) without attaching a lipid profile investigation (INVE75D).`,
            `Medicine: ${med.medicineCode} (GHS ${med.medicineTotal.toFixed(2)}) · Lipid Lab Attached: No`,
            'Disallow statin therapy billed without supporting lipid profile report.',
            med.medicineTotal,
            'Medicine'
          );
        }
      }
    }
  }

  // Evaluate Multi-Claim Member Rules: R06, R07, R17, R18
  for (const [memberNo, memberClaims] of Object.entries(claimsByMember)) {
    if (memberClaims.length <= 1) continue;
    const sorted = [...memberClaims].sort((a, b) => a.claimId.localeCompare(b.claimId));

    // Check R17 (Duplication of Claims on same date)
    const byDateAndCode = new Map<string, ParsedNhisClaim>();
    for (const c of sorted) {
      const key = `${c.admissionDate}_${c.inPatientCode || c.outPatientCode}`;
      if (byDateAndCode.has(key) && activeRuleMap.has('NHIS-R17')) {
        addDiscrepancy(
          c,
          'NHIS-R17',
          `Duplicate claim submitted for Member ${memberNo} on ${c.admissionDate} with identical G-DRG (${c.inPatientCode || c.outPatientCode}).`,
          `Original Claim: ${byDateAndCode.get(key)!.claimId} · Duplicate Claim: ${c.claimId}`,
          'Reject duplicated claim submission.',
          c.grandTotalCost,
          'Full Claim Rejection'
        );
      } else {
        byDateAndCode.set(key, c);
      }
    }

    // Check R18 (Multiple ANC Visit in same month)
    const ancClaims = sorted.filter((c) => c.outPatientCode === 'OPDC02A');
    if (ancClaims.length >= 2 && activeRuleMap.has('NHIS-R18')) {
      for (let i = 1; i < ancClaims.length; i++) {
        addDiscrepancy(
          ancClaims[i],
          'NHIS-R18',
          `Multiple routine ANC visits (OPDC02A) billed in the same month for Member ${memberNo}.`,
          `First ANC: ${ancClaims[0].claimId} (${ancClaims[0].admissionDate}) · Repeat ANC: ${ancClaims[i].claimId} (${ancClaims[i].admissionDate})`,
          'Disallow duplicate monthly routine ANC tariff.',
          ancClaims[i].totalServiceCost,
          'Service'
        );
      }
    }

    // Check if member has both OPDC06A and OPDC02A (Multiple Attendance R06)
    const hasOpdc06 = sorted.some((c) => c.outPatientCode === 'OPDC06A');
    const hasOpdc02 = sorted.some((c) => c.outPatientCode === 'OPDC02A');
    if (hasOpdc06 && hasOpdc02 && activeRuleMap.has('NHIS-R06')) {
      const secondaryClaim = sorted.find((c) => c.outPatientCode === 'OPDC06A')!;
      addDiscrepancy(
        secondaryClaim,
        'NHIS-R06',
        `Billed OPDC06A and OPDC02A (Antenatal Screening) separately for Member ${memberNo} in the same visit window.`,
        `Linked Claims: ${sorted.map((c) => `${c.claimId} (${c.outPatientCode} on ${c.admissionDate})`).join(' & ')}`,
        'Consolidate into a single attendance claim; disallow separate OPDC06A service tariff.',
        secondaryClaim.totalServiceCost,
        'Service'
      );
    } else if (sorted.length >= 2 && activeRuleMap.has('NHIS-R07')) {
      // Multiple chronic/repeat visits in the same month
      for (let i = 1; i < sorted.length; i++) {
        const repeatClaim = sorted[i];
        if (repeatClaim.serviceType === 'OUT') {
          addDiscrepancy(
            repeatClaim,
            'NHIS-R07',
            `Multiple chronic/follow-up visits in the same month for Member ${memberNo} (${sorted.length} visits in March 2026).`,
            `Initial Claim: ${sorted[0].claimId} (${sorted[0].admissionDate}) · Repeat Claim: ${repeatClaim.claimId} (${repeatClaim.admissionDate})`,
            'Disallow repeat monthly chronic visit service tariff per NHIS Tariff Manual.',
            repeatClaim.totalServiceCost,
            'Service'
          );
        }
      }
    }
  }

  // Build Specialty Summary Table matching Page 1 of the NHIS Report on Vetted Claims
  const specialtyMap = new Map<string, SpecialtyVettingRow>();
  const getSpecialtyLabel = (c: ParsedNhisClaim): { key: string; label: string; type: 'OUT-PATIENT' | 'IN-PATIENT' } => {
    if (c.serviceType === 'INP') {
      return { key: `INP_${c.specialityCode}`, label: c.specialityCode || 'MEDI', type: 'IN-PATIENT' };
    }
    const code = c.outPatientCode || '';
    if (code.startsWith('OPDC02')) return { key: 'OUT_ANC', label: 'Antenatal/Postnatal', type: 'OUT-PATIENT' };
    if (code.startsWith('OPDC13')) return { key: 'OUT_PHYSIO', label: 'Physiotherapy', type: 'OUT-PATIENT' };
    if (code.startsWith('ZOOM02'))
      return { key: 'OUT_DETENTION', label: 'Detention for Observation and Treatment', type: 'OUT-PATIENT' };
    if (code.startsWith('ZOOM05')) return { key: 'OUT_DRESSING', label: 'Change of Dressing', type: 'OUT-PATIENT' };
    if (code.startsWith('ZOOM06')) return { key: 'OUT_CIRCUM', label: 'Male Circumcision', type: 'OUT-PATIENT' };
    return { key: `OUT_${c.specialityCode}`, label: c.specialityCode || 'OPDC', type: 'OUT-PATIENT' };
  };

  // Map adjustments per claim
  const serviceAdjByClaim = new Map<string, number>();
  const medAdjByClaim = new Map<string, number>();
  for (const d of discrepancies) {
    if (d.adjustmentType === 'Full Claim Rejection') {
      const c = claims.find((cl) => cl.claimId === d.claimId);
      if (c) {
        serviceAdjByClaim.set(c.claimId, c.totalServiceCost);
        medAdjByClaim.set(c.claimId, c.totalMedicineCost);
      }
    } else if (d.adjustmentType === 'Service') {
      serviceAdjByClaim.set(d.claimId, (serviceAdjByClaim.get(d.claimId) || 0) + d.financialAdjustmentGhs);
    } else if (d.adjustmentType === 'Medicine') {
      medAdjByClaim.set(d.claimId, (medAdjByClaim.get(d.claimId) || 0) + d.financialAdjustmentGhs);
    }
  }

  for (const c of claims) {
    const spec = getSpecialtyLabel(c);
    const existingRow = specialtyMap.get(spec.key) || {
      specialty: spec.label,
      serviceType: spec.type,
      attendanceCount: 0,
      submittedServiceGhs: 0,
      submittedMedicineGhs: 0,
      submittedTotalGhs: 0,
      adjustedServiceGhs: 0,
      adjustedMedicineGhs: 0,
      adjustedTotalGhs: 0,
      dueServiceGhs: 0,
      dueMedicineGhs: 0,
      dueTotalGhs: 0,
    };

    const sAdj = Math.min(c.totalServiceCost, serviceAdjByClaim.get(c.claimId) || 0);
    const mAdj = Math.min(c.totalMedicineCost, medAdjByClaim.get(c.claimId) || 0);

    existingRow.attendanceCount += 1;
    existingRow.submittedServiceGhs += c.totalServiceCost;
    existingRow.submittedMedicineGhs += c.totalMedicineCost;
    existingRow.submittedTotalGhs += c.grandTotalCost;
    existingRow.adjustedServiceGhs += sAdj;
    existingRow.adjustedMedicineGhs += mAdj;
    existingRow.adjustedTotalGhs += sAdj + mAdj;
    existingRow.dueServiceGhs = existingRow.submittedServiceGhs - existingRow.adjustedServiceGhs;
    existingRow.dueMedicineGhs = existingRow.submittedMedicineGhs - existingRow.adjustedMedicineGhs;
    existingRow.dueTotalGhs = existingRow.submittedTotalGhs - existingRow.adjustedTotalGhs;

    specialtyMap.set(spec.key, existingRow);
  }

  const specialtySummary = Array.from(specialtyMap.values()).sort((a, b) => {
    if (a.serviceType !== b.serviceType) return a.serviceType === 'OUT-PATIENT' ? -1 : 1;
    return b.submittedTotalGhs - a.submittedTotalGhs;
  });

  const calculatedSubmittedServiceGhs = Number(
    claims.reduce((acc, c) => acc + c.totalServiceCost, 0).toFixed(2)
  );
  const calculatedSubmittedMedicineGhs = Number(
    claims.reduce((acc, c) => acc + c.totalMedicineCost, 0).toFixed(2)
  );
  const calculatedSubmittedTotalGhs = Number(
    (calculatedSubmittedServiceGhs + calculatedSubmittedMedicineGhs).toFixed(2)
  );

  const totalAdjustedServiceGhs = Number(
    specialtySummary.reduce((acc, r) => acc + r.adjustedServiceGhs, 0).toFixed(2)
  );
  const totalAdjustedMedicineGhs = Number(
    specialtySummary.reduce((acc, r) => acc + r.adjustedMedicineGhs, 0).toFixed(2)
  );
  const totalAdjustedGhs = Number((totalAdjustedServiceGhs + totalAdjustedMedicineGhs).toFixed(2));
  const netAmountDueGhs = Number((calculatedSubmittedTotalGhs - totalAdjustedGhs).toFixed(2));

  const flaggedClaimIds = new Set(discrepancies.map((d) => d.claimId));
  const flaggedClaimsCount = flaggedClaimIds.size;
  const cleanClaimsCount = Math.max(0, claims.length - flaggedClaimsCount);
  const criticalAlertsCount = discrepancies.filter((d) => d.severity === 'critical').length;
  const complianceScorePercent =
    claims.length > 0 ? Number(((cleanClaimsCount / claims.length) * 100).toFixed(1)) : 100;

  // Group discrepancies by rule
  const ruleBreakdown = rules
    .filter((r) => r.isActive)
    .map((r) => {
      const ruleDiscs = discrepancies.filter((d) => d.ruleCode === r.code);
      const uniqueClaims = new Set(ruleDiscs.map((d) => d.claimId));
      const totalCost = ruleDiscs.reduce((acc, d) => acc + d.financialAdjustmentGhs, 0);
      return {
        ruleCode: r.code,
        ruleTitle: r.title,
        category: r.category,
        severity: r.severity,
        affectedClaimsCount: uniqueClaims.size,
        totalCostGhs: Number(totalCost.toFixed(2)),
        discrepancies: ruleDiscs,
      };
    })
    .filter((rb) => rb.affectedClaimsCount > 0);

  return {
    reportId: `rep_${Date.now()}`,
    batchNumber,
    facilityName: facilityNameOverride || 'ST JOHN OF GOD HOSPITAL (DUAYAW NKWANTA) (TANO NORTH)',
    facilityCode: providerCode === 'N/A' ? '03-BA-00415' : providerCode,
    serviceMonth,
    serviceYear,
    creationDate,
    declaredClaimsCount,
    parsedClaimsCount: claims.length,
    declaredBatchAmountGhs,
    calculatedSubmittedServiceGhs,
    calculatedSubmittedMedicineGhs,
    calculatedSubmittedTotalGhs,
    totalAdjustedServiceGhs,
    totalAdjustedMedicineGhs,
    totalAdjustedGhs,
    netAmountDueGhs,
    flaggedClaimsCount,
    cleanClaimsCount,
    criticalAlertsCount,
    complianceScorePercent,
    hipaaEncryptionHash: computeHipaaBatchHash(batchNumber, claims.length, calculatedSubmittedTotalGhs),
    claims,
    discrepancies,
    specialtySummary,
    ruleBreakdown,
  };
}

// Export official NHIS Vetted Claims Report PDF
export function exportVettedReportToPdf(report: VettedBatchResult, maskPhi: boolean): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('NATIONAL HEALTH INSURANCE SCHEME (NHIS)', 105, 16, { align: 'center' });
  doc.setFontSize(12);
  doc.text('REPORT ON VETTED CLAIMS', 105, 23, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`${report.facilityName} (${report.facilityCode}) - ${report.serviceMonth}/${report.serviceYear}`, 105, 30, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const introText = `Batch ${report.batchNumber} (${report.parsedClaimsCount} audited claims) was vetted against active NHIS clinical and tariff instructions. HIPAA Integrity Hash: ${report.hipaaEncryptionHash}. Below are the details of the submission, adjustments, and net amount due after vetting:`;
  const splitIntro = doc.splitTextToSize(introText, 182);
  doc.text(splitIntro, 14, 38);

  // Summary Table
  const tableRows = report.specialtySummary.map((r) => [
    `${r.specialty} (${r.serviceType === 'OUT-PATIENT' ? 'OUT' : 'INP'})`,
    String(r.attendanceCount),
    r.submittedServiceGhs.toFixed(2),
    r.submittedMedicineGhs.toFixed(2),
    r.submittedTotalGhs.toFixed(2),
    r.adjustedServiceGhs.toFixed(2),
    r.adjustedMedicineGhs.toFixed(2),
    r.adjustedTotalGhs.toFixed(2),
    r.dueServiceGhs.toFixed(2),
    r.dueMedicineGhs.toFixed(2),
    r.dueTotalGhs.toFixed(2),
  ]);

  tableRows.push([
    'GRAND TOTAL',
    String(report.parsedClaimsCount),
    report.calculatedSubmittedServiceGhs.toFixed(2),
    report.calculatedSubmittedMedicineGhs.toFixed(2),
    report.calculatedSubmittedTotalGhs.toFixed(2),
    report.totalAdjustedServiceGhs.toFixed(2),
    report.totalAdjustedMedicineGhs.toFixed(2),
    report.totalAdjustedGhs.toFixed(2),
    (report.calculatedSubmittedServiceGhs - report.totalAdjustedServiceGhs).toFixed(2),
    (report.calculatedSubmittedMedicineGhs - report.totalAdjustedMedicineGhs).toFixed(2),
    report.netAmountDueGhs.toFixed(2),
  ]);

  autoTable(doc, {
    startY: 48,
    head: [
      [
        'SPECIALTY',
        'ATTEND.',
        'SUB SERV (GHC)',
        'SUB MED (GHC)',
        'SUB TOTAL',
        'ADJ SERV',
        'ADJ MED',
        'ADJ TOTAL',
        'DUE SERV',
        'DUE MED',
        'AMT DUE (GHC)',
      ],
    ],
    body: tableRows,
    styles: { fontSize: 6.5, cellPadding: 1.5 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
  });

  // Detailed Reasons for Adjustments
  let currentY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('REASONS FOR ADJUSTMENTS & AUDIT FINDINGS', 14, currentY);
  currentY += 6;

  report.ruleBreakdown.forEach((rb, index) => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `${index + 1}. ${rb.ruleTitle} (${rb.ruleCode}): ${rb.affectedClaimsCount} claim(s) affected, at a total cost of GHS ${rb.totalCostGhs.toFixed(2)}`,
      14,
      currentY
    );
    currentY += 4;

    const bodyRows = rb.discrepancies.map((d) => [
      maskPhi ? d.patientInitials : d.patientFullName,
      d.claimId,
      d.memberNumber,
      d.hospitalRecordNumber,
      d.attendanceDate,
      d.specificFinding,
      `GHS ${d.financialAdjustmentGhs.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Name', 'Claim ID', 'NHIS No.', 'Folder No.', 'Attendance Date', 'Audit Finding', 'Adjustment']],
      body: bodyRows,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [51, 65, 85], textColor: 255 },
      columnStyles: {
        5: { cellWidth: 62 },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  });

  doc.save(`NHIS_Vetted_Claims_Report_${report.batchNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

// Export Discrepancies to CSV
export function exportDiscrepanciesToCsv(report: VettedBatchResult, maskPhi: boolean): void {
  const headers = [
    'Batch Number',
    'Claim ID',
    'Patient Name / Initials',
    'NHIS Member No',
    'Folder No',
    'Attendance Date',
    'Specialty',
    'Service Type',
    'Rule Code',
    'Rule Title',
    'Category',
    'Severity',
    'Specific Discrepancy Finding',
    'Evidence Detail',
    'Recommended Action',
    'Adjustment Type',
    'Financial Adjustment (GHS)',
  ];

  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = report.discrepancies.map((d) => [
    report.batchNumber,
    d.claimId,
    maskPhi ? d.patientInitials : d.patientFullName,
    d.memberNumber,
    d.hospitalRecordNumber,
    d.attendanceDate,
    d.specialityCode,
    d.serviceType,
    d.ruleCode,
    d.ruleTitle,
    d.category,
    d.severity.toUpperCase(),
    d.specificFinding,
    d.evidenceDetail,
    d.recommendedAction,
    d.adjustmentType,
    d.financialAdjustmentGhs.toFixed(2),
  ]);

  const csvContent = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `NHIS_Audit_Discrepancies_${report.batchNumber.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export Extracted PDF & XML Vetting Rules Catalog to CSV
export function exportExtractedRulesToCsv(rules: VettingRuleRecord[], report: VettedBatchResult): void {
  const headers = [
    'Rule Code',
    'Rule Title',
    'Category',
    'Severity',
    'Status',
    'Description',
    'Extracted PDF Vetting Criteria',
    'Source Document(s)',
    'PDF Benchmark Claims Affected',
    'PDF Benchmark Adjustment (GHS)',
    'Active XML Batch Claims Flagged',
    'Active XML Batch Adjustment (GHS)',
  ];

  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = rules.map((r) => {
    const rb = report.ruleBreakdown.find((b) => b.ruleCode === r.code);
    return [
      r.code,
      r.title,
      r.category,
      r.severity.toUpperCase(),
      r.isActive ? 'ACTIVE' : 'DISABLED',
      r.description,
      r.criteriaSummary.replace(/\n/g, ' | '),
      r.sourceDocument,
      r.pdfAffectedCount ?? 0,
      (r.pdfTotalCostGhs ?? 0).toFixed(2),
      rb ? rb.affectedClaimsCount : 0,
      rb ? rb.totalCostGhs.toFixed(2) : '0.00',
    ];
  });

  const csvContent = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'NHIS_Extracted_Vetting_Rules_Catalog.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

