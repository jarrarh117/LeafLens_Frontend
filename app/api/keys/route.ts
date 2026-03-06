import { NextRequest, NextResponse } from 'next/server';
import { generateApiKey, hashApiKey, PLAN_LIMITS } from '@/lib/apiKeysServer';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
function getFirebaseAdmin() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase Admin environment variables not configured');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  }
  
  return admin;
}

function getDb() {
  return getFirebaseAdmin().firestore();
}

// ── Helper: Verify Firebase ID Token ─────────────────────────────────────────
async function verifyUser(request: NextRequest): Promise<{ uid: string; email: string } | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await getFirebaseAdmin().auth().verifyIdToken(idToken);
    
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

    const db = getDb();

    // Get keys from Firestore using Admin SDK
    const keysSnapshot = await db.collection('api_keys')
      .where('ownerId', '==', user.uid)
      .get();

    const keys = keysSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        maskedKey: `pd_live_${'•'.repeat(32)}`,
        plan: data.plan,
        usageCount: data.usageCount,
        usageLimit: data.usageLimit,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUsedAt: data.lastUsedAt?.toDate(),
        isActive: data.isActive,
      };
    });

    return NextResponse.json(keys);
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
    console.log('POST /api/keys - Starting');
    
    const user = await verifyUser(request);
    
    if (!user) {
      console.log('POST /api/keys - Unauthorized: No user');
      return NextResponse.json(
        { error: 'Unauthorized - Please log in again' },
        { status: 401 }
      );
    }

    console.log('POST /api/keys - User verified:', user.uid);

    const body = await request.json();
    const { name, plan = 'free' } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Invalid key name' },
        { status: 400 }
      );
    }

    console.log('POST /api/keys - Creating key for user:', user.uid, 'name:', name);

    const db = getDb();

    // Generate API key using utility functions
    const plainKey = generateApiKey();
    const hashedKey = hashApiKey(plainKey);
    
    const keyData = {
      hashedKey,
      ownerId: user.uid,
      ownerEmail: user.email,
      name,
      isActive: true,
      plan,
      usageCount: 0,
      usageLimit: PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS].requestsPerMonth,
      createdAt: getFirebaseAdmin().firestore.FieldValue.serverTimestamp(),
      lastUsedAt: null,
      expiresAt: null,
    };

    // Create document using Admin SDK
    const keyRef = await db.collection('api_keys').add(keyData);
    const keyId = keyRef.id;

    console.log('POST /api/keys - Key created:', keyId);

    return NextResponse.json({
      plainKey, // Return plain key ONCE
      keyData: {
        id: keyId,
        name,
        key: plainKey, // Include in response for immediate display
        maskedKey: `pd_live_${'•'.repeat(32)}`,
        plan,
        usageCount: 0,
        usageLimit: PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS].requestsPerMonth,
        createdAt: new Date(),
        isActive: true,
      },
    });
  } catch (error: any) {
    console.error('POST /api/keys error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create API key' },
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

    const db = getDb();

    // Get the key document
    const keyDoc = await db.collection('api_keys').doc(keyId).get();

    if (!keyDoc.exists) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    const keyData = keyDoc.data();

    // Verify the key belongs to the user
    if (keyData?.ownerId !== user.uid) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Delete the key using Admin SDK (permanent deletion)
    await db.collection('api_keys').doc(keyId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/keys error:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
