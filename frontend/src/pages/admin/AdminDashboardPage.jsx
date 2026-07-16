import { useEffect, useState } from "react";
import { adminApi } from "../../services/adminApi";

function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    adminApi
      .dashboard()
      .then((response) => setDashboard(response.data.dashboard))
      .catch(console.error);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">
          Quick metrics for store performance and inventory health.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {dashboard
          ? [
              { label: "Total Orders", value: dashboard.totalOrders },
              {
                label: "Total Revenue",
                value: `₹${dashboard.totalRevenue.toFixed(2)}`,
              },
              { label: "Today's Orders", value: dashboard.todaysOrders },
              { label: "Pending Orders", value: dashboard.pendingOrders },
              { label: "Delivered Orders", value: dashboard.deliveredOrders },
              { label: "Cancelled Orders", value: dashboard.cancelledOrders },
              { label: "Total Customers", value: dashboard.totalCustomers },
              {
                label: "Low Stock Products",
                value: dashboard.lowStockProducts,
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                  {metric.label}
                </p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">
                  {metric.value}
                </p>
              </div>
            ))
          : Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="h-32 animate-pulse rounded-3xl bg-slate-100"
              ></div>
            ))}
      </div>
    </main>
  );
}

export default AdminDashboardPage;
