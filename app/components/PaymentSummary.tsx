"use client";

import "./PaymentSummary.css";

interface PaymentSummaryProps {
  payment: {
    description: string;
    paymentAmount: number;
    clientEmail?: string | null;
    clientName?: string | null;
    paymentStatus: string;
  } | null;
  loading: boolean;
}

export default function PaymentSummary({ payment, loading }: PaymentSummaryProps) {
  if (loading || !payment) {
    return (
      <div className="payment-summary">
        <div className="payment-summary__container">
          <div className="payment-summary__loading">
            {loading ? "Cargando..." : "No se encontró información del pago"}
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  return (
    <div className="payment-summary">
      <div className="payment-summary__container">
        <h2 className="payment-summary__title">Resumen del pago</h2>
        
        <div className="payment-summary__section">
          <h3 className="payment-summary__section-title">Producto</h3>
          <p className="payment-summary__description">{payment.description}</p>
        </div>

        {payment.clientName && (
          <div className="payment-summary__section">
            <h3 className="payment-summary__section-title">Cliente</h3>
            <p className="payment-summary__client-name">{payment.clientName}</p>
            {payment.clientEmail && (
              <p className="payment-summary__client-email">{payment.clientEmail}</p>
            )}
          </div>
        )}

        <div className="payment-summary__divider"></div>

        <div className="payment-summary__total">
          <div className="payment-summary__total-label">Total a pagar</div>
          <div className="payment-summary__total-amount">
            {formatCurrency(payment.paymentAmount)}
          </div>
        </div>

        <div className="payment-summary__status">
          <span className={`payment-summary__status-badge payment-summary__status-badge--${payment.paymentStatus}`}>
            {payment.paymentStatus === "pending" ? "Pendiente" : payment.paymentStatus}
          </span>
        </div>
      </div>
    </div>
  );
}

