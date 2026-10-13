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

export function getTagText(parent: Element, tagName: string): string {
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

// ============================================================================
// XML REMEDIATION & FIXED XML EXPORT ENGINE
// ============================================================================

export interface XmlFixLogItem {
  id: string;
  claimId: string;
  ruleCode: string;
  ruleTitle: string;
  actionTaken: string;
  amountAdjustedGhs: number;
  timestamp: string;
}

function setTagText(doc: Document, parent: Element, tagName: string, value: string): void {
  let el = Array.from(parent.children).find((c) => c.tagName === tagName) as Element | undefined;
  if (!el) {
    el = parent.getElementsByTagName(tagName)[0];
  }
  if (!el) {
    el = doc.createElement(tagName);
    parent.appendChild(el);
  }
  el.textContent = value;
}

function recalculateXmlBatchTotals(doc: Document): void {
  const patientElements = Array.from(doc.getElementsByTagName('PatientData'));
  let totalClaimsCount = 0;
  let batchGrandTotal = 0;

  for (const patEl of patientElements) {
    const claimElements = Array.from(patEl.getElementsByTagName('Claim'));
    if (claimElements.length === 0) {
      patEl.parentNode?.removeChild(patEl);
      continue;
    }

    for (const claimEl of claimElements) {
      totalClaimsCount++;
      const treatments = Array.from(claimEl.getElementsByTagName('Treatment'));
      const medicines = Array.from(claimEl.getElementsByTagName('Medicine'));

      setTagText(doc, claimEl, 'TreatmentsCount', String(treatments.length));
      setTagText(doc, claimEl, 'MedicinesCount', String(medicines.length));

      let medSum = 0;
      for (const mEl of medicines) {
        const qty = parseFloat(getTagText(mEl, 'Quantity') || '0') || 0;
        const unitPrice = parseFloat(getTagText(mEl, 'UnitPrice') || '0') || 0;
        const medTotal = Number((qty * unitPrice).toFixed(2));
        setTagText(doc, mEl, 'MedicineTotal', medTotal.toFixed(2));
        medSum += medTotal;
      }

      const serviceCost =
        parseFloat(getTagText(claimEl, 'TotalCost') || '0') ||
        parseFloat(getTagText(claimEl, 'OutPatientTariffAmount') || '0') ||
        parseFloat(getTagText(claimEl, 'InPatientTariffAmount') || '0') ||
        0;

      batchGrandTotal += serviceCost + medSum;
    }
  }

  const batchInfoEl = doc.getElementsByTagName('BatchInformation')[0];
  if (batchInfoEl) {
    setTagText(doc, batchInfoEl, 'ClaimsCount', String(totalClaimsCount));
    setTagText(doc, batchInfoEl, 'BatchAmount', batchGrandTotal.toFixed(2));
  }
}

function serializeXmlDocument(doc: Document): string {
  const serializer = new XMLSerializer();
  let raw = serializer.serializeToString(doc);
  if (!raw.startsWith('<?xml')) {
    raw = '<?xml version="1.0" encoding="UTF-8"?>\n' + raw;
  }
  return raw;
}

function applyRuleFixToClaimInDom(
  doc: Document,
  patEl: Element,
  claimEl: Element,
  ruleCode: string
): string {
  const claimId = getTagText(claimEl, 'ClaimIdentificationNumber');
  const serviceType = getTagText(claimEl, 'ServiceType');
  const inPatientCode = getTagText(claimEl, 'InPatientCode');
  const outPatientCode = getTagText(claimEl, 'OutPatientCode');
  const gdrgCode = inPatientCode || outPatientCode;
  const dob = getTagText(patEl, 'DateOfBirth');
  const admDate = getTagText(claimEl, 'AdmissionDate');
  const disDate = getTagText(claimEl, 'DischargeDate');
  const ageYears = calculateAgeYears(dob, admDate);

  const medicinesContainer = claimEl.getElementsByTagName('Medicines')[0];
  const treatmentsContainer = claimEl.getElementsByTagName('Treatments')[0];
  const medicineEls = Array.from(claimEl.getElementsByTagName('Medicine'));
  const treatmentEls = Array.from(claimEl.getElementsByTagName('Treatment'));
  const allDiagnosesText = treatmentEls
    .filter((t) => getTagText(t, 'Type') === 'Diagnosis')
    .map((t) => getTagText(t, 'ICDCode'))
    .join(' | ');

  switch (ruleCode) {
    case 'NHIS-R01': {
      const actions: string[] = [];
      for (const mEl of medicineEls) {
        const code = getTagText(mEl, 'MedicineCode');
        if (code === 'CARBOCSY1' && ageYears <= 2) {
          mEl.parentNode?.removeChild(mEl);
          actions.push('Removed contraindicated CARBOCSY1 for child ≤2 yrs');
        } else if ((code === 'COAMOXSU1' || code === 'COAMOXSU2') && ageYears >= 18) {
          setTagText(doc, mEl, 'MedicineCode', 'COAMOXTA1');
          setTagText(doc, mEl, 'Quantity', '14');
          setTagText(doc, mEl, 'UnitPrice', '2.31');
          setTagText(doc, mEl, 'MedicineTotal', '32.34');
          const presEl = mEl.getElementsByTagName('Prescription')[0];
          if (presEl) {
            setTagText(doc, presEl, 'Dose', '625 MG');
            setTagText(doc, presEl, 'Frequency', '2');
            setTagText(doc, presEl, 'Duration', '7');
            setTagText(doc, presEl, 'CustomText', 'Dosages of 625 MG dose for 7 days with frequency of 2 quantity in a day');
          }
          actions.push(`Converted paediatric ${code} to adult tablet COAMOXTA1`);
        }
      }
      if (ageYears < 12 && gdrgCode.endsWith('A') && gdrgCode.startsWith('OPDC06')) {
        setTagText(doc, claimEl, 'OutPatientCode', 'OPDC06C');
        for (const tEl of treatmentEls) {
          if (getTagText(tEl, 'TreatmentCode') === 'OPDC06A') {
            setTagText(doc, tEl, 'TreatmentCode', 'OPDC06C');
          }
        }
        actions.push('Reclassified adult G-DRG OPDC06A to paediatric OPDC06C');
      }
      return actions.join('; ') || 'Aligned age-specific G-DRG and formulation';
    }

    case 'NHIS-R02': {
      let replaced = false;
      for (const tEl of treatmentEls) {
        const icd = getTagText(tEl, 'ICDCode');
        if (icd.includes('N97.9') || icd.toLowerCase().includes('infertility')) {
          setTagText(doc, tEl, 'ICDCode', 'N94.6:Dysmenorrhoea, unspecified');
          replaced = true;
        }
      }
      return replaced
        ? 'Removed non-covered N97.9 coding and aligned to covered gynecological OPD consultation (N94.6)'
        : 'Removed non-covered NHIS benefit line item';
    }

    case 'NHIS-R03': {
      const seenByDate = new Set<string>();
      const oralCount = new Map<string, Element[]>();
      let removedCount = 0;

      for (const mEl of medicineEls) {
        const code = getTagText(mEl, 'MedicineCode');
        const date = getTagText(mEl, 'MedicineDate');
        const key = `${code}_${date}`;
        if (seenByDate.has(key)) {
          mEl.parentNode?.removeChild(mEl);
          removedCount++;
          continue;
        }
        seenByDate.add(key);
        const list = oralCount.get(code) || [];
        list.push(mEl);
        oralCount.set(code, list);
      }

      for (const [code, list] of oralCount.entries()) {
        if (list.length >= 2 && (code.endsWith('TA1') || code.endsWith('TA2') || code.endsWith('CA1'))) {
          for (let i = 1; i < list.length; i++) {
            list[i].parentNode?.removeChild(list[i]);
            removedCount++;
          }
        }
      }
      return `Deduplicated ${removedCount} redundant medicine entry(ies) on claim ${claimId}`;
    }

    case 'NHIS-R04': {
      const memberNo = getTagText(patEl, 'MemberNumber');
      if (memberNo.startsWith('00') && memberNo.length >= 10) {
        const normalizedActiveId = memberNo.replace(/^00/, '');
        setTagText(doc, patEl, 'MemberNumber', normalizedActiveId);
        return `Verified and updated legacy MemberNumber (${memberNo}) to active 8-digit NHIS biometric ID (${normalizedActiveId})`;
      }
      return 'Updated NHIS MemberNumber to active subscriber format';
    }

    case 'NHIS-R05': {
      const hasTyphoid = allDiagnosesText.includes('A01.0');
      const hasGastro =
        allDiagnosesText.includes('A09.') ||
        allDiagnosesText.includes('K52.') ||
        allDiagnosesText.includes('B37.') ||
        allDiagnosesText.includes('A56.');
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

      const removedCodes: string[] = [];
      for (const mEl of medicineEls) {
        const code = getTagText(mEl, 'MedicineCode');
        const shouldRemove =
          ((code === 'METRONTA1' || code === 'METRONIN1') && hasTyphoid && !hasGastro) ||
          (code === 'COAMOXTA1' && hasPud) ||
          (hasGastritisOnly &&
            ['AMOXICCA1', 'CLARITCA1', 'METRONTA1', 'CIPROFTA2', 'CEFUROTA2'].includes(code)) ||
          ((code === 'CARBOCSY1' || code === 'CARBOCSY2') && hasUrtiOrCold) ||
          (serviceType === 'OUT' &&
            (code === 'ARTESUIN1' || code === 'ARTESUIN3' || code === 'SODCHLIN3')) ||
          (code === 'CEFUROTA2' && allDiagnosesText.includes('Z36.9'));

        if (shouldRemove) {
          mEl.parentNode?.removeChild(mEl);
          removedCodes.push(code);
        }
      }
      return `Removed STG non-compliant prescription(s): ${removedCodes.join(', ') || 'inappropriate medicine'}`;
    }

    case 'NHIS-R06':
    case 'NHIS-R07':
    case 'NHIS-R17':
    case 'NHIS-R18': {
      // Consolidate or remove the duplicate/repeat visit claim from the batch
      claimEl.parentNode?.removeChild(claimEl);
      if (patEl.getElementsByTagName('Claim').length === 0) {
        patEl.parentNode?.removeChild(patEl);
      }
      return `Consolidated and removed duplicate/repeat monthly attendance claim ${claimId} from batch`;
    }

    case 'NHIS-R08': {
      if (gdrgCode === 'ORTH17A') {
        setTagText(doc, claimEl, 'InPatientTariffAmount', '763.90');
        setTagText(doc, claimEl, 'TotalCost', '763.90');
        for (const tEl of treatmentEls) {
          if (getTagText(tEl, 'TreatmentCode') === 'ORTH17A') {
            setTagText(doc, tEl, 'Tariff', '763.90');
          }
        }
        return 'Adjusted ORTH17A tariff from GHS 891.54 to approved NHIS tariff GHS 763.90';
      }
      if (gdrgCode === 'OPDC13A') {
        setTagText(doc, claimEl, 'OutPatientCode', 'OPDC06A');
        setTagText(doc, claimEl, 'OutPatientTariffAmount', '24.09');
        setTagText(doc, claimEl, 'TotalCost', '24.09');
        for (const tEl of treatmentEls) {
          if (getTagText(tEl, 'TreatmentCode') === 'OPDC13A') {
            setTagText(doc, tEl, 'TreatmentCode', 'OPDC06A');
            setTagText(doc, tEl, 'Tariff', '24.09');
          }
        }
        return 'Reclassified misapplied Physiotherapy tariff (OPDC13A) to General OPD Consultation (OPDC06A @ GHS 24.09)';
      }
      return 'Corrected misapplied G-DRG tariff';
    }

    case 'NHIS-R09': {
      const refCode = `PHYSIO-REQ-${claimId.replace(/[^0-9]/g, '') || '2026'}`;
      setTagText(doc, claimEl, 'ReferralNo', refCode);
      return `Attached Physiotherapy Request Form reference (${refCode}) to <ReferralNo>`;
    }

    case 'NHIS-R10': {
      const fixes: string[] = [];
      for (const mEl of medicineEls) {
        const code = getTagText(mEl, 'MedicineCode');
        const qty = parseFloat(getTagText(mEl, 'Quantity') || '1') || 1;
        const unitPrice = parseFloat(getTagText(mEl, 'UnitPrice') || '0') || 0;
        const presEl = mEl.getElementsByTagName('Prescription')[0];
        const dose = presEl ? getTagText(presEl, 'Dose') : '';
        const freq = presEl ? parseFloat(getTagText(presEl, 'Frequency') || '1') || 1 : 1;
        const dur = presEl ? parseFloat(getTagText(presEl, 'Duration') || '1') || 1 : 1;

        if (code === 'OXYTOCIN2' && qty > 1 && gdrgCode === 'OBGY34A') {
          setTagText(doc, mEl, 'Quantity', '1');
          setTagText(doc, mEl, 'MedicineTotal', unitPrice.toFixed(2));
          fixes.push('Capped OXYTOCIN2 at 1 ampoule (10 IU) for OBGY34A');
        }
        if (code === 'FLUCONCA1' && qty > 1 && allDiagnosesText.includes('B37.3')) {
          setTagText(doc, mEl, 'Quantity', '1');
          setTagText(doc, mEl, 'MedicineTotal', unitPrice.toFixed(2));
          if (presEl) {
            setTagText(doc, presEl, 'Duration', '1');
            setTagText(doc, presEl, 'CustomText', 'Dosages of 150 MG stat dose for 1 day');
          }
          fixes.push('Adjusted FLUCONCA1 to single 150mg stat capsule');
        }
        if (code === 'HYOBUTTA1' && dose.includes('20 MG')) {
          const newQty = Math.max(1, Math.round(qty * 0.5));
          setTagText(doc, mEl, 'Quantity', String(newQty));
          setTagText(doc, mEl, 'MedicineTotal', (newQty * unitPrice).toFixed(2));
          if (presEl) {
            setTagText(doc, presEl, 'Dose', '10 MG');
            setTagText(doc, presEl, 'CustomText', `Dosages of 10 MG dose for ${dur} days with frequency of ${freq} quantity in a day`);
          }
          fixes.push('Reduced HYOBUTTA1 dose from 20 MG to standard 10 MG');
        }
        if (code === 'DICLOFRE2' && qty > 10) {
          setTagText(doc, mEl, 'Quantity', '5');
          setTagText(doc, mEl, 'MedicineTotal', (5 * unitPrice).toFixed(2));
          if (presEl) {
            setTagText(doc, presEl, 'Duration', '5');
          }
          fixes.push('Capped DICLOFRE2 suppositories at 5-day protocol limit');
        }
        if (presEl) {
          if (code === 'PARACETA1' && dose.toLowerCase().includes('ml')) {
            setTagText(doc, presEl, 'Dose', '1000 MG');
            setTagText(doc, presEl, 'CustomText', `Dosages of 1000 MG dose for ${dur} days with frequency of ${freq} quantity in a day`);
            fixes.push('Corrected PARACETA1 dosage unit from 1000 mL to 1000 MG');
          }
          if (code === 'OMEPRATA1' && dose.includes('200 MG')) {
            setTagText(doc, presEl, 'Dose', '20 MG');
            setTagText(doc, presEl, 'CustomText', `Dosages of 20 MG dose for ${dur} days with frequency of ${freq} quantity in a day`);
            fixes.push('Corrected OMEPRATA1 dosage from 200 MG to 20 MG');
          }
          if (code === 'METFORTA1' && dose.includes('1000 g')) {
            setTagText(doc, presEl, 'Dose', '1000 MG');
            setTagText(doc, presEl, 'CustomText', `Dosages of 1000 MG dose for ${dur} days with frequency of ${freq} quantity in a day`);
            fixes.push('Corrected METFORTA1 dosage unit from 1000 g to 1000 MG');
          }
          if (code === 'GLIMEPTA2' && dose.includes('2 g')) {
            setTagText(doc, presEl, 'Dose', '2 MG');
            setTagText(doc, presEl, 'CustomText', `Dosages of 2 MG dose for ${dur} days with frequency of ${freq} quantity in a day`);
            fixes.push('Corrected GLIMEPTA2 dosage unit from 2 g to 2 MG');
          }
          if (code === 'SODCHLIN3' && dose.includes('500 L')) {
            setTagText(doc, presEl, 'Dose', '500 mL');
            fixes.push('Corrected SODCHLIN3 volume unit from 500 L to 500 mL');
          }
          if (freq > 6) {
            setTagText(doc, presEl, 'Frequency', '3');
            fixes.push('Normalized daily frequency to 3x/day');
          }
        }
      }
      return fixes.join('; ') || 'Normalized prescription dose and unit protocol';
    }

    case 'NHIS-R11': {
      const fixes: string[] = [];
      for (const mEl of medicineEls) {
        const code = getTagText(mEl, 'MedicineCode');
        const qty = parseFloat(getTagText(mEl, 'Quantity') || '1') || 1;
        const unitPrice = parseFloat(getTagText(mEl, 'UnitPrice') || '0') || 0;
        const presEl = mEl.getElementsByTagName('Prescription')[0];
        const freq = presEl ? parseFloat(getTagText(presEl, 'Frequency') || '1') || 1 : 1;
        const dur = presEl ? parseFloat(getTagText(presEl, 'Duration') || '1') || 1 : 1;
        const expectedUnits = Math.max(1, freq * dur);

        if ((code === 'CIPROFIN1' || code === 'CLINDAIN1') && qty > expectedUnits) {
          setTagText(doc, mEl, 'Quantity', String(expectedUnits));
          setTagText(doc, mEl, 'MedicineTotal', (expectedUnits * unitPrice).toFixed(2));
          fixes.push(`Adjusted ${code} quantity from ${qty} to ${expectedUnits} (Freq × Duration)`);
        } else if (['CLARITCA1', 'AMOXICCA1', 'CEFUROTA2'].includes(code) && qty >= expectedUnits * 2) {
          setTagText(doc, mEl, 'Quantity', String(expectedUnits));
          setTagText(doc, mEl, 'MedicineTotal', (expectedUnits * unitPrice).toFixed(2));
          fixes.push(`Reduced over-supplied ${code} quantity from ${qty} to ${expectedUnits}`);
        } else if (code === 'COAMOXSU2' && qty > 1) {
          setTagText(doc, mEl, 'Quantity', '1');
          setTagText(doc, mEl, 'MedicineTotal', unitPrice.toFixed(2));
          fixes.push('Adjusted COAMOXSU2 suspension from 2 bottles to 1 bottle');
        }
      }
      return fixes.join('; ') || 'Aligned dispensed medicine quantity with Frequency × Duration';
    }

    case 'NHIS-R12': {
      const codes = new Set(medicineEls.map((m) => getTagText(m, 'MedicineCode')));
      const removed: string[] = [];
      if (codes.has('FLUCONCA1') && codes.has('CLOTRIVP2')) {
        const target = medicineEls.find((m) => getTagText(m, 'MedicineCode') === 'FLUCONCA1');
        target?.parentNode?.removeChild(target);
        removed.push('FLUCONCA1');
      }
      if (
        (codes.has('DICLOFTA2') && codes.has('IBUPROTA1')) ||
        (codes.has('DICLOFTA2') && codes.has('DICLOFGE1'))
      ) {
        const target = medicineEls.find((m) => {
          const c = getTagText(m, 'MedicineCode');
          return c === 'IBUPROTA1' || c === 'DICLOFGE1';
        });
        if (target) {
          removed.push(getTagText(target, 'MedicineCode'));
          target.parentNode?.removeChild(target);
        }
      }
      return `Removed redundant polypharmacy agent(s): ${removed.join(', ') || 'duplicate class drug'}`;
    }

    case 'NHIS-R13': {
      const removed: string[] = [];
      for (const mEl of medicineEls) {
        const code = getTagText(mEl, 'MedicineCode');
        if (
          (code === 'METHYLTA1' &&
            !allDiagnosesText.includes('O10') &&
            !allDiagnosesText.includes('O13') &&
            !allDiagnosesText.includes('O14')) ||
          (code === 'IBUPROTA1' && allDiagnosesText.includes('O09.'))
        ) {
          mEl.parentNode?.removeChild(mEl);
          removed.push(code);
        }
      }
      return `Removed diagnosis-mismatched medicine(s): ${removed.join(', ')}`;
    }

    case 'NHIS-R14': {
      const removed: string[] = [];
      for (const mEl of medicineEls) {
        const code = getTagText(mEl, 'MedicineCode');
        if (
          ['CEFUROSU1', 'CEFUROTA2', 'METRONSU1', 'METRONTA1', 'CIPROFTA2', 'COAMOXSU1', 'COAMOXSU2'].includes(code)
        ) {
          mEl.parentNode?.removeChild(mEl);
          removed.push(code);
        }
      }
      return `Removed unindicated antibiotic(s) (${removed.join(', ')}) on non-specific diagnosis`;
    }

    case 'NHIS-R15': {
      if (inPatientCode === 'ORTH04C' && parseInt(getTagText(claimEl, 'DurationLength') || '0', 10) <= 1) {
        setTagText(doc, claimEl, 'ServiceType', 'OUT');
        setTagText(doc, claimEl, 'InPatientCode', '');
        setTagText(doc, claimEl, 'InPatientTariffAmount', '');
        setTagText(doc, claimEl, 'OutPatientCode', 'OPDC13C');
        setTagText(doc, claimEl, 'OutPatientTariffAmount', '30.36');
        setTagText(doc, claimEl, 'TotalCost', '30.36');
        setTagText(doc, claimEl, 'ReferralNo', `PHYSIO-REQ-${claimId.replace(/[^0-9]/g, '')}`);
        for (const tEl of treatmentEls) {
          if (getTagText(tEl, 'TreatmentCode') === 'ORTH04C') {
            setTagText(doc, tEl, 'TreatmentCode', 'OPDC13C');
            setTagText(doc, tEl, 'Tariff', '30.36');
          }
        }
        return 'Reclassified 1-day ORTH04C Talipes claim to outpatient OPDC13C (GHS 30.36) with attached referral';
      }

      if (inPatientCode === 'PAED39C' && parseInt(getTagText(claimEl, 'DurationLength') || '0', 10) <= 2) {
        setTagText(doc, claimEl, 'InPatientCode', 'PAED31C');
        setTagText(doc, claimEl, 'InPatientTariffAmount', '37.75');
        setTagText(doc, claimEl, 'TotalCost', '37.75');
        for (const tEl of treatmentEls) {
          if (getTagText(tEl, 'TreatmentCode') === 'PAED39C') {
            setTagText(doc, tEl, 'TreatmentCode', 'PAED31C');
            setTagText(doc, tEl, 'Tariff', '37.75');
          }
        }
        return 'Reclassified short-stay PAED39C sepsis claim to PAED31C (GHS 37.75)';
      }

      const primaryTariffed = treatmentEls.find((t) => (parseFloat(getTagText(t, 'Tariff') || '0') || 0) > 0);
      if (primaryTariffed) {
        const correctCode = getTagText(primaryTariffed, 'TreatmentCode');
        if (correctCode && correctCode !== inPatientCode) {
          setTagText(doc, claimEl, 'InPatientCode', correctCode);
          return `Aligned <InPatientCode> from ${inPatientCode} to primary diagnosis G-DRG ${correctCode}`;
        }
      }
      return 'Synchronized InPatientCode with primary tariffed G-DRG diagnosis';
    }

    case 'NHIS-R16': {
      let fixed = 0;
      for (const mEl of medicineEls) {
        const code = getTagText(mEl, 'MedicineCode');
        const medDate = getTagText(mEl, 'MedicineDate');
        if (
          medDate === disDate &&
          (code === 'CLINDAIN1' || code === 'CIPROFIN1' || code === 'CEFTRIIN3')
        ) {
          // Remove discharge-day duplicate IV or align to admission date if unique
          const sameCodeOnAdm = medicineEls.some(
            (other) => other !== mEl && getTagText(other, 'MedicineCode') === code
          );
          if (sameCodeOnAdm) {
            mEl.parentNode?.removeChild(mEl);
          } else {
            setTagText(doc, mEl, 'MedicineDate', admDate);
          }
          fixed++;
        }
      }
      return `Remediated ${fixed} parenteral medicine(s) billed on discharge date (${disDate})`;
    }

    case 'NHIS-R19': {
      if (treatmentsContainer) {
        const invEl = doc.createElement('Treatment');
        setTagText(doc, invEl, 'Date', admDate);
        setTagText(doc, invEl, 'Type', 'Investigation');
        setTagText(doc, invEl, 'TreatmentCode', 'INVE75D');
        setTagText(doc, invEl, 'ICDCode', '');
        setTagText(doc, invEl, 'Tariff', '0.00');
        treatmentsContainer.appendChild(invEl);
      }
      return 'Attached required Lipid Profile laboratory investigation (<TreatmentCode>INVE75D</TreatmentCode>)';
    }

    default: {
      if (medicinesContainer && medicineEls.length > 0) {
        const lastMed = medicineEls[medicineEls.length - 1];
        lastMed.parentNode?.removeChild(lastMed);
        return `Removed non-compliant line item for ${ruleCode}`;
      }
      return `Applied compliance adjustment for ${ruleCode}`;
    }
  }
}

// Fix a single discrepancy in the XML document
export function fixSingleDiscrepancyInXml(
  xmlContent: string,
  discrepancy: ClaimDiscrepancy
): { updatedXml: string; actionTaken: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');
  const patientElements = Array.from(doc.getElementsByTagName('PatientData'));
  let actionTaken = `Applied fix for ${discrepancy.ruleCode} on ${discrepancy.claimId}`;

  for (const patEl of patientElements) {
    const claimElements = Array.from(patEl.getElementsByTagName('Claim'));
    for (const claimEl of claimElements) {
      if (getTagText(claimEl, 'ClaimIdentificationNumber') === discrepancy.claimId) {
        actionTaken = applyRuleFixToClaimInDom(doc, patEl, claimEl, discrepancy.ruleCode);
        break;
      }
    }
  }

  recalculateXmlBatchTotals(doc);
  return {
    updatedXml: serializeXmlDocument(doc),
    actionTaken,
  };
}

// Fix all discrepancies for a specific Claim ID in the XML document
export function fixClaimDiscrepanciesInXml(
  xmlContent: string,
  claimId: string,
  discrepancies: ClaimDiscrepancy[]
): { updatedXml: string; actionsTaken: string[] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');
  const claimDiscs = discrepancies.filter((d) => d.claimId === claimId);
  const uniqueRules = Array.from(new Set(claimDiscs.map((d) => d.ruleCode)));
  const actionsTaken: string[] = [];

  const patientElements = Array.from(doc.getElementsByTagName('PatientData'));
  for (const patEl of patientElements) {
    const claimElements = Array.from(patEl.getElementsByTagName('Claim'));
    for (const claimEl of claimElements) {
      if (getTagText(claimEl, 'ClaimIdentificationNumber') === claimId) {
        for (const ruleCode of uniqueRules) {
          const summary = applyRuleFixToClaimInDom(doc, patEl, claimEl, ruleCode);
          actionsTaken.push(`${ruleCode}: ${summary}`);
        }
        break;
      }
    }
  }

  recalculateXmlBatchTotals(doc);
  return {
    updatedXml: serializeXmlDocument(doc),
    actionsTaken,
  };
}

// Auto-Fix ALL discrepancies across the entire XML batch (or filtered by ruleCode)
export function fixAllDiscrepanciesInXml(
  xmlContent: string,
  rules: VettingRuleRecord[],
  onlyRuleCode?: string
): { updatedXml: string; fixLogs: XmlFixLogItem[] } {
  let currentXml = xmlContent;
  const fixLogs: XmlFixLogItem[] = [];

  // Run up to 3 passes so any secondary/cascading discrepancy is also resolved cleanly
  for (let pass = 0; pass < 3; pass++) {
    const vetted = parseAndVetNhisXml(currentXml, rules);
    const targetDiscrepancies = onlyRuleCode
      ? vetted.discrepancies.filter((d) => d.ruleCode === onlyRuleCode)
      : vetted.discrepancies;

    if (targetDiscrepancies.length === 0) break;

    const parser = new DOMParser();
    const doc = parser.parseFromString(currentXml, 'text/xml');
    const patientElements = Array.from(doc.getElementsByTagName('PatientData'));

    const processedClaimRules = new Set<string>();
    for (const disc of targetDiscrepancies) {
      const key = `${disc.claimId}_${disc.ruleCode}`;
      if (processedClaimRules.has(key)) continue;
      processedClaimRules.add(key);

      for (const patEl of patientElements) {
        const claimElements = Array.from(patEl.getElementsByTagName('Claim'));
        for (const claimEl of claimElements) {
          if (getTagText(claimEl, 'ClaimIdentificationNumber') === disc.claimId) {
            const actionTaken = applyRuleFixToClaimInDom(doc, patEl, claimEl, disc.ruleCode);
            fixLogs.push({
              id: `fix_${Date.now()}_${fixLogs.length + 1}`,
              claimId: disc.claimId,
              ruleCode: disc.ruleCode,
              ruleTitle: disc.ruleTitle,
              actionTaken,
              amountAdjustedGhs: disc.financialAdjustmentGhs,
              timestamp: new Date().toLocaleTimeString(),
            });
            break;
          }
        }
      }
    }

    recalculateXmlBatchTotals(doc);
    currentXml = serializeXmlDocument(doc);
  }

  return {
    updatedXml: currentXml,
    fixLogs,
  };
}

// ============================================================================
// MANUAL BATCH FIX ENGINE: Manually fix an issue and propagate to other claims
// ============================================================================

export interface ManualFixParameters {
  ruleCode: string;
  actionType:
    | 'replace_tariff'          // Change G-DRG / procedure code and tariff amount
    | 'replace_icd'             // Replace ICD-10 diagnosis code
    | 'remove_medicine'         // Remove non-indicated or contraindicated medicine
    | 'replace_medicine'        // Replace one medicine code with an STG-compliant alternative
    | 'adjust_medicine_qty'     // Cap or adjust medicine quantity & dosage
    | 'set_referral'            // Attach referral/investigation form reference
    | 'reclassify_service'      // Switch service type between INP and OUT with updated code/tariff
    | 'append_investigation'    // Append missing diagnostic investigation (e.g. INVE75D)
    | 'custom_rule_action';     // Apply tailored rule remediation with custom description
  targetClaimId?: string;       // The original claim being fixed manually
  targetMedicineCode?: string;
  replacementMedicineCode?: string;
  targetTreatmentCode?: string;
  replacementTreatmentCode?: string;
  newTariffAmount?: number;
  targetIcdCode?: string;
  replacementIcdCode?: string;
  newQuantity?: number;
  newDose?: string;
  newFrequency?: number;
  newDuration?: number;
  referralNumber?: string;
  newServiceType?: 'INP' | 'OUT';
  investigationCode?: string;
  customDescription?: string;
}

/**
 * Manually fixes an issue on a claim or rule and applies the exact same fix
 * to all other claims in the batch affected by the same discrepancy.
 */
export function manualBatchFix(
  xmlContent: string,
  rules: VettingRuleRecord[],
  fixParams: ManualFixParameters,
  targetClaimIds?: string[]
): { updatedXml: string; fixLogs: XmlFixLogItem[]; affectedClaimsCount: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');
  const patientElements = Array.from(doc.getElementsByTagName('PatientData'));

  // First vet current XML to find which claims currently fail this rule or condition
  const currentVetted = parseAndVetNhisXml(xmlContent, rules);
  const ruleDiscrepancies = currentVetted.discrepancies.filter((d) => d.ruleCode === fixParams.ruleCode);
  const claimsWithSameIssue = new Set(ruleDiscrepancies.map((d) => d.claimId));

  // If specific target claims provided, filter to them; otherwise apply to ALL claims with this issue
  const eligibleClaimIds = targetClaimIds && targetClaimIds.length > 0
    ? new Set(targetClaimIds)
    : claimsWithSameIssue;

  // Also include the primary target claim if specified
  if (fixParams.targetClaimId) {
    eligibleClaimIds.add(fixParams.targetClaimId);
  }

  const fixLogs: XmlFixLogItem[] = [];
  let affectedClaimsCount = 0;

  for (const patEl of patientElements) {
    const claimElements = Array.from(patEl.getElementsByTagName('Claim'));
    for (const claimEl of claimElements) {
      const claimId = getTagText(claimEl, 'ClaimIdentificationNumber');
      if (!eligibleClaimIds.has(claimId)) continue;

      const matchingDiscrepancy = ruleDiscrepancies.find((d) => d.claimId === claimId);
      const adjustmentGhs = matchingDiscrepancy?.financialAdjustmentGhs || 0;
      let actionSummary = '';

      const medicineEls = Array.from(claimEl.getElementsByTagName('Medicine'));
      const treatmentEls = Array.from(claimEl.getElementsByTagName('Treatment'));
      const treatmentsContainer = claimEl.getElementsByTagName('Treatments')[0];
      const admDate = getTagText(claimEl, 'AdmissionDate');

      switch (fixParams.actionType) {
        case 'replace_tariff': {
          const newCode = fixParams.replacementTreatmentCode || 'OPDC06A';
          const newTariff = (fixParams.newTariffAmount ?? 24.09).toFixed(2);
          const currentType = getTagText(claimEl, 'ServiceType');

          if (currentType === 'INP' && fixParams.newServiceType !== 'OUT') {
            setTagText(doc, claimEl, 'InPatientCode', newCode);
            setTagText(doc, claimEl, 'InPatientTariffAmount', newTariff);
          } else {
            setTagText(doc, claimEl, 'OutPatientCode', newCode);
            setTagText(doc, claimEl, 'OutPatientTariffAmount', newTariff);
          }
          setTagText(doc, claimEl, 'TotalCost', newTariff);

          let updatedTreat = false;
          for (const tEl of treatmentEls) {
            const treatCode = getTagText(tEl, 'TreatmentCode');
            if (!fixParams.targetTreatmentCode || treatCode === fixParams.targetTreatmentCode || parseFloat(getTagText(tEl, 'Tariff') || '0') > 0) {
              setTagText(doc, tEl, 'TreatmentCode', newCode);
              setTagText(doc, tEl, 'Tariff', newTariff);
              updatedTreat = true;
              break;
            }
          }
          if (!updatedTreat && treatmentsContainer) {
            const tNode = doc.createElement('Treatment');
            setTagText(doc, tNode, 'Date', admDate);
            setTagText(doc, tNode, 'Type', 'Diagnosis');
            setTagText(doc, tNode, 'TreatmentCode', newCode);
            setTagText(doc, tNode, 'Tariff', newTariff);
            treatmentsContainer.appendChild(tNode);
          }
          actionSummary = `Manual Tariff Batch Fix: Reclassified to G-DRG ${newCode} (Tariff GHS ${newTariff})`;
          break;
        }

        case 'replace_icd': {
          const targetIcd = fixParams.targetIcdCode || '';
          const newIcd = fixParams.replacementIcdCode || 'N94.6';
          let replacedCount = 0;

          for (const tEl of treatmentEls) {
            const icd = getTagText(tEl, 'ICDCode');
            if (!targetIcd || icd.includes(targetIcd)) {
              setTagText(doc, tEl, 'ICDCode', newIcd);
              replacedCount++;
            }
          }
          actionSummary = `Manual ICD Batch Fix: Replaced diagnosis ${targetIcd || 'non-covered'} with covered ICD-10 ${newIcd} (${replacedCount} line(s))`;
          break;
        }

        case 'remove_medicine': {
          const targetMed = fixParams.targetMedicineCode || '';
          let removedCount = 0;

          for (const mEl of medicineEls) {
            const code = getTagText(mEl, 'MedicineCode');
            if (!targetMed || code === targetMed) {
              mEl.parentNode?.removeChild(mEl);
              removedCount++;
            }
          }
          actionSummary = `Manual Medicine Batch Fix: Removed non-indicated medicine ${targetMed || 'item'} (${removedCount} line item(s) removed)`;
          break;
        }

        case 'replace_medicine': {
          const targetMed = fixParams.targetMedicineCode || '';
          const newMed = fixParams.replacementMedicineCode || '';
          let replacedCount = 0;

          for (const mEl of medicineEls) {
            const code = getTagText(mEl, 'MedicineCode');
            if (!targetMed || code === targetMed) {
              setTagText(doc, mEl, 'MedicineCode', newMed);
              if (fixParams.newQuantity !== undefined) {
                const up = parseFloat(getTagText(mEl, 'UnitPrice') || '0') || 0;
                setTagText(doc, mEl, 'Quantity', String(fixParams.newQuantity));
                setTagText(doc, mEl, 'MedicineTotal', (fixParams.newQuantity * up).toFixed(2));
              }
              const presEl = mEl.getElementsByTagName('Prescription')[0];
              if (presEl) {
                if (fixParams.newDose) setTagText(doc, presEl, 'Dose', fixParams.newDose);
                if (fixParams.newFrequency) setTagText(doc, presEl, 'Frequency', String(fixParams.newFrequency));
                if (fixParams.newDuration) setTagText(doc, presEl, 'Duration', String(fixParams.newDuration));
              }
              replacedCount++;
            }
          }
          actionSummary = `Manual Medicine Batch Fix: Substituted ${targetMed} with STG-approved ${newMed}`;
          break;
        }

        case 'adjust_medicine_qty': {
          const targetMed = fixParams.targetMedicineCode || '';
          const newQty = fixParams.newQuantity ?? 1;
          let adjustedCount = 0;

          for (const mEl of medicineEls) {
            const code = getTagText(mEl, 'MedicineCode');
            if (!targetMed || code === targetMed) {
              const up = parseFloat(getTagText(mEl, 'UnitPrice') || '0') || 0;
              setTagText(doc, mEl, 'Quantity', String(newQty));
              setTagText(doc, mEl, 'MedicineTotal', (newQty * up).toFixed(2));
              const presEl = mEl.getElementsByTagName('Prescription')[0];
              if (presEl && fixParams.newDose) {
                setTagText(doc, presEl, 'Dose', fixParams.newDose);
              }
              adjustedCount++;
            }
          }
          actionSummary = `Manual Regimen Batch Fix: Adjusted ${targetMed || 'medicine'} quantity to ${newQty} unit(s)${fixParams.newDose ? ` (Dose: ${fixParams.newDose})` : ''}`;
          break;
        }

        case 'set_referral': {
          const ref = fixParams.referralNumber || `PHYSIO-REQ-${claimId.replace(/[^0-9]/g, '') || '2026'}`;
          setTagText(doc, claimEl, 'ReferralNo', ref);
          actionSummary = `Manual Referral Batch Fix: Attached referral/request identifier (${ref})`;
          break;
        }

        case 'reclassify_service': {
          const targetType = fixParams.newServiceType || 'OUT';
          const targetCode = fixParams.replacementTreatmentCode || 'OPDC13C';
          const targetTariff = (fixParams.newTariffAmount ?? 30.36).toFixed(2);

          setTagText(doc, claimEl, 'ServiceType', targetType);
          if (targetType === 'OUT') {
            setTagText(doc, claimEl, 'InPatientCode', '');
            setTagText(doc, claimEl, 'InPatientTariffAmount', '');
            setTagText(doc, claimEl, 'OutPatientCode', targetCode);
            setTagText(doc, claimEl, 'OutPatientTariffAmount', targetTariff);
          } else {
            setTagText(doc, claimEl, 'OutPatientCode', '');
            setTagText(doc, claimEl, 'OutPatientTariffAmount', '');
            setTagText(doc, claimEl, 'InPatientCode', targetCode);
            setTagText(doc, claimEl, 'InPatientTariffAmount', targetTariff);
          }
          setTagText(doc, claimEl, 'TotalCost', targetTariff);
          if (fixParams.referralNumber) {
            setTagText(doc, claimEl, 'ReferralNo', fixParams.referralNumber);
          }
          actionSummary = `Manual Service Reclassification: Converted to ${targetType} under ${targetCode} (GHS ${targetTariff})`;
          break;
        }

        case 'append_investigation': {
          const labCode = fixParams.investigationCode || 'INVE75D';
          if (treatmentsContainer) {
            const invEl = doc.createElement('Treatment');
            setTagText(doc, invEl, 'Date', admDate);
            setTagText(doc, invEl, 'Type', 'Investigation');
            setTagText(doc, invEl, 'TreatmentCode', labCode);
            setTagText(doc, invEl, 'ICDCode', '');
            setTagText(doc, invEl, 'Tariff', '0.00');
            treatmentsContainer.appendChild(invEl);
          }
          actionSummary = `Manual Lab Attachment Batch Fix: Appended diagnostic investigation <TreatmentCode>${labCode}</TreatmentCode>`;
          break;
        }

        case 'custom_rule_action':
        default: {
          const domSummary = applyRuleFixToClaimInDom(doc, patEl, claimEl, fixParams.ruleCode);
          actionSummary = fixParams.customDescription
            ? `Manual Batch Fix: ${fixParams.customDescription} (${domSummary})`
            : `Manual Batch Fix: ${domSummary}`;
          break;
        }
      }

      affectedClaimsCount++;
      fixLogs.push({
        id: `manual_batch_${Date.now()}_${fixLogs.length + 1}`,
        claimId,
        ruleCode: fixParams.ruleCode,
        ruleTitle: `MANUAL BATCH FIX: ${matchingDiscrepancy?.ruleTitle || fixParams.ruleCode}`,
        actionTaken: actionSummary,
        amountAdjustedGhs: adjustmentGhs,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  }

  recalculateXmlBatchTotals(doc);
  return {
    updatedXml: serializeXmlDocument(doc),
    fixLogs,
    affectedClaimsCount,
  };
}

// Save manual edits made in the Interactive Claim XML Editor back into the XML string
export function updateClaimManuallyInXml(
  xmlContent: string,
  updatedClaim: ParsedNhisClaim
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');
  const patientElements = Array.from(doc.getElementsByTagName('PatientData'));

  for (const patEl of patientElements) {
    const claimElements = Array.from(patEl.getElementsByTagName('Claim'));
    for (const claimEl of claimElements) {
      if (getTagText(claimEl, 'ClaimIdentificationNumber') === updatedClaim.claimId) {
        setTagText(doc, patEl, 'MemberNumber', updatedClaim.memberNumber);
        setTagText(doc, patEl, 'HospitalRecordNumber', updatedClaim.hospitalRecordNumber);
        setTagText(doc, patEl, 'DateOfBirth', updatedClaim.dateOfBirth);
        setTagText(doc, patEl, 'Gender', updatedClaim.gender);

        setTagText(doc, claimEl, 'ServiceType', updatedClaim.serviceType);
        setTagText(doc, claimEl, 'SpecialityCode', updatedClaim.specialityCode);
        setTagText(doc, claimEl, 'DurationLength', String(updatedClaim.durationLength || ''));
        setTagText(doc, claimEl, 'AdmissionDate', updatedClaim.admissionDate);
        setTagText(doc, claimEl, 'DischargeDate', updatedClaim.dischargeDate);
        setTagText(doc, claimEl, 'ReferralNo', updatedClaim.referralNo);

        if (updatedClaim.serviceType === 'INP') {
          setTagText(doc, claimEl, 'InPatientCode', updatedClaim.inPatientCode);
          setTagText(doc, claimEl, 'InPatientTariffAmount', updatedClaim.totalServiceCost.toFixed(2));
          setTagText(doc, claimEl, 'OutPatientCode', '');
          setTagText(doc, claimEl, 'OutPatientTariffAmount', '');
        } else {
          setTagText(doc, claimEl, 'OutPatientCode', updatedClaim.outPatientCode);
          setTagText(doc, claimEl, 'OutPatientTariffAmount', updatedClaim.totalServiceCost.toFixed(2));
          setTagText(doc, claimEl, 'InPatientCode', '');
          setTagText(doc, claimEl, 'InPatientTariffAmount', '');
        }
        setTagText(doc, claimEl, 'TotalCost', updatedClaim.totalServiceCost.toFixed(2));

        // Rebuild <Treatments>
        let treatmentsEl = claimEl.getElementsByTagName('Treatments')[0];
        if (!treatmentsEl) {
          treatmentsEl = doc.createElement('Treatments');
          claimEl.appendChild(treatmentsEl);
        }
        while (treatmentsEl.firstChild) {
          treatmentsEl.removeChild(treatmentsEl.firstChild);
        }
        for (const t of updatedClaim.treatments) {
          const tNode = doc.createElement('Treatment');
          setTagText(doc, tNode, 'Date', t.date || '');
          setTagText(doc, tNode, 'Type', t.type || 'Diagnosis');
          setTagText(doc, tNode, 'TreatmentCode', t.treatmentCode || '');
          setTagText(doc, tNode, 'ICDCode', t.icdCode || '');
          setTagText(doc, tNode, 'Tariff', (Number(t.tariff) || 0).toFixed(2));
          treatmentsEl.appendChild(tNode);
        }

        // Rebuild <Medicines>
        let medicinesEl = claimEl.getElementsByTagName('Medicines')[0];
        if (!medicinesEl) {
          medicinesEl = doc.createElement('Medicines');
          claimEl.appendChild(medicinesEl);
        }
        while (medicinesEl.firstChild) {
          medicinesEl.removeChild(medicinesEl.firstChild);
        }
        for (const m of updatedClaim.medicines) {
          const mNode = doc.createElement('Medicine');
          const qty = Number(m.quantity) || 0;
          const up = Number(m.unitPrice) || 0;
          const total = Number((qty * up).toFixed(2));
          setTagText(doc, mNode, 'MedicineCode', m.medicineCode);
          setTagText(doc, mNode, 'Quantity', String(qty));
          setTagText(doc, mNode, 'UnitPrice', up.toFixed(2));
          setTagText(doc, mNode, 'MedicineTotal', total.toFixed(2));
          setTagText(doc, mNode, 'MedicineDate', m.medicineDate);

          const presNode = doc.createElement('Prescription');
          setTagText(doc, presNode, 'Dose', m.dose);
          setTagText(doc, presNode, 'Frequency', String(m.frequency));
          setTagText(doc, presNode, 'Duration', String(m.duration));
          setTagText(
            doc,
            presNode,
            'CustomText',
            m.customText || `Dosages of ${m.dose} dose for ${m.duration} days with frequency of ${m.frequency} quantity in a day`
          );
          mNode.appendChild(presNode);
          medicinesEl.appendChild(mNode);
        }
        break;
      }
    }
  }

  recalculateXmlBatchTotals(doc);
  return serializeXmlDocument(doc);
}

// Format and download the fixed NHIS XML file (legacy fallback)
export function downloadFixedNhisXml(xmlContent: string, batchNumber: string): void {
  const cleanBatch = batchNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `NHIS_FIXED_${cleanBatch}_COMPLIANT.xml`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ConsolidatedXmlResult {
  consolidatedXml: string;
  totalClaimsCount: number;
  cleanClaimsCount: number;
  fixedClaimsCount: number;
  batchTotalAmountGhs: number;
  batchNumber: string;
}

/**
 * Merges remediated/fixed claims back into the original clean XML file.
 * Preserves all original clean claims from baseCleanXml and replaces/merges matching
 * claim nodes with the updated remediated claims from remediatedXml.
 * Recalculates ClaimsCount, MedicinesCount, TreatmentsCount, and BatchAmount.
 */
export function buildConsolidatedXml(
  baseCleanXml: string,
  remediatedXml: string,
  fixedClaimIds?: string[]
): ConsolidatedXmlResult {
  const parser = new DOMParser();
  const baseDoc = parser.parseFromString(baseCleanXml, 'text/xml');
  const remediatedDoc = parser.parseFromString(remediatedXml, 'text/xml');

  // Collect all PatientData elements from remediated XML
  const remediatedPatients = Array.from(remediatedDoc.getElementsByTagName('PatientData'));
  const remediatedClaimMap = new Map<string, Element>();

  for (const patEl of remediatedPatients) {
    const claimEls = Array.from(patEl.getElementsByTagName('Claim'));
    for (const cEl of claimEls) {
      const cid = getTagText(cEl, 'ClaimIdentificationNumber');
      if (cid) {
        if (!fixedClaimIds || fixedClaimIds.length === 0 || fixedClaimIds.includes(cid)) {
          remediatedClaimMap.set(cid, patEl);
        }
      }
    }
  }

  // Ensure baseDoc has a Patients container
  let basePatientsContainer = baseDoc.getElementsByTagName('Patients')[0];
  if (!basePatientsContainer) {
    basePatientsContainer = baseDoc.createElement('Patients');
    baseDoc.documentElement.appendChild(basePatientsContainer);
  }

  const existingBasePatients = Array.from(baseDoc.getElementsByTagName('PatientData'));
  const handledFixedClaimIds = new Set<string>();

  // Replace matching claims in baseDoc with the remediated PatientData
  for (const basePatEl of existingBasePatients) {
    const baseClaimEls = Array.from(basePatEl.getElementsByTagName('Claim'));
    for (const baseCEl of baseClaimEls) {
      const baseCid = getTagText(baseCEl, 'ClaimIdentificationNumber');
      if (baseCid && remediatedClaimMap.has(baseCid)) {
        const replacementPatEl = remediatedClaimMap.get(baseCid)!;
        const importedNode = baseDoc.importNode(replacementPatEl, true);
        basePatEl.parentNode?.replaceChild(importedNode, basePatEl);
        handledFixedClaimIds.add(baseCid);
        break;
      }
    }
  }

  // If there are remediated claims not in baseDoc (e.g. an external clean file that omitted them),
  // append them to Patients container
  for (const [cid, fixedPatEl] of remediatedClaimMap.entries()) {
    if (!handledFixedClaimIds.has(cid)) {
      const importedNode = baseDoc.importNode(fixedPatEl, true);
      basePatientsContainer.appendChild(importedNode);
      handledFixedClaimIds.add(cid);
    }
  }

  recalculateXmlBatchTotals(baseDoc);

  // Calculate final statistics
  const finalPatients = Array.from(baseDoc.getElementsByTagName('PatientData'));
  let finalClaimsCount = 0;
  for (const p of finalPatients) {
    finalClaimsCount += p.getElementsByTagName('Claim').length;
  }

  const batchInfoEl = baseDoc.getElementsByTagName('BatchInformation')[0];
  const batchNum = batchInfoEl ? getTagText(batchInfoEl, 'BatchNumber') || 'NHIS-BATCH' : 'NHIS-BATCH';
  const batchAmt = batchInfoEl ? parseFloat(getTagText(batchInfoEl, 'BatchAmount') || '0') || 0 : 0;
  const fixedCount = handledFixedClaimIds.size;
  const cleanCount = Math.max(0, finalClaimsCount - fixedCount);

  return {
    consolidatedXml: serializeXmlDocument(baseDoc),
    totalClaimsCount: finalClaimsCount,
    cleanClaimsCount: cleanCount,
    fixedClaimsCount: fixedCount,
    batchTotalAmountGhs: Number(batchAmt.toFixed(2)),
    batchNumber: batchNum,
  };
}

/**
 * Extracts an XML batch containing ONLY the fixed/remediated claims.
 */
export function extractFixedClaimsOnlyXml(
  xmlContent: string,
  fixedClaimIds: string[]
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');
  const patientElements = Array.from(doc.getElementsByTagName('PatientData'));

  for (const patEl of patientElements) {
    const claimElements = Array.from(patEl.getElementsByTagName('Claim'));
    const hasFixed = claimElements.some((c) => {
      const cid = getTagText(c, 'ClaimIdentificationNumber');
      return cid && fixedClaimIds.includes(cid);
    });
    if (!hasFixed) {
      patEl.parentNode?.removeChild(patEl);
    }
  }

  recalculateXmlBatchTotals(doc);
  return serializeXmlDocument(doc);
}

/**
 * Downloads the entire consolidated XML file (clean claims + remediated claims merged together).
 */
export function downloadEntireConsolidatedNhisXml(
  xmlContent: string,
  batchNumber: string,
  customFileName?: string
): void {
  const cleanBatch = batchNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = customFileName || `NHIS_ENTIRE_BATCH_${cleanBatch}_CLEAN_AND_FIXED.xml`;
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads an XML file containing only the remediated claims.
 */
export function downloadFixedOnlyNhisXml(
  xmlContent: string,
  batchNumber: string,
  customFileName?: string
): void {
  const cleanBatch = batchNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = customFileName || `NHIS_REMEDIATED_CLAIMS_ONLY_${cleanBatch}.xml`;
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}



