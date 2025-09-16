"use client";

import { useState, useEffect } from "react";
import {
  addTestContent,
  getAllResources,
  clearAllData,
} from "@/actions/test-content";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Plus, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface Resource {
  id: string;
  content: string;
  createdAt: Date;
}

export default function AdminPage() {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);

  const fetchResources = async () => {
    setIsLoadingResources(true);
    const result = await getAllResources();
    if (result.success) {
      setResources(result.resources || []);
    }
    setIsLoadingResources(false);
  };

  const handleClearAll = async () => {
    if (
      !confirm(
        "Are you sure you want to clear ALL data? This cannot be undone."
      )
    ) {
      return;
    }

    setIsClearingData(true);
    setMessage(null);

    const result = await clearAllData();

    if (result.success) {
      setMessage({
        type: "success",
        text: result.message || "All data cleared successfully!",
      });
      setResources([]);
    } else {
      setMessage({
        type: "error",
        text: result.error || "Failed to clear data",
      });
    }

    setIsClearingData(false);
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    setMessage(null);

    const result = await addTestContent(content);

    if (result.success) {
      setMessage({
        type: "success",
        text: result.message || "Content added successfully!",
      });
      setContent("");
      fetchResources(); // Refresh the list
    } else {
      setMessage({
        type: "error",
        text: result.error || "Failed to add content",
      });
    }

    setIsLoading(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Admin - Test Content
          </h1>
          <p className="text-gray-600 mt-2">
            Add test content to your knowledge base for RAG testing
          </p>
        </div>

        {/* Add Content Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Test Content
            </CardTitle>
            <CardDescription>
              Enter content that will be chunked, embedded with Cohere, and
              stored in pgvector
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setContent(e.target.value)
                }
                placeholder="Enter your test content here... (e.g., research papers, policies, news articles)"
                className="min-h-[150px]"
                disabled={isLoading}
              />

              <div className="flex items-center gap-4">
                <Button type="submit" disabled={isLoading || !content.trim()}>
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Knowledge Base
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleClearAll}
                  disabled={isClearingData || isLoading}
                >
                  {isClearingData ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    "Clear All Data"
                  )}
                </Button>

                <div className="text-sm text-gray-500">
                  {content.length} characters
                </div>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-md text-sm ${
                    message.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {message.text}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Existing Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-between">
              <span>Existing Resources ({resources.length})</span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchResources}
                disabled={isLoadingResources}
              >
                {isLoadingResources ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </CardTitle>
            <CardDescription>
              Content stored in your knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resources.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No content added yet. Add some test content above to get
                started.
              </div>
            ) : (
              <div className="space-y-4">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="secondary" className="text-xs">
                        ID: {resource.id}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDate(resource.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">
                      {resource.content.length > 300
                        ? `${resource.content.substring(0, 300)}...`
                        : resource.content}
                    </p>
                    {resource.content.length > 300 && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          Show full content
                        </summary>
                        <p className="mt-2 text-gray-700">{resource.content}</p>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Test Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Test Content Suggestions</CardTitle>
            <CardDescription>
              Copy and paste these examples to test your RAG system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-sm">Ocean Climate Policy</h4>
                <p className="text-sm text-gray-600 mt-1">
                  The Indian Ocean Dipole significantly affects monsoon patterns
                  across South Asia. Recent climate policies focus on ocean
                  temperature monitoring through ARGO float networks to predict
                  seasonal variations and agricultural impacts.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium text-sm">ARGO Research Findings</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Latest ARGO float data from the Arabian Sea shows a warming
                  trend of 0.3°C over the past decade. This temperature increase
                  correlates with changes in salinity levels and has
                  implications for marine ecosystems in the region.
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-medium text-sm">
                  Marine Conservation News
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  The Bay of Bengal initiative launched in 2024 aims to
                  establish new ocean monitoring stations. The project will
                  deploy additional ARGO floats to improve data coverage for
                  climate research and fisheries management.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
