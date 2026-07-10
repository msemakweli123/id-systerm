import { Link } from "react-router-dom";

function App() {
  return (
    <div style={styles.container}>

      {/* HERO */}
      <div style={styles.hero}>
        <h1 style={styles.title}>🎓 Student ID System</h1>

        <p style={styles.subtitle}>
          Simple & Secure Digital ID Management
        </p>

        <Link to="/login" style={styles.button}>
          Login
        </Link>
      </div>

      {/* FEATURES */}
      <div style={styles.features}>

        <div style={styles.card}>
          🪪 <h3>Digital ID</h3>
          <p>Create and manage student ID cards easily.</p>
        </div>

        <div style={styles.card}>
          📱 <h3>QR Verification</h3>
          <p>Fast identity checking using QR codes.</p>
        </div>

        <div style={styles.card}>
          ⚡ <h3>Fast System</h3>
          <p>Built with Laravel API + React frontend.</p>
        </div>

      </div>

    </div>
  );
}

/* 🎨 STYLES */
const styles = {
  container: {
    fontFamily: "Arial",
    textAlign: "center",
    background: "#f5f7fb",
    minHeight: "100vh",
    padding: "40px 20px",
  },

  hero: {
    marginTop: "80px",
  },

  title: {
    fontSize: "36px",
    color: "#1e3a8a",
    marginBottom: "10px",
  },

  subtitle: {
    fontSize: "16px",
    color: "#555",
    marginBottom: "25px",
  },

  button: {
    padding: "12px 30px",
    background: "#2563eb",
    color: "white",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "bold",
    display: "inline-block",
  },

  features: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    marginTop: "60px",
    flexWrap: "wrap",
  },

  card: {
    background: "white",
    padding: "20px",
    width: "220px",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },
};

export default App;