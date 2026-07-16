function OrderTrackingPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Track Your Order</h1>
        <p className="mt-2 text-slate-500">
          Enter the order ID and mobile number to see the latest shipment
          updates.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Order ID"
            className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
          />
          <input
            type="tel"
            placeholder="Mobile number"
            className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
          />
        </div>
        <button className="mt-6 rounded-full bg-sky-600 px-6 py-4 text-white transition hover:bg-sky-700">
          Track order
        </button>
      </div>
    </main>
  );
}

export default OrderTrackingPage;
