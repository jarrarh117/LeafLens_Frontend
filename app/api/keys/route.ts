import { NextRequest, NextResponse } from 'next/server';
import { createApiKey, getUserApiKeys, deactivateApiKey } from '@/lib/apiKeys';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

// ── Helper: Verify Firebase ID Token ─────────────────────────────────────────
async function verifyUser(request: NextRequest): Promise<{ uid: string; email: string } | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/keys
// Get all API keys for the authenticated user
// ═════════════════════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  try {
    const user = await verifyUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const keys = await getUserApiKeys(user.uid);
    
    // Format for frontend
    const formattedKeys = keys.map(key => ({
      id: key.id,
      name: key.name,
      maskedKey: `pd_live_${'•'.repeat(32)}`,
      plan: key.plan,
      usageCount: key.usageCount,
      usageLimit: key.usageLimit,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
      isActive: key.isActive,
    }));

    return NextResponse.json(formattedKeys);
  } catch (error) {
    console.error('GET /api/keys error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/keys
// Create a new API key
// ═════════════════════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  try {
    const user = await verifyUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, plan = 'free' } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Invalid key name' },
        { status: 400 }
      );
    }

    // Create the API key
    const { plainKey, keyId } = await createApiKey(
      user.uid,
      user.email,
      name,
      plan
    );

    // Get the created key data
    const keys = await getUserApiKeys(user.uid);
    const newKey = keys.find(k => k.id === keyId);

    return NextResponse.json({
      plainKey, // Return plain key ONCE
      keyData: {
        id: keyId,
        name,
        key: plainKey, // Include in response for immediate display
        maskedKey: `pd_live_${'•'.repeat(32)}`,
        plan: newKey?.plan || plan,
        usageCount: 0,
        usageLimit: newKey?.usageLimit || 100,
        createdAt: newKey?.createdAt || new Date(),
        isActive: true,
      },
    });
  } catch (error) {
    console.error('POST /api/keys error:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// DELETE /api/keys
// Delete (deactivate) an API key
// ═════════════════════════════════════════════════════════════════════════════
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json(
        { error: 'Missing key ID' },
        { status: 400 }
      );
    }

    // Verify the key belongs to the user
    const keys = await getUserApiKeys(user.uid);
    const keyToDelete = keys.find(k => k.id === keyId);

    if (!keyToDelete) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Deactivate the key
    await deactivateApiKey(keyId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/keys error:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
