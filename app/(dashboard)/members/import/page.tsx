"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/breadcrumbs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import Papa from "papaparse"

interface CSVRow {
  [key: string]: string
}

interface ImportResult {
  success: boolean
  row: number
  error?: string
}

const EXPECTED_COLUMNS = [
  "membership_number",
  "name",
  "father_husband_name",
  "occupation",
  "gender",
  "marital_status",
  "address_line_1",
  "address_line_2",
  "city",
  "state",
  "pincode",
  "country",
  "mobile_number",
  "date_of_birth",
  "marriage_date",
  "member_since_year",
  "baptized_year",
  "spiritual_status",
]

export default function ImportMembersPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<CSVRow[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<ImportResult[]>([])
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Invalid file",
        description: "Please upload a CSV file",
        variant: "destructive",
      })
      return
    }

    setFile(file)
    setResults([])

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[]
        const cols = results.meta.fields || []
        
        setParsedData(data)
        setColumns(cols)
      },
      error: (error) => {
        toast({
          title: "Parse error",
          description: error.message,
          variant: "destructive",
        })
      },
    })
  }

  const handleImport = async () => {
    if (!parsedData.length) return

    setImporting(true)
    const importResults: ImportResult[] = []

    // For now, we'll simulate the import
    // In production, you would send to the API
    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i]
      
      try {
        // Validate required fields
        if (!row.name || !row.membership_number) {
          importResults.push({
            success: false,
            row: i + 1,
            error: "Missing required fields (name, membership_number)",
          })
          continue
        }

        // TODO: Call API to create member
        // await MembersService.create(row)
        
        importResults.push({
          success: true,
          row: i + 1,
        })
      } catch (error: any) {
        importResults.push({
          success: false,
          row: i + 1,
          error: error.message || "Unknown error",
        })
      }
    }

    setResults(importResults)
    setImporting(false)

    const successCount = importResults.filter((r) => r.success).length
    const errorCount = importResults.filter((r) => !r.success).length

    if (errorCount === 0) {
      toast({
        title: "Import complete",
        description: `Successfully imported ${successCount} members`,
      })
    } else {
      toast({
        title: "Import completed with errors",
        description: `${successCount} succeeded, ${errorCount} failed`,
        variant: "destructive",
      })
    }
  }

  const clearFile = () => {
    setFile(null)
    setParsedData([])
    setColumns([])
    setResults([])
  }

  const missingColumns = EXPECTED_COLUMNS.filter(
    (col) => !columns.includes(col) && ["name", "membership_number"].includes(col)
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Members"
        description="Upload a CSV file to bulk import church members"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Members", href: "/members" },
          { label: "Import" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Upload CSV File</CardTitle>
            <CardDescription>
              Upload a CSV file with member data. Required columns: name, membership_number
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!file ? (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/50"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  Drop your CSV file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 10MB
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* File info */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {parsedData.length} rows • {columns.length} columns
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearFile}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Validation warnings */}
                {missingColumns.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Missing required columns</AlertTitle>
                    <AlertDescription>
                      The following required columns are missing: {missingColumns.join(", ")}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Preview */}
                {parsedData.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-[300px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            {columns.slice(0, 5).map((col) => (
                              <TableHead key={col} className="capitalize">
                                {col.replace(/_/g, " ")}
                              </TableHead>
                            ))}
                            {columns.length > 5 && (
                              <TableHead>+{columns.length - 5} more</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedData.slice(0, 5).map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-muted-foreground">
                                {i + 1}
                              </TableCell>
                              {columns.slice(0, 5).map((col) => (
                                <TableCell key={col} className="max-w-[150px] truncate">
                                  {row[col] || "—"}
                                </TableCell>
                              ))}
                              {columns.length > 5 && <TableCell>...</TableCell>}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {parsedData.length > 5 && (
                      <div className="p-2 text-center text-xs text-muted-foreground bg-muted/50">
                        Showing 5 of {parsedData.length} rows
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Required Columns</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• name</li>
                <li>• membership_number</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Optional Columns</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• father_husband_name</li>
                <li>• occupation</li>
                <li>• gender (male/female/other)</li>
                <li>• marital_status</li>
                <li>• mobile_number</li>
                <li>• date_of_birth (YYYY-MM-DD)</li>
                <li>• city, state, pincode</li>
                <li>• member_since_year</li>
                <li>• baptized_year</li>
              </ul>
            </div>

            <Button variant="outline" className="w-full" size="sm">
              Download Template
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Import Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded text-sm",
                    result.success ? "bg-green-500/10" : "bg-red-500/10"
                  )}
                >
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>
                    Row {result.row}: {result.success ? "Imported successfully" : result.error}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.push("/members")}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          disabled={!file || missingColumns.length > 0 || importing}
        >
          {importing && (
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          Import {parsedData.length} Members
        </Button>
      </div>
    </div>
  )
}

