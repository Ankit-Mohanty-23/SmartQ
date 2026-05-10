import { useState } from "react";
import "./AuthPage.css";
import coverImage from "../../assets/smartQcover.png";
import logo from "../../assets/logo.png";
import { loginUser, registerUser } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";

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
    specialization: "",
    workStartTime: "",
    workEndTime: "",
    averageConsultationMinutes: "",
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
      const data = await loginUser(adminVerify);

      // STORE ADMIN TOKEN

      localStorage.setItem("token", data.token);

      localStorage.setItem("user", JSON.stringify(data.user));

      // SET TOKEN IMMEDIATELY

      API.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

      if (data.user.role === "ADMIN") {
        setShowAdminPopup(false);

        setIsRegister(true);
      } else {
        alert("Only Admin can verify");

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        delete API.defaults.headers.common["Authorization"];

        setShowAdminPopup(false);

        setIsRegister(false);
      }
    } catch (error) {
      console.log(error);

      alert("Invalid Admin Credentials");

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      delete API.defaults.headers.common["Authorization"];

      setShowAdminPopup(false);

      setIsRegister(false);
    }
  };
  // REGISTER

  const handleRegister = async () => {
    try {
      const payload = {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        role: registerData.role,
        specialization: registerData.specialization,

        workStartTime:
          registerData.workStartTime + " " + registerData.workStartPeriod,

        workEndTime:
          registerData.workEndTime + " " + registerData.workEndPeriod,

        averageConsultationMinutes:
          Number(registerData.averageConsultationMinutes) || 15,
      };

      const data = await registerUser(payload);

      console.log(data);

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
          </select>

          {/* DOCTOR ONLY FIELDS */}

          {registerData.role === "DOCTOR" && (
            <>
              <select
                className="AuthInput"
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    specialization: e.target.value,
                  })
                }
              >
                <option value="">Select Specialization</option>

                <option value="General Physician">General Physician</option>

                <option value="Cardiologist">Cardiologist</option>

                <option value="Dermatologist">Dermatologist</option>

                <option value="Neurologist">Neurologist</option>

                <option value="Orthopedic">Orthopedic</option>

                <option value="Pediatrician">Pediatrician</option>

                <option value="ENT Specialist">ENT Specialist</option>

                <option value="Gynecologist">Gynecologist</option>

                <option value="Psychiatrist">Psychiatrist</option>

                <option value="Dentist">Dentist</option>
              </select>

              <label className="timeLabel">Work Start Time</label>

              <div className="timeRow">
                <input
                  className="AuthInput"
                  type="time"
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      workStartTime: e.target.value,
                    })
                  }
                />

                <select
                  className="ampmSelect"
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      workStartPeriod: e.target.value,
                    })
                  }
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>

              <label className="timeLabel">Work End Time</label>

              <div className="timeRow">
                <input
                  className="AuthInput"
                  type="time"
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      workEndTime: e.target.value,
                    })
                  }
                />

                <select
                  className="ampmSelect"
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      workEndPeriod: e.target.value,
                    })
                  }
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>

              <input
                className="AuthInput"
                type="number"
                placeholder="Average Consultation Minutes (Optional)"
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    averageConsultationMinutes: e.target.value,
                  })
                }
              />
            </>
          )}

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
