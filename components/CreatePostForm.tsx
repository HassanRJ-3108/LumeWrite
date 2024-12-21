'use client'

import { createPost } from "@/actions/post.actions";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Editor } from '@tinymce/tinymce-react';
import { useRouter } from "next/navigation";

export default function CreatePostForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim() || !title.trim()) return;

    try {
      setIsSubmitting(true);
      await createPost(user.id, { title, content });
      router.push('/');
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4">
      <div className="mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter your post title..."
          className="w-full p-4 text-2xl font-bold border-b border-gray-200 focus:outline-none focus:border-gray-400 bg-transparent"
          required
        />
      </div>

      <div className="mb-6 bg-white rounded-lg shadow-sm">
        <Editor
          apiKey="wsu28tnkq4njsfff741w19biadjnctvky0wccul8cie5astb"
          init={{
            height: 500,
            menubar: true,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount',
              'emoticons', 'codesample'
            ],
            toolbar: 'undo redo | formatselect | ' +
              'bold italic backcolor forecolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | image media | codesample emoticons | help',
            content_style: `
              body { font-family:Helvetica,Arial,sans-serif; font-size:16px }
              pre.language-markup, pre.language-javascript, pre.language-css, pre.language-python, pre.language-java { 
                background-color: #f8f8f8; 
                border: 1px solid #ddd; 
                border-left: 3px solid #f36d33; 
                color: #333; 
                page-break-inside: avoid; 
                font-family: monospace; 
                font-size: 15px; 
                line-height: 1.6; 
                margin-bottom: 1.6em; 
                max-width: 100%; 
                overflow: auto; 
                padding: 1em 1.5em; 
                display: block; 
                word-wrap: break-word; 
              }
              code { 
                background-color: #f8f8f8; 
                border-radius: 3px; 
                font-family: courier, monospace; 
                padding: 0 3px; 
                color: #333;
              }
            `,
            codesample_languages: [
              { text: 'HTML/XML', value: 'markup' },
              { text: 'JavaScript', value: 'javascript' },
              { text: 'CSS', value: 'css' },
              { text: 'Python', value: 'python' },
              { text: 'Java', value: 'java' },
            ],
            file_picker_types: 'image',
            images_upload_handler: async function (blobInfo) {
              // Here you would typically upload to your server
              // For now, we'll return a data URL
              return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = function () {
                  resolve(reader.result as string);
                };
                reader.readAsDataURL(blobInfo.blob());
              });
            }
          }}
          value={content}
          onEditorChange={(newContent) => setContent(newContent)}
        />
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !title.trim() || !content.trim()}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Publishing...' : 'Publish Post'}
        </button>
      </div>
    </form>
  );
}

