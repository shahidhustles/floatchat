"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { User, Bot } from "lucide-react";
import type { UIMessage } from "ai";

interface MessageBubbleProps {
  message: UIMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {/* Avatar for AI (left side) */}
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Message Content */}
      <div
        className={`max-w-2xl rounded-lg px-4 py-3 ${
          isUser ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        {/* Render all message parts */}
        {message.parts.map((part, index) => {
          switch (part.type) {
            case "text":
              return (
                <div key={index}>
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{part.text}</p>
                  ) : part.text.length > 0 ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(
                              className || ""
                            );
                            return match ? (
                              <SyntaxHighlighter
                                style={tomorrow}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-md"
                              >
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            ) : (
                              <code
                                className="bg-gray-200 px-1 py-0.5 rounded text-sm"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                          table: ({ children }) => (
                            <div className="overflow-x-auto">
                              <table className="min-w-full border-collapse border border-gray-300">
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className="border border-gray-300 px-3 py-2 bg-gray-50 text-left font-semibold">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="border border-gray-300 px-3 py-2">
                              {children}
                            </td>
                          ),
                          h1: ({ children }) => (
                            <h1 className="text-xl font-bold mb-3 text-gray-900">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-lg font-semibold mb-2 text-gray-800">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-md font-semibold mb-2 text-gray-700">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="mb-2 text-gray-900 leading-relaxed">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside mb-2 space-y-1">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside mb-2 space-y-1">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-gray-900">{children}</li>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 mb-2">
                              {children}
                            </blockquote>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-gray-900">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-gray-800">{children}</em>
                          ),
                        }}
                      >
                        {part.text}
                      </ReactMarkdown>
                    </div>
                  ) : null}
                </div>
              );

            // Handle getInformation tool calls
            case "tool-getInformation":
              return (
                <div key={index} className="mb-3">
                  {renderToolCall(part)}
                </div>
              );

            default:
              return null;
          }
        })}

        {/* Timestamp */}
        <div className="mt-2 text-xs opacity-70">
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {/* Avatar for User (right side) */}
      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to render tool calls based on their state
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderToolCall(part: any) {
  const toolCallId = part.toolCallId;

  switch (part.type) {
    case "tool-getInformation":
      switch (part.state) {
        case "input-streaming":
          return (
            <span key={toolCallId} className="animate-shine">
              Preparing to search...
            </span>
          );
        case "input-available":
          return (
            <span key={toolCallId} className="animate-shine">
              Gathering info about &ldquo;{part.input?.question || "ocean data"}
              &rdquo;...
            </span>
          );
        case "output-available":
          return (
            <span key={toolCallId} className="text-black">
              Found relevant information
            </span>
          );
        case "output-error":
          return (
            <span key={toolCallId} className="text-red-600">
              Error: {part.errorText || "Unknown issue"}
            </span>
          );
        default:
          return null;
      }
    default:
      return null;
  }
}
