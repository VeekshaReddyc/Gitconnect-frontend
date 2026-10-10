import { useCallback, useEffect, useState } from "react";
import "./PaymentHistory.css";

const API_URL = "http://localhost:8081/api/payments";

export default function PaymentHistory({ user }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = user?.id;
  const role = user?.role?.toUpperCase();

  const isClient = role === "CLIENT";
  const isFreelancer = role === "FREELANCER";

  const loadPayments = useCallback(async () => {
    if (!userId || (!isClient && !isFreelancer)) {
      setPayments([]);
      setError("Please log in with a client or freelancer account.");
      setLoading(false);
      return;
    }

    const endpoint = isClient
      ? `${API_URL}/client/${userId}`
      : `${API_URL}/freelancer/${userId}`;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(endpoint);
      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load payment history."
        );
      }

      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load payment history.");
    } finally {
      setLoading(false);
    }
  }, [userId, isClient, isFreelancer]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const totalAmount = payments.reduce((total, payment) => {
    const status = String(payment.status || "").toUpperCase();

    if (status === "PAID" || status === "COMPLETED" ||
        status === "SUCCESS" || status === "RECORDED") {
      return total + Number(payment.amount || 0);
    }

    return total;
  }, 0);

  if (loading) {
    return (
      <main className="payment-history">
        <p className="payment-message">Loading payment history...</p>
      </main>
    );
  }

  return (
    <main className="payment-history">
      <header className="payment-history-header">
        <div>
          <p className="payment-eyebrow">GIGCONNECT</p>
          <h1>{isClient ? "Payments Made" : "Payments Received"}</h1>
          <p className="payment-subtitle">
            {isClient
              ? "Review payments recorded for your projects."
              : "Track payments recorded for your freelance work."}
          </p>
        </div>

        <button
          className="payment-refresh"
          type="button"
          onClick={loadPayments}
        >
          ↻ Refresh
        </button>
      </header>

      <section className="payment-summary">
        <div>
          <span className="payment-summary-label">
            {isClient ? "Total Recorded Payments" : "Total Recorded Earnings"}
          </span>
          <strong>
            ₹{totalAmount.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </strong>
        </div>

        <div>
          <span className="payment-summary-label">Transactions</span>
          <strong>{payments.length}</strong>
        </div>
      </section>

      {error && (
        <div className="payment-error" role="alert">
          {error}
        </div>
      )}

      {!error && payments.length === 0 && (
        <section className="payment-empty">
          <div className="payment-empty-icon">₹</div>
          <h2>No payments yet</h2>
          <p>
            {isClient
              ? "Your recorded project payments will appear here."
              : "Payments recorded for your completed work will appear here."}
          </p>
        </section>
      )}

      {!error && payments.length > 0 && (
        <section className="payment-table-wrapper">
          <table className="payment-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Gig ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment Date</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>#{payment.id}</td>
                  <td>#{payment.gigId ?? "—"}</td>
                  <td className="payment-amount">
                    {payment.amount != null
                      ? `₹${Number(payment.amount).toLocaleString("en-IN")}`
                      : "—"}
                  </td>
                  <td>
                    <span
                      className={`payment-status status-${String(
                        payment.status || "unknown"
                      ).toLowerCase()}`}
                    >
                      {payment.status || "Unknown"}
                    </span>
                  </td>
                  <td>
                    {payment.paymentDate
                      ? new Date(payment.paymentDate).toLocaleString("en-IN")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}