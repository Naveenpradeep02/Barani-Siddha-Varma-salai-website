import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { storefrontApi } from "../services/storefrontApi";

function formatPrice(value) {
  return `INR ${Number(value || 0).toFixed(2)}`;
}

function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    storefrontApi
      .product(id)
      .then((response) => {
        const productImages = response.data.images || [];
        setProduct(response.data.product);
        setImages(productImages);
        setSelectedImage(productImages[0]?.url || "");
        setRelated(response.data.related || []);
        setQuantity(1);
        setMessage("");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setMessage("");

    try {
      await storefrontApi.addToCart(product.id, quantity);
      setMessage(`${quantity} item added to cart`);
      return true;
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to add to cart");
      return false;
    }
  };

  const handleBuyNow = async () => {
    const added = await handleAddToCart();
    if (added) {
      navigate("/checkout");
    }
  };

  const isOutOfStock = Number(product?.stock || 0) <= 0;
  const maxQuantity = Math.max(Number(product?.stock || 1), 1);

  return (
    <main className="container mx-auto px-4 py-8">
      {loading ? (
        <div className="space-y-6">
          <div className="h-96 animate-pulse rounded-3xl bg-slate-100" />
          <div className="h-12 animate-pulse rounded-3xl bg-slate-100" />
          <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />
        </div>
      ) : product ? (
        <>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-slate-100">
                <img
                  src={
                    selectedImage || "https://via.placeholder.com/700x500?text=Product"
                  }
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-4 grid grid-cols-4 gap-3">
                {(images.length ? images : [{ id: "placeholder", url: "" }]).map(
                  (image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => image.url && setSelectedImage(image.url)}
                      className={`aspect-square overflow-hidden rounded-2xl border ${
                        selectedImage === image.url
                          ? "border-sky-500"
                          : "border-slate-200"
                      }`}
                    >
                      <img
                        src={
                          image.url ||
                          "https://via.placeholder.com/180?text=Product"
                        }
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ),
                )}
              </div>
            </section>

            <section className="space-y-5">
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
                  {product.category_name || "Product"}
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-900">
                  {product.name}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  {product.brand_name || "D-Grow"}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="text-3xl font-semibold text-slate-900">
                    {formatPrice(product.discount_price || product.price)}
                  </span>
                  {product.discount_price ? (
                    <span className="text-base font-medium text-slate-400 line-through">
                      {formatPrice(product.price)}
                    </span>
                  ) : null}
                </div>

                <p className="mt-5 text-sm leading-6 text-slate-600">
                  {product.description ||
                    product.short_description ||
                    "No product description available."}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">Availability</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {isOutOfStock ? "Out of Stock" : `${product.stock} in stock`}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">GST</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {Number(product.gst || 0).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-slate-700">
                    Quantity
                  </span>
                  <div className="flex items-center rounded-full border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setQuantity((value) => Math.max(value - 1, 1))}
                      className="px-4 py-2 text-lg"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={maxQuantity}
                      value={quantity}
                      onChange={(event) =>
                        setQuantity(
                          Math.min(
                            Math.max(Number(event.target.value || 1), 1),
                            maxQuantity,
                          ),
                        )
                      }
                      className="w-14 border-x border-slate-200 py-2 text-center outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((value) => Math.min(value + 1, maxQuantity))
                      }
                      className="px-4 py-2 text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>

                {message && (
                  <div className="mt-4 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700">
                    {message}
                  </div>
                )}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleAddToCart}
                    className="rounded-full bg-sky-600 px-6 py-4 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Add to cart
                  </button>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleBuyNow}
                    className="rounded-full border border-slate-200 bg-white px-6 py-4 font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    Buy now
                  </button>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-10 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Related products</h2>
              <Link
                to="/products"
                className="text-sm font-semibold text-sky-600 hover:text-sky-700"
              >
                View all
              </Link>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to={`/products/${item.id}`}
                  className="rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <h3 className="text-lg font-semibold text-slate-900">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {formatPrice(item.discount_price || item.price)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">
            Product not found.
          </p>
          <Link
            to="/products"
            className="mt-4 inline-flex rounded-full bg-sky-600 px-6 py-3 text-white transition hover:bg-sky-700"
          >
            Back to products
          </Link>
        </div>
      )}
    </main>
  );
}

export default ProductDetailsPage;
