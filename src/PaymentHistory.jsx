import { useCallback, useEffect, useState } from "react";
import "./PaymentHistory.css";

const API_URL = "http://localhost:8081/api/payments";

export default function PaymentHistory({ user }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Read the currently logged-in user's information.
  const userId = user?.id ?? user?.userId ?? null;

  const role = String(user?.role ?? user?.userRole ?? "")
    .replace(/^ROLE_/, "")
    .trim()
    .toUpperCase();

  const isClient = role === "CLIENT";
  const isFreelancer = role === "FREELANCER";

  const loadPayments = useCallback(async () => {
    if (!userId || (!isClient && !isFreelancer)) {
      setPayments([]);
      setError(
        !userId
          ? "Your account ID could not be found. Please log out and log in again."
          : "Payment history is available for client and freelancer accounts."
      );
      setLoading(false);
      return;
    }

    const endpoint = isClient
      ? `${API_URL}/client/${encodeURIComponent(userId)}`
      : `${API_URL}/freelancer/${encodeURIComponent(userId)}`;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(endpoint);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to load payment history."
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("The server returned an invalid payment history.");
      }

      /*
       * Extra frontend filtering:
       * Clients see only payments where clientId matches their ID.
       * Freelancers see only payments where freelancerId matches their ID.
       */
      const currentUserId = String(userId);

      const accountPayments = data.filter((payment) => {
        if (isClient) {
          return String(payment.clientId) === currentUserId;
        }

        if (isFreelancer) {
          return String(payment.freelancerId) === currentUserId;
        }

        return false;
      });

      setPayments(accountPayments);
    } catch (err) {
      setPayments([]);
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

    if (
      ["PAID", "COMPLETED", "SUCCESS", "RECORDED"].includes(status)
    ) {
      return total + Number(payment.amount || 0);
    }

    return total;
  }, 0);

  const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <main className="payment-history">
        <p className="payment-message" role="status">
          Loading payment history...
        </p>
      </main>
    );
  }

  return (
    <main className="payment-history">
      <header className="payment-history-header">
        <div>
          <p className="payment-eyebrow">GIGCONNECT</p>

          <h1>
            {isClient ? "Payments Made" : "Payments Received"}
          </h1>

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
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </header>

      {error && (
        <div className="payment-error" role="alert">
          <p>{error}</p>

          <button
            type="button"
            className="payment-retry"
            onClick={loadPayments}
          >
            Try again
          </button>
        </div>
      )}

      {!error && (
        <>
          <section className="payment-summary">
            <div>
              <span className="payment-summary-label">
                {isClient
                  ? "Total Recorded Payments"
                  : "Total Recorded Earnings"}
              </span>

              <strong>
                ₹{formatAmount(totalAmount)}
              </strong>
            </div>

            <div>
              <span className="payment-summary-label">
                Transactions
              </span>

              <strong>{payments.length}</strong>
            </div>
          </section>

          {payments.length === 0 ? (
            <section className="payment-empty">
              <div className="payment-empty-icon">₹</div>

              <h2>No payments yet</h2>

              <p>
                {isClient
                  ? "Payments you make for your projects will appear here."
                  : "Payments recorded for your completed freelance work will appear here."}
              </p>
            </section>
          ) : (
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

                      <td>
                        {payment.gigId != null
                          ? `#${payment.gigId}`
                          : "—"}
                      </td>

                      <td className="payment-amount">
                        ₹{formatAmount(payment.amount)}
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

                      <td>{formatDate(payment.paymentDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </main>
  );
}