"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { canEdit, roleLabel, type Role } from "../lib/access";
import type { Share, User } from "../lib/repo";
import SharePanel from "./SharePanel";

type SaveState = "saved" | "unsaved" | "saving" | "error";
const AUTOSAVE_MS = 800;

type Props = {
  docId: string;
  initialTitle: string;
  initialContent: string;
  ownerName: string;
  role: Role;
  initialShares: Share[];
  people: User[];
};

export default function DocumentEditor({ docId, initialTitle, initialContent, ownerName, role, initialShares, people }: Props) {
  const editable = canEdit(role);
  const [title, setTitle] = useState(initialTitle);
  const savedTitle = useRef(initialTitle);
  const [titleError, setTitleError] = useState("");
  const [state, setState] = useState<SaveState>("saved");
  const [saveError, setSaveError] = useState("");
  const pending = useRef<string | null>(null);
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const patch = useCallback(
    (body: object, keepalive = false) =>
      fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive,
      }),
    [docId],
  );

  // Saves the latest content; edits made while a save is running are picked up by the next pass.
  const flush = useCallback(async () => {
    if (inFlight.current || pending.current === null) return;
    const html = pending.current;
    pending.current = null;
    inFlight.current = true;
    setState("saving");
    try {
      const res = await patch({ content: html });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Save failed");
      setSaveError("");
      setState(pending.current === null ? "saved" : "unsaved");
    } catch (e) {
      pending.current = pending.current ?? html;
      setSaveError(e instanceof Error ? e.message : "Save failed");
      setState("error");
    } finally {
      inFlight.current = false;
      if (pending.current !== null) timer.current = setTimeout(flush, AUTOSAVE_MS);
    }
  }, [patch]);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: initialContent || "<p></p>",
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      pending.current = editor.getHTML();
      setState("unsaved");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, AUTOSAVE_MS);
    },
  });

  // Warn before leaving with unsaved work, and push any last edit when the page goes away.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (pending.current !== null || inFlight.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      if (timer.current) clearTimeout(timer.current);
      if (pending.current !== null) patch({ content: pending.current }, true).catch(() => undefined);
    };
  }, [patch]);

  async function saveTitle() {
    const next = title.trim();
    if (next === savedTitle.current) return setTitleError("");
    if (!next) {
      setTitle(savedTitle.current);
      return setTitleError("Title can't be empty, so it was restored.");
    }
    try {
      const res = await patch({ title: next });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Couldn't rename");
      savedTitle.current = next;
      setTitle(next);
      setTitleError("");
    } catch (e) {
      setTitleError(e instanceof Error ? e.message : "Couldn't rename");
    }
  }

  const stateLabel = { saved: "All changes saved", unsaved: "Unsaved changes…", saving: "Saving…", error: "Not saved" }[state];

  return (
    <div className={role === "owner" ? "layout" : undefined}>
      <div>
        <div className="editor-head">
          <input
            className="title-input"
            aria-label="Document title"
            value={title}
            maxLength={120}
            disabled={!editable}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          />
          <span className={role === "viewer" ? "badge view" : "badge"}>{roleLabel(role)}</span>
          {editable && <span className={`save-state ${state}`} aria-live="polite">{stateLabel}</span>}
        </div>
        {titleError && <p className="error" role="alert">{titleError}</p>}
        {state === "error" && (
          <p className="error" role="alert">
            {saveError}.{" "}
            <button type="button" onClick={() => { if (pending.current !== null) flush(); }}>Retry</button>
          </p>
        )}
        {!editable && <div className="banner">You have view-only access. {ownerName} owns this document.</div>}
        {role === "editor" && <p className="hint" style={{ marginTop: 0 }}>Shared with you by {ownerName}. You can edit.</p>}

        {editable && editor && <Toolbar editor={editor} />}
        <div className={editable ? "doc-surface" : "doc-surface readonly"}>
          <EditorContent editor={editor} />
        </div>
      </div>
      {role === "owner" && <SharePanel docId={docId} initialShares={initialShares} people={people} />}
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const btn = (label: React.ReactNode, title: string, active: boolean, run: () => void) => (
    <button type="button" className={active ? "on" : undefined} title={title} aria-label={title} aria-pressed={active} onClick={run}>
      {label}
    </button>
  );
  const chain = () => editor.chain().focus();
  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      {btn(<strong>B</strong>, "Bold (Ctrl+B)", editor.isActive("bold"), () => chain().toggleBold().run())}
      {btn(<em>I</em>, "Italic (Ctrl+I)", editor.isActive("italic"), () => chain().toggleItalic().run())}
      {btn(<u>U</u>, "Underline (Ctrl+U)", editor.isActive("underline"), () => chain().toggleUnderline().run())}
      <span className="sep" />
      {btn("¶", "Normal text", editor.isActive("paragraph"), () => chain().setParagraph().run())}
      {btn("H1", "Heading 1", editor.isActive("heading", { level: 1 }), () => chain().toggleHeading({ level: 1 }).run())}
      {btn("H2", "Heading 2", editor.isActive("heading", { level: 2 }), () => chain().toggleHeading({ level: 2 }).run())}
      {btn("H3", "Heading 3", editor.isActive("heading", { level: 3 }), () => chain().toggleHeading({ level: 3 }).run())}
      <span className="sep" />
      {btn("• List", "Bulleted list", editor.isActive("bulletList"), () => chain().toggleBulletList().run())}
      {btn("1. List", "Numbered list", editor.isActive("orderedList"), () => chain().toggleOrderedList().run())}
      {btn("❝", "Quote", editor.isActive("blockquote"), () => chain().toggleBlockquote().run())}
      <span className="sep" />
      {btn("↶", "Undo (Ctrl+Z)", false, () => chain().undo().run())}
      {btn("↷", "Redo (Ctrl+Y)", false, () => chain().redo().run())}
    </div>
  );
}
