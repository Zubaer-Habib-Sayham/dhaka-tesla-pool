// Run from backend: node --test src/services/driver-flow.test.js
// All writes use a temporary schema; application tables are never modified.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import pg from "pg";
import env from "../config/env.js";
import pool from "../config/database.js";
import app from "../app.js";

const schema = `dtp_driver_test_${process.pid}`;
const admin = new pg.Pool({ connectionString: env.databaseUrl });

await test("driver dashboard and signup API integration", async (t) => {
  let server;
  try {
    await admin.query(`CREATE SCHEMA ${schema}`);
    pool.options.options = `-c search_path=${schema}`;
    await pool.query(await readFile(new URL("../../../database/migrations/001_initial_schema.sql", import.meta.url), "utf8"));
    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const api = async (path, token, data) => {
      const response = await fetch(`${base}${path}`, {
        method: data === undefined ? "GET" : "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(data === undefined ? {} : { body: JSON.stringify(data) }),
      });
      return { status: response.status, body: await response.json() };
    };
    const fixture = async () => {
      await pool.query("TRUNCATE users, zones CASCADE");
      const zones = await pool.query(`INSERT INTO zones (name, latitude, longitude) VALUES ('Banani', 23.7937, 90.4066), ('Mohakhali', 23.7806, 90.4008), ('Gulshan 1', 23.7806, 90.4168) RETURNING id`);
      const signup = async (name, role = "PASSENGER") => {
        const result = await api("/auth/register", null, { name, role, email: `${name.toLowerCase()}@example.test`, password: "TestRide123!", ...(role === "DRIVER" ? { teslaName: name === "Jashim" ? "Bullet" : "Rocket", capacity: 3 } : {}) });
        assert.equal(result.status, 201);
        return result.body;
      };
      const driver = await signup("Jashim", "DRIVER");
      const nusrat = await signup("Nusrat");
      const rafiq = await signup("Rafiq");
      const shirin = await signup("Shirin");
      const request = async (passenger, seats = 1, shareRide = true) => {
        const result = await api("/rides", passenger.token, { pickupZoneId: Number(zones.rows[0].id), destinationZoneId: Number(zones.rows[1].id), requestedSeats: seats, shareRide, paymentMethod: "CASH" });
        assert.equal(result.status, 201);
        return result.body.ride;
      };
      const action = (ride, name, who = driver) => api(`/driver/rides/${ride.id}/${name}`, who.token, {});
      assert.equal((await api("/driver/online", driver.token, {})).status, 200);
      return { driver, nusrat, rafiq, shirin, request, action, zones, signup };
    };
    await t.test("both roles register; drivers receive a fixed-capacity rickshaw", async () => {
      const f = await fixture();
      const profile = await api("/driver/me", f.driver.token);
      assert.equal(profile.body.driver.tesla_name, "Bullet");
      assert.equal(profile.body.driver.capacity, 3);
      assert.equal(f.nusrat.user.role, "PASSENGER");
      const bad = await api("/auth/register", null, { name: "Broken", email: "broken@example.test", password: "TestRide123!", role: "DRIVER" });
      assert.equal(bad.status, 400);
      const duplicate = await api("/auth/register", null, { name: "Jashim", email: "jashim@example.test", password: "TestRide123!" });
      assert.equal(duplicate.status, 409);
      const login = await api("/auth/login", null, { email: "jashim@example.test", password: "TestRide123!" });
      assert.equal(login.body.user.role, "DRIVER");
    });
    await t.test("role and ownership checks reject unauthorized reads and updates", async () => {
      const f = await fixture();
      assert.equal((await api("/driver/rides", f.nusrat.token)).status, 403);
      assert.equal((await api("/rides", f.driver.token, {})).status, 403);
      assert.equal((await api("/driver/rides")).status, 401);
      const ride = await f.request(f.nusrat);
      assert.equal((await api(`/rides/${ride.id}`, f.rafiq.token)).status, 404);
      assert.equal((await api(`/rides/${ride.id}/cancel`, f.rafiq.token, {})).status, 404);
      await f.action(ride, "accept");
      const other = await f.signup("Karim", "DRIVER");
      await api("/driver/online", other.token, {});
      assert.equal((await f.action(ride, "arrive", other)).status, 404);
      assert.equal((await api("/driver/rides", other.token)).body.rides.length, 0);
      assert.equal((await api("/driver/rides/not-an-id/arrive", f.driver.token, {})).status, 400);
    });
    await t.test("two simultaneous claims for Bullet’s last seat cannot overbook", async () => {
      const f = await fixture();
      const first = await f.request(f.nusrat, 2);
      const rafiq = await f.request(f.rafiq);
      const shirin = await f.request(f.shirin);
      assert.equal((await f.action(first, "accept")).status, 200);
      const results = await Promise.all([f.action(rafiq, "accept"), f.action(shirin, "accept")]);
      assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
      const assigned = (await api("/driver/rides", f.driver.token)).body.rides;
      assert.equal(assigned.reduce((sum, r) => sum + r.requested_seats, 0), 3);
      assert.equal(new Set(assigned.map((r) => r.pool_id)).size, 1);
      assert.ok(assigned.every((r) => r.passenger_name && r.pickup_zone_name && r.destination_zone_name));
    });
    await t.test("status stages and history stay consistent under repeated clicks", async () => {
      const f = await fixture();
      const ride = await f.request(f.nusrat);
      await f.action(ride, "accept");
      assert.equal((await f.action(ride, "complete")).status, 409);
      assert.equal((await api("/driver/offline", f.driver.token, {})).status, 409);
      const arrivals = await Promise.all([f.action(ride, "arrive"), f.action(ride, "arrive")]);
      assert.deepEqual(arrivals.map((r) => r.status).sort(), [200, 409]);
      assert.equal((await f.action(ride, "start")).status, 200);
      assert.equal((await api(`/rides/${ride.id}/cancel`, f.nusrat.token, {})).status, 409);
      assert.equal((await f.action(ride, "complete")).status, 200);
      const detail = await api(`/rides/${ride.id}`, f.nusrat.token);
      assert.deepEqual(detail.body.history.map((h) => h.to_status), ["REQUESTED", "MATCHED", "DRIVER_ARRIVED", "STARTED", "COMPLETED"]);
      assert.equal(detail.body.ride.driver_name, "Jashim");
      assert.equal(detail.body.ride.pool_status, "COMPLETED");
      assert.equal((await api("/driver/offline", f.driver.token, {})).status, 200);
    });
    await t.test("cancelled members free seats and remain in driver history", async () => {
      const f = await fixture();
      const nusrat = await f.request(f.nusrat, 2);
      const rafiq = await f.request(f.rafiq);
      await f.action(nusrat, "accept"); await f.action(rafiq, "accept");
      assert.equal((await api(`/rides/${nusrat.id}/cancel`, f.nusrat.token, {})).status, 200);
      const shirin = await f.request(f.shirin, 2);
      assert.equal((await f.action(shirin, "accept")).status, 200);
      const assigned = (await api("/driver/rides", f.driver.token)).body.rides;
      assert.equal(assigned.length, 3);
      assert.equal(assigned.filter((r) => r.status !== "CANCELLED").reduce((sum, r) => sum + r.requested_seats, 0), 3);
      assert.equal((await api(`/rides/${rafiq.id}/cancel`, f.rafiq.token, {})).status, 200);
      assert.equal((await api(`/rides/${shirin.id}/cancel`, f.shirin.token, {})).status, 200);
      const next = await f.request(f.nusrat);
      assert.equal((await f.action(next, "accept")).status, 200);
    });
    await t.test("finished pools release the vehicle; private rides cannot share a pool", async () => {
      const f = await fixture();
      const first = await f.request(f.nusrat);
      await f.action(first, "accept"); await f.action(first, "arrive"); await f.action(first, "start"); await f.action(first, "complete");
      const next = await f.request(f.rafiq, 1, false);
      assert.equal((await f.action(next, "accept")).status, 200);
      const shirin = await f.request(f.shirin);
      assert.equal((await f.action(shirin, "accept")).status, 409);
      const rides = (await api("/driver/rides", f.driver.token)).body.rides;
      assert.equal(rides.length, 2);
      assert.notEqual(rides[0].pool_id, rides[1].pool_id);
    });
    await t.test("estimated and requested fares agree for shared and private rides", async () => {
      const f = await fixture();
      const route = { pickupZoneId: Number(f.zones.rows[0].id), destinationZoneId: Number(f.zones.rows[1].id), requestedSeats: 1 };
      const shared = await api("/rides/estimate", null, { ...route, shareRide: true });
      const privateFare = await api("/rides/estimate", null, { ...route, shareRide: false });
      assert.equal(shared.body.fare.poolDiscount, 20);
      assert.equal(privateFare.body.fare.poolDiscount, 0);
      const ride = await f.request(f.nusrat);
      assert.equal(ride.fare_amount, shared.body.fare.fareAmount);
    });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await pool.end();
    if (!/^dtp_driver_test_\d+$/.test(schema)) throw new Error("Invalid test schema");
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin.end();
  }
});
