import { useState, useEffect } from "react";
import api from "../api/axios";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import Footer from "../components/Footer"; // Import your footer component

export default function AdminProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      setFormData({
        name: res.data.name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        address: res.data.address || "",
      });
    } catch (err) {
      console.error("Error fetching user:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("token");
      await api.put(
        "/profile/update",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Profile updated successfully!");
      fetchUserProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <Sidebar />
        <div className="admin-main">
          <TopBar />
          <div className="admin-content-wrapper">
            <div className="admin-content">
              <div className="loading-spinner">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Loading profile...</p>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <Sidebar />
      <div className="admin-main">
        <TopBar />
        <div className="admin-content-wrapper">
          <div className="admin-content">
            {/* Profile Header */}
            <div className="profile-header">
              <div className="profile-header-left">
                <div className="profile-avatar-large">
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt={user.name} />
                  ) : (
                    <i className="fas fa-user"></i>
                  )}
                </div>
                <div className="profile-header-info">
                  <h1>{user?.name || "User"}</h1>
                  <p className="subtitle">
                    <i className="fas fa-envelope"></i> {user?.email || "No email"}
                  </p>
                  <p className="subtitle">
                    <i className="fas fa-user-tag"></i> {user?.role || "User"}
                  </p>
                </div>
              </div>
              <div className="profile-header-right">
                <span className="status-badge active">
                  <i className="fas fa-circle"></i> Active
                </span>
              </div>
            </div>

            {/* Alerts */}
            {message && (
              <div className="alert-success">
                <i className="fas fa-check-circle"></i> {message}
              </div>
            )}

            {error && (
              <div className="alert-error">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            {/* Profile Form */}
            <div className="profile-card">
              <h3 className="card-title">
                <i className="fas fa-edit"></i> Edit Profile
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="form-group">
                    <label>Role</label>
                    <input
                      type="text"
                      value={user?.role || "User"}
                      className="form-control"
                      disabled
                      style={{ background: "#f3f4f6", cursor: "not-allowed" }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="form-control"
                    rows="3"
                    placeholder="Enter your address"
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    <i className="fas fa-save"></i> Update Profile
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setFormData({
                        name: user?.name || "",
                        email: user?.email || "",
                        phone: user?.phone || "",
                        address: user?.address || "",
                      });
                    }}
                  >
                    <i className="fas fa-undo"></i> Reset
                  </button>
                </div>
              </form>
            </div>

            {/* Account Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>
                  <i className="fas fa-calendar-alt"></i>
                </div>
                <div className="stat-info">
                  <h4>Member Since</h4>
                  <p>{new Date(user?.created_at).toLocaleDateString() || "N/A"}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: "#d1fae5", color: "#065f46" }}>
                  <i className="fas fa-clock"></i>
                </div>
                <div className="stat-info">
                  <h4>Last Updated</h4>
                  <p>{new Date(user?.updated_at).toLocaleDateString() || "N/A"}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: "#fef3c7", color: "#92400e" }}>
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div className="stat-info">
                  <h4>Account Status</h4>
                  <p style={{ color: "#065f46" }}>Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>

      <style>{`
        /* ===== CONTAINER ===== */
        .admin-container {
          display: flex;
          min-height: 100vh;
          background: #f1f5f9;
        }

        /* ===== MAIN CONTENT ===== */
        .admin-main {
          flex: 1;
          margin-left: 260px;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .admin-content-wrapper {
          flex: 1;
          overflow-y: auto;
          padding: 20px 30px 20px 30px;
          background: #f8fafc;
        }

        .admin-content {
          max-width: 900px;
          margin: 0 auto;
          padding-bottom: 20px;
        }

        /* ===== LOADING ===== */
        .loading-spinner {
          text-align: center;
          padding: 60px 0;
        }

        .loading-spinner i {
          font-size: 40px;
          color: #1a472a;
        }

        .loading-spinner p {
          color: #6b7280;
          margin-top: 10px;
        }

        /* ===== PROFILE HEADER ===== */
        .profile-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          background: white;
          padding: 25px 30px;
          border-radius: 12px;
          margin-bottom: 25px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid #e5e7eb;
        }

        .profile-header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .profile-avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #1a472a;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 32px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .profile-avatar-large img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-header-info h1 {
          font-size: 22px;
          color: #1a472a;
          margin: 0 0 5px 0;
        }

        .subtitle {
          color: #6b7280;
          margin: 0;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .profile-header-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .status-badge {
          padding: 6px 14px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-badge.active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.active i {
          font-size: 8px;
          color: #10b981;
        }

        /* ===== ALERTS ===== */
        .alert-success {
          background: #d1fae5;
          color: #065f46;
          padding: 12px 18px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-left: 4px solid #10b981;
        }

        .alert-error {
          background: #fee2e2;
          color: #991b1b;
          padding: 12px 18px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-left: 4px solid #ef4444;
        }

        /* ===== PROFILE CARD ===== */
        .profile-card {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          border: 1px solid #e5e7eb;
          margin-bottom: 25px;
        }

        .card-title {
          font-size: 18px;
          color: #1a472a;
          margin: 0 0 20px 0;
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f3f4f6;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 6px;
          color: #374151;
          font-size: 14px;
        }

        .form-group label i {
          margin-right: 6px;
          color: #1a472a;
        }

        .form-control {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
          background: white;
          color: #1f2937;
        }

        .form-control:focus {
          outline: none;
          border-color: #1a472a;
          box-shadow: 0 0 0 3px rgba(26, 71, 42, 0.1);
        }

        .form-control:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
          color: #6b7280;
        }

        textarea.form-control {
          resize: vertical;
          font-family: inherit;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 10px;
        }

        .btn-primary {
          background: #1a472a;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary:hover {
          background: #2d6a4f;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(26, 71, 42, 0.3);
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 10px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        /* ===== STATS GRID ===== */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .stat-info h4 {
          margin: 0;
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }

        .stat-info p {
          margin: 4px 0 0 0;
          font-size: 15px;
          color: #1f2937;
          font-weight: 600;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          .admin-main {
            margin-left: 0;
          }

          .profile-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }

          .profile-header-left {
            width: 100%;
          }

          .profile-header-right {
            width: 100%;
            align-items: flex-start;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
            justify-content: center;
          }

          .admin-content-wrapper {
            padding: 15px;
          }
        }

        @media (max-width: 480px) {
          .profile-avatar-large {
            width: 60px;
            height: 60px;
            font-size: 24px;
          }

          .profile-header-info h1 {
            font-size: 18px;
          }

          .profile-card {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}