export interface PaymentProvider {
  name: string;
  createInvoice(userId: string, planId: string, amount: number): Promise<any>;
  verifyPayment(invoiceId: string, proofData?: any): Promise<boolean>;
  getPaymentInstructions(): string;
}
