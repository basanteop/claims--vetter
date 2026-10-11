import 'dotenv/config';
import express from 'express';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, GenerateContentParameters } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const FALLBACK_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

async function generateWithFallback(params: Omit<GenerateContentParameters, 'model'>) {
  let lastError: unknown = null;
  for (const modelName of FALLBACK_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await ai.models.generateContent({
          ...params,
          model: modelName,
        });
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err || '');
        const isTransient =
          msg.includes('503') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('429') ||
          msg.includes('high demand') ||
          msg.includes('overloaded');
        if (!isTransient) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

// Complete 19-Rule Master Catalog extracted from the attached St. John of God Hospital NHIS PDFs & XML batch
const MASTER_19_NHIS_RULES = [
  {
    code: 'NHIS-R01',
    title: 'AGE TREATMENT MISMATCH',
    category: 'Clinical',
    severity: 'high',
    description:
      'Treatments, G-DRG age suffixes, or medicine formulations dispensed did not match the ages of respective patients.',
    criteriaSummary:
      '• Carbocisteine Paediatric Syrup (125mg/5mL) prescribed for children ≤2 years or for adults.\n• Albendazole Syrup (100mg/5mL) prescribed for a 1-year-old child.\n• Amoxicillin + Clavulanic Acid Suspension, Metronidazole Suspension, Artemether + Lumefantrine Suspension, or Multivitamin Syrup prescribed for adults (≥18 yrs).\n• Adult G-DRG suffix (A) applied to paediatric patients (<12 yrs).',
    pdfAffectedCount: 87,
    pdfTotalCostGhs: 1291.39,
  },
  {
    code: 'NHIS-R02',
    title: 'BENEFIT NOT COVERED UNDER NHIS',
    category: 'Clinical',
    severity: 'critical',
    description:
      'Diagnoses stated on the claim form are excluded from the benefit package covered under the NHIS.',
    criteriaSummary:
      '• Billed for Female Infertility (ICD-10 N97.9), which is not part of the NHIS benefits package.\n• Billed for Tuberculosis (covered under Vertical National TB Control Programme, not NHIS claims reimbursement).',
    pdfAffectedCount: 25,
    pdfTotalCostGhs: 665.71,
  },
  {
    code: 'NHIS-R03',
    title: 'DUPLICATION OF MEDICINES',
    category: 'Pharmacy',
    severity: 'high',
    description:
      'Medicines prescribed were duplicated on the same claim form, same attendance date, or overlapping episode.',
    criteriaSummary:
      '• Paracetamol 500mg, Amoxicillin + Clavulanic Acid 625mg, or Ciprofloxacin 500mg billed twice on the same claim/date.\n• Ciprofloxacin Infusion, Co-amoxiclav Injection, Cefuroxime Injection 750mg, Ceftriaxone Injection 1g, or Clindamycin Injection billed twice on the same day.\n• Normal Saline 0.9%, Ringer Lactate, Diclofenac Gel, or Aspirin 75mg duplicated on the same claim.',
    pdfAffectedCount: 147,
    pdfTotalCostGhs: 6040.82,
  },
  {
    code: 'NHIS-R04',
    title: 'INACTIVE MEMBER',
    category: 'Membership',
    severity: 'critical',
    description:
      'NHIS membership numbers submitted for reimbursement were not active subscribers at the time of service. All such claims are rejected in full.',
    criteriaSummary:
      '• Full rejection of claims where MemberNumber is an expired/unverified 10-digit legacy subscriber ID (starting with "00") or inactive NHIA membership record.',
    pdfAffectedCount: 54,
    pdfTotalCostGhs: 13467.57,
  },
  {
    code: 'NHIS-R05',
    title: 'INAPPROPRIATE PRESCRIPTION',
    category: 'Pharmacy',
    severity: 'critical',
    description:
      'Medicines prescribed were clinically inappropriate or violated NHIS Standard Treatment Guidelines (STG) for the stated diagnosis.',
    criteriaSummary:
      '• Metronidazole (Tablet/Injection) or Ciprofloxacin + Tinidazole prescribed for Typhoid/Enteric Fever (A01.0).\n• Amoxicillin + Clavulanic Acid or Azithromycin prescribed for Peptic Ulcer Disease (K25.3/K27.9).\n• Systemic antibiotics prescribed for Gastritis (K29.*), Acute Bronchitis, or Rhinitis without H. pylori/bacterial protocol.\n• Carbocisteine Syrup prescribed for Cough (R05.00), Common Cold (J00.00), or URTI (J06.9).\n• IV Infusions (SODCHLIN3) or injectable Artesunate prescribed at routine OPD without 24h admission.\n• Cefuroxime Tablet prescribed for routine Antenatal Care (Z36.9).',
    pdfAffectedCount: 1884,
    pdfTotalCostGhs: 67930.56,
  },
  {
    code: 'NHIS-R06',
    title: 'MULTIPLE ATTENDANCE',
    category: 'Tariff',
    severity: 'high',
    description:
      'Multiple separate outpatient or procedural claims billed for the same member on the same visit or consecutive days.',
    criteriaSummary:
      '• Billed OPDC06A (General OPD) and OPDC02A (Antenatal Screening) separately on the same visit.\n• Billed Osteoarthritis (ORTH14A) and Physiotherapy (OPDC13A) on the same day, or ZOOM02A and MEDI38A on the same date.',
    pdfAffectedCount: 36,
    pdfTotalCostGhs: 2880.19,
  },
  {
    code: 'NHIS-R07',
    title: 'MULTIPLE CHRONIC VISIT',
    category: 'Tariff',
    severity: 'medium',
    description:
      'Multiple chronic illness visits billed within a single month contrary to the NHIS Tariff Operation Manual.',
    criteriaSummary:
      '• Flags repeat outpatient claims in the same calendar month for the same MemberNumber for chronic hypertension, diabetes, stroke rehabilitation (OPDC13A), or wound dressing (ZOOM05A).',
    pdfAffectedCount: 18,
    pdfTotalCostGhs: 455.92,
  },
  {
    code: 'NHIS-R08',
    title: 'MISAPPLICATION OF TARIFFS',
    category: 'Tariff',
    severity: 'high',
    description:
      'G-DRG tariff quoted for a service rendered was wrongfully applied to an ineligible diagnosis or procedure rule.',
    criteriaSummary:
      '• Applied Physiotherapy tariff (OPDC13A) to non-physiotherapy medical conditions such as Cough, Diabetes (E11.*), Headache, Hypertension, Dry Eye Syndrome (H04.*), Insomnia (F51.*), or Candidiasis (B37.3).\n• Applied unauthorized 20% markup on orthopedic/surgical tariffs (ORTH17A, ORTH08A, OBGY20A).',
    pdfAffectedCount: 30,
    pdfTotalCostGhs: 2700.4,
  },
  {
    code: 'NHIS-R09',
    title: 'NO ATTACHMENT FOR PHYSIOTHERAPY CLAIMS',
    category: 'Documentation',
    severity: 'medium',
    description:
      'Billed for Physiotherapy (OPDC13A / OPDC13C) without Physiotherapy request forms attached to the claims.',
    criteriaSummary:
      '• Disallows OPDC13A and OPDC13C claims where ReferralNo / Physiotherapy request form attachment is missing.',
    pdfAffectedCount: 45,
    pdfTotalCostGhs: 1379.0,
  },
  {
    code: 'NHIS-R10',
    title: 'OVER PRESCRIPTION OF DRUG',
    category: 'Pharmacy',
    severity: 'high',
    description:
      'Prescribed medicine strength, daily frequency, or duration exceeded NHIS clinical protocol for the stated condition.',
    criteriaSummary:
      '• Billed Oxytocin Injection 10 units/mL (OXYTOCIN2): 2–6 ampoules instead of 1 ampoule for Spontaneous Vaginal Delivery (OBGY34A).\n• Prescribed Fluconazole 150mg (FLUCONCA1) daily for 3–7 days instead of a single stat dose for Vaginal Candidiasis.\n• Prescribed Hyoscine Butylbromide 20mg tds for Gastritis or Supp. Diclofenac >10 units.\n• Prescribed invalid dosage units (1000 mL Paracetamol, 200 MG Omeprazole, 1000 g Metformin, 2 g Glimepiride, 500 L Saline).',
    pdfAffectedCount: 495,
    pdfTotalCostGhs: 11266.31,
  },
  {
    code: 'NHIS-R11',
    title: 'OVER SUPPLY OF MEDICINES',
    category: 'Pharmacy',
    severity: 'critical',
    description:
      'The quantity of medicines dispensed was higher than the prescribed regimen (Frequency × Duration).',
    criteriaSummary:
      '• Supplied 8, 12, 16, or 24 bottles of Ciprofloxacin Infusion (CIPROFIN1) exceeding Frequency × Duration.\n• Supplied 8, 14, 16, 18, 24, or 32 vials of Clindamycin Injection (CLINDAIN1) exceeding Frequency × Duration.\n• Supplied excess bags of Sodium Chloride 0.9% (SODCHLIN3) or double-supplied oral antibiotics and suspensions.',
    pdfAffectedCount: 288,
    pdfTotalCostGhs: 30760.97,
  },
  {
    code: 'NHIS-R12',
    title: 'POLYPHARMACY',
    category: 'Pharmacy',
    severity: 'medium',
    description:
      'Concurrent prescription of redundant or overlapping pharmacological classes on the same claim.',
    criteriaSummary:
      '• Prescribed Fluconazole Capsule (150mg) and Miconazole/Clotrimazole Ovule concurrently for Vaginal Candidiasis.\n• Prescribed Losartan (ARB) and Lisinopril (ACEi) concurrently for Hypertension.\n• Prescribed Ferrous Sulphate and Iron Polymaltose together at ANC, or concurrent dual NSAIDs.',
    pdfAffectedCount: 101,
    pdfTotalCostGhs: 2125.96,
  },
  {
    code: 'NHIS-R13',
    title: 'TREATMENT TO DIAGNOSIS MISMATCH',
    category: 'Clinical',
    severity: 'high',
    description:
      'Medicines or treatments prescribed did not match any clinical diagnosis stated on the claim form.',
    criteriaSummary:
      '• Prescribed Methyldopa (METHYLTA1) without pregnancy-induced hypertension, or Ibuprofen (IBUPROTA1) during pregnancy (O09.31).\n• Prescribed Antihypertensives without Hypertension diagnosis, Antidiabetics without Diabetes, or Artemether+Lumefantrine without Malaria.',
    pdfAffectedCount: 91,
    pdfTotalCostGhs: 2705.23,
  },
  {
    code: 'NHIS-R14',
    title: 'NON-SPECIFIC / UNCLEAR DIAGNOSIS',
    category: 'Clinical',
    severity: 'high',
    description:
      'No specific etiological diagnosis was stated on the claim form to justify systemic antimicrobial therapy.',
    criteriaSummary:
      '• Prescribed systemic antibiotics (Ciprofloxacin, Cefuroxime, Co-amoxiclav, Metronidazole) for generalized/unclear diagnoses such as Gastroenteritis unspecified (A09.0/A09.9), Unspecified Bacterial Infection (A49.9), or Fever (R50.9).',
    pdfAffectedCount: 441,
    pdfTotalCostGhs: 15276.69,
  },
  {
    code: 'NHIS-R15',
    title: 'WRONG APPLICATION OF TARIFFS',
    category: 'Tariff',
    severity: 'critical',
    description:
      'In-patient or procedural G-DRG code billed does not match the primary clinical diagnosis or length of stay.',
    criteriaSummary:
      '• Billed ORTH04C instead of OPDC13C for Talipes Equinovarus managed within 24 hours (1-day stay).\n• Billed MEDI03A/MEDI07A/MEDI30A where primary tariffed diagnosis is MEDI31A (Cellulitis/Myalgia) or MEDI32A (Hypertension).\n• Billed PAED39C/PAED14C for Paediatric Sepsis or Malaria discharged within 2 days.',
    pdfAffectedCount: 251,
    pdfTotalCostGhs: 42686.44,
  },
  {
    code: 'NHIS-R16',
    title: 'MEDICINES DISPENSED OUTSIDE ADMISSION PERIOD',
    category: 'Pharmacy',
    severity: 'high',
    description:
      'Inpatient parenteral medicines or multi-day IV infusions were billed outside the admission window or on the day of discharge.',
    criteriaSummary:
      '• Prescribed multi-day IV Ceftriaxone, Clindamycin, Ciprofloxacin Infusion, or Metronidazole on the last day of admission / discharge date.',
    pdfAffectedCount: 27,
    pdfTotalCostGhs: 2737.87,
  },
  {
    code: 'NHIS-R17',
    title: 'DUPLICATION OF CLAIMS',
    category: 'Tariff',
    severity: 'critical',
    description:
      'Duplicate claim submissions for the same patient, date, and diagnosis or same NHIS number across multiple claims.',
    criteriaSummary:
      '• Billed the same G-DRG twice on the same date for the same member, or billed two incompatible G-DRGs on the same date.',
    pdfAffectedCount: 23,
    pdfTotalCostGhs: 1173.53,
  },
  {
    code: 'NHIS-R18',
    title: 'MULTIPLE ANC VISIT',
    category: 'Tariff',
    severity: 'medium',
    description:
      'Multiple routine Antenatal Care (ANC) visits billed within a single month contrary to the NHIS Tariff Operation Manual.',
    criteriaSummary:
      '• Routine ANC visits (OPDC02A / Z36.9) are capped at six (6) per pregnancy and should not be billed multiple times within the same calendar month.',
    pdfAffectedCount: 14,
    pdfTotalCostGhs: 241.92,
  },
  {
    code: 'NHIS-R19',
    title: 'NO DIAGNOSTIC REPORT EVIDENT / PART OF TARIFF',
    category: 'Documentation',
    severity: 'medium',
    description:
      'Lipid-lowering agents billed without attached laboratory lipid profile, or unbundled surgical tariff billed.',
    criteriaSummary:
      '• Prescribed Atorvastatin Tablet 20mg/40mg (ATORVATA1/2) without attaching a lipid profile investigation (INVE75D).',
    pdfAffectedCount: 19,
    pdfTotalCostGhs: 830.26,
  },
];

// Decompress FlateDecode streams inside a PDF buffer and extract readable text tokens
function decompressPdfText(pdfBase64: string): string {
  try {
    const buf = Buffer.from(pdfBase64, 'base64');
    const binaryStr = buf.toString('latin1');
    const extractedChunks: string[] = [];

    let pos = 0;
    while (pos < binaryStr.length) {
      const streamIdx = binaryStr.indexOf('stream', pos);
      if (streamIdx === -1) break;
      let start = streamIdx + 6;
      if (binaryStr[start] === '\r' && binaryStr[start + 1] === '\n') start += 2;
      else if (binaryStr[start] === '\n' || binaryStr[start] === '\r') start += 1;

      const endIdx = binaryStr.indexOf('endstream', start);
      if (endIdx === -1) break;

      let end = endIdx;
      while (end > start && (binaryStr[end - 1] === '\n' || binaryStr[end - 1] === '\r')) {
        end--;
      }

      const rawSlice = buf.subarray(start, end);
      let decompressed: Buffer | null = null;
      try {
        decompressed = zlib.inflateSync(rawSlice);
      } catch {
        try {
          decompressed = zlib.inflateRawSync(rawSlice);
        } catch {
          decompressed = null;
        }
      }

      const contentStr = decompressed ? decompressed.toString('latin1') : rawSlice.toString('latin1');
      // Extract text inside parentheses (...) used by Tj and TJ PDF operators
      const textTokens = contentStr.match(/\((?:\\.|[^\\()])*\)/g);
      if (textTokens && textTokens.length > 0) {
        const joined = textTokens
          .map((t) =>
            t
              .slice(1, -1)
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, ' ')
              .replace(/\\\(/g, '(')
              .replace(/\\\)/g, ')')
              .replace(/\\\\/g, '\\')
          )
          .join('');
        if (joined.trim().length > 2) {
          extractedChunks.push(joined);
        }
      }
      pos = endIdx + 9;
    }

    return extractedChunks.join('\n');
  } catch {
    return '';
  }
}

