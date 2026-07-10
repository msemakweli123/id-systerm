import React, { useState, useEffect } from "react";
import api from "../api/axios";

export default function SuperAdminReports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAdmins: 0,
    totalIdCards: 0,
    signedIdCards: 0,
    totalDepartments: 0,
    totalPrograms: 0,
    totalFaculties: 0,
    pendingPhotos: 0,
    approvedPhotos: 0,
    totalPhotos: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found");
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all data in parallel with error handling for each
      const [
        studentsRes,
        adminsRes,
        idCardsRes,
        departmentsRes,
        programsRes,
        facultiesRes,
        photosRes,
        logsRes
      ] = await Promise.allSettled([
        api.get("/students", { headers }),
        api.get("/admins", { headers }),
        api.get("/id-cards", { headers }),
        api.get("/departments", { headers }),
        api.get("/programs", { headers }),
        api.get("/faculties", { headers }),
        api.get("/photos", { headers }),
        api.get("/logs", { headers })
      ]);

      // Extract data with proper fallbacks
      const students = studentsRes.status === 'fulfilled' 
        ? (studentsRes.value.data?.students || studentsRes.value.data?.data || []) 
        : [];

      const admins = adminsRes.status === 'fulfilled' 
        ? (adminsRes.value.data?.data || adminsRes.value.data || []) 
        : [];

      const idCards = idCardsRes.status === 'fulfilled' 
        ? (idCardsRes.value.data?.id_cards || idCardsRes.value.data?.data || []) 
        : [];

      const departments = departmentsRes.status === 'fulfilled' 
        ? (departmentsRes.value.data?.data || departmentsRes.value.data || []) 
        : [];

      const programs = programsRes.status === 'fulfilled' 
        ? (programsRes.value.data?.programs || programsRes.value.data?.data || []) 
        : [];

      const faculties = facultiesRes.status === 'fulfilled' 
        ? (facultiesRes.value.data?.data || facultiesRes.value.data || []) 
        : [];

      const photos = photosRes.status === 'fulfilled' 
        ? (photosRes.value.data?.photos || photosRes.value.data?.data || []) 
        : [];

      const logs = logsRes.status === 'fulfilled' 
        ? (logsRes.value.data?.logs || logsRes.value.data?.data || []) 
        : [];

      console.log("📊 Students:", students.length);
      console.log("📊 Admins:", admins.length);
      console.log("📊 ID Cards:", idCards.length);
      console.log("📊 Departments:", departments.length);
      console.log("📊 Programs:", programs.length);
      console.log("📊 Faculties:", faculties.length);
      console.log("📊 Photos:", photos.length);
      console.log("📊 Logs:", logs.length);

      // Ensure admins are properly filtered to only include admin/super_admin
      const filteredAdmins = admins.filter(user => 
        user && (
          user.role === "admin" || 
          user.role === "super_admin" ||
          user.role?.toLowerCase() === "admin" ||
          user.role?.toLowerCase() === "super_admin"
        )
      );

      setStats({
        totalStudents: students.length,
        totalAdmins: filteredAdmins.length,
        totalIdCards: idCards.length,
        signedIdCards: idCards.filter(c => c.signature || c.signature_path).length,
        totalDepartments: departments.length,
        totalPrograms: programs.length,
        totalFaculties: faculties.length,
        pendingPhotos: photos.filter(p => p.status === 'pending' || p.status === 'pending').length,
        approvedPhotos: photos.filter(p => p.status === 'approved' || p.status === 'approved').length,
        totalPhotos: photos.length,
      });

      setRecentActivities(Array.isArray(logs) ? logs.slice(0, 10) : []);

    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleString();
    } catch {
      return "N/A";
    }
  };

  const getActionColor = (action) => {
    if (!action) return "#6b7280";
    const actionLower = action.toLowerCase();
    if (actionLower.includes('student_created') || actionLower.includes('created')) return "#10b981";
    if (actionLower.includes('student_updated') || actionLower.includes('updated')) return "#3b82f6";
    if (actionLower.includes('student_deleted') || actionLower.includes('deleted')) return "#ef4444";
    if (actionLower.includes('student_status') || actionLower.includes('status')) return "#f59e0b";
    if (actionLower.includes('id_card') || actionLower.includes('id card')) return "#8b5cf6";
    if (actionLower.includes('photo') || actionLower.includes('image')) return "#ec4899";
    if (actionLower.includes('login')) return "#06b6d4";
    if (actionLower.includes('logout')) return "#6b7280";
    if (actionLower.includes('admin') || actionLower.includes('super')) return "#7c3aed";
    return "#6b7280";
  };

  const getActionBg = (action) => {
    if (!action) return "#f3f4f6";
    const actionLower = action.toLowerCase();
    if (actionLower.includes('student_created') || actionLower.includes('created')) return "#dcfce7";
    if (actionLower.includes('student_updated') || actionLower.includes('updated')) return "#dbeafe";
    if (actionLower.includes('student_deleted') || actionLower.includes('deleted')) return "#fee2e2";
    if (actionLower.includes('student_status') || actionLower.includes('status')) return "#fef3c7";
    if (actionLower.includes('id_card') || actionLower.includes('id card')) return "#ede9fe";
    if (actionLower.includes('photo') || actionLower.includes('image')) return "#fce7f3";
    if (actionLower.includes('login')) return "#cffafe";
    if (actionLower.includes('logout')) return "#f3f4f6";
    if (actionLower.includes('admin') || actionLower.includes('super')) return "#ede9fe";
    return "#f3f4f6";
  };

  const getActionDisplay = (action) => {
    if (!action) return "N/A";
    return action.replace(/_/g, ' ').toUpperCase();
  };

  const getUserName = (log) => {
    if (log.user?.name) return log.user.name;
    if (log.user_name) return log.user_name;
    if (log.username) return log.username;
    if (log.name) return log.name;
    if (log.user_id) return `User #${log.user_id}`;
    return 'System';
  };

  const statCards = [
    { title: "Total Students", value: stats.totalStudents, icon: "fa-user-graduate", color: "#4f46e5" },
    { title: "Total Admins", value: stats.totalAdmins, icon: "fa-user-shield", color: "#7c3aed" },
    { title: "Total ID Cards", value: stats.totalIdCards, icon: "fa-id-card", color: "#10b981" },
    { title: "Signed ID Cards", value: stats.signedIdCards, icon: "fa-check-circle", color: "#059669" },
    { title: "Total Photos", value: stats.totalPhotos, icon: "fa-images", color: "#ec4899" },
    { title: "Pending Photos", value: stats.pendingPhotos, icon: "fa-hourglass-half", color: "#f59e0b" },
    { title: "Approved Photos", value: stats.approvedPhotos, icon: "fa-check-circle", color: "#22c55e" },
    { title: "Faculties", value: stats.totalFaculties, icon: "fa-university", color: "#f59e0b" },
    { title: "Departments", value: stats.totalDepartments, icon: "fa-building", color: "#3b82f6" },
    { title: "Programs", value: stats.totalPrograms, icon: "fa-book", color: "#8b5cf6" },
  ];

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1>
            <i className="fas fa-chart-bar" style={{ marginRight: "10px", color: "#1a2a6c" }}></i>
            System Reports
          </h1>
          <p style={styles.subtitle}>View comprehensive system analytics and statistics</p>
        </div>
        <button onClick={fetchReports} style={styles.refreshBtn}>
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      {loading ? (
        <div style={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i> Loading reports...
        </div>
      ) : (
        <>
          {/* STATS GRID */}
          <div style={styles.statsGrid}>
            {statCards.map((stat) => (
              <div key={stat.title} style={{ ...styles.statCard, borderLeft: `4px solid ${stat.color}` }}>
                <div style={{ ...styles.statIcon, background: `${stat.color}10` }}>
                  <i className={`fas ${stat.icon}`} style={{ color: stat.color }}></i>
                </div>
                <div style={styles.statContent}>
                  <h3 style={styles.statValue}>{stat.value}</h3>
                  <p style={styles.statTitle}>{stat.title}</p>
                </div>
              </div>
            ))}
          </div>

          {/* RECENT ACTIVITIES */}
          <div style={styles.activitySection}>
            <div style={styles.activityHeader}>
              <h2 style={styles.activityTitle}>
                <i className="fas fa-clock" style={{ marginRight: "8px", color: "#1a2a6c" }}></i>
                Recent Activities
              </h2>
              <span style={styles.activityCount}>{recentActivities.length} entries</span>
            </div>

            {recentActivities.length === 0 ? (
              <div style={styles.empty}>
                <i className="fas fa-inbox" style={{ fontSize: 32, color: "#ccc" }}></i>
                <p>No recent activities found</p>
              </div>
            ) : (
              <div style={styles.activityList}>
                {recentActivities.map((log, index) => (
                  <div key={log.id || index} style={styles.activityItem}>
                    <div style={styles.activityBadge}>
                      <span style={{
                        ...styles.activityDot,
                        background: getActionColor(log.action)
                      }}></span>
                    </div>
                    <div style={styles.activityContent}>
                      <div style={styles.activityAction}>
                        <span style={{
                          ...styles.actionBadge,
                          background: getActionBg(log.action),
                          color: getActionColor(log.action)
                        }}>
                          {getActionDisplay(log.action)}
                        </span>
                      </div>
                      <p style={styles.activityDescription}>{log.description || "No description"}</p>
                      <div style={styles.activityMeta}>
                        <span style={styles.activityUser}>
                          <i className="fas fa-user"></i> {getUserName(log)}
                        </span>
                        <span style={styles.activityTime}>
                          <i className="fas fa-clock"></i> {formatDate(log.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
  refreshBtn: {
    padding: "8px 16px",
    background: "#1a2a6c",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "background 0.2s",
    alignSelf: "center",
  },
  loading: {
    textAlign: "center",
    padding: "60px",
    fontSize: "16px",
    color: "#6b7280",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  },
  statCard: {
    background: "white",
    padding: "16px 18px",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    transition: "transform 0.2s, boxShadow 0.2s",
    border: "1px solid #e5e7eb",
  },
  statIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "bold",
    color: "#1a2a6c",
  },
  statTitle: {
    margin: "2px 0 0 0",
    color: "#6b7280",
    fontSize: "12px",
  },
  activitySection: {
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    padding: "16px 18px",
    border: "1px solid #e5e7eb",
  },
  activityHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    paddingBottom: "10px",
    borderBottom: "1px solid #e5e7eb",
  },
  activityTitle: {
    margin: 0,
    fontSize: "16px",
    color: "#1a2a6c",
  },
  activityCount: {
    background: "#f3f4f6",
    padding: "2px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#6b7280",
  },
  activityList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  activityItem: {
    display: "flex",
    gap: "12px",
    padding: "10px 12px",
    borderRadius: "6px",
    background: "#f8fafc",
    transition: "background 0.2s",
    border: "1px solid transparent",
  },
  activityBadge: {
    flexShrink: 0,
    paddingTop: "4px",
  },
  activityDot: {
    display: "inline-block",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    marginBottom: "2px",
  },
  actionBadge: {
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  activityDescription: {
    margin: "2px 0",
    fontSize: "13px",
    color: "#1f2937",
  },
  activityMeta: {
    display: "flex",
    gap: "15px",
    fontSize: "11px",
    color: "#6b7280",
    marginTop: "2px",
  },
  activityUser: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  activityTime: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  empty: {
    textAlign: "center",
    padding: "30px",
    color: "#9ca3af",
  },
};

// Add hover styles
const hoverStyles = document.createElement("style");
hoverStyles.textContent = `
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transition: all 0.2s ease;
  }
  .activity-item:hover {
    background: #f1f5f9 !important;
    border-color: #e5e7eb;
  }
  .refresh-btn:hover {
    background: #2d4a8c !important;
  }

  @media (max-width: 768px) {
    .page {
      padding: 10px !important;
    }
    .stats-grid {
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important;
      gap: 8px !important;
    }
    .stat-card {
      padding: 12px 14px !important;
    }
    .stat-value {
      font-size: 17px !important;
    }
    .header {
      flex-direction: column !important;
      align-items: stretch !important;
    }
    .refresh-btn {
      align-self: stretch !important;
      justify-content: center !important;
    }
  }
`;
document.head.appendChild(hoverStyles);