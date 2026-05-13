import { promises as fs } from "node:fs";

export function stringifyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(stripBom(content)) as T;
}

export async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await fs.writeFile(filePath, stringifyJson(value), "utf8");
}

export function encodeJsonl(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}

export async function writeJsonlFile(filePath: string, values: readonly unknown[]): Promise<void> {
  await fs.writeFile(filePath, values.map(encodeJsonl).join(""), "utf8");
}

export async function appendJsonlFile(filePath: string, value: unknown): Promise<void> {
  await fs.appendFile(filePath, encodeJsonl(value), "utf8");
}

export async function readJsonlFile<T>(filePath: string): Promise<T[]> {
  const content = await fs.readFile(filePath, "utf8");
  return stripBom(content)
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(stripBom(line)) as T);
}

function stripBom(value: string): string {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}
