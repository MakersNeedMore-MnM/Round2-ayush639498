# Rashak — what changed from FloodGuard

## Product / UI
- Complete visual redesign: navy/white premium government aesthetic, dark and
  light mode, sharp rectangular corners, no glassmorphism/glow/blobs/AI icons.
- New India-map landing page with regional advisory markers, emergency CTA,
  and capability overview (SOS, shelters, evacuation, local mesh).
- Simple Resident/Admin role-selection entry (no passwords) replacing the old
  demo header trick.
- Rebuilt dashboard with the exact navigation you asked for: Overview, Live
  Map, Alerts, SOS, Shelters, Evacuation, Local Mesh, Incidents, Notifications,
  Settings — each with different content/permissions for Admin vs Resident.
- New Local Mesh Network feature: relay/gateway/shelter-hub nodes with signal,
  battery, coverage radius and connected-device counts, shown on a live map
  and in a status table. Backed by a new `MeshNode` model wired into the
  existing generic resource API.
- Multi-language selector kept and wired into the new Settings page (13
  languages already had infrastructure in the original codebase).

## Security (this was the priority)
- **Removed the biggest issue**: the old backend trusted an `X-Demo-Role`
  header sent by the client to decide the user's role. Authorization is now
  based only on a signed, httpOnly session cookie the server itself issues
  after role selection, or a verified JWT for real accounts. Nothing the
  client sends is trusted for role/identity.
- Admin entry requires a server-side `ADMIN_ACCESS_CODE` — it isn't just a
  UI toggle.
- Added: strict CORS allow-list with credentials, Helmet CSP, Mongo operator
  sanitization, HTTP parameter pollution protection, a custom recursive input
  sanitizer, double-submit-cookie CSRF protection on all state-changing
  requests, tiered rate limiting (tighter on `/auth` and SOS intake),
  structured audit logging on every non-GET request, and the previously open
  `/scraper/preview` diagnostic endpoint locked to authenticated admins only.
- `express-validator` checks on the resident SOS intake endpoint (the one
  write path reachable by an unprivileged role), with length and coordinate
  bounds.

## What I deliberately did not rebuild
- The backend's data models, ingestion services, and resource CRUD pattern
  were kept as-is per your instruction to avoid unnecessary rewrites — I
  extended them (new model, new routes) rather than replacing them.
- Full translation of all-new copy into all 13 languages wasn't done (would
  need a real translation pass); the language switcher and existing
  translation infrastructure are wired up and ready for that content.
- Real user accounts (email/password) still exist in the backend for future
  use but the primary flow is the simple role-based session your spec asked
  for.

## Before you deploy
- Set `JWT_SECRET` and `ADMIN_ACCESS_CODE` to real random values.
- Set `CLIENT_URL` to your deployed frontend origin(s) (comma-separated if
  more than one) — CORS and cookies depend on this being correct.
- Run `npm install` in both `backend/` and `frontend/` (node_modules were
  removed before packaging to keep the download small).


## Premium product redesign
- Reworked landing page, application shell, role-specific navigation, resident emergency overview, design tokens and reusable UI primitives.
- Preserved existing backend APIs, MongoDB models, Socket.IO refresh events, data ingestion/fallback paths, authentication and security middleware.
- Resident navigation now prioritizes Overview, Affected Areas, Flood Alerts, Evacuation, Shelters, Report Incident, Emergency SOS, Local Mesh and Settings.
- Administrator navigation exposes district-command operational views without exposing resident-only SOS navigation.

## UI + SOS update

- Kept the existing Rashak navy, blue, teal and emergency red visual language while moving shared panels, buttons, badges and navigation to a softer rounded operational card system.
- Redesigned the landing page to be shorter and more focused, with a compact India status map, live status cards, feature cards and an About section.
- Hardened mobile Leaflet stacking and sizing so the map stays behind the mobile sidebar and recalculates correctly after drawer, viewport or orientation changes.
- Added a prominent resident `I am in danger` SOS action. It captures live location, marks the report as critical, and sends a real time proximity alert to active Rashak users within 5 km who are sharing their live location.
- Nearby SOS notifications appear in the app immediately and can also use browser notifications when permission is available.
- Immediate SOS requires live coordinates so a nearby alert is not routed from a district center fallback.

## Operational flow update

Resident shelter view now supports location based sorting, direct Google Maps routing and direct shelter calling when a real contact is available.

Admin shelter view now supports live occupancy updates, capacity changes and shelter services including food, water, medical support and accessibility.

Resident evacuation now shows the assigned shelter route, evacuation progress and the distance and estimated arrival of an assigned response team. A resident can also request evacuation support with exact location.

Admin evacuation now separates operation creation from actual shelter occupancy. Teams can be assigned to an evacuation, response units become en route, movement progress can be recorded, shelter occupancy increases only when people are actually moved, and completed operations release the assigned teams.

Administration now includes dedicated Rescue Operations, Rescue Tracking, Road Network and Emergency Contacts pages. Page headers were simplified and landing feature cards were reduced to essential labels.


### Authentication deployment fix
The web client now uses bearer JWT authentication for role selection, REST API calls, and Socket.IO. This removes the cross site cookie and CSRF dependency between a Vercel frontend and Render backend. The role endpoint returns a signed token, the frontend stores it locally for the current session, and Socket.IO authenticates with the same token.