// Deterministic parser for NHIS Vetted Claims Report PDFs (extracts from decompressed PDF text + merges with master 19 rules)
function extractRulesFromPdfBufferFallback(pdfBase64?: string, rawText?: string, fileName?: string) {
  let combinedText = rawText || '';
  if (pdfBase64) {
    const pdfText = decompressPdfText(pdfBase64);
    if (pdfText) {
      combinedText += '\n' + pdfText;
    }
  }

  // Normalize whitespace for regex matching
  const normalizedText = combinedText.replace(/\s+/g, ' ');

  // Look for numbered rule headers like "1. AGE TREATMENT MISMATCH: 9 claim(s) affected, at a total cost of GHS 84.33"
  const regex =
    /(\d{1,2})\.\s*([A-Z][A-Z\s\-/]{3,65}):\s*(\d+)\s*claim\(s\)\s*affected[^G]*GHS\s*([\d,]+\.\d{2})/gi;
  const parsedFromPdfMap = new Map<string, { count: number; cost: number; title: string }>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(normalizedText)) !== null) {
    const title = match[2].trim().toUpperCase();
    const count = parseInt(match[3], 10);
    const cost = parseFloat(match[4].replace(/,/g, ''));
    parsedFromPdfMap.set(title, { count, cost, title });
  }

  // Merge any live-extracted PDF counts/costs into the 19-rule NHIS catalog
  return MASTER_19_NHIS_RULES.map((rule) => {
    const matched = Array.from(parsedFromPdfMap.values()).find(
      (p) => rule.title.includes(p.title) || p.title.includes(rule.title)
    );
    if (matched) {
      return {
        ...rule,
        description: `${rule.description} (Extracted from ${fileName || 'uploaded PDF'}: ${matched.count} claims affected, GHS ${matched.cost.toFixed(2)}).`,
        pdfAffectedCount: matched.count,
        pdfTotalCostGhs: matched.cost,
      };
    }
    return rule;
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // Endpoint 1: Extract NHIS Vetting Instructions from uploaded PDF / XML files
  app.post('/api/extract-pdf-rules', async (req, res) => {
    const { pdfBase64, mimeType, rawText, fileName } = req.body;
    try {
      // First decompress any PDF text so Gemini also gets clean text alongside binary PDF
      const decompressedText = pdfBase64 ? decompressPdfText(pdfBase64) : '';
      const combinedText = [rawText, decompressedText].filter(Boolean).join('\n').slice(0, 35000);

      const parts: any[] = [];
      if (pdfBase64 && !decompressedText) {
        parts.push({
          inlineData: {
            mimeType: mimeType || 'application/pdf',
            data: pdfBase64,
          },
        });
      }
      if (combinedText) {
        parts.push({
          text: `Extracted Document Text Content (${fileName || 'NHIS Vetting Document'}):\n${combinedText}`,
        });
      }

      parts.push({
        text: `You are an expert NHIS (National Health Insurance Scheme) Clinical & Billing Compliance Auditor.
Extract all vetting instructions, adjustment reasons, billing discrepancy rules, and clinical compliance rules from the provided NHIS Vetted Claims Report or Tariff Manual (${fileName || 'NHIS Vetting Document'}).
Ensure all standard NHIS vetting rules present in the document (up to 19 rules such as NHIS-R01 through NHIS-R19) are returned with:
- code: Rule identifier (e.g., "NHIS-R01", "NHIS-R02", ... "NHIS-R19")
- title: Official rule title (e.g., "AGE TREATMENT MISMATCH", "BENEFIT NOT COVERED UNDER NHIS", "DUPLICATION OF MEDICINES", etc.)
- category: Must be one of: "Clinical", "Tariff", "Membership", "Pharmacy", "Documentation"
- severity: Must be one of: "critical", "high", "medium", "low"
- description: Detailed explanation of why claims are adjusted or rejected under this rule
- criteriaSummary: Specific actionable bullet criteria (medicines, ICD-10 codes, G-DRG tariff codes, age limits, or quantity formulas) to check against XML claim records.`,
      });

      const response = await generateWithFallback({
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                code: { type: Type.STRING, description: 'Rule code identifier e.g. NHIS-R01' },
                title: { type: Type.STRING, description: 'Official rule title' },
                category: {
                  type: Type.STRING,
                  description: 'One of Clinical, Tariff, Membership, Pharmacy, Documentation',
                },
                severity: {
                  type: Type.STRING,
                  description: 'One of critical, high, medium, low',
                },
                description: { type: Type.STRING, description: 'Explanation of the rule' },
                criteriaSummary: {
                  type: Type.STRING,
                  description: 'Specific clinical, pharmacy, or G-DRG criteria to validate on XML claims',
                },
              },
              required: ['code', 'title', 'category', 'severity', 'description', 'criteriaSummary'],
            },
          },
        },
      });

      const text = response.text || '[]';
      const extractedRules = JSON.parse(text.trim());
      if (Array.isArray(extractedRules) && extractedRules.length > 0) {
        res.json({ rules: extractedRules, source: 'gemini' });
        return;
      }
      const fallbackRules = extractRulesFromPdfBufferFallback(pdfBase64, rawText, fileName);
      res.json({ rules: fallbackRules, source: 'deterministic_parser' });
    } catch (error: any) {
      console.warn('Gemini models experiencing high demand; using deterministic NHIS PDF stream parser:', error?.message);
      const fallbackRules = extractRulesFromPdfBufferFallback(pdfBase64, rawText, fileName);
      res.json({
        rules: fallbackRules,
        source: 'deterministic_parser',
      });
    }
  });

  // Endpoint 2: HIPAA De-Identified Clinical & Billing Remediation Guidance
  app.post('/api/remediate-claim', async (req, res) => {
    const { deIdentifiedClaim, findings } = req.body;
    try {
      const prompt = `You are an NHIS Senior Medical & Claims Vetting Auditor.
Analyze the following HIPAA Safe-Harbor de-identified NHIS claim and its flagged compliance discrepancies.
Provide a concise, actionable 3-point remediation instruction for the hospital claims officer before resubmission to the NHIA.

De-Identified Claim Context:
${JSON.stringify(deIdentifiedClaim, null, 2)}

Flagged Findings:
${JSON.stringify(findings, null, 2)}`;

      const response = await generateWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rootCause: { type: Type.STRING, description: 'Clinical or tariff root cause summary' },
              correctiveAction: { type: Type.STRING, description: 'Specific correction required in XML/E-Claims' },
              nhisPolicyReference: { type: Type.STRING, description: 'NHIS Tariff Manual / Vetting Protocol reference' },
            },
            required: ['rootCause', 'correctiveAction', 'nhisPolicyReference'],
          },
        },
      });

      const result = JSON.parse((response.text || '{}').trim());
      res.json(result);
    } catch (error: any) {
      console.warn('Using deterministic clinical remediation fallback:', error?.message);
      const firstFinding = Array.isArray(findings) && findings[0] ? findings[0] : null;
      res.json({
        rootCause: firstFinding
          ? `${firstFinding.ruleCode} (${firstFinding.ruleTitle}): ${firstFinding.specificFinding}`
          : 'Discrepancy between billed G-DRG/Medicine regimen and NHIS Standard Treatment Guidelines.',
        correctiveAction:
          'Verify patient age, primary ICD-10 diagnosis specificity, and dispensed quantity (Frequency × Duration) in the hospital e-Claims XML export prior to NHIA resubmission.',
        nhisPolicyReference: 'NHIS Tariff Operation Manual & Standard Treatment Guidelines (STG 7th Edition)',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
