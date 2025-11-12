import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const generateEmailHTML = (
  status: string,
  payment: {
    paymentId: string;
    paymentAmount: number;
    description: string;
    paymentMethod?: string | null;
    clientName?: string | null;
    createdAt: string;
    updatedAt: string;
  }
): string => {
  const isApproved = status === "approved";
  const primaryColor = isApproved ? "#10b981" : "#ef4444";
  const bgColor = isApproved ? "#ecfdf5" : "#fef2f2";
  const iconBg = isApproved ? "#d1fae5" : "#fee2e2";
  const icon = isApproved
    ? "✓"
    : "⚠";
  const title = isApproved ? "¡Pago Aprobado!" : "Pago Rechazado";
  const message = isApproved
    ? "Tu pago ha sido procesado exitosamente. Gracias por tu compra."
    : "Lo sentimos, tu pago no pudo ser procesado. Por favor, verifica los datos e intenta nuevamente.";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${primaryColor} 0%, ${isApproved ? "#059669" : "#dc2626"} 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: ${iconBg}; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                <span style="font-size: 48px; color: ${primaryColor}; font-weight: bold;">${icon}</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">${title}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${payment.clientName ? `Hola <strong>${payment.clientName}</strong>,` : "Hola,"}<br><br>
                ${message}
              </p>

              <!-- Payment Details Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${bgColor}; border-radius: 8px; padding: 24px; margin-bottom: 30px; border-left: 4px solid ${primaryColor};">
                <tr>
                  <td>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <span style="color: #6b7280; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Descripción</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <span style="color: #111827; font-size: 18px; font-weight: 600;">${payment.description}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <span style="color: #6b7280; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Monto</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <span style="color: ${primaryColor}; font-size: 32px; font-weight: 700;">${formatCurrency(payment.paymentAmount)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; border-top: 1px solid ${isApproved ? "#a7f3d0" : "#fecaca"}; padding-top: 20px;">
                          <span style="color: #6b7280; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">ID de Transacción</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <span style="color: #111827; font-size: 14px; font-weight: 600; font-family: 'Courier New', monospace; background-color: #ffffff; padding: 8px 12px; border-radius: 4px; display: inline-block;">${payment.paymentId}</span>
                        </td>
                      </tr>
                      ${payment.paymentMethod ? `
                      <tr>
                        <td style="padding-bottom: 12px; padding-top: 12px;">
                          <span style="color: #6b7280; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Método de Pago</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="color: #111827; font-size: 14px; font-weight: 600; text-transform: capitalize;">${payment.paymentMethod}</span>
                        </td>
                      </tr>
                      ` : ""}
                      <tr>
                        <td style="padding-top: 20px; border-top: 1px solid ${isApproved ? "#a7f3d0" : "#fecaca"};">
                          <span style="color: #6b7280; font-size: 12px;">Fecha: ${formatDate(payment.updatedAt)}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${isApproved ? `
              <!-- Success Message -->
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 30px;">
                <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.6;">
                  <strong>✓ Confirmación recibida</strong><br>
                  Tu compra ha sido registrada exitosamente. Recibirás más detalles por correo electrónico.
                </p>
              </div>
              ` : `
              <!-- Error Message -->
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 30px;">
                <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                  <strong>⚠ Acción requerida</strong><br>
                  Por favor, verifica los datos de tu tarjeta e intenta nuevamente. Si el problema persiste, contacta con tu banco.
                </p>
              </div>
              `}

              ${isApproved && payment.paymentId ? `
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-top: 20px;">
                    <a href="https://mercadopago.com/ayuda" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: background-color 0.3s;">
                      Ver Detalles del Pago
                    </a>
                  </td>
                </tr>
              </table>
              ` : ""}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Si tienes alguna pregunta, no dudes en contactarnos.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Este es un email automático, por favor no respondas a este mensaje.<br>
                © ${new Date().getFullYear()} MercadoPago. Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const sendEmail = async (
  clientEmail: string,
  subject: string,
  status: string,
  payment?: {
    paymentId: string;
    paymentAmount: number;
    description: string;
    paymentMethod?: string | null;
    clientName?: string | null;
    createdAt: string;
    updatedAt: string;
  }
) => {
  console.log("Enviando email a: ", clientEmail);
  
  const htmlContent = payment
    ? generateEmailHTML(status, payment)
    : `<p>El pago ha sido ${status === "approved" ? "aprobado" : "rechazado"}</p>`;

  const response = await resend.emails.send({
    from: "mercadopagonotificaciones@lemonpad.app",
    to: clientEmail,
    subject: `MercadoPago - ${subject}`,
    html: htmlContent,
  });
  
  if (response.error) {
    console.error("Error al enviar email: ", response.error);
    return null;
  }
  console.log("Email enviado a: ", clientEmail);
  return response;
};

export { sendEmail, resend };
