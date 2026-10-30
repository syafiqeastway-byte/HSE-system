import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuse existing Firebase app instance if already initialized
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const TOKEN_STORAGE_KEY = 'google_drive_oauth_token';
const EXPIRY_STORAGE_KEY = 'google_drive_oauth_token_expiry';

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const getValidAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) {
    const expiryStr = typeof window !== 'undefined' ? localStorage.getItem(EXPIRY_STORAGE_KEY) : null;
    if (expiryStr && parseInt(expiryStr, 10) > Date.now()) {
      return cachedAccessToken;
    }
  }

  if (typeof window !== 'undefined') {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const expiryStr = localStorage.getItem(EXPIRY_STORAGE_KEY);
    if (storedToken && expiryStr && parseInt(expiryStr, 10) > Date.now()) {
      cachedAccessToken = storedToken;
      return storedToken;
    }
  }

  return null;
};

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = await getValidAccessToken();
      if (token) {
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(EXPIRY_STORAGE_KEY);
      }
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup without forcing consent screen unless requested
export const googleSignIn = async (forcePrompt = false): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.addScope('https://www.googleapis.com/auth/spreadsheets');

    if (forcePrompt) {
      provider.setCustomParameters({
        prompt: 'consent',
      });
    } else {
      provider.setCustomParameters({
        prompt: 'select_account',
      });
    }

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token');
    }
    cachedAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      const expiry = Date.now() + 55 * 60 * 1000; // 55 minutes
      localStorage.setItem(TOKEN_STORAGE_KEY, credential.accessToken);
      localStorage.setItem(EXPIRY_STORAGE_KEY, expiry.toString());
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return getValidAccessToken();
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(EXPIRY_STORAGE_KEY);
  }
};

/**
 * Upload a PDF blob directly to Google Drive
 * Target Folder: 1kF6v8G3-2tOuGrNHqiL3DvUq1zu1G40F (Incident Report)
 */
export const uploadPdfToGoogleDrive = async (
  blob: Blob,
  fileName: string,
  folderId = '1kF6v8G3-2tOuGrNHqiL3DvUq1zu1G40F',
  hasRetriedWithoutFolder = false,
  hasRetriedAuth = false
): Promise<{ success: boolean; fileId?: string; webViewLink?: string; error?: string }> => {
  let token = await getValidAccessToken();
  if (!token) {
    const signInRes = await googleSignIn(false);
    if (!signInRes?.accessToken) {
      return { success: false, error: 'Sign-in required to save to Google Drive' };
    }
    token = signInRes.accessToken;
  }

  try {
    const metadata: Record<string, any> = {
      name: fileName,
      mimeType: 'application/pdf',
    };
    if (folderId) {
      metadata.parents = [folderId];
    }

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      }
    );

    if (uploadRes.status === 401) {
      cachedAccessToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(EXPIRY_STORAGE_KEY);
      }
      if (!hasRetriedAuth) {
        const reSignIn = await googleSignIn(false);
        if (!reSignIn?.accessToken) {
          return { success: false, error: 'Authorization expired. Please sign in again.' };
        }
        return uploadPdfToGoogleDrive(blob, fileName, folderId, hasRetriedWithoutFolder, true);
      }
      return { success: false, error: 'Authentication token invalid. Please try signing in again.' };
    }

    if (!uploadRes.ok) {
      const errJson = await uploadRes.json().catch(() => ({}));
      const errMsg = errJson.error?.message || `Google Drive upload returned status ${uploadRes.status}`;
      const isInsufficientScope =
        errMsg.toLowerCase().includes('insufficient') ||
        errMsg.toLowerCase().includes('scope');

      // If scope was insufficient, force prompt consent once to re-grant the Drive scope
      if (isInsufficientScope && !hasRetriedAuth) {
        console.warn('Insufficient scope detected, re-authenticating with consent prompt...');
        cachedAccessToken = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(EXPIRY_STORAGE_KEY);
        }
        const reSignIn = await googleSignIn(true);
        if (reSignIn?.accessToken) {
          return uploadPdfToGoogleDrive(blob, fileName, folderId, hasRetriedWithoutFolder, true);
        }
      }

      // If folder permission error (e.g. folder 404, or cannot write to shared folder with drive.file), retry directly to user's root drive
      if (folderId && !hasRetriedWithoutFolder) {
        console.warn('Folder upload failed (' + errMsg + '), retrying directly into My Drive...');
        return uploadPdfToGoogleDrive(blob, fileName, '', true, hasRetriedAuth);
      }

      throw new Error(errMsg);
    }

    const data = await uploadRes.json();
    return {
      success: true,
      fileId: data.id,
      webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
    };
  } catch (err: any) {
    console.error('Error uploading to Google Drive:', err);
    return { success: false, error: err.message || 'Failed to save to Google Drive' };
  }
};

