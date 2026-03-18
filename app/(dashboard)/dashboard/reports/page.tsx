'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/contexts/store-context'
import { api } from '@/lib/api'
import type { ReportTemplate, ReportRun } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import {
  BarChart3,
  FileText,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Settings,
} from 'lucide-react'

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  sales: { label: 'Sales', icon: TrendingUp, color: 'bg-blue-500/10 text-blue-600' },
  finance: { label: 'Finance', icon: DollarSign, color: 'bg-green-500/10 text-green-600' },
  inventory: { label: 'Inventory', icon: Package, color: 'bg-orange-500/10 text-orange-600' },
  operations: { label: 'Operations', icon: Settings, color: 'bg-purple-500/10 text-purple-600' },
  staff: { label: 'Staff', icon: Users, color: 'bg-pink-500/10 text-pink-600' },
}

export default function ReportsPage() {
  const { currentStore } = useStore()
  const storeId = currentStore?.id

  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [reports, setReports] = useState<ReportRun[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedReport, setSelectedReport] = useState<ReportRun | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [storeId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [templatesData, reportsData] = await Promise.all([
        api.getReportTypes(),
        storeId ? api.getReports(storeId) : Promise.resolve([]),
      ])
      setTemplates(templatesData)
      setReports(reportsData)
    } catch (error) {
      console.error('Failed to load reports:', error)
      setTemplates([])
      setReports([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedTemplate || !storeId) return
    setIsGenerating(true)
    try {
      const params: Record<string, unknown> = {}
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      const report = await api.generateReport(selectedTemplate.code, storeId, params)
      setReports((prev) => [report, ...prev])
      setIsDialogOpen(false)
      setSelectedReport(report)
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const openGenerateDialog = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    setStartDate('')
    setEndDate('')
    setIsDialogOpen(true)
  }

  const filteredTemplates = filterCategory === 'all'
    ? templates
    : templates.filter((t) => t.category === filterCategory)

  if (!storeId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please select a store to generate reports</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-muted-foreground">Generate and view business reports</p>
        </div>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            Generated ({reports.length})
          </TabsTrigger>
          {selectedReport && (
            <TabsTrigger value="view">
              <BarChart3 className="h-4 w-4 mr-2" />
              Results
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory('all')}
            >
              All
            </Button>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <Button
                key={key}
                variant={filterCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory(key)}
              >
                <config.icon className="h-3.5 w-3.5 mr-1.5" />
                {config.label}
              </Button>
            ))}
          </div>

          <ScrollArea className="h-[calc(100vh-22rem)]">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}><CardContent className="h-32" /></Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {filteredTemplates.map((template) => {
                  const catConfig = CATEGORY_CONFIG[template.category] || CATEGORY_CONFIG.sales
                  const CatIcon = catConfig.icon
                  return (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={catConfig.color}>
                            <CatIcon className="h-3 w-3 mr-1" />
                            {catConfig.label}
                          </Badge>
                        </div>
                        <CardTitle className="text-base mt-2">{template.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {template.description || 'No description'}
                        </p>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => openGenerateDialog(template)}
                        >
                          <Play className="h-3.5 w-3.5 mr-2" />
                          Generate
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            {reports.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No reports generated yet</p>
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {reports.map((report) => (
                  <Card
                    key={report.id}
                    className="cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => setSelectedReport(report)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {report.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : report.status === 'failed' ? (
                            <XCircle className="h-5 w-5 text-red-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-yellow-600" />
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              {templates.find((t) => t.id === report.template_id)?.name || 'Report'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(report.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                          {report.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="view">
          {selectedReport?.result ? (
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {templates.find((t) => t.id === selectedReport.template_id)?.name || 'Report Results'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Generated: {new Date(selectedReport.created_at).toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent>
                  {selectedReport.result.rows ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {Object.keys((selectedReport.result.rows as Record<string, unknown>[])[0] || {}).map((key) => (
                              <th key={key} className="text-left py-2 px-3 font-medium capitalize">
                                {key.replace(/_/g, ' ')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedReport.result.rows as Record<string, unknown>[]).map((row, i) => (
                            <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                              {Object.values(row).map((val, j) => (
                                <td key={j} className="py-2 px-3">
                                  {typeof val === 'number' ? val.toLocaleString() : String(val ?? '-')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(selectedReport.result)
                        .filter(([k]) => k !== 'type')
                        .map(([key, value]) => (
                          <div key={key} className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                            <p className="text-lg font-semibold">
                              {typeof value === 'number' ? value.toLocaleString() : String(value)}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </ScrollArea>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <p>Select a report to view its results</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Generate Report Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.name} — {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Start Date</FieldLabel>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>End Date</FieldLabel>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating && <Spinner className="mr-2 h-4 w-4" />}
              Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
