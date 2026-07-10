import { useEffect, useState, useRef, useCallback } from "react";
import api from "../api/axios";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/TopBar";
import Footer from "../components/Footer";

export default function ViewSignedIDs() {
  const [students, setStudents] = useState([]);
  const [idCards, setIdCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [courses, setCourses] = useState([]);
  const [printingStudent, setPrintingStudent] = useState(null);
  const [viewingCard, setViewingCard] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());

  const BASE_URL = "http://127.0.0.1:8000";
  const printRef = useRef(null);

  useEffect(() => {
    fetchStudents();
    fetchSignedIDs();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.students || [];
      setStudents(Array.isArray(data) ? data : []);
      const uniqueCourses = [
        ...new Set(data.map((s) => s.program?.name || s.course?.name).filter(Boolean)),
      ];
      setCourses(uniqueCourses);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSignedIDs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await api.get("/id-cards", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data?.id_cards || [];
      const signedCards = data.filter((card) => card.signature);
      setIdCards(signedCards);
      console.log("✅ Signed ID Cards:", signedCards.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStudentPhoto = (student) => {
    if (!student) return null;
    if (student.photo?.path) {
      let filename = student.photo.path;
      if (filename.includes("/")) filename = filename.split("/").pop();
      return `${BASE_URL}/photos/${filename}`;
    }
    if (student.photos && student.photos.length > 0) {
      const approvedPhoto = student.photos.find((p) => p.status === "approved");
      if (approvedPhoto?.path) {
        let filename = approvedPhoto.path;
        if (filename.includes("/")) filename = filename.split("/").pop();
        return `${BASE_URL}/photos/${filename}`;
      }
    }
    return null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStudentCard = (studentId) => {
    return idCards.find((c) => c.student_id === studentId);
  };

  const getCardImageUrl = useCallback((studentId) => {
    if (!studentId) return null;
    return `${BASE_URL}/api/id-cards/image/${studentId}?t=${imageTimestamp}`;
  }, [imageTimestamp]);

  const openPrintPreview = (student) => {
    setPrintingStudent(student);
    const card = getStudentCard(student.id);
    if (card) setViewingCard(card);
  };

  const printIDCard = () => {
    const content = document.getElementById("printable-id-card");
    if (!content) return;

    const images = content.querySelectorAll("img");
    if (images.length === 0) {
      doPrint(content);
      return;
    }

    const loadPromises = Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });

    Promise.all(loadPromises).then(() => {
      setTimeout(() => doPrint(content), 100);
    });
  };

  const doPrint = (content) => {
    const originalHTML = document.body.innerHTML;
    document.body.innerHTML = content.innerHTML;
    window.print();
    document.body.innerHTML = originalHTML;
  };

  const closeModal = () => {
    setPrintingStudent(null);
    setViewingCard(null);
  };

  const filteredStudents = students.filter((s) => {
    const hasSignedCard = idCards.some((c) => c.student_id === s.id);
    if (!hasSignedCard) return false;
    const name = s.full_name || s.user?.name || "";
    const reg = s.reg_number || "";
    const program = s.program?.name || s.course?.name || "";
    return (
      (search === "" ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        reg.toLowerCase().includes(search.toLowerCase())) &&
      (courseFilter === "" || program === courseFilter)
    );
  });

  const renderCardImage = useCallback((card, student) => {
    if (!card || !student) return null;
    
    const imageUrl = getCardImageUrl(student.id);

    return (
      <div style={s.cardPreview}>
        <img
          src={imageUrl}
          alt="ID Card"
          style={s.cardPreviewImg}
          onError={(e) => {
            console.log(`❌ Image failed to load for student ${student.id}`);
            e.target.style.display = "none";
            const fallback = e.target.parentElement?.querySelector(".card-fallback");
            if (fallback) fallback.style.display = "flex";
            setImageErrors(prev => ({ ...prev, [card.id]: true }));
          }}
          onLoad={() => {
            console.log(`✅ ID card loaded for student ${student.id}`);
            setImageErrors(prev => ({ ...prev, [card.id]: false }));
          }}
        />
        <div
          className="card-fallback"
          style={{
            display: imageErrors[card.id] ? "flex" : "none",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            padding: "20px",
          }}
        >
          <i className="fas fa-id-card" style={{ fontSize: "32px", color: "#1a472a" }}></i>
          <span style={{ color: "#666" }}>ID Card Not Found</span>
          <small style={{ color: "#999" }}>Card: {card.card_number}</small>
        </div>
      </div>
    );
  }, [getCardImageUrl, imageErrors]);

  if (loading)
    return (
      <div style={s.layout}>
        <Sidebar />
        <div style={s.main}>
          <Topbar title="Signed ID Cards" />
          <div style={s.loading}>
            <div style={s.spinner} />
            <p>Loading...</p>
          </div>
          <Footer />
        </div>
      </div>
    );

  return (
    <div style={s.layout}>
      <Sidebar />
      <div style={s.main}>
        <Topbar title="Signed ID Cards" />
        <div style={s.content}>
          <div style={s.header}>
            <div>
              <h2 style={s.title}>
                <i className="fas fa-check-circle" style={{ color: "#10b981" }}></i> Signed ID Cards
              </h2>
              <p style={s.subtitle}>Mzumbe University – Morogoro, Tanzania</p>
            </div>
            <button onClick={fetchSignedIDs} style={s.refreshBtn}>
              <i className="fas fa-sync-alt"></i> Refresh
            </button>
          </div>

          <div style={s.filters}>
            <input
              placeholder="Search name or reg number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={s.search}
            />
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              style={s.select}
            >
              <option value="">All Programs</option>
              {courses.map((c, i) => (
                <option key={i} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={s.statsGrid}>
            <div style={s.stat}>
              <span style={s.statNum}>{students.length}</span>
              <span>Total Students</span>
            </div>
            <div style={s.stat}>
              <span style={s.statNum}>{idCards.length}</span>
              <span>Signed ID Cards</span>
            </div>
            <div style={s.stat}>
              <span style={s.statNum}>{filteredStudents.length}</span>
              <span>Students with Signed IDs</span>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div style={s.empty}>
              <i className="fas fa-id-card" style={{ fontSize: "48px", color: "#ccc" }}></i>
              <p>No signed ID cards found</p>
              <p style={{ fontSize: "14px", color: "#999" }}>
                Students need to sign their ID cards first
              </p>
            </div>
          ) : (
            <div style={s.grid}>
              {filteredStudents.map((stu) => {
                const photo = getStudentPhoto(stu);
                const name = stu.full_name || stu.user?.name || "Unknown";
                const initial = name.charAt(0).toUpperCase();
                const card = getStudentCard(stu.id);

                return (
                  <div key={stu.id} style={s.card}>
                    <div style={s.cardHead}>
                      <div style={s.avatarWrap}>
                        {photo ? (
                          <img src={photo} alt={name} style={s.avatar} />
                        ) : (
                          <div style={s.avatarFall}>{initial}</div>
                        )}
                      </div>
                      <div style={s.info}>
                        <h3 style={s.name}>{name}</h3>
                        <p style={s.meta}>Reg: {stu.reg_number || "N/A"}</p>
                        <p style={s.meta}>{stu.program?.name || stu.course?.name || "No Program"}</p>
                        <span style={s.signedBadge}>
                          <i className="fas fa-check-circle"></i> Signed ✓
                        </span>
                      </div>
                    </div>

                    {card && renderCardImage(card, stu)}

                    {card && (
                      <div style={s.cardInfo}>
                        <div style={s.cardInfoRow}>
                          <span style={s.cardInfoLabel}>Card Number:</span>
                          <span style={s.cardInfoValue}>{card.card_number || "N/A"}</span>
                        </div>
                        <div style={s.cardInfoRow}>
                          <span style={s.cardInfoLabel}>Issue Date:</span>
                          <span style={s.cardInfoValue}>{formatDate(card.issue_date)}</span>
                        </div>
                        <div style={s.cardInfoRow}>
                          <span style={s.cardInfoLabel}>Expiry Date:</span>
                          <span style={s.cardInfoValue}>{formatDate(card.expiry_date)}</span>
                        </div>
                        <div style={s.cardInfoRow}>
                          <span style={s.cardInfoLabel}>Signature:</span>
                          <span style={{ ...s.cardInfoValue, color: "#10b981" }}>
                            <i className="fas fa-check-circle"></i> Signed
                          </span>
                        </div>
                      </div>
                    )}

                    <div style={s.actions}>
                      {card && (
                        <button 
                          onClick={() => openPrintPreview(stu)} 
                          style={s.printBtn}
                        >
                          <i className="fas fa-print"></i> Print ID
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <Footer />
      </div>

      {/* MODAL - Only the ID card image, no header or footer */}
      {viewingCard && printingStudent && (
        <div style={s.modalOverlay} onClick={closeModal}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHead}>
              <h3>
                <i className="fas fa-id-card"></i> Signed ID Card –{" "}
                {printingStudent.full_name || printingStudent.user?.name}
              </h3>
              <button onClick={closeModal} style={s.modalClose}>
                ✕
              </button>
            </div>
            <div style={s.modalBody}>
              <div id="printable-id-card" ref={printRef} style={s.viewCardContainer}>
                {/* Only the ID card image */}
                <div style={s.viewCardImageContainer}>
                  <img
                    src={getCardImageUrl(printingStudent.id)}
                    alt="ID Card"
                    style={s.viewCardImage}
                    onError={(e) => {
                      console.log(`❌ Failed to load ID card image for student ${printingStudent.id}`);
                      e.target.style.display = "none";
                      const fallback = e.target.parentElement?.querySelector(".view-card-fallback");
                      if (fallback) fallback.style.display = "block";
                    }}
                    onLoad={() => console.log("✅ ID card image loaded successfully")}
                  />
                  
                  <div
                    className="view-card-fallback"
                    style={{
                      display: "none",
                      textAlign: "center",
                      padding: "20px",
                      color: "#999",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                      <i className="fas fa-id-card" style={{ fontSize: "48px", color: "#ccc" }}></i>
                      <p style={{ color: "#666" }}>ID Card Image Not Available</p>
                      <small style={{ color: "#999" }}>Card: {viewingCard.card_number}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={s.modalActions}>
              <button onClick={printIDCard} style={s.printNowBtn}>
                <i className="fas fa-print"></i> Print Now
              </button>
              <button onClick={closeModal} style={s.cancelBtn}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================= STYLES ==============================
const s = {
  layout: { display: "flex", minHeight: "100vh", background: "#f0f4f8" },
  main: { flex: 1, marginLeft: "260px", display: "flex", flexDirection: "column", minHeight: "100vh" },
  content: { padding: "30px", flex: 1 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    marginBottom: "25px",
  },
  title: { margin: 0, color: "#1a472a", fontSize: "24px", fontWeight: "bold" },
  subtitle: { margin: "5px 0 0", color: "#666", fontSize: "14px" },
  refreshBtn: {
    padding: "10px 20px",
    background: "#1a472a",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
  },
  filters: { display: "flex", gap: "15px", marginBottom: "25px" },
  search: {
    flex: 2,
    padding: "12px 15px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    background: "white",
  },
  select: {
    flex: 1,
    padding: "12px 15px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
    marginBottom: "30px",
  },
  stat: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    borderTop: "3px solid #1a472a",
  },
  statNum: {
    display: "block",
    fontSize: "32px",
    fontWeight: "bold",
    color: "#1a472a",
    marginBottom: "5px",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: "20px" },
  card: {
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    border: "1px solid #e5e7eb",
    transition: "all 0.2s",
    position: "relative",
  },
  cardHead: {
    display: "flex",
    gap: "15px",
    marginBottom: "15px",
    paddingBottom: "15px",
    borderBottom: "1px solid #eee",
  },
  avatarWrap: { flexShrink: 0 },
  avatar: {
    width: "65px",
    height: "65px",
    borderRadius: "8px",
    objectFit: "cover",
    border: "2px solid #1a472a",
  },
  avatarFall: {
    width: "65px",
    height: "65px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #1a472a, #2d6a4f)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: "28px",
    fontWeight: "bold",
    border: "2px solid #ffd700",
  },
  info: { flex: 1 },
  name: { margin: "0 0 5px", fontSize: "16px", fontWeight: "600", color: "#1a472a" },
  meta: { margin: "0 0 3px", fontSize: "13px", color: "#666" },
  signedBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    color: "white",
    background: "#10b981",
    textTransform: "uppercase",
    marginTop: "4px",
  },
  cardPreview: {
    margin: "10px 0",
    padding: "10px",
    background: "#f8f9fa",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    minHeight: "120px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cardPreviewImg: {
    width: "100%",
    height: "auto",
    maxHeight: "150px",
    objectFit: "contain",
    borderRadius: "4px",
  },
  cardInfo: {
    background: "#f8f9fa",
    padding: "12px",
    borderRadius: "8px",
    margin: "10px 0",
    border: "1px solid #e5e7eb",
  },
  cardInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
    fontSize: "13px",
    borderBottom: "1px dashed #e5e7eb",
  },
  cardInfoLabel: { fontWeight: "600", color: "#1a472a" },
  cardInfoValue: { color: "#333" },
  actions: {
    display: "flex",
    gap: "10px",
    paddingTop: "15px",
    borderTop: "1px solid #eee",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  printBtn: {
    flex: 1,
    padding: "12px",
    background: "linear-gradient(135deg, #1a472a, #2d6a4f)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    minWidth: "150px",
  },
  empty: { textAlign: "center", padding: "60px", background: "white", borderRadius: "12px" },
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "50vh",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #ddd",
    borderTop: "4px solid #1a472a",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "16px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
  },
  modal: {
    background: "white",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "800px",
    maxHeight: "90%",
    overflow: "auto",
  },
  modalHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 20px",
    borderBottom: "1px solid #eee",
    background: "#1a472a",
    color: "white",
    borderRadius: "12px 12px 0 0",
  },
  modalClose: { background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "white" },
  modalBody: { padding: "20px", background: "#f0f4f8" },
  modalActions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    padding: "15px 20px",
    borderTop: "1px solid #eee",
  },
  cancelBtn: {
    padding: "10px 20px",
    background: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  printNowBtn: {
    padding: "10px 20px",
    background: "#1a472a",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  viewCardContainer: {
    background: "transparent",
    borderRadius: "8px",
    overflow: "hidden",
    maxWidth: "600px",
    margin: "0 auto",
    boxShadow: "none",
    border: "none",
  },
  viewCardImageContainer: {
    padding: "0",
    background: "transparent",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "300px",
  },
  viewCardImage: {
    width: "100%",
    height: "auto",
    maxHeight: "500px",
    objectFit: "contain",
    borderRadius: "4px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  viewCardFooter: {
    display: "none",
  },
  viewCardFooterSmall: { display: "none" },
};

// Add keyframes for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  button:hover { opacity: 0.9; transform: translateY(-1px); transition: all 0.2s; cursor: pointer; }
`;
document.head.appendChild(styleSheet);