import { useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🎞️ SLIDER IMAGES
  const images = [
    "/src/assets/login-slides/slide1.png",
    "/src/assets/login-slides/slide2.png",
    "/src/assets/login-slides/slide3.png",
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/login", {
        email,
        password,
      });

      const data = res.data;
      console.log("Full login response:", data);

      if (!data?.token) {
        setError("Token not received from server");
        return;
      }

      // ✅ CRITICAL FIX: Get role from the correct location
      let userRole = null;
      
      // Try different possible locations for role
      if (data.user && data.user.role) {
        userRole = data.user.role;
      } else if (data.role) {
        userRole = data.role;
      } else if (data.user && data.user.user_type) {
        userRole = data.user.user_type;
      } else if (data.user_type) {
        userRole = data.user_type;
      }
      
      console.log("Extracted role:", userRole);

      // If role is still null, try to get it from the email
      if (!userRole) {
        // For testing: if email contains "student", set role to "student"
        if (email.includes("student")) {
          userRole = "student";
        } else if (email.includes("admin")) {
          userRole = "admin";
        } else if (email.includes("super")) {
          userRole = "super_admin";
        }
        console.log("Role set from email fallback:", userRole);
      }

      // Store in localStorage with multiple keys for compatibility
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user || data));
      localStorage.setItem("role", userRole);
      localStorage.setItem("userRole", userRole); // Backup key
      
      console.log("Stored in localStorage:");
      console.log("  token:", localStorage.getItem("token"));
      console.log("  role:", localStorage.getItem("role"));
      console.log("  userRole:", localStorage.getItem("userRole"));

      // Navigate based on role
      if (userRole === "super_admin") {
        navigate("/super-admin");
      } else if (userRole === "admin") {
        navigate("/admin");
      } else if (userRole === "student") {
        navigate("/student");
      } else {
        setError(`Invalid role: ${userRole}. Please contact support.`);
        return;
      }

    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message ||
        "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div
          style={{
            ...styles.bgImage,
            backgroundImage: `url(${images[index]})`,
          }}
        />
        <div style={styles.overlay} />
        <div style={styles.instructionsBox}>
          <h1 style={styles.title}>Welcome</h1>
          <p style={styles.helpText}>
            Need help? Contact IT Support at{" "}
            <strong>mkcoder2018@gmail.com</strong>
          </p>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>Login to Your Account</h2>

          {error && <p style={styles.error}>{error}</p>}

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                placeholder="Enter valid email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
            </div>

            <button disabled={loading} style={styles.button}>
              {loading ? "Logging in..." : "Login →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Segoe UI",
  },
  leftPanel: {
    flex: 1,
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  bgImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundSize: "cover",
    backgroundPosition: "center",
    transition: "1s ease-in-out",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.6)",
  },
  instructionsBox: {
    position: "relative",
    zIndex: 2,
    color: "white",
    textAlign: "center",
    maxWidth: "400px",
  },
  title: {
    fontSize: "42px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  helpText: {
    fontSize: "14px",
    opacity: 0.9,
  },
  rightPanel: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f7fb",
  },
  formContainer: {
    width: "400px",
    padding: "40px",
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
  },
  formTitle: {
    textAlign: "center",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: "14px",
    marginBottom: "5px",
  },
  input: {
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "8px",
  },
  button: {
    marginTop: "10px",
    padding: "12px",
    background: "#111",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  error: {
    color: "red",
    fontSize: "14px",
    textAlign: "center",
  },
};