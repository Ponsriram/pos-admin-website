'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/contexts/store-context'
import { api } from '@/lib/api'
import type { Shift, DayClose } from '@/lib/types'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import {
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  User,
  ArrowRight,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ShiftsPage() {
  const { currentStore } = useStore()
  const storeId = currentStore?.id

  const [shifts, setShifts] = useState<Shift[]>([])
  const [dayCloses, setDayCloses] = useState<DayClose[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDayCloseOpen, setIsDayCloseOpen] = useState(false)
  const [businessDate, setBusinessDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('shifts')

  useEffect(() => {
    if (storeId) loadData()
  }, [storeId])

  const loadData = async () => {
    if (!storeId) return
    setIsLoading(true)
    try {
      const [shiftsData, dayCloseData] = await Promise.all([
        api.getShifts(storeId),
        api.getDayCloses(storeId),
      ])
      setShifts(shiftsData)
      setDayCloses(dayCloseData)
    } catch (error) {
      console.error('Failed to load shifts:', error)
      setShifts([])
      setDayCloses([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateDayClose = async () => {
    if (!storeId || !businessDate) return
    setIsSubmitting(true)
    try {
      const newDayClose = await api.generateDayClose(storeId, businessDate)
      setDayCloses((prev) => [newDayClose, ...prev])
      setIsDayCloseOpen(false)
    } catch (error) {
      console.error('Failed to generate day close:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!storeId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please select a store to view shifts</p>
      </div>
    )
  }

  const openShifts = shifts.filter((s) => s.status === 'open')
  const closedShifts = shifts.filter((s) => s.status === 'closed')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Shifts</h1>
          <p className="text-muted-foreground">View employee shifts and day-close reports</p>
        </div>
        <Button onClick={() => setIsDayCloseOpen(true)}>
          <FileText className="h-4 w-4 mr-2" />
          Generate Day Close
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open Shifts</p>
                <p className="text-2xl font-bold">{openShifts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Closed Today</p>
                <p className="text-2xl font-bold">
                  {closedShifts.filter((s) => s.ended_at && new Date(s.ended_at).toDateString() === new Date().toDateString()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Day Close Reports</p>
                <p className="text-2xl font-bold">{dayCloses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="shifts">Shifts ({shifts.length})</TabsTrigger>
          <TabsTrigger value="day-close">Day Close ({dayCloses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="shifts">
          <ScrollArea className="h-[calc(100vh-26rem)]">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Card key={i}><CardContent className="h-20" /></Card>)}
              </div>
            ) : shifts.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No shifts found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shifts.map((shift) => (
                  <Card key={shift.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Employee: {shift.employee_id.slice(0, 8)}...</p>
                            <p className="text-xs text-muted-foreground">
                              Started: {new Date(shift.started_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {shift.opening_cash !== undefined && (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Opening Cash</p>
                              <p className="font-medium text-sm">₹{shift.opening_cash?.toFixed(2)}</p>
                            </div>
                          )}
                          {shift.status === 'closed' && shift.closing_cash !== undefined && (
                            <>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Closing Cash</p>
                                <p className="font-medium text-sm">₹{shift.closing_cash?.toFixed(2)}</p>
                              </div>
                            </>
                          )}
                          <Badge variant={shift.status === 'open' ? 'default' : 'secondary'}>
                            {shift.status}
                          </Badge>
                        </div>
                      </div>
                      {shift.payment_summaries && shift.payment_summaries.length > 0 && (
                        <div className="mt-3 pt-3 border-t flex gap-4 flex-wrap">
                          {shift.payment_summaries.map((ps, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="capitalize text-muted-foreground">{ps.payment_method}:</span>
                              <span className="font-medium">₹{ps.total_amount.toFixed(2)}</span>
                              <span className="text-xs text-muted-foreground">({ps.transaction_count})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="day-close">
          <ScrollArea className="h-[calc(100vh-26rem)]">
            {dayCloses.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No day-close reports yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dayCloses.map((dc) => (
                  <Card key={dc.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold">{dc.business_date}</p>
                          <p className="text-xs text-muted-foreground">
                            Closed: {new Date(dc.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total Revenue</p>
                          <p className="text-xl font-bold text-primary">₹{dc.total_revenue.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Orders</p>
                          <p className="font-medium">{dc.total_orders}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Cash</p>
                          <p className="font-medium">₹{dc.total_cash.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Card</p>
                          <p className="font-medium">₹{dc.total_card.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">UPI</p>
                          <p className="font-medium">₹{dc.total_upi.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Day Close Dialog */}
      <Dialog open={isDayCloseOpen} onOpenChange={setIsDayCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Day Close Report</DialogTitle>
            <DialogDescription>Select the business date to close and generate the report.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Business Date</FieldLabel>
              <Input
                type="date"
                value={businessDate}
                onChange={(e) => setBusinessDate(e.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDayCloseOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateDayClose} disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
