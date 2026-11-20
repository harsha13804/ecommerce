let products = [];
let cart = JSON.parse(localStorage.getItem("shoppy_cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("velora_wishlist")) || [];
let currentUser = null;
let isRegisterMode = false;
let selectedCategory = "All";

const productGrid = document.getElementById("product-grid");
const searchInput = document.getElementById("search-input");
const sortSelect = document.getElementById("sort-select");
const catalogHeading = document.getElementById("catalog-heading");
const productCount = document.getElementById("product-count");

const cartDrawer = document.getElementById("cart-drawer");
const cartCount = document.getElementById("cart-count");
const cartItemsEl = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");

const productModal = document.getElementById("product-modal");
const productDetailBody = document.getElementById("product-detail-body");

const authBtn = document.getElementById("auth-btn");
const ordersBtn = document.getElementById("orders-btn");
const authModal = document.getElementById("auth-modal");
const authForm = document.getElementById("auth-form");
const authError = document.getElementById("auth-error");

const checkoutModal = document.getElementById("checkout-modal");
const checkoutForm = document.getElementById("checkout-form");
const checkoutError = document.getElementById("checkout-error");

const ordersModal = document.getElementById("orders-modal");
const ordersList = document.getElementById("orders-list");

const formatINR = (num) => `₹${Number(num).toLocaleString("en-IN")}`;

function showToast(msg) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

window.filterByQuickCat = function (cat) {
  selectedCategory = cat;
  document.querySelectorAll(".cat-tab").forEach((b) => {
    b.classList.toggle("active", b.dataset.cat === cat);
  });
  loadProducts();
  document.getElementById("catalog-section").scrollIntoView({ behavior: "smooth" });
};

async function loadProducts() {
  const q = encodeURIComponent(searchInput.value.trim());
  const category = encodeURIComponent(selectedCategory);
  const sort = encodeURIComponent(sortSelect.value);

  const res = await fetch(`/api/products?q=${q}&category=${category}&sort=${sort}`);
  products = await res.json();

  catalogHeading.textContent = selectedCategory === "All" ? "All Products" : `${selectedCategory} Collection`;
  productCount.textContent = `${products.length} item${products.length === 1 ? "" : "s"}`;
  renderProducts();
}

function renderProducts() {
  if (!products.length) {
    productGrid.innerHTML = "<p style='color:#64748b;'>No products match your filter.</p>";
    return;
  }

  productGrid.innerHTML = products
    .map((p) => {
      const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
      const isLiked = wishlist.includes(p.id);
      return `
      <div class="product-card">
        <div class="card-media" onclick="openProductDetail(${p.id})">
          <img src="${p.image_url}" alt="${p.name}" onerror="this.src='https://placehold.co/600x400?text=Product'" />
          ${discount > 0 ? `<span class="discount-pill">-${discount}%</span>` : ""}
          <button class="wish-btn ${isLiked ? "liked" : ""}" onclick="event.stopPropagation(); toggleWishlist(${p.id})" title="Wishlist">
            ${isLiked ? "♥" : "♡"}
          </button>
        </div>

        <div class="card-body">
          <div>
            <div class="card-meta">
              <span>${p.category}</span>
              <span class="card-rating">★ ${p.rating.toFixed(1)}</span>
            </div>
            <h3 class="card-title" onclick="openProductDetail(${p.id})">${p.name}</h3>
          </div>

          <div>
            <div class="card-price-row">
              <span class="price">${formatINR(p.price)}</span>
              ${discount > 0 ? `<span class="mrp">${formatINR(p.mrp)}</span>` : ""}
            </div>
            <button
              class="add-bag-btn"
              ${p.stock === 0 ? "disabled" : ""}
              onclick="addToCart(${p.id})"
            >
              ${p.stock > 0 ? "Add to Bag" : "Out of Stock"}
            </button>
          </div>
        </div>
      </div>`;
    })
    .join("");
}

window.toggleWishlist = function (id) {
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter((w) => w !== id);
    showToast("Removed from wishlist");
  } else {
    wishlist.push(id);
    showToast("Saved to wishlist ♥");
  }
  localStorage.setItem("velora_wishlist", JSON.stringify(wishlist));
  renderProducts();
};

window.openProductDetail = function (productId) {
  const p = products.find((item) => item.id === productId);
  if (!p) return;
  const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

  productDetailBody.innerHTML = `
    <img src="${p.image_url}" alt="${p.name}" />
    <div>
      <div class="card-meta" style="margin-bottom:0.5rem;">
        <span>${p.category}</span>
        <span class="card-rating">★ ${p.rating.toFixed(1)} Rating</span>
      </div>
      <h2 style="margin-bottom:0.65rem; font-size:1.5rem;">${p.name}</h2>
      <div class="card-price-row" style="margin-bottom:1rem;">
        <span class="price" style="font-size:1.6rem;">${formatINR(p.price)}</span>
        ${discount > 0 ? `<span class="mrp">${formatINR(p.mrp)}</span><span style="color:#059669; font-weight:700; font-size:0.9rem;">Save ${discount}%</span>` : ""}
      </div>
      <p style="color:#475569; line-height:1.6; margin-bottom:1.2rem;">${p.description || ""}</p>
      <p style="font-size:0.85rem; color:${p.stock > 0 ? "#059669" : "#e11d48"}; font-weight:600; margin-bottom:1rem;">
        ${p.stock > 0 ? `✓ In stock (${p.stock} available)` : "Currently out of stock"}
      </p>
      <button class="btn-dark full-width" ${p.stock === 0 ? "disabled" : ""} onclick="addToCart(${p.id}); productModal.classList.add('hidden');">
        ${p.stock > 0 ? "Add to Bag" : "Out of Stock"}
      </button>
    </div>
  `;
  productModal.classList.remove("hidden");
};

document.querySelectorAll(".cat-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cat-tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedCategory = btn.dataset.cat;
    loadProducts();
  });
});

