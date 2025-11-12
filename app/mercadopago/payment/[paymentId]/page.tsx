import PaymentForm from "@/app/components/PaymentForm"
import PaymentSummary from "@/app/components/PaymentSummary"
import { prisma } from "@/app/lib/prisma"
import "./page.css"

export default async function Page({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params
  
  // Obtener los datos del pago en el servidor
  let payment = null;
  try {
    payment = await prisma.payment.findUnique({
      where: {
        paymentId: paymentId,
      },
    });
  } catch (error) {
    console.error("Error al obtener el pago:", error);
  }

  return (
    <div className="payment-page">
      <div className="payment-page__container">
        <div className="payment-page__form">
          <PaymentForm paymentId={paymentId} />
        </div>
        <div className="payment-page__summary">
          <PaymentSummary payment={payment} loading={payment === null} />
        </div>
      </div>
    </div>
  )
}