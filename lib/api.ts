// ─── Standard API response envelope ──────────────────────────────────────────
// Usage in route handlers:
//   return NextResponse.json(ok(data));
//   return NextResponse.json(err('Unauthorized'), { status: 401 });

export type ApiResponse<T = null> =
  | { success: true;  data: T;      error?: never }
  | { success: false; data?: never; error: string  };

export function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function err(error: string): ApiResponse<never> {
  return { success: false, error };
}