function saveCart() {
  localStorage.setItem("shoppy_cart", JSON.stringify(cart));
  renderCart();
}

window.addToCart = function (productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const existing = cart.find((item) => item.product_id === productId);
  if (existing) {
    if (existing.quantity < product.stock) {
      existing.quantity += 1;
    } else {
      showToast("Maximum available stock reached");
      return;
    }
  } else {
    cart.push({ product_id: product.id, name: product.name, price: product.price, quantity: 1 });
  }
  saveCart();
  showToast(`Added "${product.name}" to bag`);
};

window.updateQty = function (productId, delta) {
  const item = cart.find((i) => i.product_id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter((i) => i.product_id !== productId);
  }
  saveCart();
};

function renderCart() {
  const totalCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  cartCount.textContent = totalCount;
  cartTotalEl.textContent = formatINR(totalAmount);

  if (!cart.length) {
    cartItemsEl.innerHTML = "<p style='color:#64748b;'>Your bag is currently empty.</p>";
    return;
  }

  cartItemsEl.innerHTML = cart
    .map(
      (item) => `
      <div class="cart-item">
        <div>
          <strong style="font-size:0.95rem;">${item.name}</strong>
          <div style="color:#64748b; font-size:0.85rem;">${formatINR(item.price)} × ${item.quantity}</div>
        </div>
        <div class="qty-controls">
          <button onclick="updateQty(${item.product_id}, -1)">-</button>
          <span>${item.quantity}</span>
          <button onclick="updateQty(${item.product_id}, 1)">+</button>
        </div>
      </div>`
    )
    .join("");
}

async function checkSession() {
  const res = await fetch("/api/me");
  const data = await res.json();
  if (data.id) {
    currentUser = data;
    authBtn.textContent = `Sign Out (${data.name})`;
    ordersBtn.classList.remove("hidden");
  } else {
    currentUser = null;
    authBtn.textContent = "Sign In";
    ordersBtn.classList.add("hidden");
  }
}

