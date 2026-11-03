import { describe, expect, it } from "vitest";
import { IMPORT_MAX_BYTES, ImportError, fileToDocument, markdownToHtml, textToHtml, titleFromFilename } from "../lib/import";

describe("file import", () => {
  it("turns plain text into paragraphs and escapes HTML", () => {
    expect(textToHtml("Hello <b>world</b>\nsecond line\n\nNew paragraph")).toBe(
      "<p>Hello &lt;b&gt;world&lt;/b&gt;<br>second line</p><p>New paragraph</p>",
    );
  });

  it("keeps Markdown structure: headings, emphasis and lists", () => {
    const html = markdownToHtml("# Plan\n\nSome **bold** and *italic* text.\n\n- one\n- two\n\n1. first\n2. second\n");
    expect(html).toContain("<h1>Plan</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toMatch(/<ul>\s*<li>one<\/li>/);
    expect(html).toMatch(/<ol>\s*<li>first<\/li>/);
  });

  it("does not pass raw HTML in Markdown through", () => {
    expect(markdownToHtml('<script>alert("x")</script>')).not.toContain("<script>");
  });

  it("names the document after the file", async () => {
    expect(titleFromFilename("q3_team-notes.md")).toBe("q3 team notes");
    const doc = await fileToDocument("notes.txt", Buffer.from("Hi"));
    expect(doc).toEqual({ title: "notes", html: "<p>Hi</p>" });
  });

  it("rejects unsupported, empty and oversized files with a clear message", async () => {
    await expect(fileToDocument("image.png", Buffer.from("x"))).rejects.toThrow(/Upload a \.txt, \.md or \.docx/);
    await expect(fileToDocument("empty.txt", Buffer.alloc(0))).rejects.toBeInstanceOf(ImportError);
    await expect(fileToDocument("big.txt", Buffer.alloc(IMPORT_MAX_BYTES + 1, 97))).rejects.toThrow(/2 MB/);
  });

  it("reports a corrupt .docx instead of crashing", async () => {
    await expect(fileToDocument("broken.docx", Buffer.from("not a zip"))).rejects.toThrow(/couldn't be read/);
  });
});
