'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api } from '@/lib/api'
import type { Store, TableLabel } from '@/lib/types'
import { useAuth } from './auth-context'

interface StoreContextType {
  stores: Store[]
  currentStore: Store | null
  tables: TableLabel[]
  isLoading: boolean
  setCurrentStore: (store: Store) => void
  refreshStores: () => Promise<void>
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [stores, setStores] = useState<Store[]>([])
  const [currentStore, setCurrentStoreState] = useState<Store | null>(null)
  const [tables, setTables] = useState<TableLabel[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refreshStores = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    try {
      const storeList = await api.getStores()
      setStores(storeList)
      if (storeList.length > 0 && !currentStore) {
        setCurrentStoreState(storeList[0])
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, currentStore])

  const setCurrentStore = useCallback((store: Store) => {
    setCurrentStoreState(store)
  }, [])

  // Fetch tables when current store changes
  useEffect(() => {
    const fetchTables = async () => {
      if (!currentStore) {
        setTables([])
        return
      }
      try {
        const response = await api.getStoreTables(currentStore.id)
        setTables(response.tables || [])
      } catch (error) {
        console.error('Failed to fetch tables:', error)
        setTables([])
      }
    }
    fetchTables()
  }, [currentStore])

  useEffect(() => {
    refreshStores()
  }, [refreshStores])

  return (
    <StoreContext.Provider
      value={{
        stores,
        currentStore,
        tables,
        isLoading,
        setCurrentStore,
        refreshStores,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
