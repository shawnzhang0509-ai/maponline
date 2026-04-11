import React, { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';

type Props = {
  initialHtml: string;
  onHtmlChange: (html: string) => void;
};

export const AdminRichTextEditor: React.FC<Props> = ({ initialHtml, onHtmlChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Image.configure({ inline: true, allowBase64: false }),
      Placeholder.configure({ placeholder: 'Write content…' }),
    ],
    content: initialHtml || '<p></p>',
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[200px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400',
      },
    },
    onUpdate: ({ editor }) => {
      onHtmlChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && initialHtml !== undefined) {
      const current = editor.getHTML();
      if (current !== initialHtml) {
        editor.commands.setContent(initialHtml || '<p></p>', false);
      }
    }
  }, [editor, initialHtml]);

  if (!editor) return <div className="min-h-[200px] border rounded-lg bg-gray-50 animate-pulse" />;

  const addImageByUrl = () => {
    const url = window.prompt('Image URL (https only recommended)');
    if (!url?.trim()) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  const setLink = () => {
    const previous = editor.getAttributes('link').href;
    const url = window.prompt('Link URL', previous || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg border border-gray-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-xs font-bold rounded ${editor.isActive('bold') ? 'bg-white shadow' : ''}`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-xs italic rounded ${editor.isActive('italic') ? 'bg-white shadow' : ''}`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 text-xs rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-white shadow' : ''}`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 text-xs rounded ${editor.isActive('bulletList') ? 'bg-white shadow' : ''}`}
        >
          List
        </button>
        <button type="button" onClick={setLink} className="px-2 py-1 text-xs rounded">
          Link
        </button>
        <button type="button" onClick={addImageByUrl} className="px-2 py-1 text-xs rounded">
          Image
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};
