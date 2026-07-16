import api from "./api";

export const CUSTOMER_ID = 1;

export const storefrontApi = {
  products: () => api.get("/products"),
  product: (id) => api.get(`/products/${id}`),
  cart: () => api.get("/cart", { params: { customerId: CUSTOMER_ID } }),
  addToCart: (productId, quantity = 1) =>
    api.post("/cart", { customerId: CUSTOMER_ID, productId, quantity }),
  updateCartItem: (cartItemId, quantity) =>
    api.patch(`/cart/${cartItemId}`, { quantity }),
  removeCartItem: (cartItemId) => api.delete(`/cart/${cartItemId}`),
  checkout: (data) => api.post("/checkout", data),
  createPayment: (data) => api.post("/payments/create", data),
};
