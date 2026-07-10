import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function IDGenerate() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [courseFilter, setCourseFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  /* ================= TEMPLATE ================= */
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generatingTemplate, setGeneratingTemplate] = useState(false);
  const [selectedTemplateStyle, setSelectedTemplateStyle] = useState("darkBlue");
  const [showTemplateGenerator, setShowTemplateGenerator] = useState(false);
  const [templateErrors, setTemplateErrors] = useState({});

  /* ================= PREVIEW ================= */
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    fetchStudents();
    fetchTemplates();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/students", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data?.students || [];
      setStudents(data);

      const programList = data
        .map((s) => s.program?.name || s.program?.program_name || "")
        .filter(Boolean)
        .map((p) => p.trim().toLowerCase());

      setCourses([...new Set(programList)]);
    } catch (err) {
      console.log(err);
      showMessage("❌ Failed to load students", "error");
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/id-templates", {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Templates response:", res.data);

      const templatesData = res.data?.templates || [];
      setTemplates(templatesData);
      
      const activeTemplate = templatesData.find(t => t.status === "active") || templatesData[0];
      if (activeTemplate) {
        setSelectedTemplate(activeTemplate.id);
      }
    } catch (err) {
      console.log("No templates found");
      setTemplates([]);
    }
  };

  // Generate template using backend API
  const generateTemplateViaBackend = async () => {
    setGeneratingTemplate(true);
    showMessage(`Generating ${selectedTemplateStyle} template...`, "");

    try {
      const styleNames = {
        darkBlue: "Dark Blue Template",
        whiteMilk: "White Milk Template",
        brown: "Brown Template",
        royalGold: "Royal Gold Template"
      };
      
      const token = localStorage.getItem("token");
      
      const response = await api.post("/id-template/generate", {
        style: selectedTemplateStyle,
        name: styleNames[selectedTemplateStyle]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data?.success) {
        showMessage(`✅ ${styleNames[selectedTemplateStyle]} generated successfully!`, "success");
        await fetchTemplates();
        setShowTemplateGenerator(false);
      } else {
        showMessage("❌ Failed to generate template", "error");
      }
    } catch (err) {
      console.error("Template generation error:", err);
      showMessage("❌ Failed to generate template: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setGeneratingTemplate(false);
    }
  };

  // ✅ PREVIEW FUNCTION
  const handlePreview = async () => {
    if (!selectedStudent) {
      showMessage("❌ Please select a student first", "error");
      return;
    }

    if (!selectedTemplate && templates.length === 0) {
      showMessage("❌ No template available", "error");
      return;
    }

    const templateId = selectedTemplate || templates[0]?.id;
    if (!templateId) {
      showMessage("❌ Please select a template", "error");
      return;
    }

    setPreviewLoading(true);
    setShowPreview(true);

    try {
      const token = localStorage.getItem("token");
      
      const response = await api.post("/id-template/preview", {
        template_id: templateId,
        student_id: selectedStudent.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Preview response:", response.data);

      if (response.data?.success) {
        setPreviewImage(response.data.preview_url);
        setPreviewData(response.data.student);
        showMessage("✅ Preview generated successfully", "success");
      } else {
        showMessage("❌ Failed to generate preview: " + (response.data?.message || "Unknown error"), "error");
      }
    } catch (err) {
      console.error("Preview error:", err);
      console.error("Error details:", err.response?.data);
      showMessage("❌ Failed to generate preview: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewImage(null);
    setPreviewData(null);
  };

  const updateTemplateStatus = async (templateId, status) => {
    try {
      const token = localStorage.getItem("token");
      await api.put(`/id-template/${templateId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage(`✅ Template ${status === "active" ? "activated" : "deactivated"}`, "success");
      await fetchTemplates();
      if (status === "active") setSelectedTemplate(templateId);
    } catch (err) {
      showMessage("❌ Failed to update template status", "error");
    }
  };

  const deleteTemplate = async (templateId) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/id-template/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage("✅ Template deleted successfully", "success");
      await fetchTemplates();
      if (selectedTemplate === templateId) setSelectedTemplate(null);
    } catch (err) {
      showMessage("❌ Failed to delete template", "error");
    }
  };

  const getStudentPhoto = (student) => {
    if (student.photo?.status === "approved" && student.photo?.path) {
      let filename = student.photo.path;
      if (filename.includes('/')) {
        filename = filename.split('/').pop();
      }
      return `${BASE_URL}/photos/${filename}`;
    }
    
    if (Array.isArray(student.photos)) {
      const approved = student.photos.find((p) => p.status === "approved");
      if (approved?.path) {
        let filename = approved.path;
        if (filename.includes('/')) {
          filename = filename.split('/').pop();
        }
        return `${BASE_URL}/photos/${filename}`;
      }
    }
    
    return null;
  };

  const getTemplateImageUrl = (template) => {
    if (!template?.path) return null;
    
    if (template.full_url) {
      return template.full_url;
    }
    
    return `${BASE_URL}/storage/${template.path}`;
  };

  const filteredStudents = students.filter((s) => {
    const studentProgram = (s.program?.name || s.program?.program_name || "").toLowerCase().trim();
    const selectedProgram = courseFilter.toLowerCase().trim();
    const matchProgram = !courseFilter || studentProgram === selectedProgram;
    const hasPhoto = (s.photo?.status === "approved" && s.photo?.path) ||
      (Array.isArray(s.photos) && s.photos.some((p) => p.status === "approved"));
    return matchProgram && hasPhoto;
  });

  // ✅ CORRECTED: Generate ID function
  const generateID = async () => {
    if (!selectedStudent) {
      showMessage("❌ Please select a student first", "error");
      return;
    }
    if (templates.length === 0) {
      showMessage("❌ No ID template available. Please generate a template first.", "error");
      return;
    }
    const templateId = selectedTemplate || templates[0]?.id;
    if (!templateId) {
      showMessage("❌ Please select a template", "error");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = { 
        template_id: templateId
      };
      
      const res = await api.post(`/id-cards/${selectedStudent.id}/generate`, payload, {
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        }
      });
      
      console.log("Generate ID response:", res.data);
      
      if (res.data?.success) {
        // ✅ The card is saved in storage, open it using the card URL
        if (res.data?.card_url) {
          window.open(res.data.card_url, "_blank");
          showMessage("✅ ID generated successfully", "success");
          setSelectedStudent(null);
          closePreview();
        } else {
          // ✅ If no card_url, try to open using the stored image
          const imageUrl = `${BASE_URL}/api/id-cards/image/${selectedStudent.id}`;
          window.open(imageUrl, "_blank");
          showMessage("✅ ID generated successfully", "success");
          setSelectedStudent(null);
          closePreview();
        }
      } else {
        showMessage("❌ Failed to generate ID: " + (res.data?.message || "Unknown error"), "error");
      }
    } catch (err) {
      console.error("Generation error:", err);
      console.error("Error details:", err.response?.data);
      showMessage(err.response?.data?.message || "❌ Failed to generate ID", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => { 
      setMessage(""); 
      setMessageType(""); 
    }, 5000);
  };

  const handleTemplateError = (templateId) => {
    setTemplateErrors(prev => ({ ...prev, [templateId]: true }));
  };

  // Styles object
  const styles = {
    container: {
      padding: "20px",
      maxWidth: "1200px",
      margin: "0 auto"
    },
    title: {
      marginBottom: "20px"
    },
    message: {
      padding: "10px 15px",
      marginBottom: "20px",
      borderRadius: "5px",
      display: "flex",
      alignItems: "center",
      gap: "8px"
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
      padding: "30px",
      maxWidth: "800px",
      width: "100%",
      maxHeight: "90vh",
      overflow: "auto"
    },
    previewHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px"
    },
    previewInfo: {
      background: "#f3f4f6",
      padding: "15px",
      borderRadius: "8px",
      marginBottom: "20px"
    },
    previewInfoItem: {
      margin: "5px 0",
      wordBreak: "break-word"
    },
    previewImage: {
      width: "100%",
      height: "auto",
      borderRadius: "8px",
      border: "1px solid #ddd"
    },
    previewButtons: {
      display: "flex",
      gap: "10px",
      marginTop: "20px",
      justifyContent: "center",
      flexWrap: "wrap"
    },
    templateSection: {
      marginBottom: "20px",
      padding: "20px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      backgroundColor: "#f9f9f9"
    },
    templateHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "15px",
      flexWrap: "wrap",
      gap: "10px"
    },
    templateGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: "20px",
      marginTop: "10px"
    },
    templateCard: {
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "15px",
      backgroundColor: "white",
      cursor: "pointer",
      position: "relative"
    },
    templateImageContainer: {
      width: "100%",
      height: "200px",
      backgroundColor: "#f3f4f6",
      borderRadius: "4px",
      marginBottom: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    },
    templateImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      borderRadius: "4px"
    },
    templateName: {
      margin: "10px 0 5px 0",
      fontSize: "16px",
      fontWeight: "bold"
    },
    templateDetails: {
      fontSize: "12px",
      color: "#666",
      marginTop: "5px"
    },
    templateDetailItem: {
      margin: "2px 0",
      wordBreak: "break-word"
    },
    templateActions: {
      marginTop: "15px",
      display: "flex",
      gap: "10px"
    },
    filterSection: {
      marginBottom: "20px",
      display: "flex",
      gap: "20px",
      alignItems: "center",
      flexWrap: "wrap",
      padding: "15px",
      backgroundColor: "#f9f9f9",
      borderRadius: "8px"
    },
    filterLabel: {
      display: "flex",
      alignItems: "center",
      gap: "8px"
    },
    filterSelect: {
      padding: "8px 12px",
      borderRadius: "4px",
      border: "1px solid #ddd"
    },
    studentGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      gap: "15px",
      maxHeight: "500px",
      overflowY: "auto",
      padding: "5px"
    },
    studentCard: {
      padding: "15px",
      cursor: "pointer",
      borderRadius: "8px",
      textAlign: "center",
      transition: "all 0.3s"
    },
    studentImage: {
      borderRadius: "50%",
      objectFit: "cover",
      marginBottom: "10px",
      border: "2px solid #ddd"
    },
    studentName: {
      margin: "5px 0",
      fontWeight: "bold",
      wordBreak: "break-word"
    },
    studentReg: {
      color: "#666",
      wordBreak: "break-word"
    },
    studentProgram: {
      color: "#888",
      wordBreak: "break-word"
    },
    generateButton: {
      padding: "12px 32px",
      fontSize: "16px",
      fontWeight: "bold",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer"
    },
    generateButtonDisabled: {
      background: "#ccc",
      cursor: "not-allowed"
    },
    generateButtonEnabled: {
      background: "#10b981"
    },
    badge: {
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "bold",
      color: "white"
    },
    badgeActive: {
      background: "#10b981"
    },
    badgeDefault: {
      background: "#8b5cf6"
    },
    badgeSelected: {
      background: "#3b82f6"
    }
  };

  return (
    <Layout>
      <div style={styles.container}>
        <h2 style={styles.title}>
          <i className="fas fa-id-card"></i> ID Generator System
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
                <h3 style={{ margin: 0 }}>
                  <i className="fas fa-eye"></i> ID Card Preview
                </h3>
                <button onClick={closePreview} style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 16px",
                  cursor: "pointer"
                }}>
                  <i className="fas fa-times"></i> Close
                </button>
              </div>

              {previewLoading ? (
                <div style={{ textAlign: "center", padding: "50px" }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: "40px" }}></i>
                  <p style={{ marginTop: "20px" }}>Generating preview...</p>
                </div>
              ) : previewImage ? (
                <div>
                  {previewData && (
                    <div style={styles.previewInfo}>
                      <p style={styles.previewInfoItem}><i className="fas fa-user"></i> <strong>Student:</strong> {previewData.name}</p>
                      <p style={styles.previewInfoItem}><i className="fas fa-id-card"></i> <strong>Registration:</strong> {previewData.reg_number}</p>
                      <p style={styles.previewInfoItem}><i className="fas fa-code"></i> <strong>Program Code:</strong> {previewData.program_code}</p>
                      <p style={styles.previewInfoItem}><i className="fas fa-building"></i> <strong>Department Code:</strong> {previewData.department_code}</p>
                      <p style={styles.previewInfoItem}><i className="fas fa-envelope"></i> <strong>Email:</strong> {previewData.email}</p>
                    </div>
                  )}
                  <img 
                    src={previewImage} 
                    alt="ID Card Preview"
                    style={styles.previewImage}
                    onError={() => {
                      console.log("Preview image failed to load");
                    }}
                  />
                  <div style={styles.previewButtons}>
                    <button onClick={generateID} style={{
                      padding: "12px 32px",
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "bold"
                    }}>
                      <i className="fas fa-id-card"></i> Generate This ID
                    </button>
                    <button onClick={closePreview} style={{
                      padding: "12px 32px",
                      background: "#6b7280",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "16px"
                    }}>
                      <i className="fas fa-times"></i> Close
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "50px", color: "#666" }}>
                  <i className="fas fa-image" style={{ fontSize: "48px" }}></i>
                  <p>No preview available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Template Management */}
        <div style={styles.templateSection}>
          <div style={styles.templateHeader}>
            <h3 style={{ margin: 0 }}>
              <i className="fas fa-layer-group"></i> ID Template Management
            </h3>
            <button 
              onClick={() => setShowTemplateGenerator(!showTemplateGenerator)} 
              style={{ 
                padding: "8px 16px", 
                background: "#18073f", 
                color: "white", 
                border: "none", 
                borderRadius: "6px", 
                cursor: "pointer" 
              }}
            >
              {showTemplateGenerator ? <><i className="fas fa-times"></i> Cancel</> : <><i className="fas fa-palette"></i> Generate Template</>}
            </button>
          </div>
          
          {showTemplateGenerator && (
            <div style={{ 
              marginBottom: "20px", 
              padding: "20px", 
              backgroundColor: "white", 
              borderRadius: "8px", 
              border: "2px solid #140636" 
            }}>
              <h4 style={{ marginTop: 0 }}>
                <i className="fas fa-paint-brush"></i> Choose Template Design
              </h4>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
                gap: "15px", 
                marginBottom: "20px" 
              }}>
                {[
                  { id: "darkBlue", name: "Dark Blue", color: "#1a237e", icon: "fa-moon" },
                  { id: "whiteMilk", name: "White Milk", color: "#2196f3", icon: "fa-sun" },
                  { id: "brown", name: "Brown", color: "#795548", icon: "fa-tree" },
                  { id: "royalGold", name: "Royal Gold", color: "#b8860b", icon: "fa-crown" }
                ].map(style => (
                  <div 
                    key={style.id} 
                    onClick={() => setSelectedTemplateStyle(style.id)} 
                    style={{ 
                      cursor: "pointer", 
                      padding: "15px", 
                      borderRadius: "8px", 
                      backgroundColor: selectedTemplateStyle === style.id ? `${style.color}20` : "white", 
                      border: selectedTemplateStyle === style.id ? `3px solid ${style.color}` : "2px solid #ddd",
                      transition: "all 0.3s"
                    }}
                  >
                    <div style={{ 
                      backgroundColor: style.color, 
                      padding: "20px", 
                      borderRadius: "8px", 
                      textAlign: "center", 
                      marginBottom: "10px",
                      minHeight: "80px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <i className={`fas ${style.icon}`} style={{ fontSize: "30px", color: "white" }}></i>
                      <h4 style={{ 
                        color: "white", 
                        margin: "8px 0 0 0", 
                        fontSize: "13px",
                        fontWeight: "bold"
                      }}>
                        {style.name}
                      </h4>
                    </div>
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "center", 
                      gap: "8px",
                      flexWrap: "wrap"
                    }}>
                      <span style={{ 
                        display: "inline-block",
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        backgroundColor: style.color
                      }}></span>
                      <span style={{ 
                        display: "inline-block",
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        backgroundColor: selectedTemplateStyle === style.id ? style.color : "#ddd"
                      }}></span>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={generateTemplateViaBackend} 
                disabled={generatingTemplate} 
                style={{ 
                  width: "100%", 
                  padding: "12px", 
                  background: generatingTemplate ? "#ccc" : "#10b981", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "6px", 
                  cursor: generatingTemplate ? "not-allowed" : "pointer", 
                  fontSize: "16px", 
                  fontWeight: "bold" 
                }}
              >
                {generatingTemplate ? (
                  <><i className="fas fa-spinner fa-spin"></i> Generating...</>
                ) : (
                  <><i className="fas fa-plus-circle"></i> Generate {selectedTemplateStyle.toUpperCase()} Template</>
                )}
              </button>
            </div>
          )}

          <div>
            <h4 style={{ marginTop: 0 }}>
              <i className="fas fa-list"></i> Available Templates ({templates.length}) - Click to Select
            </h4>
            {templates.length === 0 ? (
              <p style={{ color: "#666", textAlign: "center", padding: "20px" }}>
                <i className="fas fa-exclamation-triangle"></i> No templates available. Click "Generate Template" to create one.
              </p>
            ) : (
              <div style={styles.templateGrid}>
                {templates.map((template) => {
                  const imageUrl = getTemplateImageUrl(template);
                  const hasError = templateErrors[template.id];
                  const settings = template.settings ? JSON.parse(template.settings) : {};
                  
                  return (
                    <div 
                      key={template.id} 
                      onClick={() => setSelectedTemplate(template.id)} 
                      style={{
                        ...styles.templateCard,
                        border: selectedTemplate === template.id ? "3px solid #3b82f6" : "1px solid #ddd",
                        backgroundColor: selectedTemplate === template.id ? "#e6f3ff" : "white"
                      }}
                    >
                      {template.status === "active" && (
                        <div style={{
                          ...styles.badge,
                          ...styles.badgeActive,
                          position: "absolute",
                          top: "10px",
                          right: "10px"
                        }}>
                          <i className="fas fa-check-circle"></i> ACTIVE
                        </div>
                      )}
                      {template.is_default && (
                        <div style={{
                          ...styles.badge,
                          ...styles.badgeDefault,
                          position: "absolute",
                          top: "40px",
                          right: "10px"
                        }}>
                          <i className="fas fa-star"></i> DEFAULT
                        </div>
                      )}
                      {selectedTemplate === template.id && (
                        <div style={{
                          ...styles.badge,
                          ...styles.badgeSelected,
                          position: "absolute",
                          top: "10px",
                          left: "10px"
                        }}>
                          <i className="fas fa-check"></i> SELECTED
                        </div>
                      )}
                      
                      <div style={styles.templateImageContainer}>
                        {imageUrl && !hasError ? (
                          <img 
                            src={imageUrl} 
                            alt={template.name} 
                            style={styles.templateImage}
                            onError={() => handleTemplateError(template.id)}
                            onLoad={() => {
                              console.log(`Template image loaded: ${template.id}`);
                              setTemplateErrors(prev => ({ ...prev, [template.id]: false }));
                            }}
                          />
                        ) : (
                          <div style={{ textAlign: "center", color: "#999", padding: "20px" }}>
                            <i className="fas fa-image" style={{ fontSize: "48px", display: "block", marginBottom: "10px" }}></i>
                            <p style={{ margin: 0 }}>Template Image</p>
                            <small style={{ display: "block", marginTop: "5px" }}>{template.name}</small>
                          </div>
                        )}
                      </div>
                      
                      <h4 style={styles.templateName}>
                        <i className="fas fa-file-alt"></i> {template.name}
                      </h4>
                      
                      <div style={styles.templateDetails}>
                        <p style={styles.templateDetailItem}>
                          <i className="fas fa-tag"></i> <strong>Program:</strong> {template.program || "All"}
                        </p>
                        <p style={styles.templateDetailItem}>
                          <i className="fas fa-arrows-alt"></i> <strong>Dimensions:</strong> {template.width || 600} x {template.height || 400}
                        </p>
                        <p style={styles.templateDetailItem}>
                          <i className="fas fa-circle"></i> <strong>Status:</strong> 
                          <span style={{ 
                            color: template.status === "active" ? "#10b981" : "#ef4444", 
                            fontWeight: "bold" 
                          }}>
                            {template.status || "inactive"}
                          </span>
                        </p>
                        {template.is_default && (
                          <p style={{ ...styles.templateDetailItem, color: "#8b5cf6" }}>
                            <i className="fas fa-star"></i> Default Template
                          </p>
                        )}
                        {settings.primary_color && (
                          <div style={{ margin: "5px 0", display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                            <i className="fas fa-palette"></i> <span>Colors:</span>
                            <span style={{ 
                              display: "inline-block", 
                              width: "20px", 
                              height: "20px", 
                              borderRadius: "4px", 
                              backgroundColor: settings.primary_color 
                            }}></span>
                            <span style={{ 
                              display: "inline-block", 
                              width: "20px", 
                              height: "20px", 
                              borderRadius: "4px", 
                              backgroundColor: settings.secondary_color 
                            }}></span>
                          </div>
                        )}
                      </div>
                      
                      <div style={styles.templateActions}>
                        {template.status !== "active" && (
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              updateTemplateStatus(template.id, "active"); 
                            }} 
                            style={{ 
                              flex: 1, 
                              padding: "8px", 
                              backgroundColor: "#030f24", 
                              color: "white", 
                              border: "none", 
                              borderRadius: "4px", 
                              cursor: "pointer", 
                              fontSize: "13px" 
                            }}
                          >
                            <i className="fas fa-check"></i> Set Active
                          </button>
                        )}
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            deleteTemplate(template.id); 
                          }} 
                          style={{ 
                            flex: 1, 
                            padding: "8px", 
                            backgroundColor: "#ef4444", 
                            color: "white", 
                            border: "none", 
                            borderRadius: "4px", 
                            cursor: "pointer", 
                            fontSize: "13px" 
                          }}
                        >
                          <i className="fas fa-trash"></i> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Filters with Preview Button */}
        <div style={styles.filterSection}>
          <label style={styles.filterLabel}>
            <i className="fas fa-filter"></i> <strong>Filter by Program:</strong> 
            <select 
              value={courseFilter} 
              onChange={(e) => setCourseFilter(e.target.value)} 
              style={styles.filterSelect}
            >
              <option value="">All Programs</option>
              {courses.map((c, i) => (
                <option key={i} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </label>
          
          <button
            onClick={handlePreview}
            disabled={!selectedStudent || templates.length === 0 || previewLoading}
            style={{
              padding: "10px 20px",
              background: (!selectedStudent || templates.length === 0 || previewLoading) ? "#ccc" : "#8b5cf6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: (!selectedStudent || templates.length === 0 || previewLoading) ? "not-allowed" : "pointer",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <i className={`fas ${previewLoading ? "fa-spinner fa-spin" : "fa-eye"}`}></i>
            {previewLoading ? "Generating..." : "Preview ID"}
          </button>
          
          {selectedTemplate && (
            <div style={{ 
              marginLeft: "auto", 
              padding: "5px 10px", 
              backgroundColor: "#e6f3ff", 
              borderRadius: "6px",
              wordBreak: "break-word"
            }}>
              <i className="fas fa-check-circle" style={{ color: "#3b82f6" }}></i>
              <strong>Selected:</strong> {templates.find(t => t.id === selectedTemplate)?.name || "None"}
            </div>
          )}
        </div>

        {/* Students List */}
        <div>
          <h3 style={{ marginBottom: "15px" }}>
            <i className="fas fa-users"></i> Students with Approved Photos ({filteredStudents.length})
          </h3>
          {filteredStudents.length === 0 && (
            <p style={{ color: "#666", textAlign: "center", padding: "40px" }}>
              <i className="fas fa-exclamation-circle"></i> No students with approved photos found.
            </p>
          )}
          
          <div style={styles.studentGrid}>
            {filteredStudents.map((s) => {
              const photo = getStudentPhoto(s);
              const isSelected = selectedStudent?.id === s.id;
              
              return (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedStudent(s)} 
                  style={{
                    ...styles.studentCard,
                    border: isSelected ? "2px solid #031736" : "1px solid #ddd",
                    backgroundColor: isSelected ? "#e6f3ff" : "white"
                  }}
                >
                  {photo ? (
                    <img 
                      src={photo} 
                      width="80" 
                      height="80" 
                      style={styles.studentImage} 
                      alt={s.full_name || s.user?.name}
                      onError={(e) => {
                        console.log(`Failed to load image for student: ${s.id}`);
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <div style={{ 
                      width: "80px", 
                      height: "80px", 
                      borderRadius: "50%", 
                      backgroundColor: "#f0f0f0", 
                      display: "inline-flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      marginBottom: "10px" 
                    }}>
                      <i className="fas fa-user" style={{ fontSize: "30px", color: "#999" }}></i>
                    </div>
                  )}
                  
                  <p style={styles.studentName}>
                    <i className="fas fa-user-circle"></i> {s.full_name || s.user?.name}
                  </p>
                  <small style={styles.studentReg}>
                    <i className="fas fa-id-card"></i> {s.reg_number}
                  </small>
                  <br />
                  <small style={styles.studentProgram}>
                    <i className="fas fa-graduation-cap"></i> {s.program?.name || s.program?.program_name}
                  </small>
                </div>
              );
            })}
          </div>
        </div>

        {/* Generate Button */}
        <div style={{ marginTop: "30px", textAlign: "center" }}>
          <button 
            onClick={generateID} 
            disabled={!selectedStudent || loading || templates.length === 0} 
            style={{
              ...styles.generateButton,
              ...(!selectedStudent || loading || templates.length === 0 ? styles.generateButtonDisabled : styles.generateButtonEnabled)
            }}
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> Generating ID...</>
            ) : (
              <><i className="fas fa-id-card"></i> Generate ID Card</>
            )}
          </button>
          
          {templates.length === 0 && (
            <p style={{ color: "#460606", fontSize: "14px", marginTop: "10px" }}>
              <i className="fas fa-exclamation-triangle"></i> No templates available. Click "Generate Template" to create one.
            </p>
          )}
          
          {selectedStudent && !loading && templates.length > 0 && (
            <p style={{ color: "#0a4632", fontSize: "14px", marginTop: "10px" }}>
              <i className="fas fa-check-circle"></i> Ready to generate ID for {selectedStudent.full_name || selectedStudent.user?.name}
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}