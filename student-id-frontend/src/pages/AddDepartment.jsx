import { useState, useEffect } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faCode,
  faUniversity,
  faSave,
} from "@fortawesome/free-solid-svg-icons";

export default function AddDepartment() {
  const [form, setForm] = useState({
    name: "",
    code: "",
    faculty_id: "",
  });

  const [faculties, setFaculties] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // LOAD FACULTIES
  useEffect(() => {
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    try {
      const res = await api.get("/faculties");
      setFaculties(res.data);
    } catch (err) {
      console.log(err);
      setMessage("❌ Failed to load faculties");
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.name || !form.code || !form.faculty_id) {
      setMessage("❌ Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      await api.post("/departments", form);

      setMessage("✅ Department created successfully");

      setForm({
        name: "",
        code: "",
        faculty_id: "",
      });
    } catch (err) {
      console.log(err.response);

      setMessage(
        err.response?.data?.message || "❌ Error creating department"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={styles.wrapper}>

        <h2 style={styles.title}>
          <FontAwesomeIcon icon={faBuilding} /> Add Department
        </h2>

        <div style={styles.card}>
          <form onSubmit={submit} style={styles.form}>

            {/* NAME */}
            <div style={styles.field}>
              <label>
                <FontAwesomeIcon icon={faBuilding} /> Department Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
                style={styles.input}
              />
            </div>

            {/* CODE */}
            <div style={styles.field}>
              <label>
                <FontAwesomeIcon icon={faCode} /> Department Code
              </label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="e.g. CS"
                style={styles.input}
              />
            </div>

            {/* FACULTY */}
            <div style={styles.field}>
              <label>
                <FontAwesomeIcon icon={faUniversity} /> Select Faculty
              </label>

              <select
                name="faculty_id"
                value={form.faculty_id}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="">-- Select Faculty --</option>

                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              style={styles.button}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faSave} />{" "}
              {loading ? "Saving..." : "Save Department"}
            </button>

          </form>

          {message && (
            <p
              style={{
                ...styles.msg,
                color: message.includes("❌") ? "red" : "green",
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
  },

  title: {
    marginBottom: "20px",
    fontWeight: "600",
    textAlign: "center",
  },

  card: {
    background: "#ffffff",
    padding: "25px",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  input: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "14px",
  },

  button: {
    marginTop: "10px",
    padding: "12px",
    background: "#111827",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  msg: {
    marginTop: "15px",
    fontWeight: "bold",
    textAlign: "center",
  },
};