export interface CreateInvoiceInput {
  userId: string;
  planId: string;
  amount: number;
}

export interface PaymentProvider {
  name: string;
  method: "MANUAL_TRANSFER" | "AUTOMATIC_GATEWAY";
  createInvoice(input: CreateInvoiceInput): Promise<{ invoiceId: string; paymentUrl?: string }>;
  verifyPayment(invoiceId: string, proofData?: string): Promise<boolean>;
  getPaymentInstructions(): string;
}
