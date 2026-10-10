
import { Link, useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const isFreelancer = String(user.role || "")
    .toUpperCase()
    .includes("FREELANCER");

  const links = [
    { label: "Dashboard", icon: "▦", to: "/dashboard" },
    ...(isFreelancer
      ? [
          { label: "Browse Gigs", icon: "⌕", to: "/browse-gigs" },
          { label: "My Applications", icon: "▤", to: "/freelancer-my-gigs" },
        ]
      : [
          { label: "Create a Gig", icon: "+", to: "/create-gig" },
          { label: "My Gigs", icon: "▤", to: "/my-gigs" },
        ]),
    { label: "Payment History", icon: "↗", to: "/payment-history" },
    { label: "My Profile", icon: "♙", to: "/profile" },
  ];

  function logout() {
    localStorage.removeItem("user");
    navigate("/login");
  }

  const colors = {
    navy: "#07152e",
    sidebar: "#0b1b38",
    blue: "#2459d3",
    brightBlue: "#4779ef",
    background: "#f2f5fb",
    white: "#ffffff",
    text: "#15233e",
    muted: "#8290a8",
    border: "#e5eaf3",
  };

  const cardStyle = {
    background: colors.white,
    border: `1px solid ${colors.border}`,
    borderRadius: "15px",
    padding: "23px",
    minWidth: 0,
    boxShadow: "0 4px 18px rgba(13, 35, 75, 0.035)",
    boxSizing: "border-box",
  };

  const buttonStyle = {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    background: colors.blue,
    color: "white",
    padding: "12px 17px",
    border: "1px solid #2459d3",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  };

  const navStyle = (active) => ({
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "12px 14px",
    borderRadius: "9px",
    textDecoration: "none",
    color: active ? "#ffffff" : "#a9b7d0",
    background: active
      ? "linear-gradient(100deg, #2459d3, #3268e3)"
      : "transparent",
    fontWeight: active ? 700 : 500,
    fontSize: "13px",
    transition: "background 0.2s ease",
    boxShadow: active ? "0 5px 14px rgba(36, 89, 211, 0.2)" : "none",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: colors.background,
        color: colors.text,
        fontFamily: "Inter, 'Segoe UI', Arial, sans-serif",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          width: "248px",
          flexShrink: 0,
          background: colors.sidebar,
          color: "white",
          padding: "27px 16px 20px",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        <Link
          to="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "11px",
            padding: "0 11px 35px",
            color: "white",
            textDecoration: "none",
          }}
        >
          <span
            style={{
              width: "39px",
              height: "39px",
              borderRadius: "11px",
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg, #4779ef, #2048b5)",
              fontSize: "22px",
              fontWeight: 900,
              boxShadow: "0 5px 16px rgba(36, 89, 211, 0.25)",
            }}
          >
            G
          </span>
          <span>
            <span style={{ display: "block", fontSize: "20px", fontWeight: 800 }}>
              GigConnect
            </span>
            <span
              style={{
                display: "block",
                marginTop: "3px",
                color: "#8195b8",
                fontSize: "9px",
                letterSpacing: "1.7px",
                fontWeight: 700,
              }}
            >
              FREELANCE PLATFORM
            </span>
          </span>
        </Link>

        <div
          style={{
            padding: "0 13px",
            marginBottom: "12px",
            color: "#7488aa",
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "1.5px",
          }}
        >
          WORKSPACE
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {links.map((item) => {
            const active = item.to === "/dashboard";

            return (
              <Link
                key={item.label}
                to={item.to}
                style={navStyle(active)}
              >
                <span
                  style={{
                    width: "21px",
                    textAlign: "center",
                    fontSize: "19px",
                  }}
                >
                  {item.icon}
                </span>
                {item.label}
                {item.label === "My Profile" && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: "9px",
                      background: "#1c3153",
                      color: "#b7c9ed",
                      padding: "4px 6px",
                      borderRadius: "5px",
                    }}
                  >
                    EDIT
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div
          style={{
            marginTop: "auto",
            paddingTop: "30px",
          }}
        >
          <div
            style={{
              padding: "17px",
              border: "1px solid #203758",
              borderRadius: "12px",
              background: "linear-gradient(145deg, #112748, #0d203f)",
              marginBottom: "16px",
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 750 }}>
              Your next opportunity awaits.
            </div>
            <p
              style={{
                fontSize: "11px",
                lineHeight: 1.7,
                color: "#9aacc9",
                margin: "9px 0 13px",
              }}
            >
              Keep your account details up to date and make the most of your
              workspace.
            </p>
            <Link
              to="/profile"
              style={{
                color: "#82a7ff",
                textDecoration: "none",
                fontSize: "11px",
                fontWeight: 750,
              }}
            >
              Account settings →
            </Link>
          </div>

          <button
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              width: "100%",
              padding: "12px 14px",
              border: "none",
              borderRadius: "9px",
              color: "#b6c3d9",
              background: "transparent",
              fontSize: "13px",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: "19px" }}>↪</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* TOP BAR */}
        <header
          style={{
            minHeight: "76px",
            boxSizing: "border-box",
            background: colors.white,
            borderBottom: `1px solid ${colors.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "15px",
            padding: "15px 34px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "10px",
                color: colors.muted,
                fontWeight: 700,
                letterSpacing: "1.2px",
              }}
            >
              GIGCONNECT / WORKSPACE
            </div>
            <div
              style={{
                fontSize: "17px",
                fontWeight: 800,
                marginTop: "5px",
                color: colors.navy,
              }}
            >
              Dashboard Overview
            </div>
          </div>

          <Link
            to="/profile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "11px",
              textDecoration: "none",
              color: colors.text,
            }}
          >
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "12px", fontWeight: 750 }}>
                {user.name || "GigConnect User"}
              </div>
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "10px",
                  color: colors.muted,
                }}
              >
                {user.role || "Member"}
              </div>
            </div>
            <div
              style={{
                width: "41px",
                height: "41px",
                display: "grid",
                placeItems: "center",
                borderRadius: "12px",
                color: "white",
                background: `linear-gradient(135deg, ${colors.blue}, ${colors.navy})`,
                fontWeight: 800,
                fontSize: "16px",
              }}
            >
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>
          </Link>
        </header>

        <main
          style={{
            maxWidth: "1450px",
            margin: "0 auto",
            padding: "32px",
            boxSizing: "border-box",
          }}
        >
          {/* PAGE INTRO */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "18px",
              marginBottom: "27px",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  color: colors.navy,
                  fontSize: "27px",
                  letterSpacing: "-0.8px",
                  fontWeight: 800,
                }}
              >
                Welcome back, {user.name || "there"}
              </h1>
              <p
                style={{
                  color: colors.muted,
                  fontSize: "13px",
                  marginTop: "9px",
                  lineHeight: 1.6,
                }}
              >
                Here's what's happening in your workspace today.
              </p>
            </div>

            <Link
              to={isFreelancer ? "/browse-gigs" : "/create-gig"}
              style={buttonStyle}
            >
              <span style={{ fontSize: "17px" }}>+</span>
              {isFreelancer ? "Explore Opportunities" : "Create New Gig"}
            </Link>
          </div>

          {/* HERO BANNER */}
          <section
            style={{
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "24px",
              padding: "30px",
              borderRadius: "16px",
              color: "white",
              background:
                "linear-gradient(115deg, #07152e 0%, #102d60 55%, #2459d3 100%)",
              marginBottom: "23px",
              boxShadow: "0 10px 26px rgba(7, 21, 46, 0.12)",
            }}
          >
            <div style={{ maxWidth: "560px", position: "relative", zIndex: 1 }}>
              <div
                style={{
                  display: "inline-block",
                  padding: "6px 9px",
                  borderRadius: "5px",
                  background: "rgba(255,255,255,0.12)",
                  color: "#c5d7ff",
                  fontSize: "9px",
                  fontWeight: 800,
                  letterSpacing: "1.5px",
                }}
              >
                YOUR PROFESSIONAL WORKSPACE
              </div>
              <h2
                style={{
                  fontSize: "25px",
                  lineHeight: 1.3,
                  letterSpacing: "-0.5px",
                  margin: "15px 0 9px",
                }}
              >
                Build connections. Create opportunities.
              </h2>
              <p
                style={{
                  maxWidth: "500px",
                  fontSize: "12px",
                  lineHeight: 1.8,
                  color: "#c2d1ec",
                  margin: 0,
                }}
              >
                {isFreelancer
                  ? "Find projects that match your skills, manage applications, and build your professional journey."
                  : "Manage your projects, connect with freelancers, and keep your business moving forward."}
              </p>
            </div>

            <Link
              to="/profile"
              style={{
                position: "relative",
                zIndex: 1,
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                background: "#ffffff",
                color: colors.navy,
                padding: "13px 17px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 800,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Manage My Profile <span>→</span>
            </Link>

            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                right: "80px",
                top: "-110px",
                width: "270px",
                height: "270px",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "50%",
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                right: "-70px",
                bottom: "-180px",
                width: "350px",
                height: "350px",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "50%",
              }}
            />
          </section>

          {/* OVERVIEW CARDS */}
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(195px, 1fr))",
              gap: "17px",
              marginBottom: "23px",
            }}
          >
            {[
              {
                title: "Account Type",
                value: user.role || "Member",
                description: "Your current workspace role",
                icon: "♙",
              },
              {
                title: "Profile Settings",
                value: "Personal details",
                description: "Keep your information up to date",
                icon: "◎",
              },
              {
                title: "Payment Records",
                value: "Payment history",
                description: "Review your transaction records",
                icon: "↗",
              },
            ].map((item, index) => (
              <div
                key={item.title}
                style={{
                  ...cardStyle,
                  borderTop: `3px solid ${
                    index === 0
                      ? colors.navy
                      : index === 1
                        ? colors.blue
                        : colors.brightBlue
                  }`,
                }}
              >
                <div
                  style={{
                    width: "41px",
                    height: "41px",
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "10px",
                    background: "#edf2ff",
                    color: colors.blue,
                    fontSize: "21px",
                  }}
                >
                  {item.icon}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: colors.muted,
                    marginTop: "19px",
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    color: colors.navy,
                    marginTop: "7px",
                    overflowWrap: "anywhere",
                  }}
                >
                  {item.value}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: colors.muted,
                    marginTop: "8px",
                    lineHeight: 1.6,
                  }}
                >
                  {item.description}
                </div>
              </div>
            ))}
          </section>

          {/* ACCOUNT OVERVIEW */}
          <section style={cardStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "15px",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: 800,
                    color: colors.navy,
                  }}
                >
                  Account Overview
                </h3>
                <p
                  style={{
                    margin: "7px 0 0",
                    color: colors.muted,
                    fontSize: "11px",
                  }}
                >
                  Your account information at a glance.
                </p>
              </div>

              <Link
                to="/profile"
                style={{
                  color: colors.blue,
                  fontSize: "12px",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Edit Profile →
              </Link>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "24px",
                borderTop: `1px solid ${colors.border}`,
                marginTop: "23px",
                paddingTop: "22px",
              }}
            >
              {[
                { label: "FULL NAME", value: user.name || "Not provided" },
                { label: "EMAIL ADDRESS", value: user.email || "Not provided" },
                { label: "ACCOUNT ROLE", value: user.role || "Not provided" },
              ].map((item) => (
                <div key={item.label} style={{ minWidth: 0 }}>
                  <div
                    style={{
                      color: colors.muted,
                      fontSize: "9px",
                      fontWeight: 800,
                      letterSpacing: "1.1px",
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      marginTop: "9px",
                      color: colors.text,
                      fontSize: "13px",
                      fontWeight: 700,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <footer
            style={{
              textAlign: "center",
              padding: "25px 0 5px",
              color: "#98a4b8",
              fontSize: "10px",
            }}
          >
            GigConnect · Your professional freelance workspace
          </footer>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

