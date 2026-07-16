import AdminSidebar from "../../components/admin/AdminSidebar";
import { Outlet } from "react-router-dom";

function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="container mx-auto grid gap-6 xl:grid-cols-[280px_1fr]">
        <AdminSidebar />
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
