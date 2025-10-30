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
    message: "Bienvenido a la API de MercadoPago",
  });
}

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);

  const { productName, productPrice, firstname, lastname, email, notificationUrl } = body as { productName: string, productPrice: number, firstname: string, lastname: string, email: string, notificationUrl: string };
  //Guardar en base de datos
  console.log({ productName, productPrice, firstname, lastname, email, notificationUrl })

  const paymentRoute = 'http://localhost:3000/mercadopago/payment/' + generateHash();

  return NextResponse.json({
    message: "POST recibido",
    paymentRoute
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


const generateHash = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}