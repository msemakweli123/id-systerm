import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout"; // Import Layout

import "@fortawesome/fontawesome-free/css/all.min.css";

export default function Student() {
  const navigate = useNavigate();

  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoStatus, setPhotoStatus] = useState("none");

  useEffect(() => {
    //  Check authentication on mount
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    console.log("=== Student Dashboard Debug ===");
    console.log("Token:", token);
    console.log("Role:", role);
    console.log("================================");
    
    if (!token) {
      navigate("/login");
      return;
    }
    
    //  If role is missing but we're on student page, set it
    if (!role) {
      console.log("⚠️ Role missing, setting to 'student'");
      localStorage.setItem("role", "student");
    }
    
    fetchStudent();
  }, []);

  const fetchStudent = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const res = await api.get("/student/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Student data received:", res.data);
      setStudentData(res.data.student);
      await fetchPhotoStatus(token);
    } catch (err) {
      console.error("Error fetching student:", err);
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotoStatus = async (token) => {
    try {
      const photoRes = await api.get("/student/photo", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const photo = photoRes.data?.photo;

      if (!photo?.path) {
        setPhotoStatus("none");
        return;
      }

      setPhotoStatus(photo.status || "none");
    } catch (err) {
      console.log("No photo found");
      setPhotoStatus("none");
    }
  };

  const userName = studentData?.user?.name || "Student";

  // Student Dashboard Content
  const StudentContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <div style={styles.spinner}></div>
          <p>Loading your dashboard...</p>
        </div>
      );
    }

    return (
      <>
        {/* HERO - Only status badge */}
        <div style={styles.hero}>
          <div style={styles.studentInfo}>
            <h2 style={styles.welcomeTitle}>Welcome back, {userName}! </h2>
            <div style={styles.badgeContainer}>
              <div className={`badge ${photoStatus}`}>
                {photoStatus === "approved" && (
                  <span>
                    <i className="fas fa-check-circle"></i> ✅ Approved Photo
                  </span>
                )}

                {photoStatus === "pending" && (
                  <span>
                    <i className="fas fa-clock"></i> ⏳ Pending Approval
                  </span>
                )}

                {photoStatus === "rejected" && (
                  <span>
                    <i className="fas fa-times-circle"></i> ❌ Rejected
                  </span>
                )}

                {photoStatus === "none" && (
                  <span>
                    <i className="fas fa-user-circle"></i> 📸 No Photo Uploaded
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* GRID */}
        <div style={styles.grid}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <i className="fas fa-book" style={styles.cardIcon}></i> Program
            </h3>
            <p style={styles.cardText}>{studentData?.program?.name || "Not assigned"}</p>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <i className="fas fa-university" style={styles.cardIcon}></i> Department
            </h3>
            <p style={styles.cardText}>{studentData?.department?.name || "Not assigned"}</p>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <i className="fas fa-id-badge" style={styles.cardIcon}></i> ID Card
            </h3>
            <button
              onClick={() => navigate("/student/id")}
              style={styles.btn}
              onMouseEnter={(e) => {
                e.target.style.background = "#2563eb";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#3b82f6";
              }}
            >
              <i className="fas fa-eye"></i> View ID Card
            </button>
          </div>
        </div>
      </>
    );
  };

  // Wrap content with Layout
  return (
    <Layout>
      <StudentContent />
    </Layout>
  );
}

/* ===== Styles ===== */
const styles = {
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e0e0e0",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },
  hero: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
    justifyContent: "center",
    background: "white",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    marginBottom: "24px",
  },
  studentInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  welcomeTitle: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#111827",
    margin: 0,
  },
  badgeContainer: {
    display: "flex",
    gap: "12px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
  },
  card: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "default",
  },
  cardTitle: {
    color: "#111827",
    marginTop: 0,
    marginBottom: "12px",
    fontSize: "16px",
    fontWeight: 600,
  },
  cardIcon: {
    marginRight: "8px",
    color: "#3b82f6",
  },
  cardText: {
    color: "#4b5563",
    fontSize: "16px",
    margin: 0,
    fontWeight: 500,
  },
  btn: {
    marginTop: "10px",
    padding: "10px 20px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    transition: "background 0.2s, transform 0.2s",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
};

// Add CSS for badge and animations
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 24px;
      font-size: 14px;
      font-weight: 500;
    }
    
    .badge i {
      font-size: 16px;
    }
    
    .badge.approved {
      background: #dcfce7;
      color: #16a34a;
    }
    
    .badge.pending {
      background: #fef3c7;
      color: #d97706;
    }
    
    .badge.rejected {
      background: #fee2e2;
      color: #dc2626;
    }
    
    .badge.none {
      background: #f3f4f6;
      color: #6b7280;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .grid {
        grid-template-columns: 1fr !important;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}