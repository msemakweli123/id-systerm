import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import StuSidebar from "../components/StuSidebar";
import StuTopbar from "../components/StuTopbar";
import Footer from "../components/Footer";

export default function StudentProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [imageError, setImageError] = useState(false);

  const [student, setStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    address: "",
    reg_number: "",
    program_name: "",
    department_name: "",
    start_year: "",
    end_year: "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await api.get("/student/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data.student;
      setStudent(data);
      setFormData({
        name: data?.user?.name || data?.name || "",
        email: data?.user?.email || data?.email || "",
        phone: data?.phone || "",
        gender: data?.gender || "",
        dob: data?.dob || "",
        address: data?.address || "",
        reg_number: data?.reg_number || "",
        program_name: data?.program?.name || "",
        department_name: data?.department?.name || data?.program?.department?.name || "",
        start_year: data?.start_year || "",
        end_year: data?.end_year || "",
      });
      
      await fetchPhoto(token);
    } catch (err) {
      console.error("Error fetching student:", err);
      showMessage("Failed to load profile data", "error");
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
    } finally {
      setLoading(false);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await api.put(
        `/students/${student.id}`,
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          gender: formData.gender,
          dob: formData.dob,
          address: formData.address,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.success) {
        showMessage("Profile updated successfully!", "success");
        await fetchStudentData();
      } else {
        showMessage(response.data?.message || "Failed to update profile", "error");
      }
    } catch (err) {
      console.error("Update error:", err);
      showMessage(err.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    setMessage("");

    if (passwordData.password !== passwordData.password_confirmation) {
      showMessage("New passwords do not match!", "error");
      setChangingPassword(false);
      return;
    }

    if (passwordData.password.length < 6) {
      showMessage("New password must be at least 6 characters!", "error");
      setChangingPassword(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      const response = await api.post(
        "/profile/password",
        {
          current_password: passwordData.current_password,
          password: passwordData.password,
          password_confirmation: passwordData.password_confirmation,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.success) {
        showMessage("Password changed successfully!", "success");
        setPasswordData({
          current_password: "",
          password: "",
          password_confirmation: "",
        });
        setShowPasswordModal(false);
      } else {
        showMessage(response.data?.message || "Failed to change password", "error");
      }
    } catch (err) {
      console.error("Password change error:", err);
      
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const firstError = Object.values(errors)[0]?.[0] || "Validation error";
        showMessage(firstError, "error");
      } else {
        showMessage(err.response?.data?.message || "Failed to change password", "error");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  const userName = student?.user?.name || student?.name || "Student";
  const hasPhoto = photoUrl && !imageError;

  const FALLBACK_AVATAR =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='70' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

  if (loading) {
    return (
      <div className="layout">
        <StuSidebar />
        <div className="main">
          <StuTopbar title="My Profile" />
          <div style={{ textAlign: "center", padding: "50px" }}>
            <div className="spinner"></div>
            <p>Loading profile...</p>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <StuSidebar />
      <div className="main">
        <StuTopbar title="My Profile" />

        <div className="content">
          {/* Header */}
          <div className="profile-header">
            <div>
              <h1 className="page-title">
                <i className="fas fa-user-circle"></i> My Profile
              </h1>
              <p className="page-subtitle">Manage your personal information and account settings</p>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`message ${messageType}`}>
              <i className={`fas ${messageType === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`}></i>
              {message}
            </div>
          )}

          <div className="profile-grid">
            {/* Profile Card */}
            <div className="profile-card">
              <div className="profile-card-header">
                <div className="profile-avatar-container">
                  {hasPhoto ? (
                    <img
                      src={photoUrl}
                      className="profile-avatar-img"
                      alt={userName}
                      onError={(e) => {
                        console.log("Image failed to load:", photoUrl);
                        setImageError(true);
                        e.target.src = FALLBACK_AVATAR;
                      }}
                    />
                  ) : (
                    <div className="profile-avatar">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="profile-card-title">
                  <h2>{formData.name || "Student"}</h2>
                  <span className={`status-badge ${student?.user?.status === "active" ? "active" : "inactive"}`}>
                    {student?.user?.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="profile-info-grid">
                <div className="info-item">
                  <label>Registration Number</label>
                  <p>{formData.reg_number || "N/A"}</p>
                </div>
                <div className="info-item">
                  <label>Program</label>
                  <p>{formData.program_name || "N/A"}</p>
                </div>
                <div className="info-item">
                  <label>Department</label>
                  <p>{formData.department_name || "N/A"}</p>
                </div>
                <div className="info-item">
                  <label>Study Period</label>
                  <p>{formData.start_year && formData.end_year ? `${formData.start_year} - ${formData.end_year}` : "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Update Profile Form */}
            <div className="profile-card">
              <h3 className="form-title">
                <i className="fas fa-edit"></i> Edit Profile
              </h3>
              <form onSubmit={handleUpdateProfile}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter your address"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Updating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i> Update Profile
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Password Change Card */}
            <div className="profile-card">
              <h3 className="form-title">
                <i className="fas fa-lock"></i> Security
              </h3>
              <div className="password-section">
                <p className="password-info">
                  <i className="fas fa-shield-alt"></i>
                  Change your password to keep your account secure
                </p>
                <button
                  className="btn-secondary"
                  onClick={() => setShowPasswordModal(true)}
                >
                  <i className="fas fa-key"></i> Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Password Change Modal */}
          {showPasswordModal && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h3>
                    <i className="fas fa-key"></i> Change Password
                  </h3>
                  <button
                    className="modal-close"
                    onClick={() => setShowPasswordModal(false)}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div className="modal-body">
                  <form onSubmit={handleChangePassword}>
                    <div className="form-group">
                      <label>Current Password</label>
                      <input
                        type="password"
                        name="current_password"
                        value={passwordData.current_password}
                        onChange={handlePasswordChange}
                        required
                        placeholder="Enter your current password"
                      />
                    </div>

                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        name="password"
                        value={passwordData.password}
                        onChange={handlePasswordChange}
                        required
                        placeholder="Enter new password (min 6 characters)"
                      />
                    </div>

                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        name="password_confirmation"
                        value={passwordData.password_confirmation}
                        onChange={handlePasswordChange}
                        required
                        placeholder="Confirm your new password"
                      />
                    </div>

                    <div className="modal-actions">
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => setShowPasswordModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={changingPassword}
                      >
                        {changingPassword ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i> Updating...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save"></i> Update Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>

        <Footer />
      </div>

      <style>{`
        .layout {
          display: flex;
          min-height: 100vh;
          background: #f1f5f9;
        }

        .main {
          flex: 1;
          margin-left: 260px;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .content {
          padding: 30px;
          margin-top: 60px;
          flex: 1;
        }

        .profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          background: linear-gradient(135deg, #05102e, #04052e);
          padding: 25px 30px;
          border-radius: 12px;
        }

        .page-title {
          color: #ffffff;
          font-size: 28px;
          margin: 0;
        }

        .page-title i {
          color: #ffffff;
          margin-right: 10px;
        }

        .page-subtitle {
          color: #ffffff;
          margin: 5px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .message {
          padding: 12px 18px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .message.success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .message.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
        }

        .profile-card {
          background: #ffffff;
          border-radius: 12px;
          padding: 25px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .profile-card-header {
          display: flex;
          align-items: center;
          gap: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 20px;
        }

        .profile-avatar-container {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          border: 3px solid #1a472a;
        }

        .profile-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-avatar {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a472a, #2d6a4f);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 28px;
          font-weight: bold;
          flex-shrink: 0;
        }

        .profile-card-title h2 {
          color: #1e293b;
          margin: 0;
          font-size: 20px;
        }

        .status-badge {
          display: inline-block;
          padding: 3px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 4px;
        }

        .status-badge.active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        .profile-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .info-item label {
          color: #64748b;
          font-size: 12px;
          display: block;
          margin-bottom: 2px;
          font-weight: 500;
        }

        .info-item p {
          color: #1e293b;
          margin: 0;
          font-size: 14px;
          font-weight: 500;
        }

        .form-title {
          color: #1e293b;
          font-size: 18px;
          margin: 0 0 20px 0;
        }

        .form-title i {
          color: #1a472a;
          margin-right: 8px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          color: #475569;
          font-size: 13px;
          margin-bottom: 5px;
          font-weight: 500;
        }

        .form-group input,
        .form-group select {
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #1e293b;
          font-size: 14px;
          transition: all 0.3s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #1a472a;
          box-shadow: 0 0 0 3px rgba(26, 71, 42, 0.1);
          background: #ffffff;
        }

        .form-group input::placeholder {
          color: #94a3b8;
        }

        .btn-primary {
          padding: 10px 24px;
          background: #1a472a;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          justify-content: center;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2d6a4f;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(26, 71, 42, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          padding: 10px 24px;
          background: #e2e8f0;
          color: #1e293b;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-secondary:hover {
          background: #cbd5e1;
          transform: translateY(-1px);
        }

        .password-section {
          text-align: center;
          padding: 20px 0;
        }

        .password-info {
          color: #475569;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .password-info i {
          color: #1a472a;
          margin-right: 8px;
          font-size: 18px;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal {
          background: #ffffff;
          border-radius: 12px;
          max-width: 500px;
          width: 100%;
          border: 1px solid #e2e8f0;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h3 {
          color: #1e293b;
          margin: 0;
          font-size: 18px;
        }

        .modal-header h3 i {
          color: #1a472a;
          margin-right: 8px;
        }

        .modal-close {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          transition: color 0.3s;
        }

        .modal-close:hover {
          color: #1e293b;
        }

        .modal-body {
          padding: 24px;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          justify-content: flex-end;
        }

        .btn-cancel {
          padding: 10px 24px;
          background: #e2e8f0;
          color: #1e293b;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s;
        }

        .btn-cancel:hover {
          background: #cbd5e1;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #1a472a;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .main {
            margin-left: 0;
          }

          .content {
            padding: 15px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .profile-info-grid {
            grid-template-columns: 1fr;
          }

          .profile-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
            padding: 20px;
          }

          .profile-card-header {
            flex-direction: column;
            text-align: center;
          }

          .profile-avatar-container,
          .profile-avatar {
            width: 80px;
            height: 80px;
          }
        }
      `}</style>
    </div>
  );
}