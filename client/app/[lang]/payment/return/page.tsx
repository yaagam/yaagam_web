import { PaymentReturn } from "@/components/payment/payment-return";

type PaymentReturnPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function PaymentReturnPage({
  searchParams,
}: PaymentReturnPageProps) {
  const params = await searchParams;

  return (
    <PaymentReturn
      bookingId={first(params.bookingId)}
      transactionId={first(params.transactionId)}
      paymentId={first(params.razorpay_payment_id)}
      orderId={first(params.razorpay_order_id)}
      subscriptionId={first(params.razorpay_subscription_id)}
      signature={first(params.razorpay_signature)}
      callbackError={first(params.callback_error)}
    />
  );
}
