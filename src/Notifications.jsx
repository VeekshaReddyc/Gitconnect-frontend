
import { useEffect, useRef, useState } from "react";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
  });

  const wrapperRef = useRef(null);
  const bellRef = useRef(null);
  const dropdownRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!user.id || user.role?.toUpperCase() !== "FREELANCER") {
      return;
    }

    const fetchNotifications = async () => {
      try {
        const response = await fetch(
          `http://localhost:8081/api/notifications/freelancer/${user.id}`
        );

        if (!response.ok) {
          throw new Error("Unable to load notifications");
        }

        const data = await response.json();
        setNotifications(data);
        setError("");
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Could not load notifications.");
      }
    };

    fetchNotifications();

    const interval = setInterval(fetchNotifications, 10000);

    return () => clearInterval(interval);
  }, [user.id, user.role]);

  const positionDropdown = () => {
    if (!bellRef.current) return;

    const bellRect = bellRef.current.getBoundingClientRect();

    const screenPadding = 12;
    const gap = 8;
    const dropdownWidth = Math.min(350, window.innerWidth - screenPadding * 2);

    let left = bellRect.right - dropdownWidth;

    // Keep the dropdown completely inside the screen.
    left = Math.max(
      screenPadding,
      Math.min(left, window.innerWidth - dropdownWidth - screenPadding)
    );

    let top = bellRect.bottom + gap;

    // If there is insufficient space below, display it above the button.
    const availableBelow = window.innerHeight - top;
    const estimatedDropdownHeight = Math.min(
      dropdownRef.current?.scrollHeight || 400,
      window.innerHeight * 0.7
    );

    if (availableBelow < Math.min(estimatedDropdownHeight, 200)) {
      top = Math.max(
        screenPadding,
        bellRect.top - estimatedDropdownHeight - gap
      );
    }

    setDropdownPosition({ top, left });
  };

  useEffect(() => {
    if (!open) return;

    positionDropdown();

    const handleResize = () => positionDropdown();
    const handleScroll = () => positionDropdown();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, notifications.length, error]);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `http://localhost:8081/api/notifications/${notificationId}/read?freelancerId=${user.id}`,
        { method: "PATCH" }
      );

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
      alert("Could not mark notification as read. Check the backend.");
    }
  };

  if (user.role?.toUpperCase() !== "FREELANCER") {
    return null;
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  return (
    <div ref={wrapperRef} style={styles.wrapper}>
      <button
        ref={bellRef}
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        style={styles.bell}
        aria-expanded={open}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        🔔 Notifications
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount}</span>
        )}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          style={{
            ...styles.dropdown,
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
        >
          <div style={styles.header}>
            <h3 style={styles.heading}>Notifications</h3>

            <button
              type="button"
              onClick={() => setOpen(false)}
              style={styles.closeButton}
              aria-label="Close notifications"
            >
              ×
            </button>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          {!error && notifications.length === 0 && (
            <p style={styles.empty}>No notifications yet.</p>
          )}

          {notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                ...styles.item,
                background: notification.read ? "#ffffff" : "#eff6ff",
              }}
            >
              <strong style={styles.title}>{notification.title}</strong>

              <p style={styles.message}>{notification.message}</p>

              <small style={styles.date}>
                {notification.createdAt
                  ? new Date(notification.createdAt).toLocaleString()
                  : ""}
              </small>

              {!notification.read && (
                <button
                  type="button"
                  onClick={() => markAsRead(notification.id)}
                  style={styles.readButton}
                >
                  ✓ Mark as Read
                </button>
              )}

              {notification.read && (
                <p style={styles.readLabel}>✓ Read</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    position: "relative",
    display: "inline-block",
    zIndex: 1000,
  },

  bell: {
    position: "relative",
    border: "none",
    background: "#ffffff",
    color: "#1e3a8a",
    fontSize: "16px",
    cursor: "pointer",
    padding: "10px 14px",
    borderRadius: "8px",
    whiteSpace: "nowrap",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "8px",
    background: "#dc2626",
    color: "#ffffff",
    borderRadius: "50%",
    minWidth: "22px",
    height: "22px",
    fontSize: "12px",
  },

  dropdown: {
    position: "fixed",
    width: "min(350px, calc(100vw - 24px))",
    maxHeight: "70vh",
    overflowY: "auto",
    overflowX: "hidden",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#1f2937",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    boxShadow: "0 8px 25px rgba(0, 0, 0, 0.18)",
    padding: "12px",
    zIndex: 99999,
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "10px",
    marginBottom: "12px",
  },

  heading: {
    margin: 0,
    fontSize: "18px",
    color: "#1e3a8a",
  },

  closeButton: {
    border: "none",
    background: "transparent",
    color: "#6b7280",
    fontSize: "25px",
    cursor: "pointer",
    lineHeight: 1,
    padding: "2px 6px",
  },

  empty: {
    fontSize: "14px",
    color: "#6b7280",
    padding: "8px 0",
  },

  error: {
    color: "#dc2626",
    fontSize: "14px",
  },

  item: {
    padding: "12px",
    marginBottom: "8px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    overflowWrap: "anywhere",
    boxSizing: "border-box",
  },

  title: {
    display: "block",
    fontSize: "14px",
    color: "#1e3a8a",
    overflowWrap: "anywhere",
  },

  message: {
    fontSize: "14px",
    lineHeight: "1.5",
    overflowWrap: "anywhere",
    margin: "8px 0",
  },

  date: {
    display: "block",
    color: "#6b7280",
    fontSize: "12px",
    overflowWrap: "anywhere",
  },

  readButton: {
    display: "block",
    marginTop: "10px",
    padding: "8px 12px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },

  readLabel: {
    color: "#15803d",
    fontSize: "13px",
    marginBottom: 0,
  },
};

export default Notifications;

