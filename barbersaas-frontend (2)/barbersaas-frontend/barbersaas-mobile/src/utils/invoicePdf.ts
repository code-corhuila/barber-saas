import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { InvoiceDetailResponse } from '../types/invoice';
import { formatCurrency } from './dates';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildInvoiceHtml(detail: InvoiceDetailResponse): string {
  const productRows = detail.products
    .map(
      (p) => `
        <tr>
          <td>${escapeHtml(p.productName)} <span class="muted">x${p.quantity}</span></td>
          <td class="amount">${formatCurrency(p.subtotal)}</td>
        </tr>`
    )
    .join('');

  const discountRow =
    detail.promotionId && detail.discountAmount > 0
      ? `
        <tr class="discount">
          <td>Promocion: ${escapeHtml(detail.promotionTitle ?? '')}</td>
          <td class="amount">-${formatCurrency(detail.discountAmount)}</td>
        </tr>`
      : '';

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1a1a1a; padding: 32px; }
          .header { text-align: center; margin-bottom: 24px; }
          .header h1 { margin: 0; font-size: 22px; color: #B8860B; }
          .header p { margin: 4px 0 0; color: #666; font-size: 13px; }
          .meta { margin-bottom: 20px; font-size: 13px; color: #444; }
          .meta div { margin-bottom: 3px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          td { padding: 8px 4px; border-bottom: 1px solid #e5e5e5; font-size: 14px; }
          td.amount { text-align: right; font-weight: 600; white-space: nowrap; }
          .muted { color: #888; font-size: 12px; }
          .discount td { color: #2e7d32; }
          .total-row td { border-bottom: none; border-top: 2px solid #1a1a1a; font-size: 17px; font-weight: 700; padding-top: 14px; }
          .footer { margin-top: 30px; text-align: center; color: #999; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${escapeHtml(detail.barbershopName)}</h1>
          <p>Factura de servicio #${detail.appointmentId}</p>
        </div>

        <div class="meta">
          <div><strong>Fecha:</strong> ${detail.appointmentDate} - ${detail.startTime.slice(0, 5)}</div>
          <div><strong>Barbero:</strong> ${escapeHtml(detail.barberName)}</div>
          <div><strong>Cliente:</strong> ${escapeHtml(detail.clientName)}</div>
        </div>

        <table>
          <tr>
            <td>${escapeHtml(detail.serviceName)} <span class="muted">(servicio)</span></td>
            <td class="amount">${formatCurrency(detail.servicePrice)}</td>
          </tr>
          ${productRows}
          ${discountRow}
          <tr class="total-row">
            <td>Total</td>
            <td class="amount">${formatCurrency(detail.total)}</td>
          </tr>
        </table>

        <div class="footer">Generado desde BarberSaaS</div>
      </body>
    </html>
  `;
}

/**
 * Web: expo-print abre el dialogo de impresion del navegador, donde el
 * usuario elige "Guardar como PDF" -- no requiere backend ni libreria de
 * generacion de PDF aparte.
 * Nativo (Android/iOS): genera el PDF a un archivo y abre el selector de
 * "Compartir/Guardar" del sistema.
 */
export async function downloadInvoicePdf(detail: InvoiceDetailResponse): Promise<void> {
  const html = buildInvoiceHtml(detail);

  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}
