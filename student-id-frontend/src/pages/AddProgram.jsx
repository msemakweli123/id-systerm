import { useState, useEffect } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function AddProgram() {
  const [form, setForm] = useState({
    name: "",
    code: "",
    department_id: "",
  });

  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ================= LOAD DEPARTMENTS =================
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoadingDepts(true);

    try {
      const response = await api.get("/departments");
      setDepartments(response.data.data || response.data);
    } catch (error) {
      console.log(error.response);
      setMessage("❌ Error loading departments");
    } finally {
      setLoadingDepts(false);
    }
  };

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ================= SUBMIT =================
  const submit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.name || !form.code || !form.department_id) {
      setMessage("❌ Please fill all fields including department");
      return;
    }

    setLoading(true);

    try {
      await api.post("/programs", form);
      setMessage("✅ Program created successfully");
      setForm({
        name: "",
        code: "",
        department_id: "",
      });
    } catch (error) {
      console.log(error.response);
      setMessage(
        error.response?.data?.message || "❌ Error creating program"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={styles.wrapper}>
        <h2 style={styles.title}>
          <i className="fas fa-graduation-cap" style={{ marginRight: "10px" }}></i>
          Add New Program
        </h2>

        <div style={styles.card}>
          <form onSubmit={submit} style={styles.form}>

            {/* PROGRAM NAME */}
            <div style={styles.field}>
              <label>
                <i className="fas fa-tag" style={{ marginRight: "8px", color: "#1a2a6c" }}></i>
                Program Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Bachelor of IT"
                style={styles.input}
              />
            </div>

            {/* PROGRAM CODE */}
            <div style={styles.field}>
              <label>
                <i className="fas fa-code" style={{ marginRight: "8px", color: "#1a2a6c" }}></i>
                Program Code
              </label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="e.g. BIT"
                style={styles.input}
              />
            </div>

            {/* DEPARTMENT DROPDOWN */}
            <div style={styles.field}>
              <label>
                <i className="fas fa-building" style={{ marginRight: "8px", color: "#1a2a6c" }}></i>
                Department
              </label>
              <select
                name="department_id"
                value={form.department_id}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="">-- Select Department --</option>

                {loadingDepts ? (
                  <option disabled>Loading departments...</option>
                ) : departments.length === 0 ? (
                  <option disabled>No departments found</option>
                ) : (
                  departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              style={styles.button}
              disabled={loading}
            >
              <i className="fas fa-save" style={{ marginRight: "8px" }}></i>
              {loading ? "Saving..." : "Save Program"}
            </button>

          </form>

          {/* MESSAGE */}
          {message && (
            <p
              style={{
                ...styles.msg,
                color: message.includes("❌") ? "#dc3545" : "#28a745",
              }}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}

/* ================= STYLES ================= */
const styles = {
  wrapper: {
    maxWidth: "500px",
    margin: "0 auto",
    padding: "20px",
  },

  title: {
    marginBottom: "20px",
    fontWeight: "600",
    textAlign: "center",
    color: "#1a2a6c",
    fontSize: "24px",
  },

  card: {
    background: "#ffffff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(26, 42, 108, 0.15)",
    border: "1px solid #e8edf5",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  input: {
    padding: "12px 14px",
    border: "1px solid #d1d9e6",
    borderRadius: "8px",
    fontSize: "14px",
    transition: "border-color 0.3s",
    backgroundColor: "#f8faff",
  },

  button: {
    marginTop: "10px",
    padding: "12px",
    background: "#1a2a6c",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background 0.3s",
  },

  msg: {
    marginTop: "15px",
    fontWeight: "bold",
    textAlign: "center",
    padding: "10px",
    borderRadius: "6px",
    backgroundColor: "#f8f9fa",
  },
};