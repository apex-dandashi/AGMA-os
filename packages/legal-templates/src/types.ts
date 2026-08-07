export interface QuoteItem {
  /** Service/product name (Arabic). */
  title: string;
  /** One-line description, «·»-separated features as in references. */
  description?: string;
  amount: number;
  /** Original price before discount — renders the orange strikethrough line. */
  originalAmount?: number;
  /** e.g. «خصم خاص 50%» */
  discountLabel?: string;
  /** Excluded from percentage discounts (like domain/hosting in ref 00054). */
  noDiscount?: boolean;
}

export interface QuoteOption {
  label: string;
  amount: number;
  recommended?: boolean;
}

export interface PaymentAccountInfo {
  iban: string;
  bankName: string;
  beneficiaryName: string;
}

export interface QuotePayload {
  /** Q-00055 style — null while draft. */
  number: string | null;
  issueDateAr: string;
  city: string;
  recipientName: string;
  recipientCompany?: string;
  projectName: string;
  projectExtra?: { label: string; value: string };
  intro?: string;
  items: QuoteItem[];
  /** Named discounts (docs/06 §3.3), e.g. «خصم مصطفى 50%». */
  discounts: { label: string; amount: number }[];
  /** Up to 2 priced scenarios (docs/06 §3.4). */
  options: QuoteOption[];
  /** VAT-off mode renders the reserved row with «—» (rule 4). */
  vatEnabled: boolean;
  vatAmount?: number;
  paymentAccount: PaymentAccountInfo;
  /** Terms clauses for the final page. */
  clauses: { title: string; body: string }[];
  totalPages?: number;
}

export interface ContractParty {
  name: string;
  descriptor?: string;
}

export interface ContractPayload {
  docTitleAr: string;
  number: string | null;
  issueDateAr: string;
  city: string;
  firstParty: ContractParty;
  secondParty: ContractParty;
  preamble?: string;
  clauses: { title: string; body: string }[];
}

export interface QuoteTotals {
  gross: number;
  discountTotal: number;
  afterDiscount: number;
  noDiscountTotal: number;
  net: number;
}
