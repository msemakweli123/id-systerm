import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function ViewStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get("/students");

      const data = res.data?.students || res.data?.data || [];

      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch students error:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Get status from user (since status is stored in users table)
  const getStudentStatus = (student) => {
    return student.user?.status || student.status || "active";
  };

  // Get status color
  const getStatusStyle = (status) => {
    const statusMap = {
      active: { background: "#dcfce7", color: "#166534" },
      inactive: { background: "#fee2e2", color: "#991b1b" },
      suspended: { background: "#fef3c7", color: "#92400e" },
    };
    return statusMap[status?.toLowerCase()] || statusMap.active;
  };

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            <i className="fas fa-users" style={{ marginRight: "10px", color: "#1a472a" }}></i>
            Students List
          </h2>
          <span style={styles.countBadge}>
            Total: {students.length} students
          </span>
        </div>

        {loading ? (
          <div style={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i> Loading students...
          </div>
        ) : students.length === 0 ? (
          <div style={styles.empty}>
            <i className="fas fa-inbox" style={{ fontSize: 48, color: "#ccc" }}></i>
            <p>No students found</p>
          </div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Reg Number</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Program</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student, index) => {
                  const status = getStudentStatus(student);
                  const statusStyle = getStatusStyle(status);
                  return (
                    <tr key={student.id} style={styles.tr}>
                      <td style={styles.td}>{index + 1}</td>
                      <td style={styles.td}>
                        <strong>{student.user?.name || student.name || "-"}</strong>
                        {student.user && (
                          <div style={styles.userInfo}>
                            <i className="fas fa-user" style={{ fontSize: 10 }}></i> ID: {student.user.id}
                          </div>
                        )}
                      </td>
                      <td style={styles.td}>{student.user?.email || student.email || "-"}</td>
                      <td style={styles.td}>
                        <span style={styles.regBadge}>{student.reg_number || "-"}</span>
                      </td>
                      <td style={styles.td}>{student.department?.name || "-"}</td>
                      <td style={styles.td}>{student.program?.name || "-"}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.status,
                          background: statusStyle.background,
                          color: statusStyle.color
                        }}>
                          {status === 'active' && <i className="fas fa-check-circle"></i>}
                          {status === 'suspended' && <i className="fas fa-pause-circle"></i>}
                          {status === 'inactive' && <i className="fas fa-times-circle"></i>}
                          {status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CSS Styles */}
      <style>{`
        .table-container {
          overflow-x: auto;
        }
        
        .table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          border: 2px solid #1a472a;
        }
        
        .table th {
          background: #052635;
          color: white;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          border: 2px solid #1a472a;
          border-bottom: 3px solid #1a472a;
        }
        
        .table td {
          padding: 10px 16px;
          border: 2px solid #1a472a;
          vertical-align: middle;
        }
        
        .table tbody tr {
          transition: background 0.2s;
          border-bottom: 2px solid #1a472a;
        }
        
        .table tbody tr:hover {
          background: #f0f7f0;
        }
        
        .table tbody tr:nth-child(even) {
          background: #f8fafc;
        }
        
        .table tbody tr:nth-child(even):hover {
          background: #f0f7f0;
        }
        
        .table th:last-child {
          text-align: center;
        }
        
        .table td:last-child {
          text-align: center;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .table {
            font-size: 12px;
          }
          
          .table th,
          .table td {
            padding: 8px 10px;
          }
        }
      `}</style>
    </Layout>
  );
}

/* ================= STYLES ================= */
const styles = {
  container: {
    padding: "20px",
    maxWidth: "1400px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "10px",
  },

  title: {
    margin: 0,
    fontSize: "22px",
    color: "#1a472a",
    display: "flex",
    alignItems: "center",
  },

  countBadge: {
    background: "#040f25",
    color: "white",
    padding: "4px 14px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "500",
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

  tableContainer: {
    background: "white",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    border: "2px solid #1a472a",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },

  th: {
    background: "#052635",
    color: "white",
    padding: "12px 16px",
    textAlign: "left",
    fontWeight: "600",
    fontSize: "13px",
    border: "2px solid #1a472a",
    borderBottom: "3px solid #1a472a",
  },

  td: {
    padding: "10px 16px",
    border: "2px solid #1a472a",
    verticalAlign: "middle",
  },

  tr: {
    transition: "background 0.2s",
    borderBottom: "2px solid #1a472a",
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
};