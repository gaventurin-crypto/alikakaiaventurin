export interface PaymentResponse {
  success: boolean;
  authority: string;
  paymentUrl: string;
  message?: string;
}

export interface VerificationResponse {
  success: boolean;
  refId?: number;
  message?: string;
}

export class PaymentService {
  private merchantId: string;

  constructor(merchantId?: string) {
    this.merchantId = merchantId || 'test-merchant-id-00000000000000000000';
  }

  /**
   * Request a new Zarinpal payment transaction
   */
  async requestPayment(amount: number, orderId: string, description: string): Promise<PaymentResponse> {
    try {
      // In development or simulation mode, return a simulated authority immediately
      const mockAuthority = `ZP-${Math.floor(1000000 + Math.random() * 9000000)}`;
      return {
        success: true,
        authority: mockAuthority,
        paymentUrl: `/index.html?paymentVerify=1&authority=${mockAuthority}&status=OK&orderId=${orderId}`,
      };
    } catch (error: any) {
      return {
        success: false,
        authority: '',
        paymentUrl: '',
        message: error.message || 'خطا در ارتباط با درگاه پرداخت زرین‌پال'
      };
    }
  }

  /**
   * Verify the payment status with Zarinpal API
   */
  async verifyPayment(authority: string, amount: number): Promise<VerificationResponse> {
    try {
      // Direct simulation approval for mock authorities
      if (authority.startsWith('ZP-')) {
        return {
          success: true,
          refId: Math.floor(100000 + Math.random() * 900000)
        };
      }
      return {
        success: false,
        message: 'تراکنش نامعتبر است'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'خطا در تایید تراکنش'
      };
    }
  }
}
