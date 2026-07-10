import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function StudentID() {
  const [student, setStudent] = useState(null);
  const [idCard, setIdCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showSignModal, setShowSignModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [requestingID, setRequestingID] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const fileInputRef = useRef(null);
  const BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    fetchStudentData();
    fetchMyIDCard();
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/student/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudent(res.data);
      console.log("Student data loaded:", res.data);
    } catch (err) {
      console.error("Failed to fetch student data:", err);
      showMessage("❌ Failed to load student data", "error");
    }
  };

  const fetchMyIDCard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        showMessage("❌ Please login first", "error");
        setLoading(false);
        return;
      }
      
      const res = await api.get("/my-id-card", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("ID Card Response:", res.data);
      
      if (res.data?.success && res.data?.id_card) {
        const card = res.data.id_card;
        setIdCard(card);
        
        if (card.signature) {
          setHasSignature(true);
          setSignatureData(card.signature);
        }
        
        if (card.student_id) {
          console.log("Loading image for student_id:", card.student_id);
          loadCardImage(card.student_id);
        } else {
          console.error("No student_id found in card data");
          showMessage("❌ No student ID found", "error");
        }
      } else {
        setIdCard(null);
        console.log("No ID card found for this student");
      }
    } catch (err) {
      console.error("Failed to fetch ID card:", err);
      if (err.response?.status === 404) {
        setIdCard(null);
        console.log("No ID card exists yet - student needs to request one");
      } else {
        showMessage("❌ Failed to load ID card: " + (err.response?.data?.message || err.message), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCardImage = async (studentId) => {
    try {
      setPreviewLoading(true);
      setImageError(false);
      
      if (!studentId) {
        console.error("No student ID provided for image loading");
        setImageError(true);
        showMessage("❌ No student ID available", "error");
        setPreviewLoading(false);
        return;
      }
      
      const token = localStorage.getItem("token");
      const imageUrl = `${BASE_URL}/api/id-cards/image/${studentId}`;
      
      console.log("Attempting to load image from API:", imageUrl);
      
      try {
        const response = await fetch(imageUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          setPreviewImage(objectUrl);
          setImageError(false);
          console.log("✅ ID Card image loaded successfully from API");
          showMessage("✅ ID Card loaded successfully", "success");
        } else {
          setImageError(true);
          showMessage(`❌ ID Card image not found for student ${studentId}`, "error");
          console.log(`❌ No image found for student ${studentId}`);
        }
      } catch (err) {
        console.error("Error fetching image from API:", err);
        setImageError(true);
        showMessage("❌ Failed to load ID card image", "error");
      }
    } catch (err) {
      console.error("Error loading card image:", err);
      setImageError(true);
      showMessage("❌ Failed to load ID card image", "error");
    } finally {
      setPreviewLoading(false);
    }
  };

  const requestIDCard = async () => {
    setRequestingID(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post("/request-id-card", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data?.success) {
        showMessage("✅ ID card request sent to admin successfully!", "success");
        setTimeout(() => {
          fetchMyIDCard();
        }, 3000);
      } else {
        showMessage("❌ Failed to request ID card: " + (res.data?.message || "Unknown error"), "error");
      }
    } catch (err) {
      console.error("Request ID error:", err);
      showMessage(err.response?.data?.message || "❌ Failed to request ID card", "error");
    } finally {
      setRequestingID(false);
    }
  };

  const handlePreview = () => {
    if (!idCard) {
      showMessage("❌ No ID card found. Please request one from admin.", "error");
      return;
    }

    if (!previewImage) {
      const studentId = idCard?.student_id;
      if (studentId) {
        loadCardImage(studentId);
      } else {
        showMessage("❌ No student ID found for this card", "error");
      }
      setShowPreview(true);
      return;
    }

    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
  };

  // ============ SIGNATURE METHODS ============
  
  const openSignModal = () => {
    if (!idCard) {
      showMessage("❌ No ID card found to sign", "error");
      return;
    }
    if (hasSignature) {
      showMessage("✅ You have already signed this ID card", "success");
      return;
    }
    setShowNameInput(true);
    setSignatureName("");
    setSelectedFile(null);
    setFilePreview(null);
  };

  // Method 1: Upload Signature Image (NEW)
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showMessage("⚠️ Please upload a valid image file (PNG, JPG, JPEG, GIF, WEBP)", "error");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showMessage("⚠️ File size must be less than 2MB", "error");
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setFilePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSignature = async () => {
    if (!selectedFile) {
      showMessage("⚠️ Please select a signature image", "error");
      return;
    }

    setUploading(true);

    try {
      // Convert to base64 and compress
      const base64Data = await fileToBase64(selectedFile);
      const compressedSignature = await compressSignature(base64Data);
      
      await saveSignatureToServer(compressedSignature);
    } catch (err) {
      console.error("Upload error:", err);
      showMessage("❌ Failed to upload signature: " + err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Method 2: Type your name as signature
  const handleTypeSignature = async () => {
    if (!signatureName.trim()) {
      showMessage("⚠️ Please enter your name", "error");
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#1a472a';
      ctx.font = 'bold 48px "Brush Script MT", "Segoe Script", cursive';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(signatureName, canvas.width / 2, canvas.height / 2);
      
      ctx.strokeStyle = '#1a472a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, 80);
      ctx.lineTo(canvas.width - 50, 80);
      ctx.stroke();
      
      const signatureDataUrl = canvas.toDataURL('image/png');
      const compressedSignature = await compressSignature(signatureDataUrl);
      await saveSignatureToServer(compressedSignature);
    } catch (err) {
      console.error("Error creating typed signature:", err);
      showMessage("❌ Failed to create signature", "error");
    }
  };

  // Method 3: Draw signature on canvas
  const openDrawSignature = () => {
    setShowNameInput(false);
    setShowSignModal(true);
    setTimeout(() => {
      initCanvas();
    }, 100);
  };

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    
    canvas.width = 450;
    canvas.height = 200;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#cccccc';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Draw your signature here', canvas.width / 2, canvas.height / 2);
    
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1a472a';
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.isDrawing = true;
  };

  const draw = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx || !ctx.isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (ctx) {
      ctx.isDrawing = false;
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#cccccc';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Draw your signature here', canvas.width / 2, canvas.height / 2);
  };

  const saveDrawSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const signatureDataUrl = canvas.toDataURL('image/png');
    
    const emptyCanvas = document.createElement('canvas');
    emptyCanvas.width = canvas.width;
    emptyCanvas.height = canvas.height;
    const emptyCtx = emptyCanvas.getContext('2d');
    emptyCtx.fillStyle = '#ffffff';
    emptyCtx.fillRect(0, 0, emptyCanvas.width, emptyCanvas.height);
    emptyCtx.fillStyle = '#cccccc';
    emptyCtx.font = '16px Arial';
    emptyCtx.textAlign = 'center';
    emptyCtx.fillText('Draw your signature here', emptyCanvas.width / 2, emptyCanvas.height / 2);
    const emptyData = emptyCanvas.toDataURL('image/png');
    
    if (signatureDataUrl === emptyData) {
      showMessage('⚠️ Please draw your signature first', 'error');
      return;
    }
    
    const compressedSignature = await compressSignature(signatureDataUrl);
    await saveSignatureToServer(compressedSignature);
  };

  // Common save function
  const saveSignatureToServer = async (compressedSignature) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.post(`/id-cards/${idCard.id}/sign`, {
        signature: compressedSignature
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data?.success) {
        showMessage("✅ Signature saved successfully!", "success");
        setHasSignature(true);
        setSignatureData(compressedSignature);
        setShowSignModal(false);
        setShowNameInput(false);
        setSelectedFile(null);
        setFilePreview(null);
        await fetchMyIDCard();
      } else {
        showMessage("❌ Failed to save signature", "error");
      }
    } catch (err) {
      console.error("Save signature error:", err);
      showMessage(err.response?.data?.message || "❌ Failed to save signature", "error");
    }
  };

  const compressSignature = (dataUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 100;
        ctx.drawImage(img, 0, 0, 200, 100);
        const compressed = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressed);
      };
      img.src = dataUrl;
    });
  };

  const getCardStatus = () => {
    if (!idCard) {
      return { status: 'not_generated', label: 'Not Generated', color: '#ef4444', icon: 'fa-times-circle' };
    }
    if (idCard.signature) {
      return { status: 'signed', label: 'Signed ✓', color: '#10b981', icon: 'fa-check-circle' };
    }
    return { status: 'pending', label: 'Pending Signature', color: '#f59e0b', icon: 'fa-clock' };
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const status = getCardStatus();

  if (loading) {
    return (
      <Layout>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading your ID card...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.container}>
        <h2 style={styles.title}>
          <i className="fas fa-id-card"></i> My ID Card
        </h2>

        {message && (
          <div style={{
            ...styles.message,
            backgroundColor: messageType === "success" ? "#d4edda" : "#f8d7da",
            color: messageType === "success" ? "#155724" : "#721c24",
            border: `1px solid ${messageType === "success" ? "#c3e6cb" : "#f5c6cb"}`
          }}>
            <i className={`fas ${messageType === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`}></i>
            {message}
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div style={styles.previewModal}>
            <div style={styles.previewContent}>
              <div style={styles.previewHeader}>
                <h3 style={styles.previewTitle}>
                  <i className="fas fa-id-card"></i> My ID Card
                </h3>
                <button onClick={closePreview} style={styles.closeBtn}>
                  <i className="fas fa-times"></i> Close
                </button>
              </div>

              <div style={styles.previewBody}>
                {previewLoading ? (
                  <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                    <p>Loading ID Card...</p>
                  </div>
                ) : previewImage && !imageError ? (
                  <>
                    <img
                      src={previewImage}
                      alt="ID Card"
                      style={styles.previewImage}
                      onError={(e) => {
                        console.error("Image failed to load:", previewImage);
                        setImageError(true);
                        showMessage("❌ Failed to load ID card image", "error");
                      }}
                      onLoad={() => {
                        console.log("✅ ID Card image loaded successfully");
                        setImageError(false);
                      }}
                    />
                    <div style={styles.previewButtons}>
                      {!hasSignature && idCard && (
                        <button onClick={openSignModal} style={styles.signBtn}>
                          <i className="fas fa-pen"></i> Sign ID Card
                        </button>
                      )}
                      {hasSignature && (
                        <button 
                          onClick={() => {
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              printWindow.document.write(`
                                <html>
                                  <head><title>ID Card</title></head>
                                  <body style="display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;">
                                    <img src="${previewImage}" style="max-width:100%;height:auto;" />
                                    <script>
                                      window.onload = function() {
                                        window.print();
                                        window.close();
                                      }
                                    <\/script>
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                            }
                          }} 
                          style={styles.printBtn}
                        >
                          <i className="fas fa-print"></i> Print ID Card
                        </button>
                      )}
                      <button onClick={closePreview} style={styles.closePreviewBtn}>
                        Close
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={styles.emptyState}>
                    <i className="fas fa-id-card" style={{ fontSize: "48px", color: "#ccc" }}></i>
                    <p>ID Card image not available</p>
                    <button 
                      onClick={() => {
                        const studentId = idCard?.student_id;
                        if (studentId) {
                          loadCardImage(studentId);
                        } else {
                          showMessage("❌ No student ID found", "error");
                        }
                      }} 
                      style={styles.retryBtn}
                    >
                      <i className="fas fa-sync"></i> Retry
                    </button>
                    <button onClick={closePreview} style={styles.closePreviewBtn}>
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Signature Type Selection Modal */}
        {showNameInput && !showSignModal && (
          <div style={styles.previewModal}>
            <div style={{ ...styles.previewContent, maxWidth: '550px' }}>
              <div style={styles.previewHeader}>
                <h3 style={styles.previewTitle}>
                  <i className="fas fa-pen"></i> Sign Your ID Card
                </h3>
                <button onClick={() => setShowNameInput(false)} style={styles.closeBtn}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div style={{ padding: "20px", maxHeight: "70vh", overflowY: "auto" }}>
                <p style={{ textAlign: "center", color: "#666", marginBottom: "20px" }}>
                  Choose how you want to sign your ID card:
                </p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  {/* Option 1: Upload Signature Image */}
                  <div style={{ border: "2px solid #1a472a", borderRadius: "10px", padding: "20px", background: "#f0f7f4" }}>
                    <h4 style={{ margin: "0 0 10px 0", color: "#1a472a" }}>
                      <i className="fas fa-upload"></i> Upload Signature Image
                    </h4>
                    <p style={{ color: "#666", fontSize: "14px", margin: "0 0 10px 0" }}>
                      Upload an image of your signature (PNG, JPG, JPEG, GIF, WEBP)
                    </p>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      style={{ display: "none" }}
                    />
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: "100%",
                        padding: "12px",
                        background: "#e2e8f0",
                        color: "#1e293b",
                        border: "2px dashed #1a472a",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                        marginBottom: "10px"
                      }}
                    >
                      <i className="fas fa-folder-open"></i> Select Signature Image
                    </button>

                    {filePreview && (
                      <div style={{ textAlign: "center", marginTop: "10px" }}>
                        <p style={{ fontSize: "12px", color: "#666", margin: "0 0 5px 0" }}>Preview:</p>
                        <img 
                          src={filePreview} 
                          alt="Signature Preview" 
                          style={{
                            maxWidth: "100%",
                            maxHeight: "80px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            padding: "5px",
                            background: "white"
                          }}
                        />
                      </div>
                    )}

                    <button
                      onClick={handleUploadSignature}
                      disabled={!selectedFile || uploading}
                      style={{
                        width: "100%",
                        padding: "12px",
                        background: !selectedFile || uploading ? "#94a3b8" : "#1a472a",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: !selectedFile || uploading ? "not-allowed" : "pointer",
                        fontSize: "16px",
                        fontWeight: "600",
                        marginTop: "10px",
                        transition: "all 0.3s"
                      }}
                    >
                      {uploading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Uploading...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check"></i> Upload Signature
                        </>
                      )}
                    </button>
                  </div>

                  {/* Option 2: Type Name */}
                  <div style={{ border: "2px solid #e5e7eb", borderRadius: "10px", padding: "20px" }}>
                    <h4 style={{ margin: "0 0 10px 0", color: "#1a472a" }}>
                      <i className="fas fa-keyboard"></i> Type Your Name
                    </h4>
                    <p style={{ color: "#666", fontSize: "14px", margin: "0 0 10px 0" }}>
                      Simply type your name as your signature
                    </p>
                    <input
                      type="text"
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      placeholder="Enter your full name"
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                        fontSize: "16px",
                        marginBottom: "10px"
                      }}
                    />
                    <button
                      onClick={handleTypeSignature}
                      style={{
                        width: "100%",
                        padding: "12px",
                        background: "#8b5cf6",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "16px",
                        fontWeight: "600"
                      }}
                    >
                      <i className="fas fa-check"></i> Sign with Name
                    </button>
                  </div>

                  {/* Option 3: Draw Signature */}
                  <div style={{ border: "2px solid #e5e7eb", borderRadius: "10px", padding: "20px" }}>
                    <h4 style={{ margin: "0 0 10px 0", color: "#1a472a" }}>
                      <i className="fas fa-pen-fancy"></i> Draw Your Signature
                    </h4>
                    <p style={{ color: "#666", fontSize: "14px", margin: "0 0 10px 0" }}>
                      Use your mouse or touch to draw your signature
                    </p>
                    <button
                      onClick={openDrawSignature}
                      style={{
                        width: "100%",
                        padding: "12px",
                        background: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "16px",
                        fontWeight: "600"
                      }}
                    >
                      <i className="fas fa-pen"></i> Draw Signature
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Draw Signature Modal */}
        {showSignModal && (
          <div style={styles.previewModal}>
            <div style={{ ...styles.previewContent, maxWidth: '500px' }}>
              <div style={styles.previewHeader}>
                <h3 style={styles.previewTitle}>
                  <i className="fas fa-pen"></i> Draw Your Signature
                </h3>
                <button onClick={() => setShowSignModal(false)} style={styles.closeBtn}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div style={styles.signModalBody}>
                <p style={styles.signInstructions}>Draw your signature below</p>
                <div style={styles.signCanvasContainer}>
                  <canvas
                    ref={canvasRef}
                    style={styles.signCanvas}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <div style={styles.signActions}>
                  <button onClick={clearSignature} style={styles.clearSignBtn}>
                    <i className="fas fa-eraser"></i> Clear
                  </button>
                  <button onClick={saveDrawSignature} style={styles.saveSignBtn}>
                    <i className="fas fa-save"></i> Save Signature
                  </button>
                </div>
                <p style={styles.signHint}>Use your mouse or touch to draw your signature</p>
              </div>
            </div>
          </div>
        )}

        {/* Student Info Card */}
        <div style={styles.studentCard}>
          <div style={styles.studentHeader}>
            <h3 style={styles.studentName}>
              <i className="fas fa-user-graduate"></i> {student?.full_name || student?.user?.name || 'Student'}
            </h3>
            <span style={{ ...styles.statusBadge, background: status.color }}>
              <i className={`fas ${status.icon}`}></i> {status.label}
            </span>
          </div>
          
          <div style={styles.studentInfo}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Registration:</span>
              <span style={styles.infoValue}>{student?.reg_number || 'N/A'}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Program:</span>
              <span style={styles.infoValue}>{student?.program?.name || student?.program?.program_name || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* ID Card Status */}
        <div style={styles.statusCard}>
          <h4 style={styles.statusTitle}>ID Card Details</h4>
          
          {idCard ? (
            <div>
              <div style={styles.statusRow}>
                <span style={styles.statusLabel}>Card Number:</span>
                <span style={styles.statusValue}>{idCard.card_number}</span>
              </div>
              <div style={styles.statusRow}>
                <span style={styles.statusLabel}>Issue Date:</span>
                <span style={styles.statusValue}>{formatDate(idCard.issue_date)}</span>
              </div>
              <div style={styles.statusRow}>
                <span style={styles.statusLabel}>Expiry Date:</span>
                <span style={styles.statusValue}>{formatDate(idCard.expiry_date)}</span>
              </div>
              <div style={styles.statusRow}>
                <span style={styles.statusLabel}>Status:</span>
                <span style={{ ...styles.statusValue, color: status.color }}>
                  <i className={`fas ${status.icon}`}></i> {status.label}
                </span>
              </div>
              {hasSignature && (
                <div style={styles.signaturePreview}>
                  <p style={styles.signatureLabel}>Signature:</p>
                  {signatureData && (
                    <img 
                      src={signatureData} 
                      alt="Signature" 
                      style={styles.signatureImage}
                    />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <i className="fas fa-id-card" style={{ fontSize: "36px", color: "#ccc" }}></i>
              <p>You don't have an ID card yet.</p>
              <button 
                onClick={requestIDCard} 
                disabled={requestingID}
                style={{
                  ...styles.requestBtn,
                  opacity: requestingID ? 0.6 : 1,
                  cursor: requestingID ? 'not-allowed' : 'pointer',
                  marginTop: "15px"
                }}
              >
                {requestingID ? '⏳ Requesting...' : '📤 Request ID Card'}
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={styles.actions}>
          {idCard ? (
            <>
              <button onClick={handlePreview} style={styles.previewBtn}>
                <i className="fas fa-eye"></i> View ID Card
              </button>
              
              {!hasSignature ? (
                <button onClick={openSignModal} style={styles.signBtn}>
                  <i className="fas fa-pen"></i> Sign ID Card
                </button>
              ) : (
                <button 
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head><title>ID Card</title></head>
                          <body style="display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;">
                            <img src="${previewImage}" style="max-width:100%;height:auto;" />
                            <script>
                              window.onload = function() {
                                window.print();
                                window.close();
                              }
                            <\/script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }} 
                  style={styles.printBtn}
                >
                  <i className="fas fa-print"></i> Print ID Card
                </button>
              )}
            </>
          ) : (
            <button 
              onClick={requestIDCard} 
              disabled={requestingID}
              style={{
                ...styles.requestBtn,
                padding: "12px 32px",
                fontSize: "16px",
                opacity: requestingID ? 0.6 : 1,
                cursor: requestingID ? 'not-allowed' : 'pointer',
                width: "100%"
              }}
            >
              {requestingID ? '⏳ Requesting...' : '📤 Request ID Card'}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}

// ✅ Styles
const styles = {
  container: {
    padding: "30px",
    maxWidth: "800px",
    margin: "0 auto"
  },
  title: {
    marginBottom: "20px",
    color: "#1a472a",
    fontSize: "24px",
    fontWeight: "bold"
  },
  message: {
    padding: "12px 18px",
    marginBottom: "20px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px"
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    color: "#666"
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #ddd",
    borderTop: "4px solid #1a472a",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "16px"
  },
  studentCard: {
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    border: "1px solid #e5e7eb"
  },
  studentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
    flexWrap: "wrap",
    gap: "10px"
  },
  studentName: {
    margin: 0,
    fontSize: "18px",
    color: "#1a472a"
  },
  statusBadge: {
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    color: "white"
  },
  studentInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  infoRow: {
    display: "flex",
    padding: "6px 0",
    borderBottom: "1px solid #f3f4f6"
  },
  infoLabel: {
    fontWeight: "600",
    color: "#1a472a",
    minWidth: "140px"
  },
  infoValue: {
    color: "#333",
    wordBreak: "break-word"
  },
  statusCard: {
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    border: "1px solid #e5e7eb"
  },
  statusTitle: {
    margin: "0 0 15px 0",
    fontSize: "18px",
    color: "#1a472a",
    borderBottom: "2px solid #1a472a",
    paddingBottom: "10px"
  },
  statusRow: {
    display: "flex",
    padding: "6px 0",
    borderBottom: "1px solid #f3f4f6"
  },
  statusLabel: {
    fontWeight: "600",
    color: "#1a472a",
    minWidth: "140px"
  },
  statusValue: {
    color: "#333",
    wordBreak: "break-word"
  },
  signaturePreview: {
    marginTop: "15px",
    padding: "15px",
    background: "#f8f9fa",
    borderRadius: "8px",
    border: "1px solid #e5e7eb"
  },
  signatureLabel: {
    fontWeight: "600",
    color: "#1a472a",
    marginBottom: "10px"
  },
  signatureImage: {
    maxWidth: "200px",
    maxHeight: "80px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "5px",
    background: "white"
  },
  actions: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
    marginTop: "10px"
  },
  previewBtn: {
    padding: "12px 24px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    flex: 1,
    minWidth: "150px"
  },
  signBtn: {
    padding: "12px 24px",
    background: "#8b5cf6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    flex: 1,
    minWidth: "150px"
  },
  printBtn: {
    padding: "12px 24px",
    background: "#1a472a",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    flex: 1,
    minWidth: "150px"
  },
  requestBtn: {
    padding: "12px 24px",
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    flex: 1,
    minWidth: "150px"
  },
  retryBtn: {
    padding: "10px 24px",
    background: "#8b5cf6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    marginTop: "10px"
  },
  emptyState: {
    textAlign: "center",
    padding: "30px 20px",
    color: "#666"
  },
  previewModal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px"
  },
  previewContent: {
    backgroundColor: "white",
    borderRadius: "12px",
    maxWidth: "700px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto"
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 20px",
    borderBottom: "1px solid #eee",
    position: "sticky",
    top: 0,
    background: "white",
    zIndex: 10,
    borderRadius: "12px 12px 0 0"
  },
  previewTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#1a472a"
  },
  previewBody: {
    padding: "20px"
  },
  closeBtn: {
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "14px",
    whiteSpace: "nowrap"
  },
  previewImage: {
    width: "100%",
    height: "auto",
    borderRadius: "8px",
    border: "1px solid #ddd",
    maxHeight: "500px",
    objectFit: "contain"
  },
  previewButtons: {
    display: "flex",
    gap: "10px",
    marginTop: "20px",
    justifyContent: "center",
    flexWrap: "wrap"
  },
  closePreviewBtn: {
    padding: "10px 24px",
    background: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500"
  },
  signModalBody: {
    textAlign: "center",
    padding: "20px"
  },
  signInstructions: {
    marginBottom: "15px",
    color: "#666",
    fontSize: "15px"
  },
  signCanvasContainer: {
    border: "2px solid #1a472a",
    borderRadius: "8px",
    overflow: "hidden",
    background: "white"
  },
  signCanvas: {
    width: "100%",
    height: "200px",
    touchAction: "none",
    cursor: "crosshair",
    background: "white"
  },
  signActions: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    marginTop: "15px"
  },
  clearSignBtn: {
    padding: "8px 20px",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px"
  },
  saveSignBtn: {
    padding: "8px 20px",
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px"
  },
  signHint: {
    fontSize: "12px",
    color: "#999",
    marginTop: "10px"
  }
};

// Add keyframes for spinner
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin { 
    to { transform: rotate(360deg); } 
  }
  button:hover { 
    opacity: 0.9; 
    transform: translateY(-1px); 
    transition: all 0.2s; 
    cursor: pointer; 
  }
`;
document.head.appendChild(styleSheet);