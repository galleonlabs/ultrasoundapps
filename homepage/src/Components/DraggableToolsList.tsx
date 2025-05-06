import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableToolItem } from './SortableToolItem';
import ToolItem from './ToolItem';

interface Tool {
  id: string;
  name: string;
  logo: string;
  affiliateLink?: string;
  website: string;
  upvotes?: number;
  category?: string;
}

interface DraggableToolsListProps {
  tools: Tool[];
  category: string;
  visibility: Record<string, boolean>;
  favorites: Record<string, boolean>;
  toggleVisibility: (id: string) => void;
  handleToolClick: (name: string) => void;
  handleFavorite?: (id: string) => void;
  onOrderChange?: (newTools: Tool[]) => void;
}

const DraggableToolsList: React.FC<DraggableToolsListProps> = ({
  tools,
  visibility,
  favorites,
  toggleVisibility,
  handleToolClick,
  handleFavorite,
  onOrderChange,
  // Omit category as it's not used in this component
}) => {
  // Use a ref to track if we're currently processing an order change
  const isProcessingOrderChange = useRef(false);
  
  // Memoize tools to prevent unnecessary re-renders
  const [items, setItems] = useState<Tool[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Get the active tool being dragged
  const activeTool = activeId ? tools.find(tool => tool.id === activeId) : null;

  // Only update items when tools change and we're not processing a drag operation
  useEffect(() => {
    if (!isProcessingOrderChange.current) {
      setItems(tools);
    }
  }, [tools]);

  // Configure the sensors - determines how dragging is activated
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setIsDragging(true);
    // Mark that we're starting an order change operation
    isProcessingOrderChange.current = true;
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setIsDragging(false);
    
    if (over && active.id !== over.id) {
      // Find indices in the current items array
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Move the item in our array
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update local state first
        setItems(newItems);
        
        // Then notify parent of the change
        if (onOrderChange) {
          onOrderChange(newItems);
        }
      }
    }
    
    // Clear the active ID and processin flag
    setActiveId(null);
    // We need to delay unsetting the flag slightly to ensure the state updates finish
    setTimeout(() => {
      isProcessingOrderChange.current = false;
    }, 50);
  }, [items, onOrderChange]);

  // Don't try to render drag context if there are no items
  if (!items || items.length === 0) {
    return (
      <div className="tools-grid">
        {/* Empty state or render regular items without drag functionality */}
        {tools.filter(tool => !visibility[tool.id]).map((tool, index) => (
          <div key={tool.id} className="tool-appear" style={{ animationDelay: `${index * 0.03}s` }}>
            <ToolItem
              tool={tool}
              toggleVisibility={toggleVisibility}
              isVisible={!visibility[tool.id]}
              handleToolClick={handleToolClick}
              handleFavorite={handleFavorite}
              isFavorited={favorites[tool.id]}
            />
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={`${isDragging ? 'cursor-grabbing' : ''}`}>
        <SortableContext items={items.map(item => item.id)} strategy={rectSortingStrategy}>
          <div className="tools-grid">
            {items
              .filter((tool) => !visibility[tool.id])
              .map((tool, index) => (
                <SortableToolItem
                  key={tool.id}
                  tool={tool}
                  toggleVisibility={toggleVisibility}
                  isVisible={!visibility[tool.id]}
                  handleToolClick={handleToolClick}
                  handleFavorite={handleFavorite}
                  isFavorited={favorites[tool.id]}
                  index={index}
                />
              ))}
          </div>
        </SortableContext>
      </div>

      {/* Overlay for the dragged item */}
      <DragOverlay adjustScale={true}>
        {activeId && activeTool ? (
          <div className="opacity-80 w-auto">
            <ToolItem
              tool={activeTool}
              toggleVisibility={toggleVisibility}
              isVisible={!visibility[activeTool.id]}
              handleToolClick={handleToolClick}
              handleFavorite={handleFavorite}
              isFavorited={favorites[activeTool.id]}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default DraggableToolsList;