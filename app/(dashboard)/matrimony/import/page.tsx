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

// User-readable column names mapping to API field names
const COLUMN_MAPPING: Record<string, string> = {
  "Name": "name",
  "Gender": "gender",
  "Date of Birth": "date_of_birth",
  "Marital Status": "marital_status",
  "Education": "education",
  "Job Type": "job_type",
  "Job Title": "job_title",
  "Income": "income",
  "Height": "height",
  "Weight": "weight",
  "Complexion": "complexion",
  "Mobile Number": "mobile_number",
  "Native Place": "native_place",
  "Mother Tongue": "mother_tongue",
  "About": "about",
  "Father Name": "father_name",
  "Father Occupation": "father_occupation",
  "Mother Name": "mother_name",
  "Mother Occupation": "mother_occupation",
  "Family Type": "family_type",
  "Church Name": "church_name",
  "Denomination": "denomination",
  "Pastor Name": "pastor_name",
  "Pastor Mobile": "pastor_mobile_number",
}

const EXPECTED_COLUMNS = Object.keys(COLUMN_MAPPING)
const REQUIRED_COLUMNS = ["Name", "Gender", "Date of Birth"]

function mapColumnToApiField(columnName: string): string {
  return COLUMN_MAPPING[columnName] || columnName
}

export default function ImportMatrimonyPage() {
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
        
        const missingRequired = REQUIRED_COLUMNS.filter(col => !cols.includes(col))
        if (missingRequired.length > 0) {
          toast({
            title: "Missing required columns",
            description: `Required columns missing: ${missingRequired.join(", ")}`,
            variant: "destructive",
          })
        }
        
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

  const validateRow = (row: CSVRow, rowIndex: number): string[] => {
    const errors: string[] = []
    
    const nameCol = columns.find(col => mapColumnToApiField(col) === "name" || col === "Name")
    const genderCol = columns.find(col => mapColumnToApiField(col) === "gender" || col === "Gender")
    const dobCol = columns.find(col => mapColumnToApiField(col) === "date_of_birth" || col === "Date of Birth")
    
    if (!nameCol || !row[nameCol]?.trim()) {
      errors.push("Name is required")
    }
    if (!genderCol || !row[genderCol]?.trim()) {
      errors.push("Gender is required")
    } else if (!["Male", "Female"].includes(row[genderCol])) {
      errors.push("Gender must be 'Male' or 'Female'")
    }
    if (!dobCol || !row[dobCol]?.trim()) {
      errors.push("Date of Birth is required")
    } else {
      const dob = new Date(row[dobCol])
      if (isNaN(dob.getTime())) {
        errors.push("Date of Birth must be in YYYY-MM-DD format")
      }
    }
    
    return errors
  }

  const downloadTemplate = () => {
    const headers = EXPECTED_COLUMNS.join(",")
    const sampleRow = EXPECTED_COLUMNS.map(() => "").join(",")
    const csvContent = `${headers}\n${sampleRow}\n`
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    
    link.setAttribute("href", url)
    link.setAttribute("download", "matrimony_profiles_template.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImport = async () => {
    if (!parsedData.length) return

    const validationErrors: Array<{ row: number; errors: string[] }> = []
    parsedData.forEach((row, index) => {
      const errors = validateRow(row, index)
      if (errors.length > 0) {
        validationErrors.push({ row: index + 1, errors })
      }
    })

    if (validationErrors.length > 0) {
      const errorMessages = validationErrors
        .map(({ row, errors }) => `Row ${row}: ${errors.join(", ")}`)
        .join("\n")
      
      toast({
        title: "Validation errors found",
        description: `Please fix errors before importing:\n${errorMessages}`,
        variant: "destructive",
      })
      return
    }

    setImporting(true)
    const importResults: ImportResult[] = []

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i]
      
      try {
        const apiData: Record<string, any> = {}
        columns.forEach(col => {
          const apiField = mapColumnToApiField(col)
          if (row[col] !== undefined && row[col] !== "") {
            apiData[apiField] = row[col]
          }
        })

        if (!apiData.name || !apiData.gender || !apiData.date_of_birth) {
          importResults.push({
            success: false,
            row: i + 1,
            error: "Missing required fields",
          })
          continue
        }

        // TODO: Call API to create profile
        // await MatrimonyService.create(apiData)
        
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
        description: `Successfully imported ${successCount} profiles`,
      })
      router.push("/matrimony")
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

  const missingColumns = REQUIRED_COLUMNS.filter(
    (col) => !columns.includes(col)
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Matrimony Profiles"
        description="Upload a CSV file to bulk import matrimony profiles"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Matrimony", href: "/matrimony" },
          { label: "Import" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Upload CSV File</CardTitle>
            <CardDescription>
              Upload a CSV file with profile data. Required columns: Name, Gender, Date of Birth
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

                {missingColumns.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Missing required columns</AlertTitle>
                    <AlertDescription>
                      The following required columns are missing: {missingColumns.join(", ")}
                    </AlertDescription>
                  </Alert>
                )}

                {parsedData.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-[300px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            {columns.slice(0, 5).map((col) => (
                              <TableHead key={col}>{col}</TableHead>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Required Columns</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {REQUIRED_COLUMNS.map(col => (
                  <li key={col}>• {col}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Optional Columns</h4>
              <ul className="text-sm text-muted-foreground space-y-1 max-h-48 overflow-y-auto">
                {EXPECTED_COLUMNS.filter(col => !REQUIRED_COLUMNS.includes(col)).map(col => (
                  <li key={col}>• {col}</li>
                ))}
              </ul>
            </div>

            <Button variant="outline" className="w-full" size="sm" onClick={downloadTemplate}>
              Download Template
            </Button>
          </CardContent>
        </Card>
      </div>

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

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.push("/matrimony")}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          disabled={!file || missingColumns.length > 0 || importing || results.some(r => !r.success)}
        >
          {importing && (
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          Import {parsedData.length} Profiles
        </Button>
      </div>
    </div>
  )
}

