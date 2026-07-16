import { NavLink, useNavigate } from "react-router-dom";
import { clearAdminAuth } from "../../services/auth";

function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAdminAuth();
    navigate("/admin/login");
  };

  return (
    <aside className="w-full max-w-[280px] shrink-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-10">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
          Admin
        </p>
        <h2 className="mt-4 text-2xl font-semibold">D-Grow Panel</h2>
      </div>
      <nav className="space-y-3">
        <NavLink
          className={({ isActive }) =>
            `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
              isActive
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`
          }
          to="/admin/dashboard"
        >
          Dashboard
        </NavLink>
        <div>
          <div className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900">
            Products
          </div>
          <div className="ml-4 mt-2 border-l border-slate-200 pl-3">
            <NavLink
              className={({ isActive }) =>
                `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
              to="/admin/products"
            >
              All Products
            </NavLink>
          </div>
        </div>
        <NavLink
          className={({ isActive }) =>
            `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
              isActive
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`
          }
          to="/admin/orders"
        >
          Orders
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
              isActive
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`
          }
          to="/admin/categories"
        >
          Categories
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
              isActive
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`
          }
          to="/admin/brands"
        >
          Brands
        </NavLink>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-2xl bg-red-100 px-4 py-3 text-left text-sm font-medium text-red-700 transition hover:bg-red-200"
        >
          Logout
        </button>
      </nav>
    </aside>
  );
}

export default AdminSidebar;
