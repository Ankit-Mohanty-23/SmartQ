import "./App.css";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { useEffect } from "react";
import { getCurrentUser } from "./services/authService";

function App() {

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser(); 

        localStorage.setItem("user", JSON.stringify(user));
      } catch {
        localStorage.removeItem("user");
      }
    };

    loadUser();
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;