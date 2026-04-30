import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./BookingSuccess.css";
import { getBookingStatus } from "../../services/bookingStatusService";

export default function BookingSuccess() {
  const location = useLocation();
  const bookingId = location.state?.bookingId;

  const [data, setData] = useState(null);
  const [status, setStatus] = useState("PENDING");

  useEffect(() => {
    if (!bookingId) return;

    const interval = setInterval(async () => {
      try {
        const res = await getBookingStatus(bookingId);

        // expected:
        // { status, token, date, doctor }

        if (res.data.status === "CONFIRMED") {
          setData(res.data);
          setStatus("CONFIRMED");
          clearInterval(interval);
        }

        if (res.data.status === "FAILED") {
          setStatus("FAILED");
          clearInterval(interval);
        }

      } catch (err) {
        console.log(err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [bookingId]);

  return (
    <div className="smartq-success-page">
      <div className="smartq-success-card">

        {/* 🔄 PENDING */}
        {status === "PENDING" && (
          <>
            <div className="smartq-success-icon smartq-pending">⏳</div>

            <h1>Booking in Progress</h1>
            <p>Please wait while we confirm your appointment</p>

            <dotlottie-wc
              src="https://lottie.host/a2b96242-2ce7-474d-989f-3a48c3f76fb7/dUAbWwC4aa.lottie"
              style={{ width: "250px", height: "250px", margin: "0 auto" }}
              autoplay
              loop
            ></dotlottie-wc>

            <p style={{ fontSize: "12px", marginTop: "10px", color: "#888" }}>
              Booking ID: {bookingId || "N/A"}
            </p>
          </>
        )}

        {/* ✅ CONFIRMED */}
        {status === "CONFIRMED" && data && (
          <>
            <div className="smartq-success-icon smartq-confirmed">✅</div>
            <h1>Appointment Confirmed</h1>

            <div className="smartq-details">
              <p><span>Token</span> {data.token}</p>
              <p><span>Date</span> {data.date}</p>
              <p><span>Doctor</span> {data.doctor}</p>
            </div>

            <button
              className="smartq-btn"
              onClick={() => (window.location.href = "/")}
            >
              Back to Home
            </button>
          </>
        )}

        {/* ❌ FAILED */}
        {status === "FAILED" && (
          <>
            <div className="smartq-success-icon smartq-failed">❌</div>
            <h1>Could not book appointment</h1>
            <p>Please try again or contact hospital reception</p>

            <button
              className="smartq-btn retry"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </>
        )}
      </div>

      {/* SMS */}
      {status === "CONFIRMED" && (
        <div className="sms">
          <p>
            <i className="fas fa-sms icon"></i>
            <span>
              SMS confirmation will be sent to your registered mobile number
              once the receptionist confirms your slot.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}