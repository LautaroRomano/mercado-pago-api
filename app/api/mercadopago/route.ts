import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/app/lib/resend";

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
    backUrl,
  } = body as {
    description: string;
    paymentAmount: number;
    notificationUrl: string;
    apiKey: string;
    clientEmail: string;
    clientName: string;
    backUrl: string;
  };
  //Guardar en base de datos
  console.log({
    description,
    paymentAmount,
    notificationUrl,
    apiKey,
    clientEmail,
    clientName,
    backUrl,
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
      clientEmail: clientEmail,
      clientName: null,
      backUrl: backUrl,
    },
  });

  // const paymentRoute = "http://localhost:3000/mercadopago/payment/" + paymentId;
  const paymentRoute = "https://mercado-pago-api-sigma.vercel.app/mercadopago/payment/" + paymentId;

  return NextResponse.json({
    message: "POST recibido",
    paymentRoute,
  });
}

export async function PUT(request: NextRequest) {
  const body = await readJsonBody(request);

  const { paymentId, cardNumber, cardExpirationDate, cardCvv, cardHolderName } =
    body as {
      paymentId: string;
      cardNumber: string;
      cardExpirationDate: string;
      cardCvv: string;
      cardHolderName: string;
    };

  console.log("cardNumber: ", cardNumber);
  console.log("cardExpirationDate: ", cardExpirationDate);
  console.log("cardCvv: ", cardCvv);
  console.log("cardHolderName: ", cardHolderName);
  console.log("paymentId: ", paymentId);

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

  const resValidateCard = await validateCard(
    card,
    cardCvv,
    cardExpirationDate,
    payment.notificationUrl,
    payment
  );

  if (resValidateCard && resValidateCard.error) {
    return NextResponse.json(resValidateCard, { status: 400 });
  }

  const updatedPayment = await prisma.payment.update({
    where: {
      paymentId: paymentId,
    },
    data: {
      paymentStatus: "approved",
      paymentMethod: card.cardType,
      clientName: cardHolderName,
    },
  });

  if (updatedPayment.clientEmail) {
    await sendEmail(
      updatedPayment.clientEmail,
      "Pago aprobado",
      "approved",
      {
        paymentId: updatedPayment.paymentId,
        paymentAmount: updatedPayment.paymentAmount,
        description: updatedPayment.description,
        paymentMethod: updatedPayment.paymentMethod,
        clientName: updatedPayment.clientName,
        createdAt: updatedPayment.createdAt.toISOString(),
        updatedAt: updatedPayment.updatedAt.toISOString(),
      }
    );
  }

  await notifyPayment(
    updatedPayment.notificationUrl,
    "approved",
    "Pago aprobado",
    updatedPayment
  );

  return NextResponse.json({
    message: "Pago aprobado",
    payment: updatedPayment,
    backUrl: updatedPayment.backUrl,
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
  notificationUrl: string,
  payment: any
) {
  if (!card) {
    await notifyPayment(
      notificationUrl,
      "failed",
      "Tarjeta no encontrada",
      payment
    );
    return { error: "Tarjeta no encontrada" };
  }

  if (card.cardCvv !== cardCvv) {
    await notifyPayment(notificationUrl, "failed", "CVV no válido", payment);
    return { error: "CVV no válido" };
  }

  console.log("Fecha de expiración card: ", card.cardExpirationDate);
  console.log("Fecha de expiración enviada: ", cardExpirationDate);
  if (card.cardExpirationDate !== cardExpirationDate) {
    await notifyPayment(
      notificationUrl,
      "failed",
      "Fecha de expiración no válida",
      payment
    );
    return {
      error: "Fecha de expiración no válida",
      paymentId: payment.paymentId,
    };
  }

  return { success: true, paymentId: payment.paymentId };
}

async function notifyPayment(
  notificationUrl: string,
  status: string,
  message: string,
  payment: any
) {
  try {
    console.log("notificationUrl: ", notificationUrl);
    console.log("status: ", status);
    console.log("message: ", message);

    // Corregir typo común "locahost" -> "localhost"
    const correctedUrl = notificationUrl.replace(/locahost/g, "localhost");

    // Preparar datos completos del pago para la notificación
    const notificationData = {
      status: status,
      message: message,
      payment: {
        paymentId: payment.paymentId,
        paymentStatus: payment.paymentStatus,
        paymentAmount: payment.paymentAmount,
        paymentMethod: payment.paymentMethod,
        description: payment.description,
        clientEmail: payment.clientEmail,
        clientName: payment.clientName,
        backUrl: payment.backUrl,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(correctedUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notificationData),
    });

    if (!response.ok) {
      console.error(
        `Error al notificar: ${response.status} ${response.statusText}`
      );
      return null;
    }

    await prisma.payment.update({
      where: {
        paymentId: payment.paymentId,
      },
      data: {
        notificationRecived: true,
      },
    });

    return await response.json();
  } catch (error) {
    console.error("Error al enviar notificación:", error);
    return null;
  }
}
