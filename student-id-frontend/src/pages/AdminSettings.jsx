import { useState, useEffect } from "react";
import api from "../api/axios";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError("New password and confirm password do not match");
      return;
    }

    if (passwordData.new_password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await api.post(
        "/profile/password",
        {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
          confirm_password: passwordData.confirm_password,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Password changed successfully!");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <Sidebar />
      <div className="admin-main">
        <TopBar />
        <div className="admin-content-wrapper">
          <div className="admin-content">
            <div className="settings-header">
              <h1>
                <i className="fas fa-cog" style={{ marginRight: "10px", color: "#1a472a" }}></i>
                Settings
              </h1>
              <p className="subtitle">Manage your account security and preferences</p>
            </div>

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

            {/* Change Password Section */}
            <div className="settings-card">
              <h2>
                <i className="fas fa-lock" style={{ marginRight: "8px" }}></i>
                Change Password
              </h2>
              <p className="card-subtitle">Update your password to keep your account secure</p>

              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    className="form-control"
                    required
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  <i className="fas fa-save"></i> {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>

            {/* System Info Section */}
            <div className="settings-card">
              <h2>
                <i className="fas fa-info-circle" style={{ marginRight: "8px" }}></i>
                System Information
              </h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">System Name</span>
                  <span className="info-value">University ID Management System</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Version</span>
                  <span className="info-value">1.0.0</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status</span>
                  <span className="info-value status-active">
                    <i className="fas fa-circle"></i> Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .admin-container {
          display: flex;
          min-height: 100vh;
          background: #f1f5f9;
        }

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
          padding: 20px;
          background: #f8fafc;
        }

        .admin-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .settings-header {
          margin-bottom: 30px;
        }

        .settings-header h1 {
          font-size: 24px;
          color: #1a472a;
          margin: 0 0 5px 0;
        }

        .subtitle {
          color: #6b7280;
          margin: 0;
          font-size: 14px;
        }

        .alert-success {
          background: #d1fae5;
          color: #065f46;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .alert-error {
          background: #fee2e2;
          color: #991b1b;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .settings-card {
          background: white;
          padding: 25px 30px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          margin-bottom: 20px;
        }

        .settings-card h2 {
          font-size: 18px;
          color: #1a472a;
          margin: 0 0 5px 0;
        }

        .card-subtitle {
          color: #6b7280;
          font-size: 14px;
          margin: 0 0 20px 0;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 5px;
          color: #333;
        }

        .form-control {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: border 0.2s;
        }

        .form-control:focus {
          outline: none;
          border-color: #1a472a;
          box-shadow: 0 0 0 3px rgba(26, 71, 42, 0.1);
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
          transition: background 0.2s;
        }

        .btn-primary:hover {
          background: #2d6a4f;
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 10px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .info-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: #1a472a;
          margin-top: 5px;
        }

        .status-active {
          color: #10b981;
        }

        .status-active i {
          font-size: 10px;
          margin-right: 5px;
        }

        @media (max-width: 768px) {
          .admin-main {
            margin-left: 0;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}