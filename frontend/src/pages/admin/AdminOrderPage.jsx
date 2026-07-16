import { useEffect, useState } from "react";
import { adminApi } from "../../services/adminApi";

function AdminOrderPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .orders()
      .then((response) => setOrders(response.data.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Order Management</h1>
          <p className="mt-2 text-sm text-slate-500">
            View orders, track shipment status, and monitor order lifecycle.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4 h-10 bg-slate-100"></td>
                    <td className="px-6 py-4 h-10 bg-slate-100"></td>
                    <td className="px-6 py-4 h-10 bg-slate-100"></td>
                    <td className="px-6 py-4 h-10 bg-slate-100"></td>
                    <td className="px-6 py-4 h-10 bg-slate-100"></td>
                    <td className="px-6 py-4 h-10 bg-slate-100"></td>
                    <td className="px-6 py-4 h-10 bg-slate-100"></td>
                  </tr>
                ))
              : orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {order.customer_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      ₹{order.total_amount}
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
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default AdminOrderPage;
