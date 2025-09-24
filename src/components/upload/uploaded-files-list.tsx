import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileIcon, CalendarIcon, DatabaseIcon } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadDate: string;
  status: "processing" | "completed" | "failed" | "uploaded";
  recordCount?: number;
}

// No longer using hardcoded data - now using Convex

const getStatusBadge = (status: UploadedFile["status"]) => {
  switch (status) {
    case "completed":
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-800 hover:bg-green-100"
        >
          Completed
        </Badge>
      );
    case "processing":
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
        >
          Processing
        </Badge>
      );
    case "uploaded":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 hover:bg-blue-100"
        >
          Uploaded
        </Badge>
      );
    case "failed":
      return (
        <Badge
          variant="destructive"
          className="bg-red-100 text-red-800 hover:bg-red-100"
        >
          Failed
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export const UploadedFilesList = () => {
  const { user } = useUser();
  const filesQuery = useQuery(
    api.files.getUserFiles,
    user?.id ? { userId: user.id } : "skip"
  );
  const files = filesQuery || [];

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (filesQuery === undefined) {
    return (
      <div className="h-full flex flex-col">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Uploaded Files
          </h2>
          <p className="text-gray-600">
            NetCDF files processed through the ingestion pipeline
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Uploaded Files
        </h2>
        <p className="text-gray-600">
          NetCDF files processed through the ingestion pipeline
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          {files.map((file, index) => (
            <motion.div
              key={file._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={cn(
                  "hover:shadow-lg transition-shadow duration-200",
                  file.status === "processing" && "border-yellow-200",
                  file.status === "failed" && "border-red-200",
                  file.status === "completed" && "border-green-200",
                  file.status === "uploaded" && "border-blue-200"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900 truncate max-w-xs">
                          {file.filename}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatFileSize(file.fileSize)} MB
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(file.status)}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDate(file.createdAt)}</span>
                      </div>

                      {file.recordCount && (
                        <div className="flex items-center space-x-1">
                          <DatabaseIcon className="h-4 w-4" />
                          <span>
                            {file.recordCount.toLocaleString("en-US")} records
                          </span>
                        </div>
                      )}
                    </div>

                    {file.status === "processing" && (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                        <span className="text-yellow-600">Processing...</span>
                      </div>
                    )}
                  </div>

                  {file.status === "failed" && (
                    <div className="mt-2 p-2 bg-red-50 rounded-md">
                      <p className="text-sm text-red-700">
                        Failed to process file. Please check the file format and
                        try again.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {files.length === 0 && (
          <div className="text-center py-12">
            <FileIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No files uploaded yet
            </h3>
            <p className="text-gray-500">
              Upload your first NetCDF file to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
