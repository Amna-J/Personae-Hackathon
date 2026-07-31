import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from "lucide-react";
import axios from "axios";

const INITIAL_FORM = { name: "", email: "", password: "" };
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 64;

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [passwordError, setPasswordError] = useState("");
  const [isForgot, setIsForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");

  const navigate = useNavigate();

  const handleChange = ({ target }) => {
    setFormData((prev) => ({ ...prev, [target.name]: target.value }));
    if (target.name === "password") setPasswordError("");
  };

  const validatePassword = (pwd) => {
    if (pwd.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
    if (pwd.length > PASSWORD_MAX) return `Password must be no more than ${PASSWORD_MAX} characters.`;
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pwdErr = validatePassword(formData.password);
    if (pwdErr) { setPasswordError(pwdErr); return; }
    if (!isLogin) {
      try {
        const response = await axios.post("http://127.0.0.1:8000/api/users/register/", {
          username: formData.name, email: formData.email, password: formData.password,
        });
        localStorage.setItem("user_id", response.data.id);
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("email", response.data.email);
        navigate("/profile", { state: response.data });
      } catch (err) {
        if (err.response?.status === 400) alert(err.response.data.email?.[0] || "Something went wrong");
        else alert("Something went wrong.");
      }
    } else {
      try {
        const response = await axios.post("http://127.0.0.1:8000/api/users/login/", {
          email: formData.email, password: formData.password,
        });
        localStorage.setItem("user_id", response.data.id);
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("email", response.data.email);
        navigate("/profile", { state: response.data });
      } catch (err) {
        alert(err.response?.data?.detail || "Invalid credentials.");
      }
    }
  };

  const handleForgotReset = async () => {
    const pwdErr = validatePassword(newPassword);
    if (pwdErr) { setNewPasswordError(pwdErr); return; }
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/users/forgot-reset-password/",
        { email: forgotEmail, new_password: newPassword }
      );
      alert(response.data.message);
      setIsForgot(false); setForgotEmail(""); setNewPassword(""); setNewPasswordError("");
    } catch (err) {
      alert(err.response?.data?.email?.[0] || err.response?.data?.detail || "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── LEFT PANEL — always dark ── */}
      <aside className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-center px-16 auth-page-left">
        <div className="auth-orb-top" />
        <div className="auth-orb-bottom" />

        <span className="auth-deco-s">S</span>
        <span className="auth-deco-p">P</span>

        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm auth-back-link-dark">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="auth-deco-line" />
        <p className="text-xs font-bold uppercase mb-4 auth-deco-eyebrow">
          AI Fashion Stylist
        </p>
        <h1 className="auth-headline font-light leading-[1.1] mb-6">
          Discover Your<br />
          <em>Perfect Style</em>
        </h1>
        <p className="text-sm font-light leading-relaxed max-w-sm auth-tagline">
          Join thousands of users who have transformed their wardrobe with our AI-powered styling recommendations.
        </p>

        <div className="flex gap-6 mt-10">
          {[["10k+", "Users"], ["95%", "Accuracy"], ["6", "Features"]].map(([val, lbl]) => (
            <div key={lbl}>
              <p className="font-light auth-stat-value">{val}</p>
              <p className="text-xs auth-stat-label">{lbl}</p>
            </div>
          ))}
        </div>
      </aside>

      {/* ── RIGHT PANEL — light warm ── */}
      <main className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 auth-page-right">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-6 text-sm auth-back-link-light">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          {/* Header */}
          <div className="text-center mb-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 auth-eyebrow">
              {isLogin ? "Welcome Back" : "Get Started"}
            </p>
            <h2 className="auth-title font-light mb-2">
              {isLogin ? (isForgot ? "Reset Password" : "Sign In") : "Create Account"}
            </h2>
            <p className="text-m font-light auth-subtitle">
              {isLogin ? (isForgot ? "Enter your email and a new password" : "Sign in to access your personalized style") : "Start your style journey with us today"}
            </p>
            <div className="auth-header-divider" />
          </div>

          {/* Tab toggle */}
          <div className="light-side flex p-1 rounded-xl mb-7 auth-tab-bar">
            {["Sign In", "Sign Up"].map((label, idx) => {
              const active = isLogin === (idx === 0);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => { setIsLogin(idx === 0); setIsForgot(false); setPasswordError(""); }}
                  className={`flex-1 py-2.5 text-sm rounded-lg auth-tab-btn ${active ? "auth-tab-active" : "auth-tab-inactive"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Form */}
          <div className="light-side">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <InputField label="Full Name" name="name" icon={User} value={formData.name} onChange={handleChange} placeholder="Enter your name" side="light" />
              )}
              {(!isForgot || !isLogin) && (
                <InputField label="Email Address" name="email" icon={Mail} value={formData.email} onChange={handleChange} placeholder="Enter your email" type="email" side="light" />
              )}
              {(!isForgot || !isLogin) && (
                <div>
                  <InputField
                    label="Password" name="password" icon={Lock}
                    type={showPassword ? "text" : "password"}
                    value={formData.password} onChange={handleChange}
                    placeholder="Min 8 characters"
                    minLength={PASSWORD_MIN} maxLength={PASSWORD_MAX}
                    side="light"
                    rightIcon={
                      <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 auth-password-toggle">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                  {passwordError && <p className="text-xs mt-1 ml-1 auth-error-text">{passwordError}</p>}
                  {!isLogin && !passwordError && <p className="text-xs mt-1 ml-1 auth-hint-text">{PASSWORD_MIN}–{PASSWORD_MAX} characters</p>}
                </div>
              )}

              {isLogin && !isForgot && (
                <div className="flex justify-end">
                  <button type="button" className="text-xs font-medium auth-forgot-link" onClick={() => setIsForgot(true)}>
                    Forgot password?
                  </button>
                </div>
              )}

              {isLogin && isForgot && (
                <div className="space-y-4">
                  <InputField label="Email Address" name="forgotEmail" icon={Mail} value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="Enter your registered email" type="email" side="light" />
                  <div>
                    <InputField label="New Password" name="newPassword" icon={Lock} value={newPassword} onChange={e => { setNewPassword(e.target.value); setNewPasswordError(""); }} placeholder="Min 8 characters" type="password" minLength={PASSWORD_MIN} maxLength={PASSWORD_MAX} side="light" />
                    {newPasswordError && <p className="text-xs mt-1 ml-1 auth-error-text">{newPasswordError}</p>}
                    <p className="text-xs mt-1 ml-1 auth-hint-text">{PASSWORD_MIN}–{PASSWORD_MAX} characters</p>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <button type="button" className="text-xs auth-cancel-link" onClick={() => { setIsForgot(false); setNewPasswordError(""); }}>Cancel</button>
                    <button type="button" className="auth-reset-btn" onClick={handleForgotReset}>
                      Reset Password
                    </button>
                  </div>
                </div>
              )}

              {!isForgot && (
                <div className="pt-1">
                  <button type="submit" className="auth-submit-btn">
                    {isLogin ? "Sign In" : "Create Account"}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs mt-6 auth-footer-note">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="font-bold auth-footer-toggle"
              onClick={() => { setIsLogin(!isLogin); setIsForgot(false); setPasswordError(""); }}
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

const InputField = ({ label, name, value, onChange, icon: Icon, type = "text", placeholder, rightIcon, minLength, maxLength, side }) => (
  <div>
    <label className={`block text-xs font-semibold mb-1.5 ${side === "light" ? "auth-label" : "auth-label--dark"}`}>
      {label}
    </label>
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10 auth-input-icon" />
      <input
        type={type} name={name} value={value} onChange={onChange}
        className="auth-input auth-input-pr"
        placeholder={placeholder} minLength={minLength} maxLength={maxLength}
      />
      {rightIcon}
    </div>
  </div>
);

export default AuthPage;
