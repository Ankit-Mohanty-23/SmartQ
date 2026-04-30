export default function Topbar() {
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="rq-topbar">
      <div className="rq-profile">
        
        {/* Profile Photo (initial-based) */}
        <div className="rq-avatar">
          {user?.name ? user.name.charAt(0).toUpperCase() : "R"}
        </div>

        {/* Name */}
        <span className="rq-name">
          {user?.name || "Receptionist"}
        </span>

        {/* Logout */}
        <button className="rq-logout-btn" onClick={handleLogout}>
          Logout
        </button>

      </div>
    </div>
  );
}