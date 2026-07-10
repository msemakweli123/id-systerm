import { useEffect, useState } from "react";
import api from "../api/axios";

export default function SuperAdminDashboard() {
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [adminsRes, usersRes] = await Promise.all([
        api.get("/admins"),
        api.get("/students"),
      ]);

      const adminData =
        adminsRes.data?.admins ||
        adminsRes.data?.data ||
        [];

      const studentData =
        usersRes.data?.students ||
        usersRes.data?.data ||
        [];

      setAdmins(Array.isArray(adminData) ? adminData : []);
      setUsers(Array.isArray(studentData) ? studentData : []);

    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setAdmins([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: "Total Admins",
      value: admins.length,
      icon: "fa-user-shield",
      color: "#4f46e5",
    },
    {
      title: "Total Students",
      value: users.length,
      icon: "fa-users",
      color: "#10b981",
    },
    {
      title: "Active Systems",
      value: 1,
      icon: "fa-server",
      color: "#f59e0b",
    },
    {
      title: "Security Level",
      value: "High",
      icon: "fa-lock",
      color: "#ef4444",
    },
  ];

  const recentAdmins = admins.slice(0, 5);
  const recentUsers = users.slice(0, 5);

  return (
    <div style={styles.dashboard}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1>
            <i className="fas fa-user-shield" style={{ color: "#1a2a6c", marginRight: "10px" }}></i>
            Super Admin Dashboard
          </h1>
          <p style={styles.subtitle}>System overview and control center</p>
        </div>
      </div>

      {/* STATS */}
      <div style={styles.statsGrid}>
        {stats.map((s) => (
          <div
            key={s.title}
            style={{
              ...styles.card,
              borderLeft: `6px solid ${s.color}`
            }}
          >
            <div
              style={{
                ...styles.iconBox,
                background: `${s.color}20`,
                color: s.color
              }}
            >
              <i className={`fas ${s.icon}`}></i>
            </div>

            <div>
              <h2 style={styles.value}>{s.value}</h2>
              <p style={styles.label}>{s.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* GRID */}
      <div style={styles.grid}>

        {/* ADMINS */}
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>
            <i className="fas fa-user-shield" style={{ marginRight: "8px", color: "#4f46e5" }}></i>
            Recent Admins
          </h3>

          {loading ? (
            <p style={styles.loadingText}>Loading...</p>
          ) : recentAdmins.length === 0 ? (
            <p style={styles.emptyText}>No admins found</p>
          ) : (
            recentAdmins.map((admin) => (
              <div key={admin.id} style={styles.row}>
                <div style={styles.avatar}>
                  <i className="fas fa-user-shield"></i>
                </div>
                <div>
                  <strong style={styles.rowName}>{admin.name}</strong>
                  <br />
                  <small style={styles.rowEmail}>{admin.email}</small>
                </div>
              </div>
            ))
          )}
        </div>

        {/* USERS */}
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>
            <i className="fas fa-users" style={{ marginRight: "8px", color: "#10b981" }}></i>
            Recent Students
          </h3>

          {loading ? (
            <p style={styles.loadingText}>Loading...</p>
          ) : recentUsers.length === 0 ? (
            <p style={styles.emptyText}>No students found</p>
          ) : (
            recentUsers.map((user) => (
              <div key={user.id} style={styles.row}>
                <div style={{ ...styles.avatar, ...styles.userAvatar }}>
                  <i className="fas fa-user"></i>
                </div>
                <div>
                  <strong style={styles.rowName}>{user.name}</strong>
                  <br />
                  <small style={styles.rowEmail}>{user.email}</small>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* STYLES */}
      <style>{`
        .dashboard {
          width: 100%;
          padding-top: 20px; /* Added padding to push content down */
        }

        .header {
          background: white;
          padding: 25px 25px;
          border-radius: 12px;
          margin-bottom: 25px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          border: 1px solid #e5e7eb;
        }

        .header h1 {
          margin: 0;
          font-size: 24px;
          color: #1a2a6c;
        }

        .header p {
          margin: 5px 0 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 15px;
          margin-bottom: 25px;
        }

        .card {
          background: white;
          padding: 18px 20px;
          border-radius: 12px;
          display: flex;
          gap: 12px;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          border: 1px solid #e5e7eb;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .iconBox {
          width: 45px;
          height: 45px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .card h2 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
          color: #1a2a6c;
        }

        .card p {
          margin: 2px 0 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .panel {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          border: 1px solid #e5e7eb;
        }

        .panel h3 {
          margin: 0 0 15px 0;
          font-size: 16px;
          color: #1a2a6c;
        }

        .row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .row:last-child {
          border-bottom: none;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #4f46e5;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .avatar.user {
          background: #10b981;
        }

        .row strong {
          font-size: 14px;
          color: #1f2937;
        }

        .row small {
          color: #6b7280;
          font-size: 12px;
        }

        .loading-text {
          text-align: center;
          color: #6b7280;
          padding: 20px 0;
        }

        .empty-text {
          text-align: center;
          color: #9ca3af;
          padding: 20px 0;
        }

        @media (max-width: 900px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .dashboard {
            padding-top: 10px;
          }
          .header {
            padding: 15px;
          }
          .header h1 {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  dashboard: {
    width: "100%",
    paddingTop: "20px", // Added padding to push content down
  },
  header: {
    background: "white",
    padding: "25px 25px",
    borderRadius: "12px",
    marginBottom: "25px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
  },
  headerContent: {
    width: "100%",
  },
  subtitle: {
    color: "#6b7280",
    margin: "5px 0 0 0",
    fontSize: "14px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
    marginBottom: "25px",
  },
  card: {
    background: "white",
    padding: "18px 20px",
    borderRadius: "12px",
    display: "flex",
    gap: "12px",
    alignItems: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
  },
  iconBox: {
    width: "45px",
    height: "45px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },
  value: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1a2a6c",
  },
  label: {
    margin: "2px 0 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  panel: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
  },
  panelTitle: {
    margin: "0 0 15px 0",
    fontSize: "16px",
    color: "#1a2a6c",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#4f46e5",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  userAvatar: {
    background: "#10b981",
  },
  rowName: {
    fontSize: "14px",
    color: "#1f2937",
  },
  rowEmail: {
    color: "#6b7280",
    fontSize: "12px",
  },
  loadingText: {
    textAlign: "center",
    color: "#6b7280",
    padding: "20px 0",
  },
  emptyText: {
    textAlign: "center",
    color: "#9ca3af",
    padding: "20px 0",
  },
};