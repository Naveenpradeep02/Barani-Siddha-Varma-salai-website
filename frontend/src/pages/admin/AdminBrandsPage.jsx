import { useEffect, useState } from "react";
import { adminApi } from "../../services/adminApi";

const emptyBrandForm = {
  name: "",
  slug: "",
  description: "",
  status: "active",
};

function AdminBrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState(emptyBrandForm);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadBrands = () => {
    setLoading(true);
    adminApi
      .adminBrands()
      .then((response) => setBrands(response.data.brands || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingBrand(null);
    setFormError("");
    setFormData(emptyBrandForm);
    setShowForm(true);
  };

  const openEditModal = (brand) => {
    setEditingBrand(brand);
    setFormError("");
    setFormData({
      name: brand.name || "",
      slug: brand.slug || "",
      description: brand.description || "",
      status: brand.status || "active",
    });
    setShowForm(true);
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingBrand(null);
    setFormError("");
    setFormData(emptyBrandForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      if (editingBrand) {
        await adminApi.updateBrand(editingBrand.id, formData);
      } else {
        await adminApi.createBrand(formData);
      }
      closeModal();
      loadBrands();
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
          `Failed to ${editingBrand ? "update" : "create"} brand`,
      );
    }
  };

  const handleDelete = async (brand) => {
    setActionError("");
    const shouldDelete = window.confirm(
      `Delete "${brand.name}"? This action cannot be undone.`,
    );

    if (!shouldDelete) return;

    try {
      await adminApi.deleteBrand(brand.id);
      if (editingBrand?.id === brand.id) {
        closeModal();
      }
      loadBrands();
    } catch (error) {
      setActionError(error.response?.data?.message || "Failed to delete brand");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Brand Management</h1>
          <p className="mt-2 text-sm text-slate-500">
            Add or manage product brands.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-full bg-slate-900 px-6 py-3 text-white transition hover:bg-slate-700"
        >
          Add brand
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">
              {editingBrand ? "Edit Brand" : "Add Brand"}
            </h2>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-full bg-slate-100 px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
            >
              Close
            </button>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Name</span>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Slug</span>
                <input
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Description
              </span>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
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
              {editingBrand ? "Update brand" : "Save brand"}
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
                Slug
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
                  </tr>
                ))
              : brands.map((brand) => (
                  <tr key={brand.id}>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {brand.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {brand.slug}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {brand.status}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(brand)}
                          className="rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(brand)}
                          className="rounded-full bg-red-50 px-4 py-2 font-medium text-red-700 transition hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default AdminBrandsPage;
