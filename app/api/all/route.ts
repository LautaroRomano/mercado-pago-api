import { NextRequest, NextResponse } from "next/server";

async function readJsonBody(request: NextRequest): Promise<unknown | null> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function baseInfo(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    query[key] = value;
  }
  return {
    method: request.method,
    path: new URL(request.url).pathname,
    query,
  };
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    ...baseInfo(request),
    message: "GET recibido",
  });
}

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  return NextResponse.json({
    ...baseInfo(request),
    message: "POST recibido",
    body,
  });
}

export async function PUT(request: NextRequest) {
  const body = await readJsonBody(request);
  return NextResponse.json({
    ...baseInfo(request),
    message: "PUT recibido",
    body,
  });
}

export async function DELETE(request: NextRequest) {
  const body = await readJsonBody(request);
  return NextResponse.json({
    ...baseInfo(request),
    message: "DELETE recibido",
    body,
  });
}

export async function PATCH(request: NextRequest) {
  const body = await readJsonBody(request);
  return NextResponse.json({
    ...baseInfo(request),
    message: "PATCH recibido",
    body,
  });
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "GET,POST,PUT,DELETE,PATCH,OPTIONS,HEAD",
    },
  });
}

export function HEAD() {
  return new Response(null, { status: 200 });
}


