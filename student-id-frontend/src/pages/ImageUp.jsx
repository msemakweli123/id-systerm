import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";

import "@fortawesome/fontawesome-free/css/all.min.css";

export default function ImageUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    reg_number: "",
    phone: "",
    address: "",
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [photoStatus, setPhotoStatus] = useState("none");
  const [imageError, setImageError] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const BASE_URL = "http://127.0.0.1:8000";

  const FALLBACK_AVATAR =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    console.log("=== ImageUpload Component Debug ===");
    console.log("Token:", token ? "✅ Present" : "❌ Missing");
    console.log("Role:", role || "❌ Missing");
    console.log("===================================");
    
    if (!role && token) {
      console.log("⚠️ Role missing, setting to 'student'");
      localStorage.setItem("role", "student");
    }
    
    if (!token) {
      navigate("/login");
      return;
    }
    
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const res = await api.get("/student/me", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const student = res.data.student;

      setFormData({
        name: student.user?.name || "",
        email: student.user?.email || "",
        reg_number: student.reg_number || "",
        phone: student.phone || "",
        address: student.address || "",
      });

      await fetchStudentPhoto(token);
    } catch (err) {
      console.error("Error fetching student data:", err);
      setMessage({ text: "Failed to load data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentPhoto = async (token) => {
    try {
      console.log("=== FETCHING STUDENT PHOTO ===");
      const photoRes = await api.get("/student/photo", {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Full photo response:", photoRes.data);
      
      if (photoRes.data?.url) {
        console.log("📸 URL from response:", photoRes.data.url);
        setCurrentPhoto(photoRes.data.url);
        setUploadedImageUrl(photoRes.data.url);
        setPhotoStatus(photoRes.data.photo?.status || "none");
        setImageError(false);
        return;
      }

      const photo = photoRes.data?.photo;
      console.log("Photo object:", photo);

      if (photo?.path) {
        console.log("Raw path from database:", photo.path);
        console.log("Photo status:", photo.status);
        
        let filename = photo.path;
        if (filename.includes('/')) {
          filename = filename.split('/').pop();
        }
        
        const fullUrl = `${BASE_URL}/photos/${filename}`;
        
        console.log("📸 Final image URL:", fullUrl);
        console.log("📸 Filename:", filename);
        
        setCurrentPhoto(fullUrl);
        setUploadedImageUrl(fullUrl);
        setPhotoStatus(photo.status || "none");
        setImageError(false);
        
      } else {
        console.log("No photo found in response");
        setPhotoStatus("none");
        setUploadedImageUrl(null);
        setCurrentPhoto(null);
      }
    } catch (err) {
      console.error("Error fetching photo:", err);
      setPhotoStatus("none");
      setUploadedImageUrl(null);
      setCurrentPhoto(null);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (e) => {
    if (photoStatus === "pending") {
      showMessage("⚠️ Photo pending approval", "error");
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      showMessage("Only JPG/PNG allowed", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage("Max size 5MB", "error");
      return;
    }

    setSelectedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setImageError(false);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!selectedImage) {
      console.log("No image selected to upload");
      return true;
    }

    setIsUploading(true);
    setUploading(true);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showMessage("Please login again", "error");
        return false;
      }

      const formDataImg = new FormData();
      formDataImg.append("photo", selectedImage);

      console.log("=== UPLOADING IMAGE ===");
      console.log("File name:", selectedImage.name);
      console.log("File size:", selectedImage.size);
      console.log("File type:", selectedImage.type);
      
      const res = await api.post("/student/upload-photo", formDataImg, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      console.log("Upload response:", res.data);
      
      if (res.data.success === false) {
        showMessage(res.data.message || "Upload failed", "error");
        return false;
      }

      if (res.data?.url) {
        console.log("📸 Upload URL from response:", res.data.url);
        setUploadedImageUrl(res.data.url);
        setCurrentPhoto(res.data.url);
        setImagePreview(null);
        setImageError(false);
        setPhotoStatus("pending");
        showMessage("✅ Photo uploaded successfully! Waiting for approval.", "success");
        return true;
      }

      const photo = res.data.photo;
      console.log("Uploaded photo data:", photo);

      if (photo?.path) {
        console.log("Uploaded photo path:", photo.path);
        
        let filename = photo.path;
        if (filename.includes('/')) {
          filename = filename.split('/').pop();
        }
        
        const fullUrl = `${BASE_URL}/photos/${filename}`;
        
        console.log("📸 Uploaded image URL:", fullUrl);
        console.log("📸 Filename:", filename);
        
        setUploadedImageUrl(fullUrl);
        setCurrentPhoto(fullUrl);
        setImagePreview(null);
        setImageError(false);
        setPhotoStatus("pending");
        
        showMessage("✅ Photo uploaded successfully! Waiting for approval.", "success");
        return true;
      } else {
        showMessage("Upload failed: No photo data returned", "error");
        return false;
      }
      
    } catch (err) {
      console.error("Upload error:", err);
      console.error("Error response:", err.response?.data);
      
      let errorMsg = "Upload failed";
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      }
      
      showMessage(errorMsg, "error");
      return false;
    } finally {
      setIsUploading(false);
      setUploading(false);
    }
  };

  const updateProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || "",
        address: formData.address || "",
      };

      console.log("Updating profile with:", updateData);
      
      const response = await api.post(
        "/profile/update",
        updateData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log("Profile update response:", response.data);
      showMessage("Profile updated successfully", "success");
      return true;
    } catch (err) {
      console.error("Update error:", err);
      console.error("Error response:", err.response?.data);
      showMessage(err.response?.data?.message || "Update failed", "error");
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedImage) {
      const imageUploaded = await uploadImage();
      
      if (!imageUploaded) {
        return;
      }
    }
    
    const profileUpdated = await updateProfile();
    
    if (profileUpdated && selectedImage) {
      setSelectedImage(null);
      
      const token = localStorage.getItem("token");
      if (token) {
        await fetchStudentPhoto(token);
      }
      
      showMessage("✅ Photo and profile updated successfully!", "success");
    }
  };

  const getImageSrc = () => {
    console.log("=== getImageSrc Debug ===");
    console.log("imagePreview:", imagePreview ? "exists" : "null");
    console.log("uploadedImageUrl:", uploadedImageUrl || "null");
    console.log("currentPhoto:", currentPhoto || "null");
    console.log("imageError:", imageError);
    console.log("========================");
    
    if (imagePreview) {
      console.log("Showing preview image");
      return imagePreview;
    }
    
    if (uploadedImageUrl && !imageError) {
      console.log("Showing uploaded image:", uploadedImageUrl);
      return uploadedImageUrl;
    }
    
    if (currentPhoto && !imageError) {
      console.log("Showing current photo:", currentPhoto);
      return currentPhoto;
    }
    
    console.log("Showing fallback avatar");
    return FALLBACK_AVATAR;
  };

  const refreshPhoto = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      setLoading(true);
      await fetchStudentPhoto(token);
      setLoading(false);
      showMessage("Photo refreshed", "success");
    }
  };

  const getStatusIcon = () => {
    switch(photoStatus) {
      case 'approved':
        return 'fa-check-circle';
      case 'pending':
        return 'fa-clock';
      case 'rejected':
        return 'fa-times-circle';
      default:
        return 'fa-user-circle';
    }
  };

  const getStatusColor = () => {
    switch(photoStatus) {
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

  const ImageUpContent = () => {
    if (loading) {
      return (
        <div style={styles.loader}>
          <i className="fas fa-spinner fa-spin"></i> Loading...
        </div>
      );
    }

    return (
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>
            <i className="fas fa-id-card" style={styles.headerIcon}></i>
            Update Profile
          </h1>
          <p style={styles.headerSubtitle}>
            Manage your profile photo and personal information
          </p>
        </div>

        {/* Message */}
        {message.text && (
          <div
            style={{
              ...styles.message,
              background: message.type === "success" ? "#dcfce7" : "#fee2e2",
              color: message.type === "success" ? "#16a34a" : "#dc2626"
            }}
          >
            <i className={`fas ${message.type === "success" ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Photo Card */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <i className="fas fa-camera" style={styles.cardIcon}></i> Profile Photo
            </h3>

            <div style={styles.photoContainer}>
              <img
                src={getImageSrc()}
                alt="Profile"
                style={styles.photo}
                onError={(e) => {
                  console.log("❌ Image failed to load:", getImageSrc());
                  setImageError(true);
                  e.target.src = FALLBACK_AVATAR;
                }}
                onLoad={() => {
                  console.log("✅ Image loaded successfully");
                  setImageError(false);
                }}
              />
            </div>

            {/* Status Badge */}
            <div style={styles.statusContainer}>
              <span style={{
                ...styles.statusBadge,
                background: photoStatus === 'approved' ? '#dcfce7' : 
                           photoStatus === 'pending' ? '#fef3c7' : 
                           photoStatus === 'rejected' ? '#fee2e2' : '#f3f4f6',
                color: getStatusColor(),
              }}>
                <i className={`fas ${getStatusIcon()}`}></i>
                {photoStatus === 'approved' && ' Approved'}
                {photoStatus === 'pending' && ' Pending Approval'}
                {photoStatus === 'rejected' && ' Rejected'}
                {photoStatus === 'none' && ' No Photo'}
              </span>
            </div>

            {/* Upload Status Messages */}
            {uploadedImageUrl && photoStatus === 'pending' && (
              <div style={styles.pendingMessage}>
                <i className="fas fa-clock"></i> Image uploaded! Waiting for admin approval.
              </div>
            )}

            {imagePreview && (
              <div style={styles.previewMessage}>
                <i className="fas fa-eye"></i> Previewing new image
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              id="photo"
              hidden
            />

            <div style={styles.buttonGroup}>
              <label htmlFor="photo" style={styles.uploadBtn}>
                <i className="fas fa-upload"></i> Choose Image
              </label>
              <button 
                type="button" 
                onClick={refreshPhoto}
                style={styles.refreshBtn}
              >
                <i className="fas fa-sync"></i> Refresh
              </button>
            </div>

            {selectedImage && (
              <div style={styles.selectedFile}>
                <i className="fas fa-file-image" style={{ color: '#2563eb' }}></i>
                <span style={{ fontSize: '14px' }}>
                  Selected: {selectedImage.name}
                </span>
              </div>
            )}
          </div>

          {/* Personal Information Card */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <i className="fas fa-user" style={styles.cardIcon}></i> Personal Information
            </h3>

            <div style={styles.inputGroup}>
              <i className="fas fa-user" style={styles.inputIcon}></i>
              <input 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                style={styles.input} 
                placeholder="Full Name"
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <i className="fas fa-envelope" style={styles.inputIcon}></i>
              <input 
                name="email" 
                value={formData.email} 
                onChange={handleInputChange} 
                style={styles.input} 
                placeholder="Email"
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <i className="fas fa-id-card" style={styles.inputIcon}></i>
              <input 
                name="reg_number" 
                value={formData.reg_number} 
                disabled 
                style={{...styles.input, background: '#f3f4f6'}} 
                placeholder="Registration Number" 
              />
            </div>

            <div style={styles.inputGroup}>
              <i className="fas fa-phone" style={styles.inputIcon}></i>
              <input 
                name="phone" 
                value={formData.phone} 
                onChange={handleInputChange} 
                style={styles.input} 
                placeholder="Phone" 
              />
            </div>

            <div style={styles.inputGroup}>
              <i className="fas fa-map-marker-alt" style={styles.inputIcon}></i>
              <input 
                name="address" 
                value={formData.address} 
                onChange={handleInputChange} 
                style={styles.input} 
                placeholder="Address" 
              />
            </div>

            <button type="submit" style={styles.submitBtn} disabled={uploading || isUploading}>
              <i className={`fas ${uploading || isUploading ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
              {uploading || isUploading ? ' Uploading...' : ' Save Changes'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <Layout>
      <ImageUpContent />
    </Layout>
  );
}

const styles = {
  container: {
    padding: "30px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  
  header: {
    background: "linear-gradient(135deg, #060d2e, #05162c)",
    padding: "30px",
    borderRadius: "12px",
    marginBottom: "30px",
  },
  
  headerTitle: {
    color: "#ffffff",
    fontSize: "28px",
    margin: "0 0 8px 0",
    fontWeight: "700",
  },
  
  headerIcon: {
    marginRight: "12px",
    color: "#ffffff",
  },
  
  headerSubtitle: {
    color: "#ffffff",
    fontSize: "16px",
    margin: "0",
    opacity: "0.9",
  },
  
  form: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },
  
  card: {
    background: "#ffffff",
    padding: "28px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
  },
  
  cardTitle: {
    margin: "0 0 24px 0",
    fontSize: "18px",
    fontWeight: "600",
    color: "#111827",
    borderBottom: "2px solid #f3f4f6",
    paddingBottom: "12px",
  },
  
  cardIcon: {
    marginRight: "10px",
    color: "#1a472a",
  },
  
  photoContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "10px 0",
  },
  
  photo: {
    width: "180px",
    height: "180px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "4px solid #1a472a",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  
  statusContainer: {
    textAlign: "center",
    marginTop: "15px",
  },
  
  statusBadge: {
    padding: "6px 20px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "500",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
  
  pendingMessage: {
    marginTop: "12px",
    padding: "10px 16px",
    background: "#fef3c7",
    borderRadius: "8px",
    textAlign: "center",
    color: "#d97706",
    fontSize: "14px",
  },
  
  previewMessage: {
    marginTop: "12px",
    padding: "8px 16px",
    background: "#e0f2fe",
    borderRadius: "8px",
    textAlign: "center",
    fontSize: "13px",
    color: "#071d4d",
  },
  
  buttonGroup: {
    display: "flex",
    gap: "10px",
    marginTop: "16px",
  },
  
  uploadBtn: {
    flex: 1,
    textAlign: "center",
    padding: "11px",
    background: "#1a472a",
    color: "#ffffff",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background 0.3s",
    fontWeight: "500",
    border: "none",
    fontSize: "14px",
  },
  
  refreshBtn: {
    flex: 1,
    textAlign: "center",
    padding: "11px",
    background: "#6b7280",
    color: "#ffffff",
    borderRadius: "8px",
    cursor: "pointer",
    border: "none",
    transition: "background 0.3s",
    fontWeight: "500",
    fontSize: "14px",
  },
  
  selectedFile: {
    marginTop: "12px",
    padding: "10px 16px",
    background: "#e0f2fe",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  
  inputGroup: {
    position: "relative",
    marginBottom: "14px",
  },
  
  inputIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9ca3af",
    fontSize: "14px",
  },
  
  input: {
    width: "100%",
    padding: "11px 14px 11px 44px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "14px",
    transition: "border 0.3s, box-shadow 0.3s",
    boxSizing: "border-box",
    outline: "none",
    background: "#ffffff",
  },
  
  submitBtn: {
    padding: "12px",
    background: "#050833",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    transition: "background 0.3s",
    width: "100%",
    marginTop: "6px",
  },
  
  message: {
    padding: "12px 18px",
    marginBottom: "24px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontWeight: "500",
  },
  
  loader: {
    textAlign: "center",
    padding: "50px",
    fontSize: "18px",
    color: "#6b7280",
  },
};

// Add hover styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    .upload-btn:hover {
      background: #2d6a4f !important;
    }
    .refresh-btn:hover {
      background: #4b5563 !important;
    }
    .submit-btn:hover:not(:disabled) {
      background: #059669 !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    .input-field:focus {
      border-color: #1a472a !important;
      box-shadow: 0 0 0 3px rgba(26, 71, 42, 0.1) !important;
    }
    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(styleSheet);
}