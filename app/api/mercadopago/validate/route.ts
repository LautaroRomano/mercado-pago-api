import { prisma } from "@/app/lib/prisma";
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

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);

  const {
    cardNumber,
    cardExpirationDate,
    cardCvv,
  } = body as {
    cardNumber: string;
    cardExpirationDate: string;
    cardCvv: string;
  };

  // Validar que todos los campos estén presentes
  if (!cardNumber || !cardExpirationDate || !cardCvv) {
    return NextResponse.json(
      { error: "Todos los campos son requeridos", errorCode: "MISSING_FIELDS" },
      { status: 400 }
    );
  }

  const card = await prisma.card.findUnique({
    where: {
      cardNumber: cardNumber.trim().replace(/\s/g, ""),
    },
  });

  if (!card) {
    return NextResponse.json(
      { error: "Tarjeta no encontrada", errorCode: "CARD_NOT_FOUND" },
      { status: 404 }
    );
  }

  if (card.cardCvv !== cardCvv) {
    return NextResponse.json(
      { error: "CVV no válido", errorCode: "INVALID_CVV" },
      { status: 400 }
    );
  }

  console.log("Fecha de expiración card: ", card.cardExpirationDate);
  console.log("Fecha de expiración enviada: ", cardExpirationDate);
  if (card.cardExpirationDate !== cardExpirationDate) {
    return NextResponse.json(
      { error: "Fecha de expiración no válida", errorCode: "INVALID_EXPIRATION" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Tarjeta válida",
  });
}

