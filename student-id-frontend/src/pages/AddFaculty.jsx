import { useState, useEffect } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUniversity,
  faCode,
  faPlus,
  faTable,
  faTrash,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

export default function AddFaculty() {
  const [form, setForm] = useState({ name: "", code: "" });
  const [faculties, setFaculties] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    try {
      const res = await api.get("/faculties");
      setFaculties(res.data);
    } catch (err) {
      setMessage("❌ Failed to load faculties");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.name || !form.code) {
      setMessage("❌ Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      await api.post("/faculties", form);
      setMessage("✅ Faculty created successfully");
      setForm({ name: "", code: "" });
      fetchFaculties();
    } catch (err) {
      setMessage("❌ Error saving faculty");
    } finally {
      setLoading(false);
    }
  };

  const deleteFaculty = async (id) => {
    try {
      await api.delete(`/faculties/${id}`);
      setMessage("✅ Faculty deleted successfully");
      fetchFaculties();
    } catch (err) {
      setMessage("❌ Failed to delete faculty");
    }
  };

  return (
    <Layout>
      <div style={styles.container}>

        <h2 style={styles.title}>
          <FontAwesomeIcon icon={faUniversity} /> Faculty Management
        </h2>

        {/* FORM */}
        <div style={styles.card}>
          <form onSubmit={submit} style={styles.form}>

            <div style={styles.inputGroup}>
              <label>
                <FontAwesomeIcon icon={faUniversity} /> Faculty Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter faculty name"
                style={styles.input}
              />
            </div>

            {/* VERTICAL DIVIDER/BOUNDARY */}
            <div style={styles.divider}></div>

            <div style={styles.inputGroup}>
              <label>
                <FontAwesomeIcon icon={faCode} /> Faculty Code
              </label>
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="Enter faculty code"
                style={styles.input}
              />
            </div>

            <button style={styles.button} disabled={loading}>
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin /> Saving...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPlus} /> Add Faculty
                </>
              )}
            </button>
          </form>

          {message && <p style={styles.message}>{message}</p>}
        </div>

        {/* TABLE */}
        <div style={styles.card}>
          <h3>
            <FontAwesomeIcon icon={faTable} /> Faculties List
          </h3>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.cell}>#</th>
                  <th style={styles.cell}>Faculty Name</th>
                  <th style={styles.cell}>Code</th>
                  <th style={styles.cell}>Action</th>
                </tr>
              </thead>

              <tbody>
                {faculties.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={styles.empty}>
                      No faculties found
                    </td>
                  </tr>
                ) : (
                  faculties.map((f, index) => (
                    <tr key={f.id}>
                      <td style={styles.cell}>{index + 1}</td>
                      <td style={styles.cell}>{f.name}</td>
                      <td style={styles.cell}>{f.code}</td>
                      <td style={styles.cell}>
                        <button
                          onClick={() => deleteFaculty(f.id)}
                          style={styles.deleteBtn}
                        >
                          <FontAwesomeIcon icon={faTrash} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
}

/* ================= STYLES ================= */
const styles = {
  container: {
    maxWidth: "900px",
    margin: "20px auto",
    fontFamily: "Arial",
  },

  title: {
    textAlign: "center",
    marginBottom: "15px",
  },

  card: {
    background: "#fff",
    padding: "15px",
    marginBottom: "15px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },

  form: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "end",
  },

  inputGroup: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  input: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "6px",
  },

  // ADDED: Vertical divider/boundary between Faculty Name and Code
  divider: {
    width: "2px",
    height: "50px",
    backgroundColor: "#000",
    margin: "0 5px",
    alignSelf: "center",
  },

  button: {
    padding: "10px 15px",
    background: "#111827",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },

  message: {
    marginTop: "10px",
    fontWeight: "bold",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
    border: "2px solid #000",
  },

  cell: {
    border: "1px solid #000",
    padding: "8px",
    textAlign: "left",
  },

  empty: {
    textAlign: "center",
    padding: "15px",
    color: "#888",
  },

  deleteBtn: {
    padding: "6px 10px",
    background: "red",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};