const PRODUCTS = "http://localhost:3000/products";
const CART = "http://localhost:3000/cart";

// Load Products
async function loadProducts() {
  const products = await (await fetch(PRODUCTS)).json();
  const container = document.querySelector(".products");
  if (!container) return;

  container.innerHTML = products.map(p => `
    <div class="product-card">
      <img src="${p.image}" alt="${p.name}" />
      <h3>${p.name}</h3>
      <p>${p.brand}</p>
      <p>${p.description}</p>
      <p>$${p.price}</p>
      <button onclick="addToCart(${p.id})">Add to Cart</button>
    </div>
  `).join("");
}
// Add to Cart
async function addToCart(id) {
  const product = await (await fetch(`${PRODUCTS}/${id}`)).json();
  const existing = await (await fetch(`${CART}?productId=${product.id}`)).json();

  if (existing.length) {
    let item = existing[0];
    await fetch(`${CART}/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: item.quantity + 1 })
    });
  } else {
    await fetch(CART, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, productId: product.id, quantity: 1 })
    });
  }
  loadCart();
  updateCartCount();
}
// Load Cart
async function loadCart() {
  const cart = await (await fetch(CART)).json();
  const table = document.getElementById("cart-items");
  const subtotalEl = document.getElementById("subtotal");
  if (!table) return;

  let subtotal = 0;
  table.innerHTML = cart.map(item => {
    let total = item.price * item.quantity;
    subtotal += total;
    return `
      <tr>
        <td><img src="${item.image}" width="60"></td>
        <td>${item.name}</td>
        <td>${item.brand}</td>
        <td>${item.description}</td>
        <td>$${item.price}</td>
        <td><input type="number" value="${item.quantity}" min="1"
          onchange="changeQuantity(${item.id}, this.value)"></td>
        <td>$${total.toFixed(2)}</td>
        <td><button class="remove-btn" onclick="removeFromCart(${item.id})">❌</button></td>
      </tr>
    `;
  }).join("");
  subtotalEl.textContent = subtotal.toFixed(2);
}
// Change Quantity
async function changeQuantity(id, qty) {
  qty = parseInt(qty);
  await fetch(`${CART}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity: qty })
  });
  loadCart();
  updateCartCount();
}
// Remove row from cart
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-btn")) {
    e.target.closest("tr").remove();
    updateSubtotal();
    updateCartCount();
  }
});
// Update Cart Count
async function updateCartCount() {
  const cart = await (await fetch(CART)).json();
  const total = cart.reduce((s, i) => s + i.quantity, 0);
  document.querySelectorAll(".cart").forEach(c => c.textContent = `Cart (${total})`);
}
// Checkout
document.addEventListener("DOMContentLoaded", () => {
  const checkoutForm = document.querySelector("#checkout-form");

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.querySelector("#name")?.value.trim();
      const email = document.querySelector("#email")?.value.trim();
      const payment = document.querySelector("#payment")?.value;

      if (!name || !email || !payment) {
        alert("Please fill all fields before placing your order.");
        return;
      }

      const msg = document.querySelector("#order-message");
      
  // Clear cart 
      const cart = await (await fetch(CART)).json();
      for (let item of cart) {
        await fetch(`${CART}/${item.id}`, { method: "DELETE" });
      }
      loadCart();
      updateCartCount();

      if (msg) {
        msg.textContent = "Order placed successfully! Thank you for shopping with us! Your order is on its way.";
        msg.style.color = "green";
        msg.style.fontWeight = "bold";
      }

      checkoutForm.reset();
    });
  }

  if (document.querySelector(".products")) loadProducts();
  if (document.getElementById("cart-items")) loadCart();
  updateCartCount();
});
