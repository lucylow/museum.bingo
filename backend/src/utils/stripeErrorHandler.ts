export function handleStripeError(error: unknown): { statusCode: number; message: string } {
  const candidate = error as { type?: string };

  switch (candidate.type) {
    case 'StripeCardError':
      return { statusCode: 400, message: 'Your card was declined. Please use a different card.' };
    case 'StripeInvalidRequestError':
      return { statusCode: 400, message: 'Invalid payment request. Please review your details.' };
    case 'StripeAPIError':
      return { statusCode: 502, message: 'Payment service is temporarily unavailable. Please retry shortly.' };
    default:
      return { statusCode: 500, message: 'Unexpected payment error. Please contact support.' };
  }
}
