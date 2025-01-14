/* MapControls.css */
.map-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 1;
  background-color: rgba(0, 0, 0, 0.7);
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  color: white;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
  max-width: 90%; /* Ensure it doesn't overflow on small screens */
  width: auto; /* Default width (collapsed) */
  transition: width 0.3s ease, padding 0.3s ease;
}

.map-controls.expanded {
  width: 300px; /* Expanded width */
}

.map-controls.light {
  background-color: rgba(255, 255, 255, 0.7);
  color: #000;
}

.map-controls .control-button {
  padding: 8px 16px;
  background-color: rgba(0, 255, 255, 0.1);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #00ffff;
  margin-bottom: 16px;
  width: 100%;
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.map-controls .control-button:hover {
  background-color: rgba(0, 255, 255, 0.2);
  border-color: rgba(0, 255, 255, 0.6);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.map-controls .layer-toggles {
  margin-top: 10px;
}

.map-controls .layer-toggles h3 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #00ffff;
}

.map-controls .layer-toggle {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
}

.map-controls .layer-toggle input[type="checkbox"] {
  margin-right: 8px;
  cursor: pointer;
}

.map-controls .layer-toggle input[type="checkbox"]:checked {
  accent-color: #00ffff;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .map-controls {
    bottom: 10px;
    right: 10px;
    padding: 12px;
  }

  .map-controls.expanded {
    width: 90%; /* Adjust width for smaller screens */
  }

  .map-controls .control-button {
    font-size: 12px;
    padding: 6px 12px;
  }

  .map-controls .layer-toggles h3 {
    font-size: 14px;
  }

  .map-controls .layer-toggle {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .map-controls {
    bottom: 5px;
    right: 5px;
    padding: 10px;
  }

  .map-controls.expanded {
    width: 95%; /* Adjust width for very small screens */
  }

  .map-controls .control-button {
    font-size: 12px;
    padding: 6px 12px;
  }

  .map-controls .layer-toggles h3 {
    font-size: 14px;
  }

  .map-controls .layer-toggle {
    font-size: 12px;
  }
}
