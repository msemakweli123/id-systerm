import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function ApproveImages() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [imageErrors, setImageErrors] = useState({});

  const BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("❌ Please login first");
        return;
      }

      const res = await api.get("/photos/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Pending photos response:", res.data);

      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.data) {
        data = res.data.data;
      } else if (res.data?.photos) {
        data = res.data.photos;
      }

      console.log("Processed data:", data);

      const formatted = data.map((photo) => {
        let filename = photo.path || photo.photo?.path || null;
        
        if (filename && filename.includes("/")) {
          filename = filename.split("/").pop();
        }

        const image_url = filename 
          ? `${BASE_URL}/photos/${filename}`
          : null;

        let studentName = "Unknown";
        if (photo.student?.user?.name) {
          studentName = photo.student.user.name;
        } else if (photo.user?.name) {
          studentName = photo.user.name;
        } else if (photo.student_name) {
          studentName = photo.student_name;
        }

        let regNumber = "N/A";
        if (photo.student?.reg_number) {
          regNumber = photo.student.reg_number;
        } else if (photo.reg_number) {
          regNumber = photo.reg_number;
        }

        return {
          ...photo,
          filename,
          image_url,
          student_name: studentName,
          reg_number: regNumber,
          status: photo.status || "pending"
        };
      });

      console.log("Formatted photos:", formatted);
      setPhotos(formatted);
      
      if (formatted.length === 0) {
        setMessage("📷 No pending photos to review");
      }

    } catch (err) {
      console.error("Error fetching photos:", err);
      console.error("Error response:", err.response?.data);
      setMessage("❌ Failed to load photos: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("❌ Please login first");
        return;
      }

      await api.post(
        `/photos/approve/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage("✅ Photo Approved Successfully!");
      setPhotos(photos.filter(photo => photo.id !== id));
      
    } catch (err) {
      console.error("Approve error:", err);
      console.error("Error response:", err.response?.data);
      setMessage("❌ Approve failed: " + (err.response?.data?.message || err.message));
    }
  };

  const reject = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("❌ Please login first");
        return;
      }

      await api.post(
        `/photos/reject/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage("❌ Photo Rejected Successfully!");
      setPhotos(photos.filter(photo => photo.id !== id));
      
    } catch (err) {
      console.error("Reject error:", err);
      console.error("Error response:", err.response?.data);
      setMessage("❌ Reject failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleImageError = (id) => {
    console.log(`❌ Image failed to load for photo ID: ${id}`);
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const handleImageLoad = (id) => {
    console.log(`✅ Image loaded successfully for photo ID: ${id}`);
    setImageErrors((prev) => ({ ...prev, [id]: false }));
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'approved':
        return '#16a34a';
      case 'pending':
        return '#d97706';
      case 'rejected':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const getStatusBg = (status) => {
    switch(status?.toLowerCase()) {
      case 'approved':
        return '#dcfce7';
      case 'pending':
        return '#fef3c7';
      case 'rejected':
        return '#fee2e2';
      default:
        return '#f3f4f6';
    }
  };

  // ApproveImages Content Component
  const ApproveImagesContent = () => {
    return (
      <div style={styles.content}>
        {/* HEADER */}
        <div style={styles.header}>
          <h2>
            <i className="fas fa-images"></i> Pending Photos
            {photos.length > 0 && (
              <span style={styles.badge}>{photos.length} pending</span>
            )}
          </h2>

          <button onClick={fetchPhotos} style={styles.refreshBtn}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>

        {/* MESSAGE */}
        {message && (
          <div style={{
            ...styles.message,
            background: message.includes('✅') ? '#dcfce7' : 
                       message.includes('❌') ? '#fee2e2' : '#dbeafe',
            color: message.includes('✅') ? '#16a34a' : 
                   message.includes('❌') ? '#dc2626' : '#1e40af'
          }}>
            <i className={`fas ${message.includes('✅') ? 'fa-check-circle' : 
                              message.includes('❌') ? 'fa-exclamation-circle' : 
                              'fa-info-circle'}`}></i>
            {message}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div style={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i> Loading pending photos...
          </div>
        )}

        {/* EMPTY */}
        {!loading && photos.length === 0 && !message?.includes('No pending') && (
          <div style={styles.empty}>
            <i className="fas fa-check-circle" style={{ fontSize: 48, color: '#16a34a' }}></i>
            <h3>All Clear!</h3>
            <p>No pending photos to review</p>
          </div>
        )}

        {/* GRID */}
        <div style={styles.grid}>
          {photos.map((photo) => (
            <div key={photo.id} style={styles.card}>
              {/* IMAGE */}
              <div style={styles.imageBox}>
                {photo.image_url && !imageErrors[photo.id] ? (
                  <img
                    src={photo.image_url}
                    alt={`Student: ${photo.student_name}`}
                    style={styles.image}
                    onError={() => handleImageError(photo.id)}
                    onLoad={() => handleImageLoad(photo.id)}
                  />
                ) : (
                  <div style={styles.noImage}>
                    <i className="fas fa-user-circle" style={{ fontSize: 48 }}></i>
                    <p>No Image</p>
                    {photo.filename && (
                      <p style={{ fontSize: 12, color: '#999', marginTop: 5 }}>
                        {photo.filename}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Status Badge */}
                <div style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 'bold',
                  background: getStatusBg(photo.status),
                  color: getStatusColor(photo.status),
                  textTransform: 'uppercase'
                }}>
                  {photo.status || 'pending'}
                </div>
              </div>

              {/* INFO */}
              <div style={styles.info}>
                <p style={styles.infoItem}>
                  <i className="fas fa-user" style={styles.infoIcon}></i>
                  <strong>{photo.student_name}</strong>
                </p>

                <p style={styles.infoItem}>
                  <i className="fas fa-id-card" style={styles.infoIcon}></i>
                  {photo.reg_number}
                </p>

                <p style={styles.infoItem}>
                  <i className="fas fa-clock" style={styles.infoIcon}></i>
                  {photo.created_at ? new Date(photo.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              {/* ACTIONS */}
              <div style={styles.actions}>
                <button
                  onClick={() => approve(photo.id)}
                  style={styles.approveBtn}
                  disabled={photo.status === 'approved'}
                >
                  <i className="fas fa-check"></i> Approve
                </button>

                <button
                  onClick={() => reject(photo.id)}
                  style={styles.rejectBtn}
                  disabled={photo.status === 'rejected'}
                >
                  <i className="fas fa-times"></i> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <ApproveImagesContent />
    </Layout>
  );
}

/* ================= STYLES ================= */
const styles = {
  content: { 
    padding: 30,
    maxWidth: 1400,
    margin: '0 auto'
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    flexWrap: 'wrap',
    gap: 10
  },

  badge: {
    background: '#1a2a6c',
    color: '#fff',
    padding: '2px 12px',
    borderRadius: 20,
    fontSize: 14,
    marginLeft: 10
  },

  refreshBtn: {
    padding: "10px 20px",
    background: "#1a2a6c",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: '500',
    transition: 'background 0.3s',
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },

  message: {
    padding: "12px 16px",
    marginBottom: 20,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: '500'
  },

  loading: { 
    textAlign: "center", 
    padding: 60,
    fontSize: 18,
    color: '#6b7280'
  },

  empty: { 
    textAlign: "center", 
    padding: 60,
    color: "#666",
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 25,
  },

  card: {
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    transition: 'transform 0.2s, box-shadow 0.2s',
  },

  imageBox: {
    height: 240,
    background: "#f3f4f6",
    position: 'relative',
    overflow: 'hidden'
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: 'transform 0.3s'
  },

  noImage: {
    height: 240,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#999",
    gap: 10
  },

  info: { 
    padding: "16px 20px",
    borderBottom: '1px solid #f3f4f6'
  },

  infoItem: {
    margin: '6px 0',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: '#374151'
  },

  infoIcon: {
    width: 20,
    color: '#6b7280'
  },

  actions: {
    display: "flex",
    gap: 10,
    padding: "12px 20px 16px",
  },

  approveBtn: {
    flex: 1,
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: '500',
    transition: 'background 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ':hover': {
      background: '#15803d'
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  },

  rejectBtn: {
    flex: 1,
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: '500',
    transition: 'background 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ':hover': {
      background: '#b91c1c'
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  }
};