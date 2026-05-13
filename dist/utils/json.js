import { promises as fs } from "node:fs";
export function stringifyJson(value) {
    return `${JSON.stringify(value, null, 2)}\n`;
}
export async function readJsonFile(filePath) {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(stripBom(content));
}
export async function writeJsonFile(filePath, value) {
    await fs.writeFile(filePath, stringifyJson(value), "utf8");
}
export function encodeJsonl(value) {
    return `${JSON.stringify(value)}\n`;
}
export async function writeJsonlFile(filePath, values) {
    await fs.writeFile(filePath, values.map(encodeJsonl).join(""), "utf8");
}
export async function appendJsonlFile(filePath, value) {
    await fs.appendFile(filePath, encodeJsonl(value), "utf8");
}
export async function readJsonlFile(filePath) {
    const content = await fs.readFile(filePath, "utf8");
    return stripBom(content)
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0)
        .map((line) => JSON.parse(stripBom(line)));
}
function stripBom(value) {
    return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}
//# sourceMappingURL=json.js.map