import { Navigate } from "react-router-dom";
import { clearAdminAuth, isValidAdminToken } from "../../services/auth";

function AdminProtectedRoute({ children }) {
  if (!isValidAdminToken()) {
    clearAdminAuth();
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default AdminProtectedRoute;
