import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function AddStudent() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    department_id: "",
    program_id: "",
    start_year: "",
    end_year: "",
  });

  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Get current year for year selection
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear - 5 + i);

  useEffect(() => {
    fetchDepartments();
  }, []);

  /* ================= LOAD DEPARTMENTS ================= */
  const fetchDepartments = async () => {
    try {
      const res = await api.get("/departments");
      setDepartments(res.data?.data || res.data || []);
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to load departments");
    }
  };

  /* ================= LOAD PROGRAMS ================= */
  const fetchPrograms = async (departmentId) => {
    try {
      const res = await api.get(`/departments/${departmentId}/programs`);
      setPrograms(res.data?.data || res.data || []);
    } catch (error) {
      console.error(error);
      setPrograms([]);
      setMessage("❌ Failed to load programs");
    }
  };

  /* ================= HANDLE INPUT ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      // reset program when department changes
      if (name === "department_id") {
        updated.program_id = "";
        fetchPrograms(value);
      }

      // Auto-set end_year if start_year is selected (4 years later)
      if (name === "start_year" && value) {
        const startYear = parseInt(value);
        if (!isNaN(startYear)) {
          updated.end_year = (startYear + 4).toString();
        }
      }

      return updated;
    });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    console.log("SUBMIT DATA:", form);

    if (!form.name || !form.email || !form.department_id || !form.program_id) {
      setMessage("❌ Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/students", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        department_id: form.department_id,
        program_id: form.program_id,
        start_year: form.start_year || null,
        end_year: form.end_year || null,
      });

      console.log("SERVER RESPONSE:", res.data);

      setMessage("✅ Student created successfully");

      setTimeout(() => {
        navigate("/admin/view-students");
      }, 1500);

    } catch (err) {
      console.error("ERROR:", err.response?.data || err.message);

      setMessage(
        err.response?.data?.message || "❌ Error creating student"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={styles.wrapper}>
        <h2 style={styles.title}>Add Student</h2>

        <div style={styles.card}>
          <form onSubmit={handleSubmit} style={styles.form}>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full Name"
              style={styles.input}
              required
            />

            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              style={styles.input}
              required
            />

            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone"
              style={styles.input}
            />

            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="">Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <select
              name="department_id"
              value={form.department_id}
              onChange={handleChange}
              style={styles.input}
              required
            >
              <option value="">Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              name="program_id"
              value={form.program_id}
              onChange={handleChange}
              style={styles.input}
              disabled={!form.department_id}
              required
            >
              <option value="">Program</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Start Year */}
            <select
              name="start_year"
              value={form.start_year}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="">Start Year</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            {/* End Year */}
            <select
              name="end_year"
              value={form.end_year}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="">End Year (Expected Graduation)</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <button 
              type="submit" 
              disabled={loading} 
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {})
              }}
            >
              {loading ? "Saving..." : "Save Student"}
            </button>
          </form>

          {message && (
            <p style={{ 
              color: message.includes("❌") ? "#dc3545" : "#28a745",
              marginTop: "15px",
              fontWeight: "bold",
              padding: "10px",
              borderRadius: "6px",
              background: message.includes("❌") ? "#f8d7da" : "#d4edda",
              textAlign: "center"
            }}>
              {message}
            </p>
          )}
        </div>
      </div>

      {/* CSS Styles */}
      <style>{`
        input:focus, select:focus {
          border-color: #111827 !important;
          box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.1) !important;
          outline: none;
        }
        
        input:hover, select:hover {
          border-color: #6b7280;
        }
        
        button:hover:not(:disabled) {
          background: #1f2937 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(17, 24, 39, 0.15);
        }
        
        button:active:not(:disabled) {
          transform: translateY(0);
        }
        
        input::placeholder {
          color: #9ca3af;
        }
        
        select option {
          padding: 8px;
        }
      `}</style>
    </Layout>
  );
}

/* ================= STYLES ================= */
const styles = {
  wrapper: { 
    maxWidth: "600px", 
    margin: "0 auto",
    padding: "20px"
  },
  title: { 
    marginBottom: "20px",
    color: "#111827",
    fontSize: "24px",
    fontWeight: "bold"
  },
  card: { 
    background: "#ffffff", 
    padding: "30px", 
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb"
  },
  form: { 
    display: "flex", 
    flexDirection: "column", 
    gap: "14px" 
  },
  input: { 
    padding: "12px 16px", 
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.3s ease",
    backgroundColor: "#ffffff",
    color: "#111827",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box"
  },
  button: {
    padding: "12px 24px",
    background: "#111827",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    marginTop: "10px",
    width: "100%"
  },
  buttonDisabled: {
    opacity: 0.7,
    cursor: "not-allowed"
  }
};