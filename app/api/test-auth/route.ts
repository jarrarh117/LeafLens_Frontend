import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Check if Firebase Admin is initialized
    const hasApp = admin.apps.length > 0;
    
    // Check environment variables
    const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
    const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
    const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;
    
    return NextResponse.json({
      firebaseAdminInitialized: hasApp,
      environmentVariables: {
        FIREBASE_PROJECT_ID: hasProjectId,
        FIREBASE_CLIENT_EMAIL: hasClientEmail,
        FIREBASE_PRIVATE_KEY: hasPrivateKey,
      },
      message: hasProjectId && hasClientEmail && hasPrivateKey 
        ? 'All environment variables are set' 
        : 'Missing environment variables',
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
    }, { status: 500 });
  }
}
