import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";

const Navbar = () => {
  const navigate    = useNavigate();
  const userId      = localStorage.getItem("user_id");
  const username    = localStorage.getItem("username");

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    navigate("/");
    window.location.reload();
  };

  const avatarLetter = username ? username.charAt(0).toUpperCase() : "U";

  return (
    <div className="navbar fixed top-0 z-50 px-4 h-20 navbar-root">
      {/* Left: mobile menu + logo */}
      <div className="flex-none flex items-center">
        <div className="dropdown lg:hidden">
          <label tabIndex={0} className="btn btn-ghost navbar-ghost-btn">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content mt-3 p-2 rounded-box w-52 navbar-dropdown-menu"
          >
            {[["Home", "/"], ["Analysis", "/AnalyzePage"], ["Unveil", "/style-dna"], ["AI Chat", "/AIchat"], ["Blogs", "/Blogs"]].map(([label, path]) => (
              <li key={path}>
                <Link to={path} className="block px-3 py-2 rounded-lg text-sm navbar-link">
                  {label}
                </Link>
              </li>
            ))}
            {userId ? (
              <li className="mt-3 flex flex-col gap-2">
                <Link to="/profile" className="btn btn-outline btn-sm w-full navbar-btn-outline">My Profile</Link>
                <button onClick={handleLogout} className="btn btn-sm w-full navbar-btn-terracotta">
                  Logout
                </button>
              </li>
            ) : (
              <li className="mt-3 flex flex-col gap-2">
                <Link to="/auth" className="btn btn-outline btn-sm w-full navbar-btn-outline">Sign In</Link>
                <Link to="/AnalyzePage" className="btn btn-sm w-full navbar-btn-terracotta">
                  Get Started
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div className="flex-1 flex justify-center lg:justify-start">
          <Link to="/" className="flex items-center mt-38">
            <img src={logo} alt="Personae Logo" className="h-73 w-auto object-contain" />
          </Link>
        </div>
      </div>

      {/* Center nav links */}
      <div className="flex-1 hidden lg:flex justify-center space-x-8">
        {[["Home", "/"], ["Analysis", "/AnalyzePage"], ["Unveil", "/style-dna"], ["AI Chat", "/AIchat"], ["Blogs", "/Blogs"]].map(([label, path]) => (
          <Link
            key={path}
            to={path}
            className="font-medium text-sm navbar-link"
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div className="flex-none hidden lg:flex gap-4 mr-8 items-center">
        {userId ? (
          <>
            <Link to="/AnalyzePage" className="btn btn-sm py-5 px-7 font-medium navbar-cta-btn">
              Get Started
            </Link>
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="cursor-pointer flex items-center gap-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm navbar-avatar">
                  {avatarLetter}
                </div>
              </label>
              <ul tabIndex={0} className="dropdown-content mt-3 p-2 rounded-xl w-48 navbar-dropdown-menu">
                <li>
                  <Link to="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm navbar-dropdown-item">
                    👤 My Profile
                  </Link>
                </li>
                <li className="mt-1 border-t pt-1 navbar-dropdown-divider">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm navbar-logout-btn"
                  >
                    🚪 Logout
                  </button>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <Link to="/auth" className="mt-2 text-base font-medium navbar-signin-link">
              Sign In
            </Link>
            <Link to="/AnalyzePage" className="btn btn-sm py-5 px-7 font-medium navbar-cta-btn">
              Get Started
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;
