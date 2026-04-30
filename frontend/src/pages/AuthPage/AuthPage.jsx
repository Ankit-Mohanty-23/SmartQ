import { useState } from "react";
import "./AuthPage.css";
import coverImage from "../../assets/smartQcover.png";
import logo from "../../assets/logo.png";
import { loginUser, registerUser } from "../../services/authService";
import { useNavigate } from "react-router-dom";

function AuthPage() {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    role: "",
  });

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  // ✅ LOGIN
  const handleLogin = async () => {
  try {
    const response = await loginUser(loginData);

    if (response.data.success) {
      const user = response.data.data;

      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "DOCTOR") {
        navigate("/doctor");
      } else if (user.role === "RECEPTIONIST") {
        navigate("/receptionist");
      } else {
        navigate("/");
      }
    
    }

  } catch (error) {
    console.log(error);
  }
};

  // ✅ REGISTER
  const handleRegister = async () => {
    try {
      const response = await registerUser(registerData);

      if (response.data.success) {
        alert("Registration successful");
        setIsRegister(false);
      }

      console.log(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="loginPage">
      {/* LEFT PANEL */}
      <div className="leftContainer">

        {/* LOGIN FORM */}
        <div className={`loginLeft ${isRegister ? "hideLogin" : ""}`}>
          <div className="logo-container">
            <img src={logo} className="logo" alt="logo" />
          </div>

          <h3>Log in to your account</h3>
          <p>Please enter your details</p>

          <input
            className="AuthInput"
            type="email"
            placeholder="Enter your email"
            onChange={(e) =>
              setLoginData({ ...loginData, email: e.target.value })
            }
          />

          <input
            className="AuthInput"
            type="password"
            placeholder="Password"
            onChange={(e) =>
              setLoginData({ ...loginData, password: e.target.value })
            }
          />

          <select
            className="AuthInput"
            onChange={(e) =>
              setLoginData({ ...loginData, role: e.target.value })
            }
          >
            <option value="">Select your Role</option>
            <option value="Receptionist">Receptionist</option>
            <option value="Doctor">Doctor</option>
            <option value="Admin">Admin</option>
          </select>

          <button className="loginBtn" onClick={handleLogin}>
            Log in
          </button>

          <div className="divider">OR</div>

          <p className="txt">Don't have an account ?</p>

          <button className="loginBtn" onClick={() => setIsRegister(true)}>
            Create account
          </button>
        </div>

        {/* REGISTER FORM */}
        <div className={`registerLeft ${isRegister ? "showRegister" : ""}`}>
          <div className="logo-container">
            <img src={logo} className="logo" alt="logo" />
          </div>

          <h3>Create your account</h3>
          <p>Please enter your details</p>

          <input
            className="AuthInput"
            placeholder="Full name"
            onChange={(e) =>
              setRegisterData({ ...registerData, name: e.target.value })
            }
          />

          <input
            className="AuthInput"
            type="email"
            placeholder="Email"
            onChange={(e) =>
              setRegisterData({ ...registerData, email: e.target.value })
            }
          />

          <input
            className="AuthInput"
            type="password"
            placeholder="Password"
            onChange={(e) =>
              setRegisterData({ ...registerData, password: e.target.value })
            }
          />

          <select
            className="AuthInput"
            onChange={(e) =>
              setRegisterData({ ...registerData, role: e.target.value })
            }
          >
            <option value="">Select your Role</option>
            <option value="Receptionist">Receptionist</option>
            <option value="Doctor">Doctor</option>
            <option value="Admin">Admin</option>
          </select>

          <button className="loginBtn" onClick={handleRegister}>
            Register
          </button>

          <div className="divider">OR</div>

          <p className="txt">Already have an account ?</p>

          <button className="loginBtn" onClick={() => setIsRegister(false)}>
            Login
          </button>
        </div>
      </div>

      {/* RIGHT IMAGE */}
      <div className="loginRight">
        <img src={coverImage} alt="dashboard" />
      </div>
    </div>
  );
}

export default AuthPage;