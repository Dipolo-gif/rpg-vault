"use client";

import { useEffect } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import {
  Bold,
  Braces,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Editor de texto formatado das descrições de item.
 * Guarda HTML em magic_items.description_html e o texto puro em
 * description_text, que é o que serve para busca.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Descreva os efeitos, regras e a história do item...",
}: {
  value: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    // Sem isso o Tiptap tenta renderizar no servidor e quebra a hidratação.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "tiptap item-prose min-h-40 w-full px-3 py-2 focus:outline-none",
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML(), instance.getText());
    },
  });

  // Quando o painel troca de item, o conteúdo do editor precisa acompanhar.
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="min-h-40 rounded-lg border border-input bg-transparent" />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-transparent focus-within:ring-[3px] focus-within:ring-ring/50">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const actions = [
    {
      icon: Bold,
      label: "Negrito",
      run: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
    },
    {
      icon: Italic,
      label: "Itálico",
      run: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
    },
    {
      icon: Strikethrough,
      label: "Riscado",
      run: () => editor.chain().focus().toggleStrike().run(),
      active: editor.isActive("strike"),
    },
    {
      icon: Heading2,
      label: "Título",
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
    },
    {
      icon: List,
      label: "Lista",
      run: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
    },
    {
      icon: ListOrdered,
      label: "Lista numerada",
      run: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
    },
    {
      icon: Quote,
      label: "Citação",
      run: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive("blockquote"),
    },
    {
      icon: Braces,
      label: "Código",
      run: () => editor.chain().focus().toggleCode().run(),
      active: editor.isActive("code"),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-secondary/40 px-1.5 py-1">
      {actions.map((action) => (
        <Button
          key={action.label}
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={action.label}
          title={action.label}
          onClick={action.run}
          className={cn(action.active && "bg-accent text-accent-foreground")}
        >
          <action.icon className="size-3.5" />
        </Button>
      ))}

      <span className="mx-1 h-4 w-px bg-border" />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Desfazer"
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Refazer"
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="size-3.5" />
      </Button>
    </div>
  );
}
