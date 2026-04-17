import { NextResponse } from 'next/server';

/**
 * This endpoint has been deprecated. Use /api/ai/grade-essay instead.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Este endpoint foi descontinuado. Use /api/ai/grade-essay.' },
    { status: 410 },
  );
}