authBtn.addEventListener("click", async () => {
  if (currentUser) {
    await fetch("/api/logout", { method: "POST" });
    await checkSession();
    showToast("Signed out successfully");
  } else {
    authError.textContent = "";
    authModal.classList.remove("hidden");
  }
});

document.getElementById("toggle-auth-mode").addEventListener("click", (e) => {
  e.preventDefault();
  isRegisterMode = !isRegisterMode;
  document.getElementById("auth-title").textContent = isRegisterMode ? "Create account" : "Welcome back";
  document.getElementById("name-group").classList.toggle("hidden", !isRegisterMode);
  document.getElementById("auth-switch-msg").textContent = isRegisterMode
    ? "Already have an account?"
    : "New to HVR Sales?";
  e.target.textContent = isRegisterMode ? "Sign in" : "Create an account";
  authError.textContent = "";
});

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.textContent = "";
  const endpoint = isRegisterMode ? "/api/register" : "/api/login";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("auth-name").value,
      email: document.getElementById("auth-email").value,
      password: document.getElementById("auth-password").value,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    authError.textContent = data.error || "Authentication failed";
    return;
  }
  authModal.classList.add("hidden");
  authForm.reset();
  await checkSession();
  showToast(`Welcome, ${data.name}!`);
});

document.getElementById("checkout-btn").addEventListener("click", () => {
  if (!cart.length) return showToast("Your bag is empty");
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  document.getElementById("checkout-summary").innerHTML = `
    <strong>Items:</strong> ${cart.reduce((s, i) => s + i.quantity, 0)} <br/>
    <strong>Total Payable:</strong> ${formatINR(total)}
  `;
  if (currentUser) {
    document.getElementById("ship-name").value = currentUser.name;
    document.getElementById("ship-email").value = currentUser.email;
  }
  checkoutError.textContent = "";
  cartDrawer.classList.add("hidden");
  checkoutModal.classList.remove("hidden");
});

checkoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  checkoutError.textContent = "";
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: document.getElementById("ship-name").value,
      customer_email: document.getElementById("ship-email").value,
      shipping_address: document.getElementById("ship-address").value,
      items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    checkoutError.textContent = data.error || "Checkout failed";
    return;
  }
  showToast(`Order #${data.order_id} confirmed!`);
  cart = [];
  saveCart();
  checkoutModal.classList.add("hidden");
  checkoutForm.reset();
  loadProducts();
});

ordersBtn.addEventListener("click", async () => {
  const res = await fetch("/api/orders");
  const orders = await res.json();
  ordersList.innerHTML = !orders.length
    ? "<p style='color:#64748b;'>You have not placed any orders yet.</p>"
    : orders
        .map(
          (o) => `
        <div class="order-card">
          <div><strong>Order #${o.id}</strong> — ${o.status} (${o.created_at})</div>
          <div style="margin:0.25rem 0;"><strong>Total:</strong> ${formatINR(o.total_amount)}</div>
          <div><small style="color:#64748b;">Address: ${o.shipping_address}</small></div>
          <ul style="margin-top:0.5rem; padding-left:1.2rem; font-size:0.9rem;">
            ${o.items.map((it) => `<li>${it.product_name} × ${it.quantity} (${formatINR(it.unit_price)})</li>`).join("")}
          </ul>
        </div>`
        )
        .join("");
  ordersModal.classList.remove("hidden");
});

document.getElementById("cart-btn").addEventListener("click", () => cartDrawer.classList.remove("hidden"));
document.getElementById("close-cart").addEventListener("click", () => cartDrawer.classList.add("hidden"));
document.getElementById("close-auth").addEventListener("click", () => authModal.classList.add("hidden"));
document.getElementById("close-checkout").addEventListener("click", () => checkoutModal.classList.add("hidden"));
document.getElementById("close-orders").addEventListener("click", () => ordersModal.classList.add("hidden"));
document.getElementById("close-product-modal").addEventListener("click", () => productModal.classList.add("hidden"));

searchInput.addEventListener("input", loadProducts);
sortSelect.addEventListener("change", loadProducts);

checkSession();
loadProducts();
renderCart();   