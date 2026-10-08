/** Implementations are intentionally omitted until an external API contract is approved. */
export interface ExternalSystemAdapter<TInput = unknown, TOutput = unknown> {
  readonly system: string;
  push(entityType: string, payload: TInput): Promise<TOutput>;
  pull(entityType: string, externalId: string): Promise<TOutput | null>;
}

export interface PaymentProviderAdapter<TRequest = unknown, TResponse = unknown> {
  readonly provider: string;
  createPayment(request: TRequest): Promise<TResponse>;
  verifyWebhook(headers: Record<string, string | undefined>, body: unknown): Promise<boolean>;
  refund(providerPaymentId: string, amount: string): Promise<TResponse>;
}

export interface DeliveryProviderAdapter<TRequest = unknown, TResponse = unknown> {
  readonly provider: string;
  createShipment(request: TRequest): Promise<TResponse>;
  track(trackingNumber: string): Promise<TResponse>;
}
