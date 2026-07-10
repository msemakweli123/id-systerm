// src/components/Footer.jsx - Simple Version
import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer style={styles.footer}>
      <p style={styles.text}>
        &copy; {currentYear} Mzumbe University. All rights reserved.
      </p>
    </footer>
  );
}

const styles = {
  footer: {
    background: '#ffffff',
    borderTop: '1px solid #e5e7eb',
    padding: '16px 24px',
    textAlign: 'center',
    marginTop: 'auto',
  },
  text: {
    margin: 0,
    fontSize: '13px',
    color: '#6b7280',
  },
};