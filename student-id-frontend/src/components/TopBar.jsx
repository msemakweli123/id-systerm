import { useState, useEffect } from "react";
import api from "../api/axios";

export default function AdminTopbar({ title }) {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchNotifications();
    fetchUserProfile();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await api.get("/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      setLoading(true);

      const res = await api.get("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const list = res.data?.notifications || [];

      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.is_read).length);
    } catch (err) {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    const token = localStorage.getItem("token");

    await api.post(
      `/notifications/read/${id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, is_read: 1 } : n
      )
    );

    setUnreadCount((p) => Math.max(0, p - 1));
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("token");

    await api.post(
      `/notifications/mark-all-read`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: 1 }))
    );

    setUnreadCount(0);
  };

  /* ================= ICON MAP ================= */
  const getIcon = (type) => {
    switch (type) {
      case "student_registered":
        return "fas fa-user-graduate";
      case "card_generated":
        return "fas fa-id-card";
      case "photo_uploaded":
        return "fas fa-image";
      case "photo_approved":
        return "fas fa-check-circle";
      case "photo_rejected":
        return "fas fa-times-circle";
      default:
        return "fas fa-bell";
    }
  };

  const timeAgo = (date) => {
    const diff = new Date() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  // Get role display name
  const getRoleDisplay = (role) => {
    switch(role?.toLowerCase()) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Administrator';
      case 'student':
        return 'Student';
      default:
        return role || 'User';
    }
  };

  // Get profile route based on role
  const getProfileRoute = () => {
    const role = user?.role?.toLowerCase();
    if (role === 'super_admin') {
      return '/super-admin/settings';
    } else if (role === 'admin') {
      return '/admin/profile';
    }
    return '/admin/profile';
  };

  // Get settings route based on role
  const getSettingsRoute = () => {
    const role = user?.role?.toLowerCase();
    if (role === 'super_admin') {
      return '/super-admin/settings';
    } else if (role === 'admin') {
      return '/admin/settings';
    }
    return '/admin/settings';
  };

  // Get dashboard route based on role
  const getDashboardRoute = () => {
    const role = user?.role?.toLowerCase();
    if (role === 'super_admin') {
      return '/super-admin';
    } else if (role === 'admin') {
      return '/admin';
    }
    return '/admin';
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const handleProfile = () => {
    setShowProfile(false);
    window.location.href = getProfileRoute();
  };

  const handleSettings = () => {
    setShowProfile(false);
    window.location.href = getSettingsRoute();
  };

  const handleDashboard = () => {
    setShowProfile(false);
    window.location.href = getDashboardRoute();
  };

  return (
    <div style={styles.navbar}>

      {/* LEFT */}
      <div style={styles.left}>
        <i className="fas fa-university" style={styles.logo}></i>
        <h3 style={styles.title}>{title}</h3>
      </div>

      {/* RIGHT */}
      <div style={styles.right}>

        {/* NOTIFICATIONS */}
        <div style={styles.iconBox}>
          <div
            style={styles.iconBtn}
            onClick={() => {
              setShowNotif(!showNotif);
              setShowProfile(false);
            }}
          >
            <i className="fas fa-bell" style={styles.mainIcon}></i>

            {unreadCount > 0 && (
              <span style={styles.badge}>{unreadCount}</span>
            )}
          </div>

          {showNotif && (
            <div style={styles.dropdown}>
              <div style={styles.dropdownHeader}>
                <b>Notifications</b>

                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} style={styles.btn}>
                    Mark all
                  </button>
                )}
              </div>

              {loading ? (
                <p style={styles.empty}>Loading...</p>
              ) : notifications.length === 0 ? (
                <p style={styles.empty}>No notifications</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                    style={{
                      ...styles.item,
                      background: n.is_read ? "transparent" : "#111c2e",
                    }}
                  >

                    <i
                      className={getIcon(n.type)}
                      style={styles.icon}
                    ></i>

                    <div style={{ flex: 1 }}>
                      <p style={styles.msg}>
                        <b>{n.title}</b>
                        <br />
                        {n.message}
                      </p>
                      <small style={styles.time}>
                        {timeAgo(n.created_at)}
                      </small>
                    </div>

                    {!n.is_read && <span style={styles.dot}></span>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* PROFILE - UPDATED WITH AVATAR, NAME & ROLE */}
        <div style={styles.iconBox}>
          <div
            style={styles.profileBtn}
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotif(false);
            }}
          >
            {/* Avatar with image or fallback */}
            <div style={styles.avatarContainer}>
              {user?.profile_image ? (
                <img 
                  src={user.profile_image} 
                  alt={user.name} 
                  style={styles.avatarImage}
                />
              ) : (
                <div style={styles.avatarFallback}>
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            
            {/* User name and role */}
            <div style={styles.userInfo}>
              <span style={styles.userName}>{user?.name || "User"}</span>
              <span style={styles.userRole}>{getRoleDisplay(user?.role)}</span>
            </div>
            
            {/* Dropdown arrow */}
            <i className="fas fa-chevron-down" style={styles.dropdownArrow}></i>
          </div>

          {showProfile && (
            <div style={styles.dropdown}>
              {/* Profile Info */}
              <div style={styles.profileHeader}>
                <div style={styles.profileAvatar}>
                  {user?.profile_image ? (
                    <img 
                      src={user.profile_image} 
                      alt={user.name} 
                      style={styles.profileAvatarImage}
                    />
                  ) : (
                    <i className="fas fa-user" style={{ fontSize: 24 }}></i>
                  )}
                </div>
                <div style={styles.profileInfo}>
                  <p style={styles.profileName}>{user?.name || "User"}</p>
                  <p style={styles.profileEmail}>{getRoleDisplay(user?.role)}</p>
                </div>
              </div>

              <hr style={{ border: "1px solid #334155" }} />

              {/* Dashboard */}
              <div style={styles.menuItem} onClick={handleDashboard}>
                <i className="fas fa-home"></i> Dashboard
              </div>

              {/* Profile Link */}
              <div style={styles.menuItem} onClick={handleProfile}>
                <i className="fas fa-user"></i> My Profile
              </div>

              {/* Settings */}
              <div style={styles.menuItem} onClick={handleSettings}>
                <i className="fas fa-cog"></i> Settings
              </div>

              <hr style={{ border: "1px solid #334155" }} />

              {/* Logout */}
              <div
                style={{ ...styles.menuItem, color: "#ef4444" }}
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt"></i> Logout
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  navbar: {
    height: 60,
    background: "#0b1220",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 24px", // Added padding for better spacing
    borderBottom: "1px solid #1f2937",
    position: "fixed",
    top: 0,
    right: 0,
    left: "290px",
    zIndex: 100,
    width: "calc(100% - 250px)",
  },

  left: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "white",
  },

  logo: {
    color: "#38bdf8",
    fontSize: 20,
  },

  title: {
    margin: 0,
    fontSize: 16,
    color: "#ffffff",
  },

  right: {
    display: "flex",
    gap: 20, // Increased gap
    alignItems: "center",
  },

  iconBox: {
    position: "relative",
  },

  // Notification bell button
  iconBtn: {
    background: "#1e293b",
    padding: 10,
    borderRadius: 10,
    cursor: "pointer",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    transition: "background 0.2s",
    border: "none",
  },

  mainIcon: {
    color: "white",
    fontSize: 18,
  },

  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    background: "red",
    color: "white",
    fontSize: 11,
    width: 18,
    height: 18,
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  // ===== PROFILE BUTTON (NEW) =====
  profileBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#1e293b",
    padding: "6px 14px 6px 6px",
    borderRadius: "50px",
    cursor: "pointer",
    transition: "background 0.2s, border-color 0.2s",
    border: "1px solid #334155",
    height: "44px",
  },

  // Avatar container
  avatarContainer: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    overflow: "hidden",
    flexShrink: 0,
  },

  // Avatar image
  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  // Avatar fallback (initials)
  avatarFallback: {
    width: "100%",
    height: "100%",
    background: "#2563eb",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "bold",
  },

  // User info container
  userInfo: {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.2,
    minWidth: "60px",
  },

  // User name
  userName: {
    color: "white",
    fontSize: "13px",
    fontWeight: "500",
    whiteSpace: "nowrap",
  },

  // User role
  userRole: {
    color: "#94a3b8",
    fontSize: "10px",
    whiteSpace: "nowrap",
  },

  // Dropdown arrow
  dropdownArrow: {
    color: "#94a3b8",
    fontSize: "10px",
    marginLeft: "2px",
    transition: "transform 0.2s",
  },

  // ===== DROPDOWN STYLES =====
  dropdown: {
    position: "absolute",
    right: 0,
    top: 55,
    width: 320,
    background: "#0f172a",
    borderRadius: 10,
    border: "1px solid #1f2937",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
    zIndex: 200,
  },

  dropdownHeader: {
    display: "flex",
    justifyContent: "space-between",
    padding: 12,
    color: "white",
    background: "#111827",
  },

  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "15px",
    background: "#111827",
  },

  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: "50%",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    overflow: "hidden",
    flexShrink: 0,
  },

  profileAvatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    margin: 0,
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },

  profileEmail: {
    margin: "2px 0 0 0",
    color: "#94a3b8",
    fontSize: 12,
  },

  btn: {
    fontSize: 12,
    padding: "3px 8px",
    background: "#2563eb",
    border: "none",
    color: "white",
    borderRadius: 5,
    cursor: "pointer",
  },

  item: {
    display: "flex",
    gap: 12,
    padding: 10,
    borderBottom: "1px solid #1f2937",
    cursor: "pointer",
    transition: "background 0.2s",
  },

  icon: {
    fontSize: 18,
    color: "#38bdf8",
    minWidth: 20,
    marginTop: 2,
  },

  msg: {
    margin: 0,
    fontSize: 13,
    color: "#e5e7eb",
  },

  time: {
    color: "#94a3b8",
    fontSize: 11,
  },

  dot: {
    width: 8,
    height: 8,
    background: "#38bdf8",
    borderRadius: "50%",
    marginTop: 6,
    flexShrink: 0,
  },

  menuItem: {
    padding: "10px 15px",
    color: "#e5e7eb",
    cursor: "pointer",
    display: "flex",
    gap: 10,
    alignItems: "center",
    transition: "background 0.2s",
    fontSize: "14px",
  },

  empty: {
    padding: 15,
    textAlign: "center",
    color: "#94a3b8",
  },
};

// Add hover styles
const hoverStyles = document.createElement("style");
hoverStyles.textContent = `
  .menu-item:hover {
    background: #1e293b !important;
  }
  
  /* Profile button hover */
  [style*="profileBtn"]:hover {
    background: #2d3748 !important;
    border-color: #4a5568 !important;
  }
  
  /* Notification button hover */
  [style*="iconBtn"]:hover {
    background: #2d3748 !important;
  }
  
  /* Notification item hover */
  [style*="item"]:hover {
    background: #1e293b !important;
  }
`;
document.head.appendChild(hoverStyles);