import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CUSTOMER_ID, storefrontApi } from "../services/storefrontApi";

const emptyCheckoutForm = {
  fullName: "",
  email: "",
  phone: "",
  postalCode: "",
  address: "",
  city: "",
  state: "",
  sameBilling: true,
  billingAddress: "",
};

function formatPrice(value) {
  return `INR ${Number(value || 0).toFixed(2)}`;
}

function getItemPrice(item) {
  return Number(item.discount_price || item.price || 0);
}

function loadCashfreeSdk() {
  return new Promise((resolve, reject) => {
    if (window.Cashfree) {
      resolve(window.Cashfree);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]',
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.Cashfree));
      existingScript.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => resolve(window.Cashfree);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

async function openCashfreeCheckout(paymentSessionId, mode) {
  const Cashfree = await loadCashfreeSdk();
  const cashfree = Cashfree({ mode });
  await cashfree.checkout({
    paymentSessionId,
    redirectTarget: "_self",
  });
}

function CheckoutPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(emptyCheckoutForm);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    storefrontApi
      .cart()
      .then((response) => setItems(response.data.items || []))
      .catch((apiError) =>
        setError(apiError.response?.data?.message || "Failed to load cart"),
      )
      .finally(() => setLoading(false));
  }, []);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + getItemPrice(item) * Number(item.quantity || 0),
        0,
      ),
    [items],
  );
  const tax = subtotal * 0.05;
  const shipping = subtotal > 0 && subtotal < 999 ? 80 : 0;
  const discount = 0;
  const total = subtotal + tax + shipping - discount;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const buildAddress = () =>
    [
      formData.fullName,
      formData.address,
      formData.city,
      formData.state,
      formData.postalCode,
    ]
      .filter(Boolean)
      .join(", ");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setOrder(null);

    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.postalCode
    ) {
      setError("Please fill all customer and shipping details.");
      return;
    }

    const shippingAddress = buildAddress();
    const billingAddress = formData.sameBilling
      ? shippingAddress
      : formData.billingAddress;

    if (!billingAddress) {
      setError("Please enter billing address.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        customerId: CUSTOMER_ID,
        shippingAddress,
        billingAddress,
        customerName: formData.fullName,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        taxAmount: tax,
        shippingCharges: shipping,
        discountAmount: discount,
        items: items.map((item) => ({
          productId: item.product_id,
          quantity: Number(item.quantity || 1),
          price: getItemPrice(item),
          discountPrice: Number(item.discount_price || 0),
        })),
      };

      const response = await storefrontApi.checkout(payload);
      const createdOrder = response.data;
      const paymentResponse = await storefrontApi.createPayment({
        orderId: createdOrder.orderId,
        amount: createdOrder.grandTotal,
        buyerName: formData.fullName,
        buyerEmail: formData.email,
        buyerPhone: formData.phone,
        purpose: `Order ${createdOrder.orderNumber}`,
      });

      await Promise.all(
        items.map((item) => storefrontApi.removeCartItem(item.id)),
      );
      const paymentSessionId = paymentResponse.data.paymentSessionId;
      if (paymentSessionId) {
        await openCashfreeCheckout(
          paymentSessionId,
          paymentResponse.data.cashfreeMode || "sandbox",
        );
        return;
      }

      const paymentUrl = paymentResponse.data.paymentUrl;
      if (paymentUrl) {
        window.location.assign(paymentUrl);
        return;
      }

      setOrder(createdOrder);
      setItems([]);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (order) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
            Order placed
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Thank you</h1>
          <p className="mt-3 text-slate-500">
            Your order number is{" "}
            <span className="font-semibold text-slate-900">
              {order.orderNumber}
            </span>
            .
          </p>
          <p className="mt-2 text-lg font-semibold">
            Total: {formatPrice(order.grandTotal)}
          </p>
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
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          Checkout
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Complete your order</h1>
        <p className="mt-2 text-slate-500">
          Enter shipping details and confirm your order summary.
        </p>
      </div>

      {loading ? (
        <div className="h-96 animate-pulse rounded-3xl bg-slate-100" />
      ) : !items.length ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
          <p className="text-lg">Your cart is empty.</p>
          <Link
            to="/products"
            className="mt-4 inline-flex rounded-full bg-sky-600 px-6 py-3 text-white transition hover:bg-sky-700"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[1fr_380px]"
        >
          <section className="space-y-6 rounded-3xl bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold">Customer Information</h2>
              <p className="mt-2 text-sm text-slate-500">
                We will use these details for order updates.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Full name
                </span>
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-500"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-500"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Phone</span>
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-500"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Postal code
                </span>
                <input
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-500"
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Shipping address
                </span>
                <textarea
                  name="address"
                  rows="4"
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-500"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">City</span>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-500"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">State</span>
                <input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-500"
                  required
                />
              </label>
            </div>

            <label className="inline-flex items-center gap-3">
              <input
                type="checkbox"
                name="sameBilling"
                checked={formData.sameBilling}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">
                Billing address is same as shipping
              </span>
            </label>

            {!formData.sameBilling && (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Billing address
                </span>
                <textarea
                  name="billingAddress"
                  rows="3"
                  value={formData.billingAddress}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-500"
                />
              </label>
            )}
          </section>

          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Order Summary</h2>
            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <img
                    src={item.image_url || "https://via.placeholder.com/120"}
                    alt={item.name}
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Qty {item.quantity} x {formatPrice(getItemPrice(item))}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatPrice(getItemPrice(item) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>{shipping ? formatPrice(shipping) : "Free"}</span>
              </div>
              <div className="flex justify-between pt-3 text-lg font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-full bg-sky-600 px-6 py-4 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? "Placing order..." : "Place order"}
            </button>
            <Link
              to="/cart"
              className="mt-3 flex w-full justify-center rounded-full border border-slate-200 px-6 py-4 font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Back to cart
            </Link>
          </aside>
        </form>
      )}
    </main>
  );
}

export default CheckoutPage;
