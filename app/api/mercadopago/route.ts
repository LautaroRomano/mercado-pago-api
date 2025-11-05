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
  console.log("process.env.PRIVATE_API_KEY", process.env.PRIVATE_API_KEY);
  console.log("process.env.DATABASE_URL", process.env.DATABASE_URL);

  return NextResponse.json({
    message: "Bienvenido a la API de MercadoPago",
  });
}

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);

  const {
    description,
    paymentAmount,
    notificationUrl,
    apiKey,
    clientEmail,
    clientName,
  } = body as {
    description: string;
    paymentAmount: number;
    notificationUrl: string;
    apiKey: string;
    clientEmail: string;
    clientName: string;
  };
  //Guardar en base de datos
  console.log({
    description,
    paymentAmount,
    notificationUrl,
    apiKey,
    clientEmail,
    clientName,
  });

  const paymentId = generateHash();

  await prisma.payment.create({
    data: {
      paymentId,
      paymentStatus: "pending",
      paymentAmount,
      paymentMethod: null,
      notificationUrl: notificationUrl,
      description,
      clientEmail: null,
      clientName: null,
    },
  });

  const paymentRoute = "http://localhost:3000/mercadopago/payment/" + paymentId;

  return NextResponse.json({
    message: "POST recibido",
    paymentRoute,
  });
}

export async function PUT(request: NextRequest) {
  const body = await readJsonBody(request);

  const {
    paymentId,
    clientEmail,
    cardNumber,
    cardExpirationDate,
    cardCvv,
    cardHolderName,
  } = body as {
    paymentId: string;
    clientEmail: string;
    cardNumber: string;
    cardExpirationDate: string;
    cardCvv: string;
    cardHolderName: string;
  };

  const card = await prisma.card.findUnique({
    where: {
      cardNumber: cardNumber.trim().replace(/\s/g, ""),
    },
  });

  if (!card) {
    return NextResponse.json(
      { error: "Tarjeta no encontrada" },
      { status: 404 }
    );
  }

  const payment = await prisma.payment.findUnique({
    where: {
      paymentId: paymentId,
    },
  });

  if (!payment) {
    return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  }

  await validateCard(
    card,
    cardCvv,
    cardExpirationDate,
    payment.notificationUrl
  );

  await prisma.payment.update({
    where: {
      paymentId: paymentId,
    },
    data: {
      paymentStatus: "approved",
      paymentMethod: card.cardType,
      clientEmail: clientEmail,
      clientName: cardHolderName,
    },
  });

  console.log("Pago en base de datos: ", payment);

  await notifyPayment(payment.notificationUrl, "approved", "Pago aprobado");

  return NextResponse.json({
    message: "PUT recibido",
    payment,
  });
}

const generateHash = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

async function validateCard(
  card: any,
  cardCvv: string,
  cardExpirationDate: string,
  notificationUrl: string
) {
  if (!card) {
    await notifyPayment(notificationUrl, "failed", "Tarjeta no encontrada");
    return { error: "Tarjeta no encontrada" };
  }

  if (card.cardCvv !== cardCvv) {
    await notifyPayment(notificationUrl, "failed", "CVV no válido");
    return { error: "CVV no válido" };
  }

  if (card.cardExpirationDate !== cardExpirationDate) {
    await notifyPayment(
      notificationUrl,
      "failed",
      "Fecha de expiración no válida"
    );
    return { error: "Fecha de expiración no válida" };
  }
}

async function notifyPayment(
  notificationUrl: string,
  status: string,
  message: string
) {
  try {
    console.log("notificationUrl: ", notificationUrl);
    console.log("status: ", status);
    console.log("message: ", message);

    // Corregir typo común "locahost" -> "localhost"
    const correctedUrl = notificationUrl.replace(/locahost/g, "localhost");

    const response = await fetch(correctedUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: status, message: message }),
    });

    if (!response.ok) {
      console.error(
        `Error al notificar: ${response.status} ${response.statusText}`
      );
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error al enviar notificación:", error);
    return null;
  }
}
