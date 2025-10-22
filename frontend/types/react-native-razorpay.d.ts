declare module 'react-native-razorpay' {
  export interface RazorpayOptions {
    description: string;
    image: string;
    currency: string;
    key: string;
    amount: number;
    name: string;
    order_id: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
    };
    theme?: {
      color: string;
    };
  }

  export interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  export interface RazorpayError {
    code: number;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id: string;
      payment_id: string;
    };
  }

  export default class RazorpayCheckout {
    static open(options: RazorpayOptions): Promise<RazorpayResponse>;
    static readonly PAYMENT_CANCELLED: number;
  }
}

