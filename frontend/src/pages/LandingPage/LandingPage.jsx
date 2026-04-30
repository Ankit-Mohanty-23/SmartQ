import "./LandingPage.css";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import AuthPage from "../AuthPage/AuthPage";

export default function LandingPage() {
  return (
    <div className="landing-container">
      <nav className="navbar">
        <img src={logo} className="title"></img>
        <Link to="AuthPage">
          <button className="login-btn">Staff Login</button>
        </Link>
      </nav>

      <dotlottie-wc
        src="https://lottie.host/bd732b36-eb6a-4d42-b156-0d153ab6a2ce/nIEP2OaWWd.lottie"
        style={{ width: "350px", height: "350px" }}
        autoplay
        loop
      ></dotlottie-wc>

      <section className="hero">
        <h2>Skip the Waiting Room.</h2>
        <p>
          Join hospital queues remotely, track your live position, and get
          AI-powered wait time predictions with SmartQ.
        </p>
        <Link to="UserDashboard">
          <button className="join-btn">
            <i class="fa-regular fa-clock"></i>
            <span>Check Queue Status</span>
            <i class="fa-solid fa-angle-right"></i>
          </button>
        </Link>
        <Link to="PatientRegister">
          <button className="join-btn">
            <i class="fa-regular fa-calendar"></i>
            <span>Book Appointment</span>
            <i class="fa-solid fa-angle-right"></i>
            </button>
        </Link>
      </section>

      <section className="features">
        <h3>Why Choose SmartQ?</h3>

        <div className="feature-grid">
          <div className="card">
            <h4>Real-Time Tracking</h4>
            <p>Know exactly when your turn is coming.</p>
          </div>

          <div className="card">
            <h4>AI Wait-Time Prediction</h4>
            <p>Smart estimates powered by machine learning.</p>
          </div>

          <div className="card">
            <h4>Digital Queue System</h4>
            <p>No physical waiting. Everything online.</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        © 2026 SmartQ – AI Powered Hospital Queue System
      </footer>
    </div>
  );
}
