import api from "./api";

export const adminApi = {
  login: (data) => api.post("/auth/login", data),
  dashboard: () => api.get("/admin/dashboard"),
  products: () => api.get("/admin/products"),
  createProduct: (formData) =>
    api.post("/admin/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateProduct: (id, formData) =>
    api.put(`/admin/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  orders: () => api.get("/admin/orders"),
  orderTracking: (orderId) => api.get(`/admin/orders/${orderId}/tracking`),
  categories: () => api.get("/categories"),
  brands: () => api.get("/brands"),
  adminCategories: () => api.get("/admin/categories"),
  createCategory: (data) => api.post("/admin/categories", data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  adminBrands: () => api.get("/admin/brands"),
  createBrand: (data) => api.post("/admin/brands", data),
  updateBrand: (id, data) => api.put(`/admin/brands/${id}`, data),
  deleteBrand: (id) => api.delete(`/admin/brands/${id}`),
};
