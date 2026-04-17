import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/my-orders.css";
import { apiFetch } from "../utils/api";

function MyOrders() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    apiFetch(`/orders/my-orders/${user._id}`, {}, logout)
      .then((res) => res.json())
      .then((data) => setOrders(data));
  }, [user, navigate]);

  return (
    <div className="my-orders-page">
      <h2>My Orders</h2>
      <p className="page-sub">Track your medicine orders and their delivery status.</p>

      {orders.length === 0 ? (
        <p className="no-orders">You haven't placed any orders yet.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div className="order-card" key={order._id}>
              <div className="order-header">
                <span className="order-id">Order #{order._id.slice(-8).toUpperCase()}</span>
                <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="order-items">
                {order.items.map((item, i) => (
                  <div className="order-item" key={i}>
                    <span>{item.name}</span>
                    <span>× {item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="order-summary">
                <p><b>Total:</b> ₹{order.totalAmount}</p>
                <p>
                  <b>Payment:</b>{" "}
                  <span className={`badge ${order.paymentStatus}`}>
                    {order.paymentStatus === "confirmed_by_doctor" ? "Confirmed" : order.paymentStatus}
                  </span>
                </p>
                <p>
                  <b>Status:</b>{" "}
                  <span className={`badge ${order.orderStatus}`}>{order.orderStatus}</span>
                </p>
                {order.trackingId && (
                  <p><b>IndiaPost Tracking:</b> {order.trackingId}</p>
                )}
              </div>

              <div className="order-address">
                <b>Shipping to:</b> {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyOrders;
