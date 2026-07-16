import { Link, useSearchParams } from "react-router-dom";

function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const orderNumber = searchParams.get("orderNumber");
  const isSuccess = status === "success";

  return (
    <main className="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-2xl rounded-3xl bg-white p-8 text-center shadow-sm">
        <p
          className={`text-sm font-semibold uppercase tracking-[0.25em] ${
            isSuccess ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {isSuccess ? "Payment successful" : "Payment failed"}
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          {isSuccess ? "Your order is confirmed" : "We could not confirm payment"}
        </h1>
        {orderNumber && (
          <p className="mt-3 text-slate-500">
            Order number{" "}
            <span className="font-semibold text-slate-900">{orderNumber}</span>
          </p>
        )}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/track-order"
            className="rounded-full bg-sky-600 px-6 py-3 font-semibold text-white transition hover:bg-sky-700"
          >
            Track order
          </Link>
          <Link
            to="/products"
            className="rounded-full border border-slate-200 px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Continue shopping
          </Link>
        </div>
      </section>
    </main>
  );
}

export default PaymentResultPage;