/**
 * Append Incident Report row to Google Sheet "NEW IR"
 * Spreadsheet ID: 1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs
 * Column Mapping:
 * - Col A (index 0): FORM NO
 * - Col B (index 1): DATE
 * - Col L (index 11): NAME
 * - Col O (index 14): PDF Drive link
 */
export const appendIncidentReportToGoogleSheet = async (
  data: {
    formNo: string;
    date: string;
    name: string;
    pdfUrl: string;
  },
  spreadsheetId = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs',
  sheetName = 'NEW IR',
  hasRetriedAuth = false
): Promise<{ success: boolean; updatedRange?: string; error?: string }> => {
  let token = await getValidAccessToken();
  if (!token) {
    const signInRes = await googleSignIn(false);
    if (!signInRes?.accessToken) {
      return { success: false, error: 'Sign-in required to update Google Sheet' };
    }
    token = signInRes.accessToken;
  }

  try {
    const range = `'${sheetName}'!A:O`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    // 15 columns: A (0), B (1), ..., L (11), ..., O (14)
    const rowValues = [
      data.formNo || '', // Col A
      data.date || '',   // Col B
      '',                // Col C
      '',                // Col D
      '',                // Col E
      '',                // Col F
      '',                // Col G
      '',                // Col H
      '',                // Col I
      '',                // Col J
      '',                // Col K
      data.name || '',   // Col L
      '',                // Col M
      '',                // Col N
      data.pdfUrl || '', // Col O
    ];

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: [rowValues],
      }),
    });

    if (res.status === 401) {
      cachedAccessToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(EXPIRY_STORAGE_KEY);
      }
      if (!hasRetriedAuth) {
        const reSignIn = await googleSignIn(false);
        if (!reSignIn?.accessToken) {
          return { success: false, error: 'Authorization expired. Please sign in again.' };
        }
        return appendIncidentReportToGoogleSheet(data, spreadsheetId, sheetName, true);
      }
      return { success: false, error: 'Authentication token invalid. Please try signing in again.' };
    }

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const errMsg = errJson.error?.message || `Google Sheets API returned status ${res.status}`;
      const isInsufficientScope =
        errMsg.toLowerCase().includes('insufficient') ||
        errMsg.toLowerCase().includes('scope');

      if (isInsufficientScope && !hasRetriedAuth) {
        console.warn('Insufficient scope for Sheets, re-authenticating with consent...');
        cachedAccessToken = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(EXPIRY_STORAGE_KEY);
        }
        const reSignIn = await googleSignIn(true);
        if (reSignIn?.accessToken) {
          return appendIncidentReportToGoogleSheet(data, spreadsheetId, sheetName, true);
        }
      }

      throw new Error(errMsg);
    }

    const resData = await res.json();
    return {
      success: true,
      updatedRange: resData.updates?.updatedRange || '',
    };
  } catch (err: any) {
    console.error('Error appending to Google Sheet:', err);
    return { success: false, error: err.message || 'Failed to update Google Sheet' };
  }
};


