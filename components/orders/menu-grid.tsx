'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MenuItem, Category } from '@/lib/types'

interface MenuGridProps {
  items: MenuItem[]
  categories: Category[]
  onAddItem: (item: MenuItem) => void
  cartItemIds: Set<string>
}

export function MenuGrid({ items, categories, onAddItem, cartItemIds }: MenuGridProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filteredItems = activeCategory
    ? items.filter((item) => item.category_id === activeCategory)
    : items

  const allCategories = [
    { id: null, name: 'All' },
    ...categories,
  ]

  return (
    <div className="space-y-4">
      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {allCategories.map((category) => (
          <Button
            key={category.id || 'all'}
            variant={activeCategory === category.id ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'shrink-0',
              activeCategory === category.id && 'bg-primary text-primary-foreground'
            )}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Menu items grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            inCart={cartItemIds.has(item.id)}
            onAdd={() => onAddItem(item)}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          No items found
        </div>
      )}
    </div>
  )
}

function MenuItemCard({
  item,
  inCart,
  onAdd,
}: {
  item: MenuItem
  inCart: boolean
  onAdd: () => void
}) {
  // Generate a placeholder image based on item name
  const imageUrl = item.image_url || `/api/placeholder/200/150?text=${encodeURIComponent(item.name)}`

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[4/3] bg-muted">
        <Image
          src={imageUrl}
          alt={item.name}
          fill
          className="object-cover"
          unoptimized
        />
        {item.is_vegetarian && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
            Veg
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-medium text-sm line-clamp-1">{item.name}</h3>
          <span className="text-primary font-semibold text-sm shrink-0">
            ${item.price.toFixed(2)}
          </span>
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
            {item.description}
          </p>
        )}
        <Button
          variant={inCart ? 'outline' : 'default'}
          size="sm"
          className="w-full"
          onClick={onAdd}
        >
          {inCart ? 'Add more (1)' : 'Add to cart'}
        </Button>
      </div>
    </Card>
  )
}
