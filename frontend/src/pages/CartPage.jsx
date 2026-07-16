import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { storefrontApi } from "../services/storefrontApi";

function formatPrice(value) {
  return `INR ${Number(value || 0).toFixed(2)}`;
}

function getItemPrice(item) {
  return Number(item.discount_price || item.price || 0);
}

function CartPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");

  const loadCart = () => {
    setLoading(true);
    storefrontApi
      .cart()
      .then((response) => setItems(response.data.items || []))
      .catch((error) =>
        setActionError(error.response?.data?.message || "Failed to load cart"),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCart();
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
  const total = subtotal + tax + shipping;

  const updateQuantity = async (item, quantity) => {
    const nextQuantity = Math.max(Number(quantity || 1), 1);
    setActionError("");

    try {
      await storefrontApi.updateCartItem(item.id, nextQuantity);
      setItems((currentItems) =>
        currentItems.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: nextQuantity }
            : cartItem,
        ),
      );
    } catch (error) {
      setActionError(
        error.response?.data?.message || "Failed to update cart item",
      );
    }
  };

  const removeItem = async (item) => {
    setActionError("");

    try {
      await storefrontApi.removeCartItem(item.id);
      setItems((currentItems) =>
        currentItems.filter((cartItem) => cartItem.id !== item.id),
      );
    } catch (error) {
      setActionError(
        error.response?.data?.message || "Failed to remove cart item",
      );
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          Cart
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Shopping Cart</h1>
        <p className="mt-2 text-slate-500">
          Review your items before checkout.
        </p>
      </div>

      {actionError && (
        <div className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="h-80 animate-pulse rounded-3xl bg-slate-100" />
      ) : items.length ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="grid gap-4 rounded-3xl bg-white p-4 shadow-sm sm:grid-cols-[120px_1fr_auto]"
              >
                <img
                  src={item.image_url || "https://via.placeholder.com/160"}
                  alt={item.name}
                  className="h-32 w-full rounded-2xl object-cover sm:h-28"
                />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {item.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatPrice(getItemPrice(item))}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem(item)}
                    className="mt-4 text-sm font-semibold text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <div className="flex items-center rounded-full border border-slate-200">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item, item.quantity - 1)}
                      className="px-4 py-2"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) =>
                        updateQuantity(item, event.target.value)
                      }
                      className="w-14 border-x border-slate-200 py-2 text-center outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateQuantity(item, item.quantity + 1)}
                      className="px-4 py-2"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-lg font-semibold">
                    {formatPrice(getItemPrice(item) * item.quantity)}
                  </p>
                </div>
              </article>
            ))}
          </section>

          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Order Summary</h2>
            <div className="mt-6 space-y-3 text-sm">
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
              <div className="border-t border-slate-100 pt-4 text-lg font-semibold text-slate-900">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
            <Link
              to="/checkout"
              className="mt-6 flex w-full justify-center rounded-full bg-sky-600 px-6 py-4 font-semibold text-white transition hover:bg-sky-700"
            >
              Checkout
            </Link>
            <Link
              to="/products"
              className="mt-3 flex w-full justify-center rounded-full border border-slate-200 px-6 py-4 font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
          <p className="text-lg">Your cart is empty.</p>
          <Link
            to="/products"
            className="mt-4 inline-flex rounded-full bg-sky-600 px-6 py-3 text-white transition hover:bg-sky-700"
          >
            Continue shopping
          </Link>
        </div>
      )}
    </main>
  );
}

export default CartPage;
