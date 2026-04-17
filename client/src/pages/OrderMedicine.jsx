import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import "../styles/order-medicine.css";
import { apiFetch } from "../utils/api";

function OrderMedicine() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [medicines, setMedicines] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [address, setAddress] = useState({ street: "", city: "", state: "", pincode: "" });

  useEffect(() => {
    if (!user) {
      toast.error("Please login to order medicines");
      navigate("/login");
      return;
    }
    if (user.role !== "patient") {
      toast.error("Only patients can order medicines");
      navigate("/");
      return;
    }

    apiFetch(`/medicines`, {}, logout)
      .then((res) => res.json())
      .then((data) => setMedicines(data));
  }, [user, navigate]);

  const addToCart = (med) => {
    const existing = cart.find((item) => item.medicineId === med._id);
    if (existing) {
      setCart(cart.map((item) =>
        item.medicineId === med._id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { medicineId: med._id, name: med.name, price: med.price, quantity: 1 }]);
    }
    toast.success(`${med.name} added to cart`);
  };

  const removeFromCart = (medicineId) => {
    setCart(cart.filter((item) => item.medicineId !== medicineId));
  };

  const updateQuantity = (medicineId, qty) => {
    if (qty < 1) return;
    setCart(cart.map((item) =>
      item.medicineId === medicineId ? { ...item, quantity: qty } : item
    ));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!address.street || !address.city || !address.state || !address.pincode) {
      toast.error("Please fill in the full shipping address");
      return;
    }

    try {
      const res = await apiFetch(`/orders`, {
        method: "POST",
        body: JSON.stringify({
          patientId: user._id,
          items: cart,
          totalAmount,
          shippingAddress: address,
        }),
      }, logout);

      const data = await res.json();

      if (res.ok) {
        toast.success("Order placed successfully!");
        setCart([]);
        setShowCheckout(false);
        setAddress({ street: "", city: "", state: "", pincode: "" });
        setTimeout(() => navigate("/profile?tab=orders"), 1500);
      } else {
        toast.error(data.message || "Failed to place order");
      }
    } catch (error) {
      toast.error("Error placing order");
    }
  };

  return (
    <div className="order-medicine-page">
      <h2>Order Medicines</h2>
      <p className="page-sub">Browse available medicines and place your order. Payment is made directly to the doctor.</p>

      <div className="order-layout">
        {/* Medicine list */}
        <div className="medicine-list">
          {medicines.length === 0 && <p>No medicines available at the moment.</p>}
          {medicines.map((med) => (
            <div className="med-card" key={med._id}>
              <div className="med-info">
                <h3>{med.name}</h3>
                {med.description && <p className="med-desc">{med.description}</p>}
                <p className="med-price">₹{med.price}</p>
                {med.stock > 0 ? (
                  <span className="in-stock">In Stock ({med.stock})</span>
                ) : (
                  <span className="out-stock">Out of Stock</span>
                )}
              </div>
              <button
                className="add-btn"
                onClick={() => addToCart(med)}
                disabled={med.stock === 0}
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>

        {/* Cart */}
        <div className="cart-section">
          <h3>Your Cart ({cart.length})</h3>
          {cart.length === 0 ? (
            <p className="empty-cart">Your cart is empty</p>
          ) : (
            <>
              {cart.map((item) => (
                <div className="cart-item" key={item.medicineId}>
                  <div className="cart-item-info">
                    <span className="cart-item-name">{item.name}</span>
                    <span className="cart-item-price">₹{item.price} × {item.quantity}</span>
                  </div>
                  <div className="cart-item-controls">
                    <button onClick={() => updateQuantity(item.medicineId, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.medicineId, item.quantity + 1)}>+</button>
                    <button className="remove-btn" onClick={() => removeFromCart(item.medicineId)}>×</button>
                  </div>
                </div>
              ))}
              <div className="cart-total">
                <b>Total: ₹{totalAmount}</b>
              </div>
              <button className="checkout-btn" onClick={() => setShowCheckout(true)}>
                Proceed to Checkout
              </button>
            </>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="modal-overlay">
          <div className="checkout-modal">
            <h3>Shipping Address</h3>
            <form onSubmit={handlePlaceOrder}>
              <input
                placeholder="Street / House No."
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                required
              />
              <input
                placeholder="City"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                required
              />
              <input
                placeholder="State"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                required
              />
              <input
                placeholder="Pincode"
                value={address.pincode}
                onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                required
              />
              <p className="payment-note">
                💳 Payment is done directly to the doctor (UPI/Bank Transfer). The doctor will confirm once received.
              </p>
              <div className="modal-actions">
                <button type="submit">Place Order — ₹{totalAmount}</button>
                <button type="button" className="btn-cancel" onClick={() => setShowCheckout(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderMedicine;
