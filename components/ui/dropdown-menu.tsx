// components/ui/dropdown-menu.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

// Context for DropdownMenu state
interface DropdownMenuContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const DropdownMenuContext = createContext<DropdownMenuContextType | undefined>(undefined);

// Main DropdownMenu component
interface DropdownMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function DropdownMenu({ open: controlledOpen, onOpenChange, children }: DropdownMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

// Trigger component
interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export function DropdownMenuTrigger({ asChild, children }: DropdownMenuTriggerProps) {
  const context = useContext(DropdownMenuContext);
  if (!context) throw new Error('DropdownMenuTrigger must be used within DropdownMenu');

  const handleClick = () => {
    context.setOpen(!context.open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: context.triggerRef,
      onClick: handleClick,
      'aria-expanded': context.open,
      'aria-haspopup': 'menu',
    });
  }

  return (
    <button
      ref={context.triggerRef as React.RefObject<HTMLButtonElement>}
      onClick={handleClick}
      aria-expanded={context.open}
      aria-haspopup="menu"
    >
      {children}
    </button>
  );
}

// Content component
interface DropdownMenuContentProps {
  align?: 'start' | 'center' | 'end';
  className?: string;
  children: React.ReactNode;
  asChild?: boolean;
}

export function DropdownMenuContent({ 
  align = 'center', 
  className, 
  children,
  asChild 
}: DropdownMenuContentProps) {
  const context = useContext(DropdownMenuContext);
  if (!context) throw new Error('DropdownMenuContent must be used within DropdownMenu');

  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (context.open && context.triggerRef.current) {
      const trigger = context.triggerRef.current;
      const rect = trigger.getBoundingClientRect();
      
      let left = rect.left;
      if (align === 'end') {
        left = rect.right - 224; // 224px = w-56 (14rem)
      } else if (align === 'center') {
        left = rect.left + (rect.width / 2) - 112;
      }

      setPosition({
        top: rect.bottom + 4,
        left: Math.max(8, Math.min(left, window.innerWidth - 232)),
      });
    }
  }, [context.open, align, context.triggerRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        context.open &&
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        context.triggerRef.current &&
        !context.triggerRef.current.contains(event.target as Node)
      ) {
        context.setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && context.open) {
        context.setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [context]);

  if (!context.open) return null;

  const content = (
    <div
      ref={contentRef}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        'animate-in fade-in-0 zoom-in-95',
        className
      )}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {children}
    </div>
  );

  if (asChild && React.isValidElement(children)) {
    return createPortal(
      React.cloneElement(children as React.ReactElement<any>, {
        ref: contentRef,
        style: {
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
        },
      }),
      document.body
    );
  }

  return createPortal(content, document.body);
}

// Menu Item component
interface DropdownMenuItemProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function DropdownMenuItem({ 
  className, 
  children, 
  onClick,
  disabled 
}: DropdownMenuItemProps) {
  const context = useContext(DropdownMenuContext);
  
  const handleClick = () => {
    if (!disabled) {
      onClick?.();
      context?.setOpen(false);
    }
  };

  return (
    <div
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:bg-accent focus:text-accent-foreground',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={handleClick}
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
    >
      {children}
    </div>
  );
}

// Label component
interface DropdownMenuLabelProps {
  className?: string;
  children: React.ReactNode;
}

export function DropdownMenuLabel({ className, children }: DropdownMenuLabelProps) {
  return (
    <div
      className={cn('px-2 py-1.5 text-sm font-semibold', className)}
    >
      {children}
    </div>
  );
}

// Separator component
interface DropdownMenuSeparatorProps {
  className?: string;
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return (
    <div
      className={cn('-mx-1 my-1 h-px bg-muted', className)}
      role="separator"
    />
  );
}