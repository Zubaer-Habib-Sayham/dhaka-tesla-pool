import { useState } from "react";
import { loginPassenger, registerPassenger, startDemo, isDemoMode, switchDemoRole } from "./services/api";
import { getCurrentUser, isAuthenticated, saveAuth, logout } from "./services/auth";
import PassengerDashboard from "./components/PassengerDashboard";
import RideRequest from "./components/RideRequest";
import RideDetails from "./components/RideDetails";
import DriverDashboard from "./components/DriverDashboard";
import RideProgress from "./components/RideProgress";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(getCurrentUser);
  const [role, setRole] = useState("PASSENGER");
  const [page, setPage] = useState("dashboard");
  const [createdRide, setCreatedRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setError(""); setLoading(true);
    try {
      const result = isLogin ? await loginPassenger(data) : await registerPassenger({ ...data, role });
      saveAuth(result); setUser(result.user); setPage("dashboard");
    } catch (error) { setError(error.message); } finally { setLoading(false); }
  };
  const handleLogout = () => { logout(); setUser(null); setPage("dashboard"); setCreatedRide(null); };
  const enterDemo = () => { const result = startDemo(); setUser(result.user); setPage("dashboard"); };
  if (user && isAuthenticated()) {
    return <>
      {isDemoMode() && <div className="demo-banner">
        <span><b>Test mode</b> · Sample rides, no real bookings</span>
        <div><button onClick={() => { const result = switchDemoRole(); setUser(result.user); setPage("dashboard"); setCreatedRide(null); }}>
          View as {user.role === "DRIVER" ? "passenger" : "driver"} ↗
        </button><button onClick={handleLogout}>Exit test</button></div>
      </div>}
      {user.role === "DRIVER" ? <DriverDashboard key={user.id} onLogout={handleLogout} />
        : page === "request" ? <RideRequest onBack={() => setPage("dashboard")} onRideCreated={(ride) => { setCreatedRide(ride); setPage("ride"); }} />
          : page === "ride" && createdRide ? <RideDetails rideId={createdRide.id} initialRide={createdRide} onBack={() => { setCreatedRide(null); setPage("dashboard"); }} />
            : <PassengerDashboard onLogout={handleLogout} onRequestRide={() => setPage("request")} onRideClick={(ride) => { setCreatedRide(ride); setPage("ride"); }} />}
    </>;
  }
  return <div className="entry-page">
    <header className="entry-header"><a className="brand" href="/"> <span className="brand-mark">dtp<span>↗</span></span> Dhaka Tesla Pool</a>
      <button className="secondary-button test-button" onClick={enterDemo}><span>▷</span> Test the app</button>
    </header>
    <main className="auth-layout">
      <section className="auth-story">
        <p className="eyebrow"><span className="live-dot" /> THREE WHEELS. ONE DHAKA.</p>
        <h1>Your city.<br />Your ride.<br /><em>A little more shared.</em></h1>
        <p className="story-copy">From Banani to wherever life takes you.<br />Hop into a rickshaw, share a seat, split the fare.</p>
        <RideProgress status="STARTED" pickup="Banani" destination="Mohakhali" decorative />
        <div className="story-foot"><span>01 / MADE FOR DHAKA</span><span>চলো, যাই ↗</span></div>
      </section>
      <section className="auth-card">
        <div className="auth-tabs" aria-label="Account access"><button className={isLogin ? "active" : ""} onClick={() => { setIsLogin(true); setError(""); }}>Log in</button><button className={!isLogin ? "active" : ""} onClick={() => { setIsLogin(false); setError(""); }}>Sign up</button></div>
        <div className="auth-heading"><p className="eyebrow">{isLogin ? "LET’S GET YOU MOVING" : "FIND YOUR PLACE ON THE ROAD"}</p><h2>{isLogin ? "Welcome back." : "Come along for the ride."}</h2><p>{isLogin ? "Your next ride is just around the corner." : "Choose how you want to join Dhaka Tesla Pool."}</p></div>
        {!isLogin && <div className="role-picker" role="group" aria-label="Sign up as">
          <button className={role === "PASSENGER" ? "selected" : ""} onClick={() => setRole("PASSENGER")} aria-pressed={role === "PASSENGER"}><span>↗</span><strong>Passenger</strong><small>Book & share rides</small></button>
          <button className={role === "DRIVER" ? "selected" : ""} onClick={() => setRole("DRIVER")} aria-pressed={role === "DRIVER"}><span>◎</span><strong>Driver</strong><small>Drive & earn</small></button>
        </div>}
        <form key={`${isLogin}-${role}`} onSubmit={handleSubmit} className="auth-form">
          {!isLogin && <label>Full name<input name="name" autoComplete="name" minLength={2} maxLength={100} placeholder="Your name" required /></label>}
          <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
          <label>Password<input name="password" type="password" autoComplete={isLogin ? "current-password" : "new-password"} minLength={isLogin ? 1 : 8} maxLength={100} placeholder={isLogin ? "Enter your password" : "At least 8 characters"} required /></label>
          {!isLogin && role === "DRIVER" && <div className="form-columns"><label>Rickshaw name<input name="teslaName" maxLength={100} placeholder="e.g. Bullet" required /></label><label>Seat capacity<select name="capacity" defaultValue="3"><option value="1">1 seat</option><option value="2">2 seats</option><option value="3">3 seats</option></select></label></div>}
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="primary-button" type="submit" disabled={loading}>{loading ? "Please wait…" : isLogin ? "Log in →" : `Create ${role.toLowerCase()} account →`}</button>
        </form>
        <p className="auth-note">{isLogin ? "One login for passengers and drivers." : role === "DRIVER" ? "Your driver account includes your rickshaw profile." : "Book a seat, share a ride, and follow your trip."}</p>
        <div className="auth-test"><span>Just looking around?</span><button className="text-button" onClick={enterDemo}>Try the test dashboard ↗</button></div>
      </section>
    </main>
    <footer className="entry-footer"><span>Share a seat. Split the fare.</span><span>DHAKA, BANGLADESH · ৳ BDT</span></footer>
  </div>;
}
export default App;
