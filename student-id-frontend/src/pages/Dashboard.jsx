import { useEffect, useState } from "react";
import api from "../api/axios";
import Footer from "../components/Footer";

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [programs, setPrograms] = useState([]);
  const [idCards, setIdCards] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  /* ================= FETCH ALL DATA ================= */
  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch students
      const studentsRes = await api.get("/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Fetch ID cards
      const idCardsRes = await api.get("/id-cards", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Fetch programs
      const programsRes = await api.get("/programs", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const studentsData = studentsRes.data?.students || [];
      const idCardsData = idCardsRes.data?.id_cards || [];
      const programsData = programsRes.data?.programs || [];

      setStudents(studentsData);
      setIdCards(idCardsData);
      setGeneratedCount(idCardsData.length);
      setPrograms(programsData);
      
      console.log(" Total Students:", studentsData.length);
      console.log(" Generated IDs:", idCardsData.length);
      console.log(" Programs:", programsData.length);
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setStudents([]);
      setIdCards([]);
      setGeneratedCount(0);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  // Get recent students (last 5)
  const recentStudents = students.slice(-5).reverse();

  // Count unique programs
  const programCount = new Set(
    students.map((s) => s.program?.id).filter(Boolean)
  ).size;

  const stats = [
    { 
      title: "Total Students", 
      value: students.length, 
      icon: "fas fa-user-graduate", 
      color: "#4f46e5" 
    },
    { 
      title: "Generated IDs", 
      value: generatedCount, 
      icon: "fas fa-id-card", 
      color: "#10b981" 
    },
    { 
      title: "Programs", 
      value: programCount || programs.length, 
      icon: "fas fa-book", 
      color: "#f59e0b" 
    },
    { 
      title: "Active System", 
      value: 1, 
      icon: "fas fa-shield-alt", 
      color: "#ef4444" 
    },
  ];

  // Recent activities from notifications or logs
  const [recentActivities, setRecentActivities] = useState([
    { id: 1, action: "System running normally", time: "Just now", icon: "fas fa-check-circle" },
  ]);

  // Fetch recent activities from notifications
  useEffect(() => {
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const notifications = res.data?.notifications || [];
      if (notifications.length > 0) {
        const activities = notifications.slice(0, 5).map((n) => ({
          id: n.id,
          action: n.message || n.title || "Notification",
          time: new Date(n.created_at).toLocaleString(),
          icon: "fas fa-bell",
        }));
        setRecentActivities(activities);
      }
    } catch (err) {
      console.log("No notifications found");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}
        <div style={styles.header}>
          <h1 style={styles.title}>
            <i className="fas fa-university"></i> University Admin Dashboard
          </h1>
          <p style={styles.subtitle}>
            Student Registration & ID Card Management System
          </p>
        </div>

        {/* STATS */}
        <div style={styles.statsGrid}>
          {stats.map((s) => (
            <div key={s.title} style={{ ...styles.card, borderLeft: `5px solid ${s.color}` }}>
              <i className={s.icon} style={{ ...styles.icon, color: s.color }}></i>
              <div>
                <h2 style={styles.value}>{loading ? "..." : s.value}</h2>
                <p style={styles.label}>{s.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div style={styles.gridWrapper}>
          <div style={styles.grid}>

            {/* STUDENTS */}
            <div style={styles.panel}>
              <h3 style={styles.panelTitle}>
                <i className="fas fa-users"></i> Recent Students
              </h3>

              {loading ? (
                <p style={styles.empty}>Loading...</p>
              ) : recentStudents.length === 0 ? (
                <p style={styles.empty}>No students found</p>
              ) : (
                recentStudents.map((s) => (
                  <div key={s.id} style={styles.studentCard}>
                    <div style={styles.avatar}>
                      <i className="fas fa-user"></i>
                    </div>

                    <div>
                      <p style={styles.name}>
                        {s.full_name || s.user?.name || "Unknown Student"}
                      </p>
                      <p style={styles.meta}>
                        <i className="fas fa-id-badge"></i> {s.reg_number || "N/A"} •{" "}
                        <i className="fas fa-book"></i> {s.program?.name || "No Program"}
                      </p>
                    </div>
                  </div>
                ))
              )}
              
              {students.length > 5 && (
                <p style={styles.viewAll}>View all {students.length} students →</p>
              )}
            </div>

            {/* ACTIVITIES */}
            <div style={styles.panel}>
              <h3 style={styles.panelTitle}>
                <i className="fas fa-bell"></i> Activity Feed
              </h3>

              {recentActivities.length === 0 ? (
                <p style={styles.empty}>No recent activities</p>
              ) : (
                recentActivities.map((a) => (
                  <div key={a.id} style={styles.activity}>
                    <i className={a.icon} style={styles.activityIcon}></i>
                    <div>
                      <p style={styles.activityText}>{a.action}</p>
                      <small style={styles.time}>{a.time}</small>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

        {/* FOOTER - Always at bottom */}
        <div style={styles.footerWrapper}>
          <Footer />
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  page: {
    background: "#f3f6fb",
    minHeight: "100vh",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    display: "flex",
    flexDirection: "column",
  },

  container: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    width: "100%",
  },

  header: {
    marginBottom: 25,
    padding: 20,
    background: "white",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },

  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a472a",
  },

  subtitle: {
    color: "#666",
    marginTop: 5,
    fontSize: 14,
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 15,
    marginBottom: 25,
  },

  card: {
    background: "white",
    padding: 15,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    gap: 15,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    transition: "transform 0.2s",
  },

  icon: {
    fontSize: 26,
    width: 40,
    textAlign: "center",
  },

  value: {
    margin: 0,
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a472a",
  },

  label: {
    margin: 0,
    color: "#777",
    fontSize: 13,
  },

  gridWrapper: {
    flex: 1,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 20,
  },

  panel: {
    background: "white",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },

  panelTitle: {
    margin: "0 0 15px 0",
    fontSize: 16,
    color: "#333",
  },

  studentCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid #eee",
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#4f46e5",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  name: {
    margin: 0,
    fontWeight: "bold",
    fontSize: 14,
  },

  meta: {
    margin: "3px 0 0 0",
    fontSize: 12,
    color: "#777",
  },

  activity: {
    display: "flex",
    gap: 10,
    padding: "10px 0",
    borderBottom: "1px solid #eee",
    alignItems: "center",
  },

  activityIcon: {
    fontSize: 18,
    color: "#4f46e5",
    width: 30,
    textAlign: "center",
  },

  activityText: {
    margin: 0,
    fontSize: 14,
  },

  time: {
    color: "#777",
    fontSize: 12,
  },

  empty: {
    color: "#999",
    textAlign: "center",
    padding: 20,
  },

  viewAll: {
    color: "#4f46e5",
    cursor: "pointer",
    marginTop: 10,
    fontSize: 13,
    textAlign: "center",
  },

  footerWrapper: {
    marginTop: "auto",
    paddingTop: 20,
  },
};