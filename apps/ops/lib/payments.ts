/**
 * Payment provider adapter (docs/11 §ب-6): Core finance never knows PSP
 * details. Today: manual bank transfer with a unique reference. Tomorrow:
 * a licensed PSP (mada / Apple Pay hosted checkout) implements the same
 * interface — اختيار المزود قرار شركاء.
 *
 * Hard rule (docs/11): card data NEVER touches AGMA systems — hosted
 * checkout only, no PAN/CVV storage, ever.
 */
import { COMPANY } from '@agma/legal-templates';

export interface CheckoutRequest {
  invoiceNumber: string;
  amount: number;
  bank: { iban: string; bankName: string; beneficiaryName: string };
}

export interface CheckoutSession {
  provider: string;
  reference: string;
  /** Hosted checkout URL when a PSP is connected; null for manual transfer. */
  checkoutUrl: string | null;
  /** Ready-to-send Arabic payment instructions (WhatsApp/email). */
  instructions: string;
}

export interface PaymentProvider {
  readonly name: string;
  createCheckout(req: CheckoutRequest, reference: string): CheckoutSession;
}

/** Bank transfer with a unique reference — works today, no PSP contract. */
export const manualTransferProvider: PaymentProvider = {
  name: 'manual_transfer',
  createCheckout(req, reference) {
    const instructions = [
      `سداد الفاتورة ${req.invoiceNumber} — ${COMPANY.brandAr}`,
      `المبلغ: SAR ${req.amount.toLocaleString('en-US')}`,
      `التحويل إلى: ${req.bank.beneficiaryName}`,
      `${req.bank.bankName} — آيبان: ${req.bank.iban}`,
      `مرجع السداد (يُكتب في خانة الغرض): ${reference}`,
      '',
      `بعد التحويل نرجو تزويدنا بالإيصال. ${COMPANY.closingLine}.`,
    ].join('\n');
    return { provider: this.name, reference, checkoutUrl: null, instructions };
  },
};

/** The active provider — swapped once the PSP partner decision lands. */
export const paymentProvider: PaymentProvider = manualTransferProvider;

export const newPaymentReference = () =>
  `AGMA-PAY-${Date.now().toString(36).toUpperCase()}`;
