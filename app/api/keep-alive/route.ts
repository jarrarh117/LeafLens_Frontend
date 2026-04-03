import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/**
 * Keep-alive endpoint to prevent Hugging Face Space from sleeping
 * Call this endpoint every 10-15 minutes to keep the backend awake
 */
export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        status: 'success',
        message: 'Backend is awake',
        backend: data,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        status: 'error',
        message: 'Backend returned error',
        statusCode: response.status,
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }
  } catch (error: any) {
    console.error('Keep-alive ping failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to reach backend',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
