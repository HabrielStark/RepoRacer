const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "generated");

function run(command, args, cwd = root) {
  execFileSync(command, args, { cwd, stdio: "inherit" });
}

function write(filePath, content) {
  const target = path.join(root, filePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
}

function commit(message) {
  run("git", ["add", "."]);
  run("git", ["commit", "-m", message]);
}

fs.rmSync(root, { recursive: true, force: true });
fs.mkdirSync(root, { recursive: true });
run("git", ["init"]);
run("git", ["config", "user.email", "demo@example.com"]);
run("git", ["config", "user.name", "RepoRacer Demo"]);
run("git", ["config", "core.autocrlf", "false"]);

write(".gitattributes", "* text=auto eol=lf\n");

write(
  "package.json",
  JSON.stringify(
    {
      name: "buggy-todo-app",
      version: "1.0.0",
      private: true,
      type: "module",
      scripts: {
        test: "node test/todos.test.cjs"
      }
    },
    null,
    2
  ) + "\n"
);
write(
  "src/todos.js",
  `export function createTodo(title) {
  return { id: String(Date.now()), title, done: false };
}

export function toggleTodo(todo) {
  todo.done = !todo.done;
  return todo;
}

export function filterTodos(todos, mode) {
  if (mode === "done") return todos.filter((todo) => todo.done);
  if (mode === "open") return todos.filter((todo) => !todo.done);
  return todos;
}

export function serializeTodos(todos) {
  return JSON.stringify(todos);
}
`
);
write(
  "test/todos.test.cjs",
  `const assert = require("node:assert");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

(async () => {
  const todos = await import(pathToFileURL(path.join(__dirname, "..", "src", "todos.js")));
  const todo = todos.createTodo("ship RepoRacer");
  assert.equal(todo.title, "ship RepoRacer");
  assert.equal(todo.done, false);
  assert.equal(todos.toggleTodo(todo).done, true);
})();
`
);
commit("chore: initial todo app with basic model");

const fixes = [
  {
    message: "fix: trim todo titles before storing",
    test: `  assert.equal(todos.createTodo("  ship RepoRacer  ").title, "ship RepoRacer");`,
    source: (text) =>
      text.replace(
        "return { id: String(Date.now()), title, done: false };",
        "return { id: String(Date.now()), title: title.trim(), done: false };"
      )
  },
  {
    message: "fix: reject empty todo titles",
    test: `  assert.throws(() => todos.createTodo("   "), /title is required/);`,
    source: (text) =>
      text.replace(
        "return { id: String(Date.now()), title: title.trim(), done: false };",
        'const normalizedTitle = title.trim();\n  if (normalizedTitle.length === 0) throw new Error("title is required");\n  return { id: String(Date.now()), title: normalizedTitle, done: false };'
      )
  },
  {
    message: "fix: make toggle immutable",
    test: `  const original = todos.createTodo("immutable");\n  const toggled = todos.toggleTodo(original);\n  assert.notEqual(original, toggled);\n  assert.equal(original.done, false);\n  assert.equal(toggled.done, true);`,
    source: (text) => text.replace("todo.done = !todo.done;\n  return todo;", "return { ...todo, done: !todo.done };")
  },
  {
    message: "fix: support case-insensitive filters",
    test: `  assert.equal(todos.filterTodos([toggled], "DONE").length, 1);`,
    source: (text) =>
      text
        .replace(
          'if (mode === "done")',
          'const normalizedMode = String(mode).toLowerCase();\n  if (normalizedMode === "done")'
        )
        .replace('if (mode === "open")', 'if (normalizedMode === "open")')
  },
  {
    message: "fix: sort serialized todos by title",
    test: `  assert.deepEqual(JSON.parse(todos.serializeTodos([todos.createTodo("b"), todos.createTodo("a")])).map((item) => item.title), ["a", "b"]);`,
    source: (text) =>
      text.replace(
        "return JSON.stringify(todos);",
        "return JSON.stringify([...todos].sort((left, right) => left.title.localeCompare(right.title)));"
      )
  },
  {
    message: "fix: preserve createdAt timestamps",
    test: `  assert.equal(typeof todos.createTodo("dated").createdAt, "string");`,
    source: (text) => text.replace("done: false };", "done: false, createdAt: new Date().toISOString() };")
  },
  {
    message: "fix: add completed count helper",
    test: `  assert.equal(todos.countDone([todo, toggled]), 1);`,
    source: (text) =>
      `${text}\nexport function countDone(todos) {\n  return todos.filter((todo) => todo.done).length;\n}\n`
  },
  {
    message: "fix: avoid duplicate todo titles",
    test: `  assert.deepEqual(todos.dedupeTodos([todos.createTodo("x"), todos.createTodo("x")]).map((item) => item.title), ["x"]);`,
    source: (text) =>
      `${text}\nexport function dedupeTodos(todos) {\n  const seen = new Set();\n  return todos.filter((todo) => {\n    if (seen.has(todo.title)) return false;\n    seen.add(todo.title);\n    return true;\n  });\n}\n`
  },
  {
    message: "fix: parse serialized todos safely",
    test: `  assert.deepEqual(todos.parseTodos("not json"), []);`,
    source: (text) =>
      `${text}\nexport function parseTodos(value) {\n  try {\n    const parsed = JSON.parse(value);\n    return Array.isArray(parsed) ? parsed : [];\n  } catch {\n    return [];\n  }\n}\n`
  },
  {
    message: "fix: expose todo summary",
    test: `  assert.deepEqual(todos.todoSummary([todo, toggled]), { total: 2, done: 1, open: 1 });`,
    source: (text) =>
      `${text}\nexport function todoSummary(todos) {\n  const done = countDone(todos);\n  return { total: todos.length, done, open: todos.length - done };\n}\n`
  }
];

for (const fix of fixes) {
  const testPath = path.join(root, "test", "todos.test.cjs");
  const currentTest = fs.readFileSync(testPath, "utf8");
  fs.writeFileSync(testPath, currentTest.replace("})();", `${fix.test}\n})();`), "utf8");
  const sourcePath = path.join(root, "src", "todos.js");
  fs.writeFileSync(sourcePath, fix.source(fs.readFileSync(sourcePath, "utf8")), "utf8");
  commit(fix.message);
}

console.log(`Created demo repository at ${root}`);
