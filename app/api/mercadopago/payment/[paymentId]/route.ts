import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;

    console.log("paymentId: ", paymentId);

    const payment = await prisma.payment.findUnique({
      where: {
        paymentId: paymentId,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Pago no encontrado", errorCode: 404 },
        { status: 404 }
      );
    }

    return NextResponse.json({ payment, errorCode: 200 });
  } catch (error) {
    console.error("Error al buscar el pago:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

