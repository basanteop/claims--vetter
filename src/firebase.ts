import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Defensive Payload Constraints synchronized with firebase-blueprint.json
export const SCHEMA_LIMITS = {
  ID_MAX: 128,
  ID_REGEX: /^[a-zA-Z0-9_\-]+$/,
  DISPLAY_NAME_MAX: 100,
  DEPARTMENT_MAX: 80,
  EMAIL_MAX: 254,
  RULE_CODE_MAX: 40,
  RULE_TITLE_MAX: 160,
  RULE_DESC_MAX: 1000,
  SOURCE_DOC_MAX: 200,
  BATCH_NUMBER_MAX: 120,
  FACILITY_NAME_MAX: 200,
  ALERT_TITLE_MAX: 200,
  ALERT_MSG_MAX: 1000,
  LOG_ACTION_MAX: 120,
  LOG_DETAILS_MAX: 500,
};

export function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, SCHEMA_LIMITS.ID_MAX);
  return cleaned.length > 0 ? cleaned : 'id_default';
}

export function truncateString(val: string, maxLen: number, minLen = 1): string {
  const trimmed = (val || '').trim();
  if (trimmed.length < minLen) {
    return trimmed.padEnd(minLen, '_');
  }
  return trimmed.slice(0, maxLen);
}
