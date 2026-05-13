export const reportStyles = `
:root {
  color-scheme: light;
  --bg: #f8fafc;
  --panel: #ffffff;
  --ink: #0f172a;
  --muted: #64748b;
  --line: #d9e2ec;
  --blue: #1769e0;
  --blue-dark: #0f3f8f;
  --green: #18794e;
  --yellow: #a16207;
  --red: #b42318;
  --shadow: 0 18px 50px rgba(15, 23, 42, 0.12);
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
header {
  background: #08111f;
  color: #ffffff;
  padding: 44px 32px 36px;
}
.wrap {
  max-width: 1180px;
  margin: 0 auto;
}
.eyebrow {
  color: #9ec5ff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}
h1 {
  margin: 6px 0 8px;
  font-size: 40px;
  line-height: 1.08;
  letter-spacing: 0;
}
h2 {
  margin: 34px 0 14px;
  font-size: 22px;
  letter-spacing: 0;
}
.subtitle {
  color: #dbeafe;
  max-width: 760px;
  font-size: 16px;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}
.pill {
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  padding: 6px 10px;
  color: #e0f2fe;
}
main {
  padding: 26px 32px 56px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px;
}
.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
  padding: 16px;
}
.metric {
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 700;
}
.value {
  font-size: 28px;
  font-weight: 800;
  margin-top: 4px;
}
table {
  width: 100%;
  border-collapse: collapse;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}
th, td {
  padding: 11px 12px;
  border-bottom: 1px solid var(--line);
  text-align: left;
  vertical-align: top;
}
th {
  background: #edf4ff;
  color: var(--blue-dark);
  font-size: 12px;
  text-transform: uppercase;
}
tr:last-child td {
  border-bottom: 0;
}
.status {
  display: inline-flex;
  border-radius: 999px;
  padding: 3px 8px;
  font-weight: 700;
  font-size: 12px;
}
.status.completed {
  background: #dcfce7;
  color: var(--green);
}
.status.test_failed,
.status.agent_failed,
.status.timed_out,
.status.internal_error,
.status.risk_blocked {
  background: #fee2e2;
  color: var(--red);
}
.status.no_changes {
  background: #fef3c7;
  color: var(--yellow);
}
details {
  margin-top: 10px;
}
summary {
  cursor: pointer;
  color: var(--blue);
  font-weight: 700;
}
pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: #0b1220;
  color: #e5edf7;
  border-radius: 8px;
  padding: 14px;
  max-height: 420px;
  overflow: auto;
}
.risk {
  margin: 4px 0;
}
.muted {
  color: var(--muted);
}
@media (max-width: 760px) {
  header, main {
    padding-left: 18px;
    padding-right: 18px;
  }
  h1 {
    font-size: 32px;
  }
  table {
    display: block;
    overflow-x: auto;
  }
}
`;
//# sourceMappingURL=styles.js.map