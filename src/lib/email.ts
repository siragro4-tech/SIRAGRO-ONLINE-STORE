import { Resend } from "resend";

export type OrderEmailDetails = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  fulfilmentType: "delivery" | "collection";
  deliveryAddress?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  hasAgeRestrictedItems: boolean;
};

/**
 * Sends a transactional order confirmation email to the customer.
 */
export async function sendOrderConfirmationEmail(details: OrderEmailDetails) {
  const apiKey = process.env.RESEND_API_KEY;

  const itemsHtml = details.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">£${item.unitPrice.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">£${item.lineTotal.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation - SIRAGRO</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #16a34a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">SIRAGRO Supermarket</h1>
          <p style="color: #dcfce7; margin: 5px 0 0 0; font-size: 14px;">Thank you for your order!</p>
        </div>

        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <p>Hi <strong>${details.customerName}</strong>,</p>
          <p>We've received your order and payment. Our shop team is now preparing your items!</p>

          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>Order Reference:</strong> <span style="font-family: monospace; font-size: 16px; color: #15803d;">${details.orderNumber}</span></p>
            <p style="margin: 6px 0 0 0; font-size: 14px;"><strong>Fulfilment:</strong> ${details.fulfilmentType === "delivery" ? "Home Delivery" : "In-Store Collection"}</p>
            ${
              details.deliveryAddress
                ? `<p style="margin: 6px 0 0 0; font-size: 14px;"><strong>Delivery Address:</strong> ${details.deliveryAddress}</p>`
                : `<p style="margin: 6px 0 0 0; font-size: 14px;"><strong>Collection Point:</strong> SIRAGRO Store near UB3 4NS (Hayes, Middlesex)</p>`
            }
          </div>

          ${
            details.hasAgeRestrictedItems
              ? `<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px; margin: 16px 0; color: #991b1b; font-size: 13px;">
                  <strong>🔞 Challenge 25 Notice:</strong> Your order contains age-restricted items. Please ensure the recipient has valid photographic ID (Passport, Driving Licence, or PASS card) ready for inspection.
                </div>`
              : ""
          }

          <h3 style="font-size: 16px; border-bottom: 2px solid #16a34a; padding-bottom: 6px; margin-top: 24px;">Your Items</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 8px; text-align: left;">Item</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Price</th>
                <th style="padding: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 14px; text-align: right;">
            <p style="margin: 4px 0;">Subtotal: <strong>£${details.subtotal.toFixed(2)}</strong></p>
            <p style="margin: 4px 0;">Fulfilment Fee: <strong>${details.deliveryCharge === 0 ? "FREE" : `£${details.deliveryCharge.toFixed(2)}`}</strong></p>
            <p style="margin: 8px 0 0 0; font-size: 18px; color: #16a34a;"><strong>Total Paid: £${details.total.toFixed(2)}</strong></p>
          </div>

          <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
            <p>SIRAGRO Supermarket • Serving UB3 and surrounding areas</p>
            <p>If you have any questions about this order, please reply directly to this email or visit our store.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  if (!apiKey || apiKey === "re_your-resend-api-key") {
    // Development / unconfigured fallback: log email to console
    console.log(
      `[DEV EMAIL SIMULATION] Confirmation email for order ${details.orderNumber} to ${details.customerEmail}: Total £${details.total.toFixed(2)}`
    );
    return { success: true, simulated: true };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: "SIRAGRO Orders <orders@siragro.co.uk>",
      to: [details.customerEmail],
      subject: `Order Confirmation #${details.orderNumber} — SIRAGRO`,
      html: emailHtml,
    });

    if (error) {
      console.error("[Resend Error]:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error("[Email Exception]:", err);
    return { success: false, error: err };
  }
}

export type StatusUpdateEmailDetails = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  fulfilmentType: "delivery" | "collection";
  newStatus: string;
  deliveryAddress?: string | null;
  adminNotes?: string | null;
};

