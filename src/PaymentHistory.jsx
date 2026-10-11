
import { useCallback, useEffect, useState } from "react";
import "./PaymentHistory.css";

const API_URL =
  "https://gigconnect-backend-in1g.onrender.com/api/payments";

function getLoggedInUser() {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Unable to read logged-in user:", error);
    return null;
  }
}

export default function PaymentHistory({ user: userProp }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [storedUser] = useState(getLoggedInUser);
  const user = userProp ?? storedUser;

  const userId =
    user?.id ??
    user?.userId ??
    user?.user_id ??
    user?.user?.id ??
    null;

  const role = String(
    user?.role ?? user?.userRole ?? user?.user?.role ?? ""
  )
    .replace(/^ROLE_/i, "")
    .trim()
    .toUpperCase();

  const isClient = role === "CLIENT";
  const isFreelancer = role === "FREELANCER";

  const loadPayments = useCallback(async () => {
    if (userId == null || String(userId).trim() === "") {
      setPayments([]);
      setError("Your account ID is missing. Please log out and log in again.");
      setLoading(false);
      return;
    }

    if (!isClient && !isFreelancer) {
      setPayments([]);
      setError(`Your account role could not be identified. Detected role: "${role || "missing"}".`);
      setLoading(false);
      return;
    }

    const endpoint = isClient
      ? `${API_URL}/client/${encodeURIComponent(userId)}`
      : `${API_URL}/freelancer/${encodeURIComponent(userId)}`;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(endpoint);
      const responseText = await response.text();

      let data = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        throw new Error(
          `The payment server returned an invalid response (HTTP ${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Unable to load payment history (HTTP ${response.status}).`
        );
      }

      if (!Array.isArray(data)) {
        throw new Error(
          "The payment API did not return a list of payments. Please check the backend."
        );
      }

      const currentUserId = String(userId);

      const accountPayments = data.filter((payment) => {
        const paymentUserId = isClient
          ? payment.clientId ??
            payment.client?.id ??
            payment.client?.userId
          : payment.freelancerId ??
            payment.freelancer?.id ??
            payment.freelancer?.userId;

        return (
          paymentUserId != null &&
          String(paymentUserId) === currentUserId
        );
      });

      setPayments(accountPayments);
    } catch (err) {
      console.error("Payment history error:", err);
      setPayments([]);
      setError(
        err.message ||
          "Unable to load payment history. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [userId, isClient, isFreelancer, role]);

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

    if (Number.isNaN(parsedDate.getTime())) return "—";

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
            disabled={loading}
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
              <strong>₹{formatAmount(totalAmount)}</strong>
            </div>

            <div>
              <span className="payment-summary-label">Transactions</span>
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
                          : payment.gig?.id != null
                          ? `#${payment.gig.id}`
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

