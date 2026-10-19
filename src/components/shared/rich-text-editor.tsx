"use client";

import { useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Undo2,
  Redo2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RICH_TEXT_CLASSES } from "@/components/shared/rich-text-classes";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
  id?: string;
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none",
        active && "bg-primary-50 text-primary-700",
      )}
    >
      {children}
    </button>
  );
}

function normalizeUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return "";
  if (/^(https?:\/\/|mailto:)/i.test(url)) return url;
  return `https://${url}`;
}

function LinkForm({ editor, onDone }: { editor: Editor; onDone: () => void }) {
  const [url, setUrl] = useState<string>(editor.getAttributes("link").href ?? "");

  function apply() {
    const href = normalizeUrl(url);
    const chain = editor.chain().focus().extendMarkRange("link");
    if (href) chain.setLink({ href }).run();
    else chain.unsetLink().run();
    onDone();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-2 py-2">
      <Input
        autoFocus
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            apply();
          }
          if (e.key === "Escape") onDone();
        }}
        placeholder="https://..."
        className="h-9 flex-1 min-w-[160px]"
      />
      <Button type="button" size="sm" onClick={apply}>
        Simpan
      </Button>
      {editor.isActive("link") && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            onDone();
          }}
        >
          Hapus link
        </Button>
      )}
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  maxLength,
  id,
}: RichTextEditorProps) {
  const [showLinkForm, setShowLinkForm] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto"],
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class: `${RICH_TEXT_CLASSES} min-h-[140px] px-4 py-3 outline-none`,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            underline: editor.isActive("underline"),
            h2: editor.isActive("heading", { level: 2 }),
            h3: editor.isActive("heading", { level: 3 }),
            bulletList: editor.isActive("bulletList"),
            orderedList: editor.isActive("orderedList"),
            blockquote: editor.isActive("blockquote"),
            link: editor.isActive("link"),
            canUndo: editor.can().undo(),
            canRedo: editor.can().redo(),
            isEmpty: editor.isEmpty,
            charCount: editor.getText().length,
          }
        : null,
  });

  const overLimit = maxLength != null && (state?.charCount ?? 0) > maxLength;

  return (
    <div>
      <div
        className={cn(
          "overflow-hidden rounded-lg border border-border bg-white transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring",
          overLimit && "border-error",
        )}
      >
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-1.5 py-1">
          <ToolbarButton label="Tebal" active={state?.bold} disabled={!editor} onClick={() => editor?.chain().focus().toggleBold().run()}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Miring" active={state?.italic} disabled={!editor} onClick={() => editor?.chain().focus().toggleItalic().run()}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Garis bawah" active={state?.underline} disabled={!editor} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
            <Underline className="h-4 w-4" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <ToolbarButton label="Judul" active={state?.h2} disabled={!editor} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Sub judul" active={state?.h3} disabled={!editor} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Daftar poin" active={state?.bulletList} disabled={!editor} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Daftar nomor" active={state?.orderedList} disabled={!editor} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Kutipan" active={state?.blockquote} disabled={!editor} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Link" active={state?.link || showLinkForm} disabled={!editor} onClick={() => setShowLinkForm((v) => !v)}>
            <Link2 className="h-4 w-4" />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <ToolbarButton label="Urungkan" disabled={!state?.canUndo} onClick={() => editor?.chain().focus().undo().run()}>
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Ulangi" disabled={!state?.canRedo} onClick={() => editor?.chain().focus().redo().run()}>
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {editor && showLinkForm && (
          <LinkForm editor={editor} onDone={() => setShowLinkForm(false)} />
        )}

        <div className="relative">
          {(state?.isEmpty ?? !value) && placeholder && (
            <p className="pointer-events-none absolute left-4 top-3 text-sm text-muted-foreground">
              {placeholder}
            </p>
          )}
          <EditorContent editor={editor} />
        </div>
      </div>
      {maxLength != null && (
        <p className={cn("mt-1 text-right text-[11px]", overLimit ? "text-error" : "text-muted-foreground")}>
          {state?.charCount ?? 0}/{maxLength}
        </p>
      )}
    </div>
  );
}
