import { useState } from "react";
import { loginPassenger, registerPassenger } from "./services/api";
import { getCurrentUser, isAuthenticated, saveAuth } from "./services/auth";
import PassengerDashboard from "./components/PassengerDashboard";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(getCurrentUser());

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = isLogin
        ? await loginPassenger({
            email,
            password,
          })
        : await registerPassenger({
            name,
            email,
            password,
          });

      saveAuth(result);
      setUser(result.user);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (user && isAuthenticated()) {
    return (
      <PassengerDashboard onLogout={handleLogout} onRequestRide={() => {}} />
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-heading">
          <p className="brand">Dhaka Tesla Pool</p>

          <h1>{isLogin ? "Welcome back." : "Start sharing your ride."}</h1>

          <p>Share a seat. Split the fare. Survive Dhaka traffic.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <label>
              Name
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Log in" : "Create account"}
          </button>
        </form>

        <button
          className="switch-auth"
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
          }}>
          {isLogin
            ? "Don't have an account? Create one"
            : "Already have an account? Log in"}
        </button>
      </section>
    </main>
  );
}

export default App;
