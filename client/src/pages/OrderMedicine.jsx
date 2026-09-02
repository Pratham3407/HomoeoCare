import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import "../styles/order-medicine.css";
import "../styles/error-states.css";
import { apiFetch } from "../utils/api";
import { validate } from "../utils/errors";

function OrderMedicine() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [medicines, setMedicines] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [address, setAddress] = useState({ street: "", city: "", state: "", pincode: "" });
  const [errors, setErrors] = useState({});
  const [isPlacing, setIsPlacing] = useState(false);

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
      .then((res) => {
        if (res.ok) setMedicines(res.data);
        else if (res.message) toast.error(res.message);
      });
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

    // Client-side validation
    const fieldErrors = {};
    if (!address.street || !address.street.trim()) fieldErrors.street = "Please enter your street address.";
    if (!address.city || !address.city.trim()) fieldErrors.city = "Please enter your city.";
    if (!address.state || !address.state.trim()) fieldErrors.state = "Please enter your state.";
    const pinError = validate.pincode(address.pincode);
    if (pinError) fieldErrors.pincode = pinError;

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      const firstKey = Object.keys(fieldErrors)[0];
      const el = document.getElementById(`shipping-${firstKey}`);
      if (el) setTimeout(() => el.focus(), 0);
      return;
    }

    setErrors({});
    setIsPlacing(true);

    try {
      const result = await apiFetch(`/orders`, {
        method: "POST",
        body: JSON.stringify({
          patientId: user._id,
          items: cart,
          totalAmount,
          shippingAddress: address,
        }),
      }, logout);

      if (result.ok) {
        toast.success("Order placed successfully.");
        setCart([]);
        setShowCheckout(false);
        setAddress({ street: "", city: "", state: "", pincode: "" });
        setTimeout(() => navigate("/profile?tab=orders"), 1500);
      } else {
        if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
          const mapped = {};
          Object.entries(result.fieldErrors).forEach(([k, v]) => {
            if (["street", "city", "state", "pincode"].includes(k)) {
              mapped[k] = v;
            } else {
              toast.error(v);
            }
          });
          setErrors(mapped);
        } else {
          toast.error(result.message);
        }
      }
    } catch {
      toast.error("We couldn't place your order right now. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
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
              <button className="checkout-btn" onClick={() => { setShowCheckout(true); setErrors({}); }}>
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
            <form onSubmit={handlePlaceOrder} noValidate>
              <input
                id="shipping-street"
                name="street"
                aria-label="Street or house number"
                aria-invalid={errors.street ? "true" : "false"}
                aria-describedby={errors.street ? "shipping-street-error" : undefined}
                placeholder="Street / House No."
                className={errors.street ? "input-error" : ""}
                value={address.street}
                onChange={(e) => {
                  setAddress({ ...address, street: e.target.value });
                  clearFieldError("street");
                }}
              />
              {errors.street && (
                <p id="shipping-street-error" className="field-error" role="alert">{errors.street}</p>
              )}
              <input
                id="shipping-city"
                name="city"
                aria-label="City"
                aria-invalid={errors.city ? "true" : "false"}
                aria-describedby={errors.city ? "shipping-city-error" : undefined}
                placeholder="City"
                className={errors.city ? "input-error" : ""}
                value={address.city}
                onChange={(e) => {
                  setAddress({ ...address, city: e.target.value });
                  clearFieldError("city");
                }}
              />
              {errors.city && (
                <p id="shipping-city-error" className="field-error" role="alert">{errors.city}</p>
              )}
              <input
                id="shipping-state"
                name="state"
                aria-label="State"
                aria-invalid={errors.state ? "true" : "false"}
                aria-describedby={errors.state ? "shipping-state-error" : undefined}
                placeholder="State"
                className={errors.state ? "input-error" : ""}
                value={address.state}
                onChange={(e) => {
                  setAddress({ ...address, state: e.target.value });
                  clearFieldError("state");
                }}
              />
              {errors.state && (
                <p id="shipping-state-error" className="field-error" role="alert">{errors.state}</p>
              )}
              <input
                id="shipping-pincode"
                name="pincode"
                aria-label="Pincode"
                aria-invalid={errors.pincode ? "true" : "false"}
                aria-describedby={errors.pincode ? "shipping-pincode-error" : undefined}
                placeholder="Pincode"
                className={errors.pincode ? "input-error" : ""}
                inputMode="numeric"
                value={address.pincode}
                onChange={(e) => {
                  setAddress({ ...address, pincode: e.target.value.replace(/\D/g, "") });
                  clearFieldError("pincode");
                }}
              />
              {errors.pincode && (
                <p id="shipping-pincode-error" className="field-error" role="alert">{errors.pincode}</p>
              )}
              <p className="payment-note">
                Payment is done directly to the doctor (UPI/Bank Transfer). The doctor will confirm once received.
              </p>
              <div className="modal-actions">
                <button type="submit" disabled={isPlacing} style={{ opacity: isPlacing ? 0.7 : 1, cursor: isPlacing ? "not-allowed" : "pointer" }}>
                  {isPlacing ? "Placing order..." : `Place Order — ₹${totalAmount}`}
                </button>
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