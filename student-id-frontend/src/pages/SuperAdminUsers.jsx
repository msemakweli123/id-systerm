import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function SuperAdminUsers() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await api.get("/students", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let studentsData = [];
      if (response.data?.students) {
        studentsData = response.data.students;
      } else if (Array.isArray(response.data)) {
        studentsData = response.data;
      } else if (response.data?.data) {
        studentsData = response.data.data;
      }

      setStudents(studentsData || []);
    } catch (error) {
      console.error("Error loading students:", error);
      setStudents([]);
      showMessage("❌ Failed to load students", "error");
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

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.patch(
        `/students/${id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        showMessage(`✅ Student status updated to ${status}`, "success");
        fetchStudents();
      } else {
        showMessage(`❌ ${response.data.message || 'Failed to update status'}`, "error");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to update status";
      showMessage(`❌ ${errorMsg}`, "error");
    }
  };

  const getStudentName = (student) => {
    return student.full_name || student.user?.name || student.name || "Unknown";
  };

  const getStudentEmail = (student) => {
    return student.user?.email || student.email || "N/A";
  };

  const getStudentStatus = (student) => {
    return student.user?.status || "active";
  };

  const filteredStudents = students.filter((student) => {
    const name = getStudentName(student).toLowerCase();
    const email = getStudentEmail(student).toLowerCase();
    const reg = student.reg_number?.toLowerCase() || "";
    const searchTerm = search.toLowerCase();
    return name.includes(searchTerm) || email.includes(searchTerm) || reg.includes(searchTerm);
  });

  const getStatusStyle = (status) => {
    const statusMap = {
      active: { background: "#dcfce7", color: "#166534" },
      inactive: { background: "#fee2e2", color: "#991b1b" },
    };
    return statusMap[status?.toLowerCase()] || statusMap.active;
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1>
          <i className="fas fa-user-graduate" style={{ marginRight: "10px", color: "#1a2a6c" }}></i>
          Student Management
        </h1>
        <p style={styles.subtitle}>Manage all registered students and their login status</p>
        <div style={styles.stats}>
          <span style={styles.statBadge}>
            <i className="fas fa-users"></i> Total: {students.length} students
          </span>
          <span style={styles.statBadge}>
            <i className="fas fa-check-circle" style={{ color: "#16a34a" }}></i> Active: {
              students.filter(s => getStudentStatus(s) === 'active').length
            }
          </span>
          <span style={styles.statBadge}>
            <i className="fas fa-times-circle" style={{ color: "#dc2626" }}></i> Inactive: {
              students.filter(s => getStudentStatus(s) === 'inactive').length
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
            placeholder="Search by name, email or registration number..."
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
                <th style={styles.th}>Student Name</th>
                <th style={styles.th}>Registration</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={styles.textCenter}>
                    <i className="fas fa-spinner fa-spin"></i> Loading students...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.textCenter}>
                    <i className="fas fa-inbox" style={{ fontSize: 24, color: "#ccc", display: "block", marginBottom: 8 }}></i>
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => {
                  const status = getStudentStatus(student);
                  const statusStyle = getStatusStyle(status);
                  return (
                    <tr key={student.id} style={styles.tr}>
                      <td style={styles.td}>{index + 1}</td>
                      <td style={styles.td}>
                        <strong>{getStudentName(student)}</strong>
                        {student.user && (
                          <div style={styles.userInfo}>
                            <i className="fas fa-user" style={{ fontSize: 10 }}></i> {student.user.name}
                          </div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.regBadge}>{student.reg_number || "N/A"}</span>
                      </td>
                      <td style={styles.td}>{getStudentEmail(student)}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.status,
                          background: statusStyle.background,
                          color: statusStyle.color
                        }}>
                          {status === 'active' && <i className="fas fa-check-circle"></i>}
                          {status === 'inactive' && <i className="fas fa-times-circle"></i>}
                          {status.toUpperCase()}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button
                            style={{ ...styles.btn, ...styles.activate }}
                            onClick={() => updateStatus(student.id, "active")}
                            disabled={status === "active"}
                            title="Activate student"
                          >
                            <i className="fas fa-check"></i> Activate
                          </button>

                          <button
                            style={{ ...styles.btn, ...styles.deactivate }}
                            onClick={() => updateStatus(student.id, "inactive")}
                            disabled={status === "inactive"}
                            title="Deactivate student"
                          >
                            <i className="fas fa-times"></i> Deactivate
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

        {!loading && filteredStudents.length > 0 && (
          <div style={styles.footer}>
            Showing {filteredStudents.length} of {students.length} students
          </div>
        )}
      </div>
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
    marginBottom: "15px",
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
    fontSize: "11px",
    color: "#6b7280",
    marginTop: "2px",
  },
  regBadge: {
    background: "#f3f4f6",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    color: "#374151",
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
  btn: {
    border: "none",
    color: "white",
    cursor: "pointer",
    padding: "5px 10px",
    borderRadius: "4px",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    transition: "opacity 0.2s, transform 0.1s",
  },
  activate: {
    background: "#16a34a",
  },
  deactivate: {
    background: "#dc2626",
  },
  footer: {
    marginTop: "12px",
    paddingTop: "10px",
    borderTop: "1px solid #f3f4f6",
    fontSize: "13px",
    color: "#6b7280",
    textAlign: "center",
  },
};

// Add table header styles
const tableStyles = document.createElement("style");
tableStyles.textContent = `
  .table th:last-child {
    border-right: none;
  }
  .table td:last-child {
    border-right: none;
  }
  .table tr:last-child td {
    border-bottom: none;
  }
  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .btn:hover:not(:disabled) {
    opacity: 0.85;
    transform: scale(0.95);
  }
  .table tr:hover {
    background: #f8fafc;
  }
`;
document.head.appendChild(tableStyles);