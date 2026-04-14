import type { ChatMessage } from "@/shared/domain/types";
import { Badge } from "@/shared/ui/Badge";
import { cn } from "@/shared/lib/cn";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeMathJaxSvg from "rehype-mathjax/svg";
import rehypeHighlight from "rehype-highlight";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isStudent = message.role === "student";
  return (
    <div className={cn("flex w-full", isStudent ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
          isStudent
            ? "bg-blue-600 text-white rounded-br-sm whitespace-pre-wrap"
            : "bg-gray-100 text-gray-900 rounded-bl-sm dark:bg-gray-800 dark:text-gray-100",
        )}
      >
        {!isStudent && message.gagne_event && (
          <div className="mb-1">
            <Badge tone="blue">Evento E{message.gagne_event}</Badge>
          </div>
        )}
        {isStudent ? (
          message.text
        ) : (
          <div className="tutor-md">
            <Markdown
              remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: false }], remarkRehype]}
              rehypePlugins={[rehypeMathJaxSvg, rehypeHighlight]}
              components={{
                a: ({ node, ...props }) => (
                  <a {...props} target="_blank" rel="noopener noreferrer" />
                ),
              }}
            >
              {message.text}
            </Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
