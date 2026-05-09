import { useState } from "react";
import "./AuthPage.css";
import coverImage from "../../assets/smartQcover.png";
import logo from "../../assets/logo.png";
import { loginUser, registerUser } from "../../services/authService";
import { useNavigate } from "react-router-dom";

function AuthPage() {
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);

  const [showAdminPopup, setShowAdminPopup] = useState(false);

  const [adminVerify, setAdminVerify] = useState({
    email: "",
    password: "",
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  // LOGIN
  const handleLogin = async () => {
    try {
      const data = await loginUser(loginData);

      console.log("Login Response:", data);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "DOCTOR") {
        navigate("/doctor");
      } else if (data.user.role === "RECEPTIONIST") {
        navigate("/receptionist");
      } else if (data.user.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.log(error);
      alert("Invalid Login");
    }
  };

  // ADMIN VERIFY
  const handleAdminVerify = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/v1/auth/admin-verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(adminVerify),
        },
      );

      const data = await response.json();

      if (data.success) {
        setShowAdminPopup(false);
        setIsRegister(true);
      } else {
        alert("Invalid Admin Credentials");

        setShowAdminPopup(false);
        setIsRegister(false);
      }
    } catch (error) {
      console.log(error);
      alert("Server Error");
    }
  };

  // REGISTER
  const handleRegister = async () => {
    try {
      const data = await registerUser(registerData);

      console.log("Register Response:", data);

      alert("Registration Successful");
      setIsRegister(false);
    } catch (error) {
      console.log(error);
      alert("Registration Failed");
    }
  };

  return (
    <div className="loginPage">
      <div className="leftContainer">
        {/* LOGIN */}
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
              setLoginData({
                ...loginData,
                email: e.target.value,
              })
            }
          />

          <input
            className="AuthInput"
            type="password"
            placeholder="Password"
            onChange={(e) =>
              setLoginData({
                ...loginData,
                password: e.target.value,
              })
            }
          />


          <button className="loginBtn" onClick={handleLogin}>
            Log in
          </button>

          <div className="divider">OR</div>

          <p className="txt">Don't have an account ?</p>

          <button className="loginBtn" onClick={() => setShowAdminPopup(true)}>
            Create account
          </button>
        </div>

        {/* REGISTER */}
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
              setRegisterData({
                ...registerData,
                name: e.target.value,
              })
            }
          />

          <input
            className="AuthInput"
            type="email"
            placeholder="Email"
            onChange={(e) =>
              setRegisterData({
                ...registerData,
                email: e.target.value,
              })
            }
          />

          <input
            className="AuthInput"
            type="password"
            placeholder="Password"
            onChange={(e) =>
              setRegisterData({
                ...registerData,
                password: e.target.value,
              })
            }
          />

          <select
            className="AuthInput"
            onChange={(e) =>
              setRegisterData({
                ...registerData,
                role: e.target.value,
              })
            }
          >
            <option value="">Select your Role</option>
            <option value="RECEPTIONIST">Receptionist</option>
            <option value="DOCTOR">Doctor</option>
            <option value="ADMIN">Admin</option>
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

        {/* ADMIN POPUP */}

        {showAdminPopup && (
          <div className="popupOverlay">
            <div className="adminPopup">
              <h2>Admin Verification</h2>

              <p>Verify admin credentials to continue</p>

              <input
                type="email"
                placeholder="Admin Email"
                className="AuthInput"
                onChange={(e) =>
                  setAdminVerify({
                    ...adminVerify,
                    email: e.target.value,
                  })
                }
              />

              <input
                type="password"
                placeholder="Admin Password"
                className="AuthInput"
                onChange={(e) =>
                  setAdminVerify({
                    ...adminVerify,
                    password: e.target.value,
                  })
                }
              />

              <div className="popupBtns">
                <button className="verifyBtn" onClick={handleAdminVerify}>
                  Verify
                </button>

                <button
                  className="cancelBtn"
                  onClick={() => setShowAdminPopup(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT IMAGE */}
      <div className="loginRight">
        <img src={coverImage} alt="dashboard" />
      </div>
    </div>
  );
}

export default AuthPage;
