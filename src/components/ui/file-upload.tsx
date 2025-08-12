"use client"

import * as React from "react"
import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, File, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  onUpload?: (files: File[]) => Promise<void>
  accept?: Record<string, string[]>
  maxFiles?: number
  maxSize?: number // in bytes
  disabled?: boolean
  className?: string
  showPreview?: boolean
  showProgress?: boolean
}

interface FileWithProgress extends File {
  id: string
  progress?: number
  status?: 'uploading' | 'success' | 'error'
  error?: string
}

export function FileUpload({
  onFilesSelected,
  onUpload,
  accept,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false,
  className,
  showPreview = true,
  showProgress = true,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filesWithProgress: FileWithProgress[] = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'uploading' as const,
    }))

    setFiles(prev => [...prev, ...filesWithProgress])
    onFilesSelected(acceptedFiles)

    if (onUpload) {
      handleUpload(filesWithProgress)
    }
  }, [onFilesSelected, onUpload])

  const handleUpload = async (filesToUpload: FileWithProgress[]) => {
    if (!onUpload) return

    setIsUploading(true)
    
    try {
      await onUpload(filesToUpload)
      
      // Update status to success
      setFiles(prev => prev.map(file => 
        filesToUpload.some(f => f.id === file.id) 
          ? { ...file, status: 'success' as const, progress: 100 }
          : file
      ))
    } catch (error) {
      // Update status to error
      setFiles(prev => prev.map(file => 
        filesToUpload.some(f => f.id === file.id) 
          ? { ...file, status: 'error' as const, error: error instanceof Error ? error.message : 'Upload failed' }
          : file
      ))
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    disabled: disabled || isUploading,
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️'
    if (file.type.startsWith('video/')) return '🎥'
    if (file.type.startsWith('audio/')) return '🎵'
    if (file.type.includes('pdf')) return '📄'
    if (file.type.includes('word') || file.type.includes('document')) return '📝'
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return '📊'
    return '📁'
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive && !isDragReject && "border-primary bg-primary/5",
          isDragReject && "border-destructive bg-destructive/5",
          disabled && "opacity-50 cursor-not-allowed",
          "hover:border-primary/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">
          {isDragActive
            ? isDragReject
              ? "Some files will be rejected"
              : "Drop the files here..."
            : "Drag & drop files here, or click to select files"}
        </p>
        <p className="text-xs text-muted-foreground">
          Max {maxFiles} files, up to {formatFileSize(maxSize)} each
        </p>
      </div>

      {showPreview && files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files</h4>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-lg">{getFileIcon(file)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {file.status === 'success' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  {showProgress && file.progress !== undefined && file.progress < 100 && (
                    <Progress value={file.progress} className="w-20" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {files.some(f => f.status === 'error') && (
        <div className="p-3 border border-destructive/20 bg-destructive/5 rounded-lg">
          <p className="text-sm text-destructive">
            Some files failed to upload. Please try again.
          </p>
        </div>
      )}
    </div>
  )
} 