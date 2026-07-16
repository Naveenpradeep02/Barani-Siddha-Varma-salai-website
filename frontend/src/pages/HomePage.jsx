import { useEffect, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";

function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/products")
      .then((response) => setProducts(response.data.products || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <section className="rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-700 p-10 text-white shadow-xl">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-100">
            Premium eCommerce
          </p>
          <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
            Build your brand with seamless shopping experiences.
          </h1>
          <p className="mt-6 text-lg text-sky-100/90">
            Explore curated collections, fast checkout, and intelligent order
            tracking across desktop and mobile.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/products"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/10 transition hover:bg-slate-100"
            >
              Shop Now
            </Link>
            <Link
              to="/track-order"
              className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Track Order
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Featured Products</h2>
          <p className="mt-3 text-sm text-slate-500">
            Hand-picked items for top sellers and rapid delivery.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">New Arrivals</h2>
          <p className="mt-3 text-sm text-slate-500">
            Fresh stock, latest trends, and seasonal essentials.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Best Sellers</h2>
          <p className="mt-3 text-sm text-slate-500">
            Top-rated products based on customer reviews and purchase history.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
              Popular picks
            </p>
            <h2 className="text-2xl font-semibold">Trending products</h2>
          </div>
          <Link
            to="/products"
            className="text-sm font-semibold text-sky-600 hover:text-sky-700"
          >
            View all products
          </Link>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 rounded-3xl border border-slate-200 bg-slate-100 p-6 animate-pulse"
                />
              ))
            : products.slice(0, 6).map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex h-48 items-center justify-center overflow-hidden rounded-3xl bg-slate-100">
                    <img
                      src={
                        product.featured_image ||
                        "https://via.placeholder.com/300"
                      }
                      alt={product.name}
                      className="h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-900">
                    {product.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {product.category_name || "Category"}
                  </p>
                  <div className="mt-4 flex items-center gap-3 text-slate-900">
                    <span className="text-lg font-semibold">
                      ₹{product.discount_price || product.price}
                    </span>
                    {product.discount_price ? (
                      <span className="text-sm text-slate-400 line-through">
                        ₹{product.price}
                      </span>
                    ) : null}
                  </div>
                </Link>
              ))}
        </div>
      </section>
    </main>
  );
}

export default HomePage;
