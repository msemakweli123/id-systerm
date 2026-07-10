import { useEffect, useState } from "react";
import axios from "../api/axios";

export default function Notifications() {
  const [list, setList] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => setList(res.data));
  }, []);

  return (
    <div>
      <h3>🔔 Notifications</h3>

      {list.length === 0 ? (
        <p>No notifications</p>
      ) : (
        list.map((n) => (
          <div key={n.id} style={styles.item}>
            <strong>{n.title}</strong>
            <p>{n.message}</p>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  item: {
    background: "#fff",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
};