const STATUS_TITLES: Record<string, { subject: string; heading: string; message: string; badgeColor: string }> = {
  processing: {
    subject: "Order In Progress",
    heading: "Your Order is Being Prepared",
    message: "Our supermarket team is currently picking and packing your items with care.",
    badgeColor: "#0284c7",
  },
  ready_for_pickup: {
    subject: "Ready for Collection",
    heading: "Your Order is Ready for Pickup!",
    message: "Your grocery order is packed and ready for collection at our store counter: 147 North Hyde Road, Hayes, Middlesex UB3 4NS.",
    badgeColor: "#16a34a",
  },
  out_for_delivery: {
    subject: "Out for Delivery",
    heading: "Your Order is on the Way!",
    message: "Our local delivery driver has your order and is currently heading to your delivery address.",
    badgeColor: "#0284c7",
  },
  delivered: {
    subject: "Order Delivered",
    heading: "Your Order Has Been Delivered",
    message: "Your order has been safely delivered to your address. Thank you for choosing SIRAGRO!",
    badgeColor: "#16a34a",
  },
  collected: {
    subject: "Order Collected",
    heading: "Order Collected — Thank You!",
    message: "Your order has been handed over at our store counter. We appreciate your custom!",
    badgeColor: "#16a34a",
  },
  cancelled: {
    subject: "Order Update: Cancelled",
    heading: "Order Cancellation Notice",
    message: "Your order has been marked as cancelled. If you did not request this or have any queries, please get in touch with our team directly.",
    badgeColor: "#dc2626",
  },
};

/**
 * Sends a transactional order status update email to the customer.
 */
export async function sendStatusUpdateEmail(details: StatusUpdateEmailDetails): Promise<{
  success: boolean;
  simulated?: boolean;
  error?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  const statusConfig = STATUS_TITLES[details.newStatus] || {
    subject: `Order Status Update: ${details.newStatus}`,
    heading: `Order Status Update: ${details.newStatus}`,
    message: `Your order status has been updated to "${details.newStatus}".`,
    badgeColor: "#323c4b",
  };

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${statusConfig.subject} - SIRAGRO</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #323C4B; padding: 22px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">SIRAGRO SUPERMARKET</h1>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;">147 North Hyde Road, Hayes, UB3 4NS • 020 8813 6458</p>
        </div>

        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 15px;">Hi <strong>${details.customerName}</strong>,</p>
          <div style="background-color: #f8fafc; border-left: 4px solid ${statusConfig.badgeColor}; padding: 14px 18px; margin: 18px 0; border-radius: 0 6px 6px 0;">
            <h2 style="margin: 0 0 6px 0; font-size: 18px; color: #0f172a;">${statusConfig.heading}</h2>
            <p style="margin: 0; color: #334155; font-size: 14px;">${statusConfig.message}</p>
          </div>

          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px; margin: 20px 0; font-size: 13px;">
            <p style="margin: 0;"><strong>Order Reference:</strong> <span style="font-family: monospace; font-size: 14px; font-weight: bold; color: #323C4B;">${details.orderNumber}</span></p>
            <p style="margin: 6px 0 0 0;"><strong>Fulfilment Type:</strong> ${details.fulfilmentType === "delivery" ? "Home Delivery" : "In-Store Collection"}</p>
            ${
              details.fulfilmentType === "delivery" && details.deliveryAddress
                ? `<p style="margin: 6px 0 0 0;"><strong>Delivery Address:</strong> ${details.deliveryAddress}</p>`
                : ""
            }
            ${
              details.fulfilmentType === "collection"
                ? `<p style="margin: 6px 0 0 0;"><strong>Collection Desk:</strong> 147 North Hyde Road, Hayes, Middlesex UB3 4NS (Daily 7am – 10pm)</p>`
                : ""
            }
            ${
              details.adminNotes
                ? `<p style="margin: 10px 0 0 0; padding-top: 8px; border-top: 1px dashed #cbd5e1; color: #475569;"><strong>Store Note:</strong> ${details.adminNotes}</p>`
                : ""
            }
          </div>

          <div style="margin-top: 26px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
            <p style="margin: 2px 0;">SIRAGRO Supermarket &amp; Off-Licence</p>
            <p style="margin: 2px 0;">Need help? Call <a href="tel:02088136458" style="color: #323C4B; text-decoration: underline;">020 8813 6458</a> or <a href="tel:02088484840" style="color: #323C4B; text-decoration: underline;">0208 848 4840</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  if (!apiKey || apiKey === "re_your-resend-api-key") {
    console.log(
      `[DEV EMAIL SIMULATION] Status update email for order ${details.orderNumber} (${details.newStatus}) to ${details.customerEmail}`
    );
    return { success: true, simulated: true };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "SIRAGRO Orders <orders@siragro.co.uk>",
      to: [details.customerEmail],
      subject: `${statusConfig.subject} — Order #${details.orderNumber} (SIRAGRO)`,
      html: emailHtml,
    });

    if (error) {
      console.error("[Resend Status Email Error]:", error);
      return { success: false, error: typeof error === "object" && "message" in error ? String(error.message) : "Failed to send email via Resend" };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Email exception occurred";
    console.error("[Email Exception in sendStatusUpdateEmail]:", message);
    return { success: false, error: message };
  }
}

