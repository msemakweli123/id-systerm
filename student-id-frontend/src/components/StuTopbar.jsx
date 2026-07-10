import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function StuTopbar({ title }) {
  const navigate = useNavigate();
  
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [imageError, setImageError] = useState(false);

  const BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    fetchNotifications();
    fetchStudentData();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await api.get("/student/me", {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Student data:", res.data);
      setStudentData(res.data.student);
      await fetchPhoto(token);
    } catch (err) {
      console.error("Error fetching student:", err);
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
    }
  };

  const fetchPhoto = async (token) => {
    try {
      const photoRes = await api.get("/student/photo", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Photo response:", photoRes.data);

      const photo = photoRes.data?.photo;

      if (!photo?.path) {
        console.log("No photo path found");
        setPhotoUrl(null);
        return;
      }

      let filename = photo.path;
      if (filename.includes("/")) {
        filename = filename.split("/").pop();
      }

      console.log("Photo filename:", filename);

      const imageUrl = photoRes.data?.url || `${BASE_URL}/photos/${filename}`;
      
      console.log("Setting photo URL to:", imageUrl);
      
      setPhotoUrl(imageUrl);
      setImageError(false);

    } catch (err) {
      console.error("Error fetching photo:", err);
      setPhotoUrl(null);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      setLoading(true);

      const response = await api.get("/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });

      let notifs = [];
      if (response.data?.notifications) notifs = response.data.notifications;
      else if (Array.isArray(response.data)) notifs = response.data;
      else if (response.data?.data) notifs = response.data.data;

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);

    } catch (err) {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await api.post(`/notifications/read/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
      );

      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {}
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");

      await api.post("/notifications/mark-all-read", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {}
  };

  const formatTime = (dateString) => {
    if (!dateString) return "Just now";
    const diff = new Date() - new Date(dateString);
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleProfile = () => {
    setShowProfile(false);
    navigate("/student/profile");
  };

  const handleUploadPhoto = () => {
    setShowProfile(false);
    navigate("/student/upload-image"); // ✅ CORRECTED: Matches your route
  };

  const handleMyIDCard = () => {
    setShowProfile(false);
    navigate("/student/id");
  };

  const userName = studentData?.user?.name || studentData?.name || "Student";
  const userInitial = userName.charAt(0).toUpperCase();
  const hasPhoto = photoUrl && !imageError;

  const FALLBACK_AVATAR =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

  return (
    <>
      <div className="topbar">
        <h3 className="title">{title}</h3>

        <div className="right">

          {/* NOTIFICATIONS */}
          <div className="iconBox">
            <div
              className="icon"
              onClick={() => {
                setShowNotif(!showNotif);
                setShowProfile(false);
              }}
            >
              <i className="fas fa-bell"></i>

              {unreadCount > 0 && (
                <span className="badge">{unreadCount}</span>
              )}
            </div>

            {showNotif && (
              <div className="dropdown">
                <div className="dropdownHeader">
                  <h4>Notifications</h4>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead}>
                      Mark all read
                    </button>
                  )}
                </div>

                {loading ? (
                  <p className="state">Loading...</p>
                ) : notifications.length === 0 ? (
                  <p className="state">No notifications</p>
                ) : (
                  <div className="list">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        className={`notif ${!n.is_read ? "unread" : ""}`}
                        onClick={() => !n.is_read && markAsRead(n.id)}
                      >
                        <div>
                          <p className="msg">
                            <strong>{n.title}</strong><br />
                            {n.message}
                          </p>
                          <small>{formatTime(n.created_at)}</small>
                        </div>

                        {!n.is_read && <span className="dot"></span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PROFILE - Now shows student info */}
          <div className="iconBox">
            <div
              className="icon profile-icon"
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotif(false);
              }}
            >
              {hasPhoto ? (
                <img
                  src={photoUrl}
                  className="profile-avatar"
                  alt={userName}
                  onError={(e) => {
                    console.log("Image failed to load:", photoUrl);
                    setImageError(true);
                    e.target.src = FALLBACK_AVATAR;
                  }}
                />
              ) : (
                <span className="profile-initials">{userInitial}</span>
              )}
            </div>

            {showProfile && (
              <div className="dropdown profile-dropdown">
                {/* Profile Header */}
                <div className="profile-header">
                  {hasPhoto ? (
                    <img
                      src={photoUrl}
                      className="dropdown-avatar"
                      alt={userName}
                      onError={(e) => {
                        console.log("Dropdown image failed to load:", photoUrl);
                        setImageError(true);
                        e.target.src = FALLBACK_AVATAR;
                      }}
                    />
                  ) : (
                    <div className="dropdown-avatar-fallback">
                      <span>{userInitial}</span>
                    </div>
                  )}
                  <div className="profile-info">
                    <p className="profile-name">{userName}</p>
                    <p className="profile-reg">Reg: {studentData?.reg_number || "N/A"}</p>
                    <p className="profile-email">{studentData?.user?.email || studentData?.email || "N/A"}</p>
                  </div>
                </div>

                <hr />

                <p onClick={handleProfile} style={{ cursor: 'pointer' }}>
                  <i className="fas fa-user"></i> My Profile
                </p>

                <p onClick={handleUploadPhoto} style={{ cursor: 'pointer' }}>
                  <i className="fas fa-camera"></i> Upload Photo
                </p>

                <p onClick={handleMyIDCard} style={{ cursor: 'pointer' }}>
                  <i className="fas fa-id-card"></i> My ID Card
                </p>

                <hr />

                <p className="logout" onClick={handleLogout} style={{ cursor: 'pointer' }}>
                  <i className="fas fa-sign-out-alt"></i> Logout
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ================= INTERNAL CSS ================= */}
      <style>{`
        /* TOPBAR FIXED AT TOP */
        .topbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: #0f172a;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 20px;
          border-bottom: 1px solid #1f2937;
          z-index: 9999;
        }

        .title {
          color: white;
          font-size: 18px;
          margin: 0;
          font-weight: 600;
        }

        .right {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        /* ICON */
        .iconBox {
          position: relative;
        }

        .icon {
          width: 40px;
          height: 40px;
          background: #1f2937;
          color: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          transition: 0.2s;
        }

        .icon:hover {
          background: #334155;
        }

        /* Profile Icon */
        .profile-icon {
          background: transparent;
          padding: 0;
          overflow: hidden;
        }

        .profile-icon:hover {
          background: transparent;
          transform: scale(1.05);
        }

        .profile-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          object-fit: cover;
          border: 2px solid #3b82f6;
        }

        .profile-initials {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
          border: 2px solid #3b82f6;
        }

        /* BADGE */
        .badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #ef4444;
          color: white;
          font-size: 11px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* DROPDOWN */
        .dropdown {
          position: absolute;
          right: 0;
          top: 50px;
          width: 320px;
          background: #111827;
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          overflow: hidden;
          z-index: 10000;
        }

        .profile-dropdown {
          width: 340px;
        }

        .dropdownHeader {
          padding: 12px;
          background: #0f172a;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #1f2937;
          color: white;
        }

        .dropdownHeader button {
          background: #3b82f6;
          border: none;
          color: white;
          font-size: 12px;
          padding: 5px 10px;
          border-radius: 6px;
          cursor: pointer;
        }

        .list {
          max-height: 320px;
          overflow-y: auto;
        }

        .notif {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          border-bottom: 1px solid #1f2937;
          cursor: pointer;
          transition: 0.2s;
        }

        .notif:hover {
          background: #1f2937;
        }

        .unread {
          background: #1f2937;
        }

        .msg {
          margin: 0;
          font-size: 13px;
          color: #e5e7eb;
        }

        small {
          color: #6b7280;
        }

        .dot {
          width: 8px;
          height: 8px;
          background: #3b82f6;
          border-radius: 50%;
          margin-top: 6px;
        }

        /* Profile Header in Dropdown */
        .profile-header {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          background: #0f172a;
          border-bottom: 1px solid #1f2937;
        }

        .dropdown-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #3b82f6;
        }

        .dropdown-avatar-fallback {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          font-weight: bold;
          border: 3px solid #3b82f6;
        }

        .profile-info {
          flex: 1;
          min-width: 0;
        }

        .profile-name {
          margin: 0;
          color: white;
          font-weight: 600;
          font-size: 15px;
        }

        .profile-reg {
          margin: 2px 0;
          color: #9ca3af;
          font-size: 12px;
        }

        .profile-email {
          margin: 2px 0;
          color: #6b7280;
          font-size: 11px;
          word-break: break-all;
        }

        .dropdown p {
          margin: 0;
          padding: 10px 12px;
          color: #e5e7eb;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dropdown p i {
          width: 18px;
          text-align: center;
        }

        .dropdown p:hover {
          background: #1f2937;
        }

        .logout {
          color: #ef4444 !important;
        }

        .logout i {
          color: #ef4444 !important;
        }

        hr {
          border: none;
          border-top: 1px solid #1f2937;
          margin: 5px 0;
        }

        .state {
          text-align: center;
          padding: 15px;
          color: #6b7280;
        }

        /* Scrollbar styling */
        .list::-webkit-scrollbar {
          width: 4px;
        }

        .list::-webkit-scrollbar-track {
          background: #1f2937;
        }

        .list::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 2px;
        }
      `}</style>
    </>
  );
}