import { useEffect, useState } from "react";
import { adminApi } from "../../services/adminApi";

const emptyFormData = {
  name: "",
  slug: "",
  categoryId: "",
  brandId: "",
  sku: "",
  shortDescription: "",
  description: "",
  price: "",
  discountPrice: "",
  gst: "",
  stock: "",
  status: "active",
  featured: false,
  images: [],
  removeImageIds: [],
};

function getProductFormData(product) {
  return {
    name: product.name || "",
    slug: product.slug || "",
    categoryId: product.category_id ? String(product.category_id) : "",
    brandId: product.brand_id ? String(product.brand_id) : "",
    sku: product.sku || "",
    shortDescription: product.short_description || "",
    description: product.description || "",
    price: product.price ?? "",
    discountPrice: product.discount_price ?? "",
    gst: product.gst ?? "",
    stock: product.stock ?? "",
    status: product.status || "active",
    featured: Boolean(product.featured),
    images: [],
    removeImageIds: [],
  };
}

function getPrimaryImage(product) {
  return product.images?.[0]?.url || "https://via.placeholder.com/240x180?text=Product";
}

function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [defaultBrandId, setDefaultBrandId] = useState("");
  const [formData, setFormData] = useState(emptyFormData);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const productStats = {
    total: products.length,
    active: products.filter((product) => product.status === "active").length,
    images: products.reduce(
      (total, product) => total + (product.images?.length || 0),
      0,
    ),
  };

  const filteredProducts = products.filter((product) => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return true;

    return [product.name, product.sku, product.category_name, product.brand_name]
      .filter(Boolean)
      .some((value) => value.toString().toLowerCase().includes(keyword));
  });

  const spotlightProducts = filteredProducts.slice(0, 3);

  const loadProducts = () => {
    setLoading(true);
    adminApi
      .products()
      .then((response) => setProducts(response.data.products || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();

    // Load categories and brands together so we can pick a default brand if present
    Promise.all([adminApi.categories(), adminApi.brands()])
      .then(([catRes, brandRes]) => {
        const cats = catRes.data.categories || [];
        const brandsList = brandRes.data.brands || [];
        setCategories(cats);
        setBrands(brandsList);

        // Auto-select a brand named or slugged 'own' (case-insensitive) if it exists
        const ownBrand = brandsList.find((b) => {
          const name = (b.name || "").toString().toLowerCase();
          const slug = (b.slug || "").toString().toLowerCase();
          return name === "own" || slug === "own" || name.includes("own");
        });

        if (ownBrand) {
          setDefaultBrandId(String(ownBrand.id));
          setFormData((prev) => ({ ...prev, brandId: String(ownBrand.id) }));
        }
      })
      .catch(console.error);
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    if (type === "file") {
      setFormData((prev) => ({ ...prev, images: Array.from(files || []) }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleRemoveImage = (imageId) => {
    setFormData((prev) => {
      const removeImageIds = prev.removeImageIds.includes(imageId)
        ? prev.removeImageIds.filter((id) => id !== imageId)
        : [...prev.removeImageIds, imageId];

      return { ...prev, removeImageIds };
    });
  };

  const isImageMarkedForRemoval = (imageId) =>
    formData.removeImageIds.includes(imageId);

  const resetForm = () => {
    setEditingProduct(null);
    setShowForm(false);
    setFormError("");
    setFormData(emptyFormData);
  };

  const handleAddClick = () => {
    setEditingProduct(null);
    setFormError("");
    setFormData({ ...emptyFormData, brandId: defaultBrandId });
    setShowForm((prev) => !prev);
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setFormError("");
    setFormData(getProductFormData(product));
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "images") {
          Array.from(value || []).forEach((file) => {
            payload.append("images", file);
          });
          return;
        }

        if (key === "removeImageIds") {
          if (value.length) {
            payload.append("removeImageIds", value.join(","));
          }
          return;
        }

        payload.append(key, value);
      });

      if (editingProduct) {
        await adminApi.updateProduct(editingProduct.id, payload);
      } else {
        await adminApi.createProduct(payload);
      }

      resetForm();
      loadProducts();
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
          `Failed to ${editingProduct ? "update" : "create"} product`,
      );
    }
  };

  const handleDeleteClick = async (product) => {
    setActionError("");
    const shouldDelete = window.confirm(
      `Delete "${product.name}"? This action cannot be undone.`,
    );

    if (!shouldDelete) return;

    try {
      await adminApi.deleteProduct(product.id);
      if (editingProduct?.id === product.id) {
        resetForm();
      }
      loadProducts();
    } catch (error) {
      setActionError(error.response?.data?.message || "Failed to delete product");
    }
  };

  return (
    <main className="min-h-screen rounded-[28px] bg-[#eef3f8] p-3 text-slate-900 shadow-inner lg:p-4">
      <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_22px_70px_rgba(15,23,42,0.12)]">
        <div className="grid gap-0 xl:grid-cols-[1fr_260px]">
          <section className="p-5 lg:p-8">
            <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full bg-slate-50 px-5 py-3">
                <span className="text-sm font-semibold text-blue-500">Search</span>
                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
              <button
                onClick={handleAddClick}
                className="rounded-full bg-[#1688d3] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-[#0d6fac]"
              >
                {showForm && !editingProduct ? "Hide form" : "Add product"}
              </button>
            </div>

            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-500">
                  Catalog dashboard
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950 lg:text-3xl">
                  Hi, manage your products
                </h1>
              </div>
              <div className="flex gap-2 text-sm text-blue-500">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50">
                  &lt;
                </span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50">
                  &gt;
                </span>
              </div>
            </div>

            <div className="mb-7 grid gap-4 md:grid-cols-3">
              {spotlightProducts.length
                ? spotlightProducts.map((product) => (
                    <article key={product.id} className="min-w-0">
                      <div className="aspect-[4/3] overflow-hidden rounded-md bg-slate-100">
                        <img
                          src={getPrimaryImage(product)}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="mt-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-slate-900">
                            {product.name}
                          </h3>
                          <p className="mt-1 text-xs font-semibold text-blue-500">
                            INR {product.discount_price || product.price}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-slate-400">
                          {product.images?.length || 0} images
                        </span>
                      </div>
                    </article>
                  ))
                : Array.from({ length: 3 }).map((_, index) => (
                    <article key={index}>
                      <div className="aspect-[4/3] animate-pulse rounded-md bg-slate-100" />
                      <div className="mt-3 h-4 w-28 animate-pulse rounded bg-slate-100" />
                    </article>
                  ))}
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-xs text-slate-400">Products</p>
                <p className="mt-1 text-2xl font-semibold">{productStats.total}</p>
              </div>
              <div className="rounded-md bg-blue-50 p-4">
                <p className="text-xs text-blue-500">Active</p>
                <p className="mt-1 text-2xl font-semibold">{productStats.active}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-xs text-slate-400">Gallery Images</p>
                <p className="mt-1 text-2xl font-semibold">{productStats.images}</p>
              </div>
            </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h2>
            <div className="flex gap-2">
            {editingProduct && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel edit
              </button>
            )}
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full bg-slate-100 px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Name</span>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Slug</span>
                <input
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                  required
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Category
                </span>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Brand
                </span>
                <select
                  name="brandId"
                  value={formData.brandId}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                  required
                >
                  <option value="">Select Brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">SKU</span>
                <input
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Price
                </span>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Stock
                </span>
                <input
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Discount Price
                </span>
                <input
                  name="discountPrice"
                  type="number"
                  step="0.01"
                  value={formData.discountPrice}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  GST %
                </span>
                <input
                  name="gst"
                  type="number"
                  step="0.01"
                  value={formData.gst}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Status
                </span>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Short Description
              </span>
              <textarea
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Description
              </span>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Images</span>
              {editingProduct && (
                <span className="mt-1 block text-xs text-slate-500">
                  Upload up to 10 images. Existing photos can be removed below.
                </span>
              )}
              <input
                name="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleInputChange}
                className="mt-2 w-full rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 px-4 py-3 text-sm outline-none"
              />
            </label>

            {editingProduct?.images?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Existing Images
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {editingProduct.images.map((image) => {
                    const isRemoved = isImageMarkedForRemoval(image.id);

                    return (
                      <div
                        key={image.id}
                        className={`overflow-hidden rounded-2xl border bg-white ${
                          isRemoved ? "border-red-200 opacity-60" : "border-slate-200"
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={editingProduct.name}
                          className="h-24 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => toggleRemoveImage(image.id)}
                          className={`w-full px-3 py-2 text-xs font-semibold ${
                            isRemoved
                              ? "bg-slate-100 text-slate-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {isRemoved ? "Undo remove" : "Remove"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {formData.images.length > 0 && (
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">
                  New Images Selected
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.images.map((file) => (
                    <span
                      key={`${file.name}-${file.size}`}
                      className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm"
                    >
                      {file.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-slate-300 text-slate-900"
              />
              <span className="text-sm text-slate-700">Mark as featured</span>
            </label>

            {formError && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <button
              type="submit"
              className="rounded-full bg-slate-900 px-6 py-3 text-white transition hover:bg-slate-700"
            >
              {editingProduct ? "Update product" : "Save product"}
            </button>
          </form>
          </div>
        </div>
      )}

      {actionError && (
        <div className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Name
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Category
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Brand
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Price
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Stock
              </th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                Status
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">
                Actions
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
              : filteredProducts.length
                ? filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {product.category_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {product.brand_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      INR {product.price}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {product.status}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditClick(product)}
                          className="rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(product)}
                          className="rounded-full bg-red-50 px-4 py-2 font-medium text-red-700 transition hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
                : (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-10 text-center text-sm text-slate-400"
                    >
                      No products found.
                    </td>
                  </tr>
                )}
          </tbody>
        </table>
      </div>
          </section>

          <aside className="border-t border-slate-100 bg-slate-50/70 p-5 xl:border-l xl:border-t-0 lg:p-6">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex gap-3 text-blue-500">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm">
                  M
                </span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm">
                  N
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[#f3c69f] text-sm font-bold text-slate-900">
                  DG
                </div>
                <div>
                  <p className="text-sm font-semibold">Admin</p>
                  <p className="text-xs text-slate-400">Catalog manager</p>
                </div>
              </div>
            </div>

            <div className="mb-7">
              <h2 className="text-sm font-semibold text-slate-900">
                Image Gallery
              </h2>
              <div className="mt-4 rounded-md bg-[#36a9df] p-5 text-white shadow-lg shadow-blue-100">
                <p className="text-xs font-semibold uppercase text-white/80">
                  Product photos
                </p>
                <p className="mt-6 text-3xl font-semibold">
                  {productStats.images}
                </p>
                <p className="mt-1 text-xs text-white/80">
                  Uploaded across {productStats.total} products
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{
                      width: `${Math.min(productStats.images * 6, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mb-7">
              <h2 className="text-sm font-semibold text-slate-900">
                Recent Images
              </h2>
              <div className="mt-4 space-y-3">
                {products
                  .filter((product) => product.images?.length)
                  .slice(0, 3)
                  .map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleEditClick(product)}
                      className="flex w-full items-center gap-3 rounded-md bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <img
                        src={getPrimaryImage(product)}
                        alt={product.name}
                        className="h-14 w-14 rounded-md object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-700">
                          {product.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {product.images.length} images
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Activity
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-xs text-slate-500">
                    <span>Active products</span>
                    <span>{productStats.active}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-[#1688d3]"
                      style={{
                        width: `${
                          productStats.total
                            ? (productStats.active / productStats.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-xs text-slate-500">
                    <span>With images</span>
                    <span>
                      {
                        products.filter((product) => product.images?.length)
                          .length
                      }
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-[#1688d3]"
                      style={{
                        width: `${
                          productStats.total
                            ? (products.filter((product) => product.images?.length)
                                .length /
                                productStats.total) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default AdminProductsPage;
