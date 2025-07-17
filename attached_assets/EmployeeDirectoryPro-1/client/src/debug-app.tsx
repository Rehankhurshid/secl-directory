import { createRoot } from "react-dom/client";

function DebugApp() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Debug App - Basic Test</h1>
      <p>If you see this, React is working!</p>
      <div style={{ marginTop: "20px" }}>
        <button onClick={() => alert("Button clicked!")}>
          Test Button
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<DebugApp />);