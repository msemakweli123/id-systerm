import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function SuperAdminIdCards() {
  const [idCards, setIdCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [modalImageError, setModalImageError] = useState(false);

  const BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    fetchIdCards();
  }, []);

  const fetchIdCards = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await api.get("/id-cards", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let cardsData = [];
      if (response.data?.id_cards) {
        cardsData = response.data.id_cards;
      } else if (Array.isArray(response.data)) {
        cardsData = response.data;
      } else if (response.data?.data) {
        cardsData = response.data.data;
      }

      setIdCards(cardsData || []);
    } catch (error) {
      console.error("Error loading ID cards:", error);
      setIdCards([]);
      showMessage("❌ Failed to load ID cards", "error");
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

  const deleteIdCard = async (id) => {
    if (!window.confirm("Are you sure you want to delete this ID card?")) return;

    try {
      const token = localStorage.getItem("token");
      await api.delete(`/id-cards/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      showMessage("✅ ID card deleted successfully", "success");
      fetchIdCards();
    } catch (error) {
      console.error("Error deleting ID card:", error);
      showMessage("❌ Failed to delete ID card", "error");
    }
  };

  const viewIdCard = (card) => {
    setSelectedCard(card);
    setModalImageError(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCard(null);
    setModalImageError(false);
  };

  const getStudentName = (card) => {
    return card.student?.full_name || card.student?.name || card.student_name || "Unknown";
  };

  const getStudentReg = (card) => {
    return card.student?.reg_number || card.reg_number || "N/A";
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'generated':
        return { background: "#dcfce7", color: "#166534" };
      case 'pending':
        return { background: "#fef3c7", color: "#92400e" };
      case 'expired':
        return { background: "#fee2e2", color: "#991b1b" };
      default:
        return { background: "#f3f4f6", color: "#6b7280" };
    }
  };

  const getSignatureStatus = (card) => {
    return card.signature ? "✅ Signed" : "❌ Not Signed";
  };

  const getSignatureColor = (card) => {
    return card.signature ? { color: "#16a34a" } : { color: "#dc2626" };
  };

  const filteredCards = idCards.filter((card) => {
    const name = getStudentName(card).toLowerCase();
    const reg = getStudentReg(card).toLowerCase();
    const cardNumber = card.card_number?.toLowerCase() || "";
    const searchTerm = search.toLowerCase();
    return name.includes(searchTerm) || reg.includes(searchTerm) || cardNumber.includes(searchTerm);
  });

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get card image URL from storage with multiple fallbacks
  const getCardImageUrl = (card) => {
    if (!card) return null;
    
    // The image might be stored with different naming patterns
    const possibleNames = [
      card.card_number, // ID-00001-2026
      `id_card_${card.student_id}`, // id_card_1
      `student_${card.student_id}`, // student_1
      `card_${card.id}`, // card_1
      card.id, // just the ID
    ];
    
    const extensions = ['jpg', 'png', 'jpeg'];
    
    // Try all combinations
    for (const name of possibleNames) {
      for (const ext of extensions) {
        const url = `${BASE_URL}/storage/id-cards/${name}.${ext}?t=${Date.now()}`;
        // Return the first one, we'll try fallbacks on error
        return url;
      }
    }
    
    // Fallback to API endpoint
    return `${BASE_URL}/id-cards/image/${card.student_id}?t=${Date.now()}`;
  };

  // Handle modal image error with multiple attempts
  const handleModalImageError = (e) => {
    const img = e.target;
    const card = selectedCard;
    if (!card) return;
    
    // Try alternative paths
    const alternatives = [
      `${BASE_URL}/storage/id-cards/${card.card_number}.png`,
      `${BASE_URL}/storage/id-cards/id_card_${card.student_id}.jpg`,
      `${BASE_URL}/storage/id-cards/id_card_${card.student_id}.png`,
      `${BASE_URL}/storage/id-cards/student_${card.student_id}.jpg`,
      `${BASE_URL}/storage/id-cards/card_${card.id}.jpg`,
      `${BASE_URL}/id-cards/image/${card.student_id}`,
      `${BASE_URL}/api/id-cards/image/${card.student_id}`,
    ];
    
    // Find the current attempted URL
    const currentSrc = img.src.split('?')[0];
    const currentIndex = alternatives.findIndex(url => currentSrc.includes(url));
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < alternatives.length) {
      img.src = `${alternatives[nextIndex]}?t=${Date.now()}`;
    } else {
      // All attempts failed
      setModalImageError(true);
    }
  };

  // Retry loading the image
  const retryLoadImage = () => {
    setModalImageError(false);
    setTimeout(() => {
      const img = document.querySelector('.modal-image');
      if (img && selectedCard) {
        img.src = `${BASE_URL}/storage/id-cards/${selectedCard.card_number}.jpg?t=${Date.now()}`;
      }
    }, 100);
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1>
          <i className="fas fa-id-card" style={{ marginRight: "10px", color: "#1a2a6c" }}></i>
          ID Cards Management
        </h1>
        <p style={styles.subtitle}>View and manage all student identification cards</p>
        <div style={styles.stats}>
          <span style={styles.statBadge}>
            <i className="fas fa-id-card"></i> Total: {idCards.length} cards
          </span>
          <span style={styles.statBadge}>
            <i className="fas fa-check-circle" style={{ color: "#16a34a" }}></i> Signed: {
              idCards.filter(c => c.signature).length
            }
          </span>
          <span style={styles.statBadge}>
            <i className="fas fa-times-circle" style={{ color: "#dc2626" }}></i> Unsigned: {
              idCards.filter(c => !c.signature).length
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
            placeholder="Search by student name, registration number or card number..."
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
                <th style={styles.th}>Card Number</th>
                <th style={styles.th}>Student Name</th>
                <th style={styles.th}>Registration</th>
                <th style={styles.th}>ID Card</th>
                <th style={styles.th}>Issue Date</th>
                <th style={styles.th}>Expiry Date</th>
                <th style={styles.th}>Signature</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={styles.textCenter}>
                    <i className="fas fa-spinner fa-spin"></i> Loading ID cards...
                  </td>
                </tr>
              ) : filteredCards.length === 0 ? (
                <tr>
                  <td colSpan="10" style={styles.textCenter}>
                    <i className="fas fa-inbox" style={{ fontSize: 24, color: "#ccc", display: "block", marginBottom: 8 }}></i>
                    No ID cards found
                  </td>
                </tr>
              ) : (
                filteredCards.map((card, index) => {
                  const statusStyle = getStatusColor(card.status);
                  const signatureStyle = getSignatureColor(card);
                  const imageUrl = getCardImageUrl(card);
                  const hasError = imageErrors[card.id];
                  
                  return (
                    <tr key={card.id} style={styles.tr}>
                      <td style={styles.td}>{index + 1}</td>
                      <td style={styles.td}>
                        <span style={styles.cardBadge}>{card.card_number || "N/A"}</span>
                      </td>
                      <td style={styles.td}>
                        <strong>{getStudentName(card)}</strong>
                        {card.student && (
                          <div style={styles.userInfo}>
                            <i className="fas fa-user" style={{ fontSize: 10 }}></i> {card.student.email || "No email"}
                          </div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.regBadge}>{getStudentReg(card)}</span>
                      </td>
                      <td style={styles.td}>
                        {imageUrl && !hasError ? (
                          <img
                            src={imageUrl}
                            alt="ID Card"
                            style={styles.thumbnail}
                            onError={() => setImageErrors(prev => ({ ...prev, [card.id]: true }))}
                            onLoad={() => console.log("✅ Card image loaded for:", card.card_number)}
                          />
                        ) : (
                          <div style={styles.thumbnailPlaceholder}>
                            <i className="fas fa-id-card" style={{ fontSize: 20, color: "#ccc" }}></i>
                          </div>
                        )}
                      </td>
                      <td style={styles.td}>{formatDate(card.issue_date)}</td>
                      <td style={styles.td}>{formatDate(card.expiry_date)}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.signatureBadge,
                          ...signatureStyle
                        }}>
                          {getSignatureStatus(card)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.status,
                          background: statusStyle.background,
                          color: statusStyle.color
                        }}>
                          {card.status?.toUpperCase() || "N/A"}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button
                            style={{ ...styles.btn, ...styles.viewBtn }}
                            onClick={() => viewIdCard(card)}
                            title="View ID Card"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            style={{ ...styles.btn, ...styles.deleteBtn }}
                            onClick={() => deleteIdCard(card.id)}
                            title="Delete ID Card"
                          >
                            <i className="fas fa-trash"></i>
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

        {!loading && filteredCards.length > 0 && (
          <div style={styles.footer}>
            Showing {filteredCards.length} of {idCards.length} ID cards
          </div>
        )}
      </div>

      {/* VIEW ID CARD MODAL */}
      {showModal && selectedCard && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>
                <i className="fas fa-id-card" style={{ marginRight: "8px" }}></i>
                ID Card - {selectedCard.card_number}
              </h3>
              <button onClick={closeModal} style={styles.modalClose}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalGrid}>
                {/* Student Info */}
                <div style={styles.modalInfo}>
                  <h4 style={styles.modalInfoTitle}>Student Information</h4>
                  <div style={styles.modalInfoRow}>
                    <span style={styles.modalInfoLabel}>Student:</span>
                    <span style={styles.modalInfoValue}>{getStudentName(selectedCard)}</span>
                  </div>
                  <div style={styles.modalInfoRow}>
                    <span style={styles.modalInfoLabel}>Registration:</span>
                    <span style={styles.modalInfoValue}>{getStudentReg(selectedCard)}</span>
                  </div>
                  <div style={styles.modalInfoRow}>
                    <span style={styles.modalInfoLabel}>Card Number:</span>
                    <span style={styles.modalInfoValue}>{selectedCard.card_number}</span>
                  </div>
                  <div style={styles.modalInfoRow}>
                    <span style={styles.modalInfoLabel}>Issue Date:</span>
                    <span style={styles.modalInfoValue}>{formatDate(selectedCard.issue_date)}</span>
                  </div>
                  <div style={styles.modalInfoRow}>
                    <span style={styles.modalInfoLabel}>Expiry Date:</span>
                    <span style={styles.modalInfoValue}>{formatDate(selectedCard.expiry_date)}</span>
                  </div>
                  <div style={styles.modalInfoRow}>
                    <span style={styles.modalInfoLabel}>Signature:</span>
                    <span style={{ ...styles.modalInfoValue, ...getSignatureColor(selectedCard) }}>
                      {getSignatureStatus(selectedCard)}
                    </span>
                  </div>
                  <div style={styles.modalInfoRow}>
                    <span style={styles.modalInfoLabel}>Status:</span>
                    <span style={{
                      ...styles.modalInfoValue,
                      ...getStatusColor(selectedCard.status)
                    }}>
                      {selectedCard.status?.toUpperCase() || "N/A"}
                    </span>
                  </div>
                  <div style={styles.modalInfoRow}>
                    <span style={styles.modalInfoLabel}>Student ID:</span>
                    <span style={styles.modalInfoValue}>{selectedCard.student_id}</span>
                  </div>
                </div>

                {/* ID Card Image */}
                <div style={styles.modalImageContainer}>
                  <h4 style={styles.modalInfoTitle}>ID Card Image</h4>
                  <div style={styles.modalImageWrapper}>
                    {!modalImageError ? (
                      <img
                        className="modal-image"
                        src={`${BASE_URL}/storage/id-cards/${selectedCard.card_number}.jpg?t=${Date.now()}`}
                        alt="ID Card"
                        style={styles.modalImage}
                        onError={handleModalImageError}
                        onLoad={() => console.log("✅ Full card image loaded for:", selectedCard.card_number)}
                      />
                    ) : (
                      <div style={styles.modalImageFallback}>
                        <i className="fas fa-id-card" style={{ fontSize: "48px", color: "#ccc", display: "block", marginBottom: "10px" }}></i>
                        <p style={{ color: "#666" }}>ID Card Image Not Available</p>
                        <small style={{ color: "#999" }}>Card: {selectedCard.card_number}</small>
                        <div style={styles.filePathInfo}>
                          <p style={styles.filePathText}>Expected file paths:</p>
                          <code style={styles.filePathCode}>
                            storage/id-cards/{selectedCard.card_number}.jpg
                          </code>
                          <code style={{ ...styles.filePathCode, marginTop: "5px" }}>
                            storage/id-cards/id_card_{selectedCard.student_id}.jpg
                          </code>
                          <code style={{ ...styles.filePathCode, marginTop: "5px" }}>
                            storage/id-cards/card_{selectedCard.id}.jpg
                          </code>
                        </div>
                        <button 
                          onClick={retryLoadImage}
                          style={styles.retryBtn}
                        >
                          <i className="fas fa-sync-alt"></i> Retry
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={closeModal} style={styles.modalCloseBtn}>
                <i className="fas fa-times"></i> Close
              </button>
            </div>
          </div>
        </div>
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
  cardBadge: {
    background: "#dbeafe",
    color: "#1e40af",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
  },
  regBadge: {
    background: "#f3f4f6",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    color: "#374151",
  },
  thumbnail: {
    width: "60px",
    height: "40px",
    objectFit: "cover",
    borderRadius: "4px",
    border: "1px solid #e5e7eb",
  },
  thumbnailPlaceholder: {
    width: "60px",
    height: "40px",
    background: "#f3f4f6",
    borderRadius: "4px",
    border: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  signatureBadge: {
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
  },
  status: {
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "bold",
    display: "inline-block",
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
  viewBtn: {
    background: "#2563eb",
  },
  deleteBtn: {
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
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.7)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  modal: {
    background: "white",
    borderRadius: "12px",
    maxWidth: "800px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 20px",
    borderBottom: "1px solid #e5e7eb",
    background: "#1a2a6c",
    color: "white",
  },
  modalClose: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "20px",
    cursor: "pointer",
  },
  modalBody: {
    padding: "20px",
    overflowY: "auto",
    maxHeight: "calc(90vh - 130px)",
  },
  modalGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  modalInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  modalInfoTitle: {
    margin: "0 0 10px 0",
    color: "#1a2a6c",
    fontSize: "16px",
  },
  modalInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  modalInfoLabel: {
    fontWeight: "600",
    color: "#374151",
  },
  modalInfoValue: {
    color: "#1f2937",
  },
  modalImageContainer: {
    display: "flex",
    flexDirection: "column",
  },
  modalImageWrapper: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#f9fafb",
    minHeight: "200px",
  },
  modalImage: {
    width: "100%",
    maxHeight: "300px",
    objectFit: "contain",
    padding: "10px",
  },
  modalImageFallback: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#999",
    minHeight: "200px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  filePathInfo: {
    marginTop: "15px",
    padding: "10px 15px",
    background: "#f3f4f6",
    borderRadius: "6px",
    width: "100%",
  },
  filePathText: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "0 0 5px 0",
  },
  filePathCode: {
    display: "block",
    fontSize: "12px",
    color: "#1a2a6c",
    background: "#e5e7eb",
    padding: "4px 8px",
    borderRadius: "4px",
    fontFamily: "monospace",
    marginTop: "3px",
  },
  retryBtn: {
    marginTop: "15px",
    padding: "8px 20px",
    background: "#1a2a6c",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    transition: "background 0.2s",
  },
  modalFooter: {
    padding: "15px 20px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "flex-end",
  },
  modalCloseBtn: {
    padding: "8px 20px",
    background: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "background 0.2s",
  },
};

// Add styles
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
  .btn:hover:not(:disabled) {
    opacity: 0.85;
    transform: scale(0.95);
  }
  .table tr:hover {
    background: #f8fafc;
  }
  .retry-btn:hover {
    background: #2d4a8c !important;
  }
  .modal-close-btn:hover {
    background: #4b5563 !important;
  }
  @media (max-width: 768px) {
    .modal-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(tableStyles);