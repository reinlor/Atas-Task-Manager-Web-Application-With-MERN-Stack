import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

const sanitizeOptions = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    div: [...(defaultSchema.attributes?.div || []), ["className", "math", "math-display"]],
    span: [...(defaultSchema.attributes?.span || []), ["className", "math", "math-inline", "katex", "katex-mathml", "katex-html"]],
  },
};

export default function MarkdownContent({ children, className = "" }) {
  return (
    <div className={`text-primary ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeHighlight,
          [rehypeSanitize, sanitizeOptions],
          rehypeKatex,
        ]}
      >
        {children || ""}
      </Markdown>
    </div>
  );
}
