import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { storefrontApi } from "../services/storefrontApi";

function formatPrice(value) {
  return `INR ${Number(value || 0).toFixed(2)}`;
}

function ProductPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [loading, setLoading] = useState(true);
  const [cartMessage, setCartMessage] = useState("");

  useEffect(() => {
    storefrontApi
      .products()
      .then((response) => setProducts(response.data.products || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((product) => product.category_name).filter(Boolean)),
      ),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const result = products.filter((product) => {
      const matchesSearch =
        !keyword ||
        [product.name, product.category_name, product.brand_name]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword));
      const matchesCategory =
        category === "all" || product.category_name === category;

      return matchesSearch && matchesCategory;
    });

    return [...result].sort((a, b) => {
      const aPrice = Number(a.discount_price || a.price || 0);
      const bPrice = Number(b.discount_price || b.price || 0);
      if (sortBy === "price-low") return aPrice - bPrice;
      if (sortBy === "price-high") return bPrice - aPrice;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [category, products, searchTerm, sortBy]);

  const handleAddToCart = async (event, product) => {
    event.preventDefault();
    event.stopPropagation();
    setCartMessage("");

    try {
      await storefrontApi.addToCart(product.id, 1);
      setCartMessage(`${product.name} added to cart`);
      return true;
    } catch (error) {
      setCartMessage(error.response?.data?.message || "Unable to add to cart");
      return false;
    }
  };

  const handleBuyNow = async (event, product) => {
    const added = await handleAddToCart(event, product);
    if (added) {
      navigate("/checkout");
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
          <aside className="border-b border-slate-100 bg-slate-50 p-6 lg:border-b-0 lg:border-r">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
              Shop
            </p>
            <h1 className="mt-3 text-3xl font-semibold">All Products</h1>
            <p className="mt-3 text-sm text-slate-500">
              Browse active products, filter by category, and add items to cart.
            </p>

            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Search
                </span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Name, brand, category"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Category
                </span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                >
                  <option value="all">All categories</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Sort</span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500"
                >
                  <option value="latest">Latest</option>
                  <option value="name">Name</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </label>
            </div>
          </aside>

          <div className="p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Showing {filteredProducts.length} of {products.length} products
                </p>
                {cartMessage && (
                  <p className="mt-1 text-sm font-medium text-sky-600">
                    {cartMessage}
                  </p>
                )}
              </div>
              <Link
                to="/cart"
                className="inline-flex justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                View Cart
              </Link>
            </div>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-80 animate-pulse rounded-3xl bg-slate-100"
                  />
                ))}
              </div>
            ) : filteredProducts.length ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => {
                  const salePrice = product.discount_price || product.price;
                  const isOutOfStock = Number(product.stock || 0) <= 0;

                  return (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      className="group flex min-h-full flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                        <img
                          src={
                            product.featured_image ||
                            "https://via.placeholder.com/360x270?text=Product"
                          }
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <span
                          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${
                            isOutOfStock
                              ? "bg-red-50 text-red-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {isOutOfStock ? "Out of stock" : "In stock"}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col pt-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          {product.category_name || "Product"}
                        </p>
                        <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-slate-900">
                          {product.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {product.brand_name || "D-Grow"}
                        </p>
                        <div className="mt-4 flex items-center gap-3">
                          <span className="text-lg font-semibold text-slate-900">
                            {formatPrice(salePrice)}
                          </span>
                          {product.discount_price ? (
                            <span className="text-sm text-slate-400 line-through">
                              {formatPrice(product.price)}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={(event) => handleAddToCart(event, product)}
                            className="rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={(event) => handleBuyNow(event, product)}
                            className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                          >
                            Buy
                          </button>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
                No products found.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default ProductPage;
