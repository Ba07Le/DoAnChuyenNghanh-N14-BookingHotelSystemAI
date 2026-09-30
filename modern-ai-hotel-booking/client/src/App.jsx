import { useEffect, useState } from "react";
import api from "./services/api";

function App() {
  const [serverStatus, setServerStatus] = useState("Checking...");

  useEffect(() => {
    api
      .get("/health")
      .then((response) => {
        setServerStatus(response.data.message);
      })
      .catch(() => {
        setServerStatus("Server unavailable");
      });
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-blue-400">MODERN AI-POWERED HOTEL BOOKING</p>

          <h1 className="text-6xl font-bold">Find Your Perfect Stay</h1>

          <p className="mt-6 text-slate-400">
            AI-powered hotel booking platform
          </p>

          <div className="mt-8 rounded-xl border border-slate-700 p-4">
            Backend: {serverStatus}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
