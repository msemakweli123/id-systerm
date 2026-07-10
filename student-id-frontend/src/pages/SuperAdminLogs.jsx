import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function SuperAdminLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let usersData = [];
      if (res.data?.users) {
        usersData = res.data.users;
      } else if (Array.isArray(res.data)) {
        usersData = res.data;
      } else if (res.data?.data) {
        usersData = res.data.data;
      }
      
      setUsers(usersData);
      console.log("✅ Users loaded:", usersData.length);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/admins", {
          headers: { Authorization: `Bearer ${token}` }
        });
        let adminsData = [];
        if (res.data?.admins) {
          adminsData = res.data.admins;
        } else if (Array.isArray(res.data)) {
          adminsData = res.data;
        } else if (res.data?.data) {
          adminsData = res.data.data;
        }
        setUsers(adminsData);
        console.log("✅ Admins loaded as fallback:", adminsData.length);
      } catch (err2) {
        console.error("Failed to fetch admins too:", err2);
      }
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await api.get("/logs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Full API Response:", res);
      console.log("Response Data:", res.data);
      
      let logsData = [];
      
      if (res.data) {
        if (Array.isArray(res.data)) {
          logsData = res.data;
        } 
        else if (res.data.data && Array.isArray(res.data.data)) {
          logsData = res.data.data;
        } 
        else if (res.data.logs && Array.isArray(res.data.logs)) {
          logsData = res.data.logs;
        }
        else if (res.data.log && Array.isArray(res.data.log)) {
          logsData = res.data.log;
        }
        else if (typeof res.data === 'object' && res.data !== null) {
          const values = Object.values(res.data);
          if (values.length > 0 && Array.isArray(values[0])) {
            logsData = values[0];
          } else if (values.some(item => typeof item === 'object' && item !== null)) {
            logsData = values;
          }
        }
      }
      
      console.log("Extracted Logs Data:", logsData);
      console.log("Logs Count:", logsData.length);
      
      if (logsData.length > 0) {
        console.log("First log item:", logsData[0]);
        console.log("First log item keys:", Object.keys(logsData[0]));
      }
      
      setLogs(Array.isArray(logsData) ? logsData : []);
      
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      console.error("Error response:", err.response);
      setError(err.response?.data?.message || "Failed to load logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId) => {
    if (!userId) return "System";
    const user = users.find(u => u.id === userId);
    return user?.name || `User #${userId}`;
  };

  const getUserEmail = (userId) => {
    if (!userId) return "";
    const user = users.find(u => u.id === userId);
    return user?.email || "";
  };

  const getActionDisplay = (action) => {
    if (!action) return "N/A";
    return action
      .replace(/_/g, ' ')
      .toUpperCase();
  };

  const getActionColor = (action) => {
    if (!action) return "#6b7280";
    const actionLower = action.toLowerCase();
    if (actionLower.includes('test')) return "#6b7280";
    if (actionLower.includes('login')) return "#06b6d4";
    if (actionLower.includes('logout')) return "#6b7280";
    if (actionLower.includes('student_created')) return "#10b981";
    if (actionLower.includes('student_updated')) return "#3b82f6";
    if (actionLower.includes('student_deleted')) return "#ef4444";
    if (actionLower.includes('student_status')) return "#f59e0b";
    if (actionLower.includes('id_card')) return "#8b5cf6";
    if (actionLower.includes('photo')) return "#ec4899";
    if (actionLower.includes('admin')) return "#7c3aed";
    if (actionLower.includes('super')) return "#7c3aed";
    return "#6b7280";
  };

  const getActionBg = (action) => {
    if (!action) return "#f3f4f6";
    const actionLower = action.toLowerCase();
    if (actionLower.includes('test')) return "#f3f4f6";
    if (actionLower.includes('login')) return "#cffafe";
    if (actionLower.includes('logout')) return "#f3f4f6";
    if (actionLower.includes('student_created')) return "#dcfce7";
    if (actionLower.includes('student_updated')) return "#dbeafe";
    if (actionLower.includes('student_deleted')) return "#fee2e2";
    if (actionLower.includes('student_status')) return "#fef3c7";
    if (actionLower.includes('id_card')) return "#ede9fe";
    if (actionLower.includes('photo')) return "#fce7f3";
    if (actionLower.includes('admin')) return "#ede9fe";
    if (actionLower.includes('super')) return "#ede9fe";
    return "#f3f4f6";
  };

  const getActionIcon = (action) => {
    if (!action) return "fa-circle";
    const actionLower = action.toLowerCase();
    if (actionLower.includes('login')) return "fa-sign-in-alt";
    if (actionLower.includes('logout')) return "fa-sign-out-alt";
    if (actionLower.includes('student_created')) return "fa-user-plus";
    if (actionLower.includes('student_updated')) return "fa-user-edit";
    if (actionLower.includes('student_deleted')) return "fa-user-times";
    if (actionLower.includes('student_status')) return "fa-toggle-on";
    if (actionLower.includes('id_card')) return "fa-id-card";
    if (actionLower.includes('photo')) return "fa-image";
    if (actionLower.includes('admin')) return "fa-user-shield";
    if (actionLower.includes('super')) return "fa-user-shield";
    return "fa-circle";
  };

  const getFilteredLogs = () => {
    let filtered = logs;

    if (filterAction !== "all") {
      filtered = filtered.filter(log => 
        log.action?.toLowerCase().includes(filterAction.toLowerCase())
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.action?.toLowerCase().includes(term) ||
        log.description?.toLowerCase().includes(term) ||
        getUserName(log.user_id).toLowerCase().includes(term) ||
        getUserEmail(log.user_id).toLowerCase().includes(term) ||
        log.ip_address?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const filteredLogs = getFilteredLogs();

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1>
            <i className="fas fa-history" style={{ marginRight: "10px", color: "#1a2a6c" }}></i>
            Activity Logs
          </h1>
          <p style={styles.subtitle}>View all system activities, logins, logouts and user actions</p>
        </div>
        {!loading && (
          <span style={styles.countBadge}>
            <i className="fas fa-list"></i> Total: {logs.length} logs
          </span>
        )}
      </div>

      {error && (
        <div style={styles.errorBox}>
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i> Loading logs...
        </div>
      ) : logs.length === 0 ? (
        <div style={styles.empty}>
          <i className="fas fa-inbox" style={{ fontSize: 48, color: "#ccc" }}></i>
          <h3>No Logs Found</h3>
          <p>No activity logs are available in the system yet.</p>
          <button onClick={fetchLogs} style={styles.refreshBtn}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      ) : (
        <>
          {/* FILTERS */}
          <div style={styles.filterSection}>
            <div style={styles.filterLeft}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>
                  <i className="fas fa-filter"></i> Action:
                </label>
                <select 
                  value={filterAction} 
                  onChange={(e) => setFilterAction(e.target.value)}
                  style={styles.filterSelect}
                >
                  <option value="all">All Actions</option>
                  <option value="login"><i className="fas fa-sign-in-alt"></i> Logins</option>
                  <option value="logout"><i className="fas fa-sign-out-alt"></i> Logouts</option>
                  <option value="student_created"><i className="fas fa-user-plus"></i> Student Created</option>
                  <option value="student_updated"><i className="fas fa-user-edit"></i> Student Updated</option>
                  <option value="student_deleted"><i className="fas fa-user-times"></i> Student Deleted</option>
                  <option value="id_card"><i className="fas fa-id-card"></i> ID Card</option>
                  <option value="photo"><i className="fas fa-image"></i> Photo</option>
                  <option value="admin"><i className="fas fa-user-shield"></i> Admin</option>
                </select>
              </div>
            </div>
            <div style={styles.filterRight}>
              <div style={styles.searchWrapper}>
                <i className="fas fa-search" style={styles.searchIcon}></i>
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
                {searchTerm && (
                  <button style={styles.clearBtn} onClick={() => setSearchTerm("")}>
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
              <button onClick={fetchLogs} style={styles.refreshBtnSmall}>
                <i className="fas fa-sync-alt"></i> Refresh
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div style={styles.tableContainer}>
            <div style={styles.tableHeader}>
              <span>
                <i className="fas fa-list"></i> Showing {filteredLogs.length} of {logs.length} entries
              </span>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Action</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>IP Address</th>
                  <th style={styles.th}>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={styles.noResults}>
                      <i className="fas fa-search"></i> No logs match your filters
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, index) => {
                    const userName = getUserName(log.user_id);
                    const userEmail = getUserEmail(log.user_id);
                    const hasUser = log.user_id && log.user_id !== null;
                    
                    return (
                      <tr key={log.id || index} style={styles.tr}>
                        <td style={styles.td}>{index + 1}</td>
                        <td style={styles.td}>
                          {hasUser ? (
                            <>
                              <strong style={styles.userName}>{userName}</strong>
                              {userEmail && (
                                <div style={styles.userEmail}>
                                  <i className="fas fa-envelope" style={{ fontSize: "10px" }}></i> {userEmail}
                                </div>
                              )}
                              <div style={styles.userId}>
                                <i className="fas fa-id-badge" style={{ fontSize: "10px" }}></i> ID: {log.user_id}
                              </div>
                            </>
                          ) : (
                            <span style={styles.systemUser}>
                              <i className="fas fa-cog" style={{ marginRight: "4px" }}></i>
                              System
                            </span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.actionBadge,
                            background: getActionBg(log.action),
                            color: getActionColor(log.action)
                          }}>
                            <i className={`fas ${getActionIcon(log.action)}`} style={{ marginRight: "4px" }}></i>
                            {getActionDisplay(log.action)}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.descriptionText}>
                            {log.description || "N/A"}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <code style={styles.ipBadge}>
                            <i className="fas fa-network-wired" style={{ fontSize: "10px", marginRight: "4px" }}></i>
                            {log.ip_address || "N/A"}
                          </code>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.dateTime}>
                            <div style={styles.date}>
                              <i className="fas fa-calendar" style={{ fontSize: "10px" }}></i> {log.created_at ? new Date(log.created_at).toLocaleDateString() : "N/A"}
                            </div>
                            <div style={styles.time}>
                              <i className="fas fa-clock" style={{ fontSize: "10px" }}></i> {log.created_at ? new Date(log.created_at).toLocaleTimeString() : "N/A"}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    padding: "15px 20px",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "10px",
  },
  headerLeft: {
    flex: 1,
  },
  subtitle: {
    color: "#6b7280",
    margin: "5px 0 0 0",
    fontSize: "14px",
  },
  countBadge: {
    background: "#1a2a6c",
    color: "white",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    alignSelf: "center",
  },
  errorBox: {
    background: "#fee2e2",
    color: "#dc2626",
    padding: "10px 16px",
    borderRadius: "8px",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
  },
  loading: {
    textAlign: "center",
    padding: "60px",
    fontSize: "16px",
    color: "#6b7280",
  },
  empty: {
    textAlign: "center",
    padding: "80px 40px",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  refreshBtn: {
    marginTop: "15px",
    padding: "10px 24px",
    background: "#1a2a6c",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    transition: "background 0.2s",
  },
  refreshBtnSmall: {
    padding: "6px 14px",
    background: "#1a2a6c",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    transition: "background 0.2s",
    whiteSpace: "nowrap",
  },
  filterSection: {
    background: "white",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "16px",
    border: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },
  filterLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  filterRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  filterLabel: {
    fontSize: "13px",
    color: "#6b7280",
    fontWeight: "500",
  },
  filterSelect: {
    padding: "5px 10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "13px",
    outline: "none",
    background: "white",
    cursor: "pointer",
  },
  searchWrapper: {
    position: "relative",
    width: "250px",
  },
  searchIcon: {
    position: "absolute",
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9ca3af",
    fontSize: "12px",
  },
  searchInput: {
    width: "100%",
    padding: "6px 30px 6px 32px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "13px",
    outline: "none",
    transition: "border-color 0.2s",
    background: "white",
  },
  clearBtn: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#9ca3af",
    cursor: "pointer",
    padding: "2px 6px",
  },
  tableContainer: {
    background: "white",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #e5e7eb",
  },
  tableHeader: {
    padding: "10px 16px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "13px",
    color: "#64748b",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    background: "#f8fafc",
    padding: "10px 14px",
    textAlign: "left",
    fontWeight: "600",
    color: "#475569",
    borderBottom: "2px solid #e5e7eb",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  td: {
    padding: "8px 14px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle",
  },
  tr: {
    transition: "background 0.15s",
  },
  noResults: {
    textAlign: "center",
    padding: "30px",
    color: "#9ca3af",
  },
  userName: {
    fontSize: "13px",
    color: "#1f2937",
  },
  userId: {
    fontSize: "10px",
    color: "#6b7280",
    marginTop: "1px",
  },
  userEmail: {
    fontSize: "11px",
    color: "#6b7280",
    marginTop: "1px",
  },
  systemUser: {
    fontSize: "13px",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
  },
  actionBadge: {
    padding: "3px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    whiteSpace: "nowrap",
  },
  descriptionText: {
    fontSize: "13px",
    color: "#374151",
  },
  ipBadge: {
    background: "#f3f4f6",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    color: "#374151",
    fontFamily: "monospace",
    display: "inline-flex",
    alignItems: "center",
  },
  dateTime: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    fontSize: "12px",
  },
  date: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    color: "#6b7280",
  },
  time: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    color: "#6b7280",
  },
};

// Add hover styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .table tr:hover {
    background: #f8fafc;
  }
  .table tr:last-child td {
    border-bottom: none;
  }
  .refresh-btn:hover {
    background: #2d4a8c !important;
  }
  .refresh-btn-small:hover {
    background: #2d4a8c !important;
  }
  .filter-select:focus {
    border-color: #1a2a6c !important;
    box-shadow: 0 0 0 2px rgba(26, 42, 108, 0.1);
  }
  .search-input:focus {
    border-color: #1a2a6c !important;
    box-shadow: 0 0 0 2px rgba(26, 42, 108, 0.1);
  }
  .clear-btn:hover {
    color: #374151 !important;
  }

  @media (max-width: 768px) {
    .page {
      padding: 10px !important;
    }
    .header {
      flex-direction: column !important;
      align-items: stretch !important;
    }
    .count-badge {
      align-self: stretch !important;
      text-align: center !important;
      justify-content: center !important;
    }
    .filter-section {
      flex-direction: column !important;
      align-items: stretch !important;
    }
    .filter-left {
      flex-direction: column !important;
      align-items: stretch !important;
    }
    .filter-right {
      flex-direction: column !important;
      align-items: stretch !important;
    }
    .search-wrapper {
      width: 100% !important;
    }
    .table-container {
      overflow-x: auto !important;
    }
    .table {
      font-size: 12px !important;
    }
    .th, .td {
      padding: 6px 10px !important;
    }
  }
`;
document.head.appendChild(styleSheet);