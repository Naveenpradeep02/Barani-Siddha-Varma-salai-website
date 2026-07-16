import { useEffect, useState } from "react";
import { adminApi } from "../../services/adminApi";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function getCustomerName(order) {
  if (order.customer_name && order.customer_name !== "Guest Customer") {
    return order.customer_name;
  }

  const addressName = String(order.shipping_address || "").split(",")[0]?.trim();
  return (
    addressName || order.customer_email || order.order_customer_email || "Customer"
  );
}

function getCustomerEmail(order) {
  return order.customer_email || order.order_customer_email || "N/A";
}

function getCustomerPhone(order) {
  return order.customer_phone || order.order_customer_phone || "N/A";
}

function AdminOrderPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  useEffect(() => {
    adminApi
      .orders()
      .then((response) => setOrders(response.data.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleViewOrder = async (orderId) => {
    setSelectedOrderId(orderId);
    setDetailsError("");
    setOrderDetails(null);
    setDetailsLoading(true);

    try {
      const response = await adminApi.orderTracking(orderId);
      setOrderDetails(response.data);
    } catch (error) {
      setOrderDetails(null);
      setDetailsError(
        error.response?.data?.message || "Failed to load order details",
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedOrderId(null);
    setOrderDetails(null);
    setDetailsError("");
    setDetailsLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Order Management</h1>
          <p className="mt-2 text-sm text-slate-500">
            View orders, customer details, items, payment status, and shipment
            progress.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Order #
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Customer
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Amount
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Payment
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Order
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Shipment
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Placed
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    {Array.from({ length: 8 }).map((__, cellIdx) => (
                      <td
                        key={cellIdx}
                        className="h-10 bg-slate-100 px-6 py-4"
                      />
                    ))}
                  </tr>
                ))
              : orders.map((order) => (
                  <tr
                    key={order.id}
                    className={
                      selectedOrderId === order.id ? "bg-sky-50/60" : ""
                    }
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <p className="font-medium text-slate-900">
                        {getCustomerName(order)}
                      </p>
                      <p className="mt-1 text-xs">{getCustomerPhone(order)}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {formatCurrency(order.grand_total || order.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {order.payment_status}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {order.status}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {order.shipment_status || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleViewOrder(order.id)}
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {selectedOrderId && (
        <OrderDetailsModal
          details={orderDetails}
          error={detailsError}
          loading={detailsLoading}
          onClose={closeDetails}
        />
      )}
    </main>
  );
}

function OrderDetailsModal({ details, error, loading, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
              Order Details
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              {details?.order?.order_number || "Loading order"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(90vh-86px)] overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-8 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : details ? (
            <OrderDetails details={details} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OrderDetails({ details }) {
  const { order, items = [], tracking = [] } = details;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
          Order Details
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
          {order.order_number}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Placed {new Date(order.created_at).toLocaleString()}
        </p>
      </div>

      <section>
        <h3 className="text-sm font-semibold text-slate-900">Customer</h3>
        <div className="mt-3 space-y-1 text-sm text-slate-600">
          <p className="font-medium text-slate-900">{getCustomerName(order)}</p>
          <p>{getCustomerEmail(order)}</p>
          <p>{getCustomerPhone(order)}</p>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-900">Address</h3>
        <div className="mt-3 space-y-3 text-sm text-slate-600">
          <div>
            <p className="font-medium text-slate-900">Shipping</p>
            <p>{order.shipping_address}</p>
          </div>
          <div>
            <p className="font-medium text-slate-900">Billing</p>
            <p>{order.billing_address}</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-900">Items</h3>
        <div className="mt-3 divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 py-3">
              <img
                src={item.image_url || "https://via.placeholder.com/120"}
                alt={item.product_name || "Product"}
                className="h-14 w-14 rounded-2xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {item.product_name || "Deleted product"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Qty {item.quantity} x {formatCurrency(item.unit_price)}
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {formatCurrency(item.total_price)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2 border-t border-slate-100 pt-4 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span>{formatCurrency(order.total_amount)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Tax</span>
          <span>{formatCurrency(order.tax_amount)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Shipping</span>
          <span>{formatCurrency(order.shipping_charges)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Discount</span>
          <span>{formatCurrency(order.discount_amount)}</span>
        </div>
        <div className="flex justify-between pt-2 text-base font-semibold text-slate-900">
          <span>Total</span>
          <span>{formatCurrency(order.grand_total)}</span>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-900">Status</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Payment</p>
            <p className="mt-1 font-semibold text-slate-900">
              {order.payment_status}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Order</p>
            <p className="mt-1 font-semibold text-slate-900">{order.status}</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-900">Tracking</h3>
        {tracking.length ? (
          <div className="mt-3 space-y-3 text-sm">
            {tracking.map((event) => (
              <div key={`${event.status}-${event.updated_at}`}>
                <p className="font-medium text-slate-900">{event.status}</p>
                <p className="text-slate-500">
                  {[event.location, event.message].filter(Boolean).join(" - ")}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(event.updated_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No tracking updates yet.</p>
        )}
      </section>
    </div>
  );
}

export default AdminOrderPage;
