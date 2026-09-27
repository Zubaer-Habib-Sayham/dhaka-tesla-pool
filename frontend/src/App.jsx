import { useState } from "react";
import { loginPassenger, registerPassenger } from "./services/api";
import { getCurrentUser, isAuthenticated, saveAuth } from "./services/auth";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(getCurrentUser());
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

  if (user && isAuthenticated()) {
    return (
      <main>
        <h1>Dhaka Tesla Pool</h1>
        <p>Welcome, {user.name}.</p>
        <p>Role: {user.role}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Dhaka Tesla Pool</h1>
      <p>Share a seat. Split the fare. Survive Dhaka traffic.</p>

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && <p>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : isLogin ? "Log in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setIsLogin(!isLogin);
          setError("");
        }}>
        {isLogin
          ? "Create a passenger account"
          : "Already have an account? Log in"}
      </button>
    </main>
  );
}

export default App;
