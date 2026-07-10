import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function SuperAdminAdmins() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin",
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await api.get("/admins", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let adminsData = [];
      if (response.data?.data) {
        adminsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        adminsData = response.data;
      } else if (response.data?.admins) {
        adminsData = response.data.admins;
      }

      // Filter to only include admin and super_admin roles
      const filteredAdmins = adminsData.filter(user => 
        user && (
          user.role === "admin" || 
          user.role === "super_admin" ||
          user.role?.toLowerCase() === "admin" ||
          user.role?.toLowerCase() === "super_admin"
        )
      );

      setAdmins(filteredAdmins || []);
    } catch (error) {
      console.error("Error loading admins:", error);
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
      setAdmins([]);
      showMessage("❌ Failed to load admins", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type = "success") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4000);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!formData.name.trim()) {
      showMessage("❌ Name is required", "error");
      return;
    }
    if (!formData.email.trim()) {
      showMessage("❌ Email is required", "error");
      return;
    }
    if (!editingAdmin && !formData.password) {
      showMessage("❌ Password is required for new admin", "error");
      return;
    }
    if (formData.password && formData.password !== formData.confirmPassword) {
      showMessage("❌ Passwords do not match", "error");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };
      
      if (formData.password) {
        payload.password = formData.password;
      }

      if (editingAdmin) {
        await api.put(
          `/admins/${editingAdmin.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showMessage("✅ Admin updated successfully!", "success");
      } else {
        await api.post(
          "/admins",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showMessage("✅ Admin created successfully!", "success");
      }

      setTimeout(() => {
        resetForm();
        fetchAdmins();
      }, 1000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to save admin";
      showMessage(`❌ ${errorMsg}`, "error");
    }
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: "",
      confirmPassword: "",
      role: admin.role || "admin",
    });
    setShowModal(true);
    setMessage("");
    setMessageType("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await api.delete(`/admins/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showMessage("✅ Admin deleted successfully!", "success");
      fetchAdmins();
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to delete admin";
      showMessage(`❌ ${errorMsg}`, "error");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "admin",
    });
    setEditingAdmin(null);
    setShowModal(false);
    setMessage("");
    setMessageType("");
  };

  const getRoleDisplay = (role) => {
    if (!role) return "Admin";
    const roleLower = role.toLowerCase();
    if (roleLower === "super_admin") return "Super Admin";
    if (roleLower === "admin") return "Admin";
    return role;
  };

  const getAdminStatus = (admin) => {
    return admin.status || "active";
  };

  const filteredAdmins = admins.filter((admin) => {
    const name = admin.name?.toLowerCase() || "";
    const email = admin.email?.toLowerCase() || "";
    const searchTerm = search.toLowerCase();
    return name.includes(searchTerm) || email.includes(searchTerm);
  });

  const getStatusStyle = (status) => {
    const statusMap = {
      active: { background: "#dcfce7", color: "#166534" },
      inactive: { background: "#fee2e2", color: "#991b1b" },
      suspended: { background: "#fef3c7", color: "#92400e" },
    };
    return statusMap[status?.toLowerCase()] || statusMap.active;
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.patch(
        `/admins/${id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        showMessage(`✅ Admin status updated to ${status}`, "success");
        fetchAdmins();
      } else {
        showMessage(`❌ ${response.data.message || 'Failed to update status'}`, "error");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to update status";
      showMessage(`❌ ${errorMsg}`, "error");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <h1>
            <i className="fas fa-user-shield" style={{ marginRight: "10px", color: "#1a2a6c" }}></i>
            Admin Management
          </h1>
          <button style={styles.addButton} onClick={() => { resetForm(); setShowModal(true); }}>
            <i className="fas fa-plus"></i> Add Admin
          </button>
        </div>
        <p style={styles.subtitle}>Create, manage, and oversee admin accounts</p>
        <div style={styles.stats}>
          <span style={styles.statBadge}>
            <i className="fas fa-user-shield"></i> Total: {admins.length} admins
          </span>
          <span style={styles.statBadge}>
            <i className="fas fa-check-circle" style={{ color: "#16a34a" }}></i> Active: {
              admins.filter(a => getAdminStatus(a) === 'active').length
            }
          </span>
          <span style={styles.statBadge}>
            <i className="fas fa-times-circle" style={{ color: "#dc2626" }}></i> Inactive: {
              admins.filter(a => getAdminStatus(a) === 'inactive').length
            }
          </span>
        </div>
      </div>

      {message && (
        <div style={{
          ...styles.message,
          color: messageType === 'success' ? '#16a34a' : '#dc2626',
          background: messageType === 'success' ? '#dcfce7' : '#fee2e2'
        }}>
          <i className={`fas ${messageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {message}
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.searchWrapper}>
          <i className="fas fa-search" style={styles.searchIcon}></i>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.search}
          />
          {search && (
            <button 
              style={styles.clearBtn}
              onClick={() => setSearch("")}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Admin Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Created</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={styles.textCenter}>
                    <i className="fas fa-spinner fa-spin"></i> Loading admins...
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan="7" style={styles.textCenter}>
                    <i className="fas fa-inbox" style={{ fontSize: 24, color: "#ccc", display: "block", marginBottom: 8 }}></i>
                    No admins found
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin, index) => {
                  const status = getAdminStatus(admin);
                  const statusStyle = getStatusStyle(status);
                  return (
                    <tr key={admin.id} style={styles.tr}>
                      <td style={styles.td}>{index + 1}</td>
                      <td style={styles.td}>
                        <div style={styles.userInfo}>
                          <div style={styles.avatar}>
                            {admin.name?.charAt(0)?.toUpperCase() || "A"}
                          </div>
                          <div>
                            <strong>{admin.name}</strong>
                            {admin.role?.toLowerCase() === "super_admin" && (
                              <div style={styles.userBadge}>
                                <i className="fas fa-crown" style={{ fontSize: 10 }}></i> Super Admin
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>{admin.email}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.roleBadge,
                          ...(admin.role?.toLowerCase() === "super_admin" ? styles.superAdminBadge : {})
                        }}>
                          {getRoleDisplay(admin.role)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.status,
                          background: statusStyle.background,
                          color: statusStyle.color
                        }}>
                          {status === 'active' && <i className="fas fa-check-circle"></i>}
                          {status === 'inactive' && <i className="fas fa-times-circle"></i>}
                          {status === 'suspended' && <i className="fas fa-pause-circle"></i>}
                          {status.toUpperCase()}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button
                            style={styles.editBtn}
                            onClick={() => handleEdit(admin)}
                            title="Edit admin"
                          >
                            <i className="fas fa-edit"></i>
                          </button>

                          {admin.role?.toLowerCase() !== "super_admin" && (
                            <>
                              <button
                                style={{ ...styles.statusBtn, ...styles.activate }}
                                onClick={() => updateStatus(admin.id, "active")}
                                disabled={status === "active"}
                                title="Activate admin"
                              >
                                <i className="fas fa-check"></i>
                              </button>

                              <button
                                style={{ ...styles.statusBtn, ...styles.deactivate }}
                                onClick={() => updateStatus(admin.id, "inactive")}
                                disabled={status === "inactive"}
                                title="Deactivate admin"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </>
                          )}

                          <button
                            style={styles.deleteBtn}
                            onClick={() => handleDelete(admin.id)}
                            title="Delete admin"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredAdmins.length > 0 && (
          <div style={styles.footer}>
            Showing {filteredAdmins.length} of {admins.length} admins
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => resetForm()}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingAdmin ? (
                  <i className="fas fa-edit" style={{ color: "#4f46e5", marginRight: "8px" }}></i>
                ) : (
                  <i className="fas fa-user-plus" style={{ color: "#4f46e5", marginRight: "8px" }}></i>
                )}
                {editingAdmin ? "Edit Admin" : "Add New Admin"}
              </h2>
              <button style={styles.closeButton} onClick={resetForm}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    {editingAdmin ? "New Password (optional)" : "Password *"}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder={editingAdmin ? "Leave blank to keep current" : "Enter password"}
                    required={!editingAdmin}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    {editingAdmin ? "Confirm Password" : "Confirm Password *"}
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="Confirm password"
                    required={!editingAdmin}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  style={styles.input}
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div style={styles.formActions}>
                <button type="button" style={styles.cancelButton} onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitButton}>
                  <i className="fas fa-save"></i> {editingAdmin ? "Update Admin" : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== STYLES =====================
const styles = {
  page: {
    width: "100%",
    padding: "15px 20px",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    marginBottom: "15px",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },
  subtitle: {
    color: "#6b7280",
    margin: "5px 0 0 0",
    fontSize: "14px",
  },
  stats: {
    display: "flex",
    gap: "12px",
    marginTop: "10px",
    flexWrap: "wrap",
  },
  statBadge: {
    background: "white",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    color: "#374151",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
  },
  addButton: {
    background: "#4f46e5",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
  },
  message: {
    padding: "10px 16px",
    borderRadius: "8px",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
  },
  card: {
    background: "white",
    padding: "15px",
    borderRadius: "10px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  searchWrapper: {
    position: "relative",
    marginBottom: "12px",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9ca3af",
  },
  search: {
    width: "100%",
    padding: "8px 14px 8px 38px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  clearBtn: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#9ca3af",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  tableContainer: {
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  th: {
    background: "#f8fafc",
    padding: "10px 14px",
    textAlign: "left",
    fontWeight: "600",
    color: "#475569",
    borderBottom: "2px solid #e5e7eb",
    borderRight: "1px solid #e5e7eb",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  td: {
    padding: "10px 14px",
    borderBottom: "1px solid #e5e7eb",
    borderRight: "1px solid #e5e7eb",
    verticalAlign: "middle",
  },
  tr: {
    transition: "background 0.2s",
  },
  textCenter: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#6b7280",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#4f46e5",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "600",
    flexShrink: 0,
  },
  userBadge: {
    fontSize: "10px",
    color: "#92400e",
    background: "#fef3c7",
    padding: "1px 6px",
    borderRadius: "3px",
    display: "inline-block",
    marginTop: "2px",
  },
  roleBadge: {
    padding: "2px 10px",
    borderRadius: "50px",
    fontSize: "11px",
    fontWeight: "500",
    background: "#e0e7ff",
    color: "#4f46e5",
    whiteSpace: "nowrap",
  },
  superAdminBadge: {
    background: "#fef3c7",
    color: "#92400e",
  },
  status: {
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "bold",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  actions: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap",
  },
  editBtn: {
    background: "#e0e7ff",
    color: "#4f46e5",
    border: "none",
    cursor: "pointer",
    padding: "5px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    transition: "all 0.2s",
  },
  deleteBtn: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    cursor: "pointer",
    padding: "5px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    transition: "all 0.2s",
  },
  statusBtn: {
    border: "none",
    cursor: "pointer",
    padding: "5px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    transition: "all 0.2s",
  },
  activate: {
    background: "#dcfce7",
    color: "#16a34a",
  },
  deactivate: {
    background: "#fee2e2",
    color: "#dc2626",
  },
  footer: {
    marginTop: "12px",
    paddingTop: "10px",
    borderTop: "1px solid #f3f4f6",
    fontSize: "13px",
    color: "#6b7280",
    textAlign: "center",
  },

  // Modal Styles
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modal: {
    background: "white",
    borderRadius: "8px",
    maxWidth: "480px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
    padding: "0",
    animation: "slideIn 0.25s ease",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 18px",
    borderBottom: "1px solid #e5e7eb",
  },
  modalTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
  },
  closeButton: {
    background: "transparent",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    color: "#6b7280",
    padding: "4px 8px",
    borderRadius: "4px",
    transition: "background 0.15s",
  },
  form: {
    padding: "16px 18px",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  formGroup: {
    marginBottom: "10px",
  },
  label: {
    display: "block",
    fontWeight: "500",
    marginBottom: "3px",
    color: "#374151",
    fontSize: "12px",
  },
  input: {
    width: "100%",
    padding: "6px 10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "13px",
    transition: "border 0.2s",
    outline: "none",
    background: "white",
    color: "#1f2937",
  },
  formActions: {
    display: "flex",
    gap: "8px",
    marginTop: "12px",
    justifyContent: "flex-end",
  },
  submitButton: {
    padding: "6px 16px",
    background: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    transition: "background 0.2s",
  },
  cancelButton: {
    padding: "6px 16px",
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.2s",
  },
};

// Add animations and hover styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes slideIn {
    from { transform: translateY(-15px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .table th:last-child { border-right: none; }
  .table td:last-child { border-right: none; }
  .table tr:last-child td { border-bottom: none; }

  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn:hover:not(:disabled) { opacity: 0.85; transform: scale(0.95); }
  .table tr:hover { background: #f8fafc; }

  .add-button:hover { background: #4338ca !important; }
  .edit-btn:hover { background: #c7d2fe !important; }
  .delete-btn:hover { background: #fecaca !important; }
  .status-btn:hover:not(:disabled) { opacity: 0.8; }
  .close-button:hover { background: #f3f4f6 !important; }
  .submit-button:hover { background: #4338ca !important; }
  .cancel-button:hover { background: #e5e7eb !important; }
  .input:focus { border-color: #4f46e5 !important; box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15) !important; }

  @media (max-width: 768px) {
    .header-top { flex-direction: column !important; align-items: stretch !important; }
    .add-button { width: 100% !important; justify-content: center !important; }
    .form-row { grid-template-columns: 1fr !important; }
    .table-container { overflow-x: auto !important; }
    .search-box { max-width: 100% !important; }
    .modal { max-width: 100% !important; margin: 10px !important; }
    .stats { gap: 8px; }
    .stat-badge { font-size: 11px; padding: 2px 8px; }
  }
`;
document.head.appendChild(styleSheet);