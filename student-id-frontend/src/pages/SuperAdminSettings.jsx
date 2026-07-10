import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function SuperAdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [settings, setSettings] = useState({
    // System Info
    system_name: "Mzumbe University ID System",
    system_email: "support@mzumbe.ac.tz",
    system_phone: "+255 712 345 678",
    system_address: "Morogoro, Tanzania",

    // Security
    default_password: "mk123",
    force_password_change: true,
    maintenance_mode: false,

    // ID Card Settings
    id_prefix: "142330",
    id_suffix: "/T.26",
    auto_generate_id: true,

    // File Settings
    max_upload_size: 2048, // KB
    allowed_file_types: "jpg,png,jpeg",

    // Audit
    enable_logs: true,
  });

  const [originalSettings, setOriginalSettings] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await api.get("/system/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.settings) {
        setSettings(response.data.settings);
        setOriginalSettings(response.data.settings);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      showMessage("❌ Failed to load settings", "error");
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : type === "number" ? Number(value) : value;

    setSettings((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      await api.post(
        "/system/settings",
        { settings },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOriginalSettings({ ...settings });
      showMessage("✅ Settings saved successfully", "success");
    } catch (error) {
      console.error(error);
      showMessage(
        "❌ Failed to save settings: " + (error.response?.data?.message || error.message),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all settings?")) {
      setSettings({ ...originalSettings });
      showMessage("🔄 Settings reset", "success");
    }
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1>
            <i className="fas fa-cog" style={{ marginRight: "10px", color: "#1a2a6c" }}></i>
            System Settings
          </h1>
          <p style={styles.subtitle}>Configure important system settings</p>
        </div>
        <div style={styles.headerActions}>
          <button 
            onClick={handleReset} 
            style={styles.resetBtn}
            disabled={!hasChanges}
          >
            <i className="fas fa-undo"></i> Reset
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            ...styles.message,
            color: messageType === "success" ? "#16a34a" : "#dc2626",
            background: messageType === "success" ? "#dcfce7" : "#fee2e2",
            borderLeft: `4px solid ${messageType === "success" ? "#16a34a" : "#dc2626"}`,
          }}
        >
          <i className={`fas ${messageType === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`}></i>
          {message}
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i> Loading settings...
        </div>
      ) : (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardHeaderText}>
              <i className="fas fa-sliders-h"></i> System Configuration
            </span>
            {hasChanges && (
              <span style={styles.unsavedBadge}>
                <i className="fas fa-circle"></i> Unsaved Changes
              </span>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            {/* SYSTEM INFO */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <i className="fas fa-building" style={{ marginRight: "8px", color: "#1a2a6c" }}></i>
                System Information
              </h3>

              <div style={styles.formGroup}>
                <label style={styles.label}>System Name</label>
                <input
                  name="system_name"
                  value={settings.system_name}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter system name"
                />
                <small style={styles.helpText}>Name displayed throughout the system</small>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>System Email</label>
                  <input
                    name="system_email"
                    value={settings.system_email}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="admin@example.com"
                  />
                  <small style={styles.helpText}>Primary contact email</small>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone Number</label>
                  <input
                    name="system_phone"
                    value={settings.system_phone}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="+255 700 000 000"
                  />
                  <small style={styles.helpText}>Primary contact phone</small>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Address</label>
                <input
                  name="system_address"
                  value={settings.system_address}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter system address"
                />
                <small style={styles.helpText}>Physical address of the institution</small>
              </div>
            </div>

            <hr style={styles.divider} />

            {/* SECURITY */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <i className="fas fa-shield-alt" style={{ marginRight: "8px", color: "#1a2a6c" }}></i>
                Security Settings
              </h3>

              <div style={styles.formGroup}>
                <label style={styles.label}>Default Password</label>
                <input
                  name="default_password"
                  value={settings.default_password}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Default password"
                />
                <small style={styles.helpText}>Default password for new student accounts</small>
              </div>

              <div style={styles.settingRow}>
                <div>
                  <span style={styles.settingLabel}>Force Password Change</span>
                  <p style={styles.settingDesc}>Force users to change password on first login</p>
                </div>
                <label style={styles.switch}>
                  <input
                    type="checkbox"
                    name="force_password_change"
                    checked={settings.force_password_change}
                    onChange={handleChange}
                  />
                  <span style={styles.slider}></span>
                </label>
              </div>

              <div style={styles.settingRow}>
                <div>
                  <span style={styles.settingLabel}>Maintenance Mode</span>
                  <p style={styles.settingDesc}>Put the system in maintenance mode</p>
                </div>
                <label style={styles.switch}>
                  <input
                    type="checkbox"
                    name="maintenance_mode"
                    checked={settings.maintenance_mode}
                    onChange={handleChange}
                  />
                  <span style={styles.slider}></span>
                </label>
              </div>
            </div>

            <hr style={styles.divider} />

            {/* ID SETTINGS */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <i className="fas fa-id-card" style={{ marginRight: "8px", color: "#1a2a6c" }}></i>
                ID Card Settings
              </h3>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>ID Prefix</label>
                  <input
                    name="id_prefix"
                    value={settings.id_prefix}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Prefix"
                  />
                  <small style={styles.helpText}>Prefix for registration numbers</small>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>ID Suffix</label>
                  <input
                    name="id_suffix"
                    value={settings.id_suffix}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Suffix"
                  />
                  <small style={styles.helpText}>Suffix for registration numbers</small>
                </div>
              </div>

              <div style={styles.settingRow}>
                <div>
                  <span style={styles.settingLabel}>Auto Generate ID</span>
                  <p style={styles.settingDesc}>Automatically generate registration numbers</p>
                </div>
                <label style={styles.switch}>
                  <input
                    type="checkbox"
                    name="auto_generate_id"
                    checked={settings.auto_generate_id}
                    onChange={handleChange}
                  />
                  <span style={styles.slider}></span>
                </label>
              </div>
            </div>

            <hr style={styles.divider} />

            {/* FILE SETTINGS */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <i className="fas fa-file" style={{ marginRight: "8px", color: "#1a2a6c" }}></i>
                File Settings
              </h3>

              <div style={styles.formGroup}>
                <label style={styles.label}>Max Upload Size (KB)</label>
                <input
                  name="max_upload_size"
                  type="number"
                  value={settings.max_upload_size}
                  onChange={handleChange}
                  style={styles.input}
                  min="100"
                  max="10240"
                />
                <small style={styles.helpText}>Maximum file size for photo uploads</small>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Allowed File Types</label>
                <input
                  name="allowed_file_types"
                  value={settings.allowed_file_types}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="jpg,png,jpeg"
                />
                <small style={styles.helpText}>Comma separated list of allowed extensions</small>
              </div>
            </div>

            <hr style={styles.divider} />

            {/* AUDIT */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <i className="fas fa-list" style={{ marginRight: "8px", color: "#1a2a6c" }}></i>
                Audit Settings
              </h3>

              <div style={styles.settingRow}>
                <div>
                  <span style={styles.settingLabel}>Enable Logs</span>
                  <p style={styles.settingDesc}>Log all system activities</p>
                </div>
                <label style={styles.switch}>
                  <input
                    type="checkbox"
                    name="enable_logs"
                    checked={settings.enable_logs}
                    onChange={handleChange}
                  />
                  <span style={styles.slider}></span>
                </label>
              </div>
            </div>

            {/* SAVE BUTTONS */}
            <div style={styles.buttonRow}>
              <button
                type="submit"
                disabled={saving || !hasChanges}
                style={{
                  ...styles.saveBtn,
                  opacity: saving || !hasChanges ? 0.6 : 1,
                  cursor: saving || !hasChanges ? "not-allowed" : "pointer",
                }}
              >
                <i className={`fas ${saving ? "fa-spinner fa-spin" : "fa-save"}`}></i>
                {saving ? "Saving..." : "Save Settings"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={!hasChanges}
                style={{
                  ...styles.cancelBtn,
                  opacity: !hasChanges ? 0.5 : 1,
                  cursor: !hasChanges ? "not-allowed" : "pointer",
                }}
              >
                <i className="fas fa-undo"></i> Reset
              </button>
            </div>

            {hasChanges && (
              <p style={styles.unsavedText}>
                <i className="fas fa-exclamation-triangle" style={{ color: "#f59e0b" }}></i>
                You have unsaved changes. Please save your settings.
              </p>
            )}
          </form>
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
  headerActions: {
    display: "flex",
    gap: "10px",
    alignSelf: "center",
  },
  subtitle: {
    color: "#6b7280",
    margin: "5px 0 0 0",
    fontSize: "14px",
  },
  resetBtn: {
    padding: "8px 16px",
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
  },
  message: {
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "15px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
  },
  loading: {
    textAlign: "center",
    padding: "60px",
    fontSize: "16px",
    color: "#6b7280",
  },
  card: {
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    maxWidth: "800px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    paddingBottom: "15px",
    borderBottom: "2px solid #f3f4f6",
  },
  cardHeaderText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
  },
  unsavedBadge: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  section: {
    marginBottom: "20px",
  },
  sectionTitle: {
    margin: "0 0 15px 0",
    fontSize: "16px",
    color: "#1a2a6c",
    fontWeight: "600",
  },
  divider: {
    border: "none",
    borderTop: "1px solid #e5e7eb",
    margin: "20px 0",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
  },
  formGroup: {
    marginBottom: "15px",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "500",
    fontSize: "13px",
    color: "#374151",
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
    background: "white",
  },
  helpText: {
    display: "block",
    marginTop: "4px",
    fontSize: "11px",
    color: "#6b7280",
  },
  settingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  settingLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1f2937",
  },
  settingDesc: {
    margin: "2px 0 0 0",
    fontSize: "12px",
    color: "#6b7280",
  },
  switch: {
    position: "relative",
    display: "inline-block",
    width: "48px",
    height: "26px",
    flexShrink: 0,
  },
  slider: {
    position: "absolute",
    cursor: "pointer",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "#ccc",
    transition: "0.3s",
    borderRadius: "26px",
  },
  buttonRow: {
    display: "flex",
    gap: "12px",
    marginTop: "20px",
    alignItems: "center",
  },
  saveBtn: {
    padding: "10px 24px",
    background: "#1a2a6c",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "background 0.2s",
  },
  cancelBtn: {
    padding: "10px 24px",
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "background 0.2s",
  },
  unsavedText: {
    margin: "10px 0 0 0",
    fontSize: "13px",
    color: "#92400e",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
};

// Add switch slider styles
const switchStyles = document.createElement("style");
switchStyles.textContent = `
  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .switch input:checked + .slider {
    background: #1a2a6c;
  }
  .switch input:focus + .slider {
    box-shadow: 0 0 1px #1a2a6c;
  }
  .switch .slider:before {
    content: "";
    position: absolute;
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background: white;
    transition: 0.3s;
    border-radius: 50%;
  }
  .switch input:checked + .slider:before {
    transform: translateX(22px);
  }
  .input:focus {
    border-color: #1a2a6c !important;
    box-shadow: 0 0 0 3px rgba(26, 42, 108, 0.1) !important;
  }
  .save-btn:hover:not(:disabled) {
    background: #2d4a8c !important;
  }
  .cancel-btn:hover:not(:disabled) {
    background: #e5e7eb !important;
  }
  .reset-btn:hover:not(:disabled) {
    background: #e5e7eb !important;
  }

  @media (max-width: 768px) {
    .page {
      padding: 10px !important;
    }
    .header {
      flex-direction: column !important;
      align-items: stretch !important;
    }
    .header-actions {
      width: 100% !important;
    }
    .reset-btn {
      width: 100% !important;
      justify-content: center !important;
    }
    .form-row {
      grid-template-columns: 1fr !important;
    }
    .card {
      padding: 15px !important;
    }
    .button-row {
      flex-direction: column !important;
    }
    .save-btn, .cancel-btn {
      width: 100% !important;
      justify-content: center !important;
    }
  }
`;
document.head.appendChild(switchStyles);