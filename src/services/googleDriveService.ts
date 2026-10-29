import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuse existing Firebase app instance if already initialized
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Workspace Drive scope
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'consent',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup
export const googleSignIn = async (forcePrompt = false): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    if (forcePrompt) {
      provider.setCustomParameters({
        prompt: 'consent',
      });
    }
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google access token');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
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
  let token = cachedAccessToken;
  if (!token) {
    const signInRes = await googleSignIn(true);
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
      if (!hasRetriedAuth) {
        const reSignIn = await googleSignIn(true);
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
