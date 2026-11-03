// Turns an uploaded .txt, .md or .docx file into HTML the editor can open as a new document.
import mammoth from "mammoth";
import { Marked } from "marked";
import { TITLE_MAX } from "./validation";

export const IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx"] as const;

export class ImportError extends Error {}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Blank lines separate paragraphs; single line breaks inside a paragraph are kept. */
export function textToHtml(text: string): string {
  const paragraphs = text
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return "<p></p>";
  return paragraphs.map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("");
}

// Raw HTML inside Markdown is shown as text, never passed through.
const markdown = new Marked({ async: false, gfm: true });
markdown.use({ renderer: { html: (token) => escapeHtml(token.text) } });

export function markdownToHtml(source: string): string {
  return markdown.parse(source) as string;
}

export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

export function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return (base || "Imported document").slice(0, TITLE_MAX);
}

export async function fileToDocument(filename: string, bytes: Buffer): Promise<{ title: string; html: string }> {
  const ext = extensionOf(filename);
  if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new ImportError("Unsupported file type. Upload a .txt, .md or .docx file.");
  }
  if (bytes.length === 0) throw new ImportError("The file is empty.");
  if (bytes.length > IMPORT_MAX_BYTES) throw new ImportError("The file is larger than 2 MB.");

  const title = titleFromFilename(filename);
  if (ext === ".txt") return { title, html: textToHtml(bytes.toString("utf8")) };
  if (ext === ".md") return { title, html: markdownToHtml(bytes.toString("utf8")) };

  try {
    const { value } = await mammoth.convertToHtml({ buffer: bytes });
    return { title, html: value || "<p></p>" };
  } catch {
    throw new ImportError("This .docx file couldn't be read. Is it a valid Word document?");
  }
}
