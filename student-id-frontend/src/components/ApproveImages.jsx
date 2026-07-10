import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function ApproveImages() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  // ================= FETCH PENDING IMAGES =================
  const fetchPhotos = async () => {
    try {
      setLoading(true);

      const res = await api.get("/photos/pending");

      setPhotos(res.data || []);
    } catch (error) {
      console.log("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  // ================= APPROVE =================
  const approvePhoto = async (id) => {
    try {
      await api.post(`/photo/approve/${id}`);
      fetchPhotos();
    } catch (error) {
      console.log(error);
    }
  };

  // ================= REJECT =================
  const rejectPhoto = async (id) => {
    try {
      await api.post(`/photo/reject/${id}`);
      fetchPhotos();
    } catch (error) {
      console.log(error);
    }
  };

  // ================= IMAGE URL =================
  const getImage = (path) => {
    if (!path) return "/default.png";
    return `http://127.0.0.1:8000/storage/${path}`;
  };

  return (
    <Layout>
      <h2>🖼️ Approve Student Images</h2>

      {loading && <p>Loading images...</p>}

      <div style={styles.grid}>
        {photos.length === 0 && !loading && (
          <p>No pending images</p>
        )}

        {photos.map((photo) => (
          <div key={photo.id} style={styles.card}>

            {/* IMAGE */}
            <img
              src={getImage(photo.path)}
              alt="student"
              style={styles.image}
            />

            {/* INFO */}
            <p><b>Student ID:</b> {photo.student_id}</p>
            <p><b>Status:</b> {photo.status}</p>

            {/* BUTTONS */}
            <div style={styles.btnRow}>
              <button
                onClick={() => approvePhoto(photo.id)}
                style={styles.approve}
              >
                Approve
              </button>

              <button
                onClick={() => rejectPhoto(photo.id)}
                style={styles.reject}
              >
                Reject
              </button>
            </div>

          </div>
        ))}
      </div>
    </Layout>
  );
}

/* ================= STYLES ================= */
const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 15,
    marginTop: 20,
  },

  card: {
    border: "1px solid #ddd",
    padding: 15,
    borderRadius: 10,
    background: "#fff",
    textAlign: "center",
  },

  image: {
    width: "100%",
    height: 180,
    objectFit: "cover",
    borderRadius: 8,
    marginBottom: 10,
  },

  btnRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 10,
  },

  approve: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
    cursor: "pointer",
  },

  reject: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
    cursor: "pointer",
  },
};