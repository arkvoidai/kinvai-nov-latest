import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItemData {
  id: string;
  title: string;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItemData[];
  allowMultiple?: boolean;
  defaultOpenIds?: string[];
  className?: string;
}

/**
 * Smooth height Accordion using the CSS grid-rows-[0fr]/[1fr] trick (zero layout thrash).
 */
export function Accordion({
  items,
  allowMultiple = false,
  defaultOpenIds = [],
  className = '',
}: AccordionProps) {
  const baseId = useId();
  const [openIds, setOpenIds] = useState<string[]>(defaultOpenIds);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const isOpen = prev.includes(id);
      if (isOpen) {
        return prev.filter((item) => item !== id);
      }
      return allowMultiple ? [...prev, id] : [id];
    });
  };

  return (
    <div className={`divide-y divide-line border-y border-line ${className}`}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        const buttonId = `${baseId}-btn-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;

        return (
          <div key={item.id}>
            <button
              id={buttonId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(item.id)}
              className="flex w-full items-center justify-between gap-4 py-4 md:py-5 text-left text-base font-medium text-ink hover:text-ink-soft transition-colors cursor-pointer min-h-[52px]"
            >
              <span>{item.title}</span>
              <span
                aria-hidden="true"
                className="w-8 h-8 rounded-full bg-stone flex items-center justify-center shrink-0"
              >
                <ChevronDown
                  size={18}
                  strokeWidth={1.75}
                  className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                />
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid transition-[grid-template-rows,opacity] duration-250 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="pb-5 pr-8 text-[15px] leading-relaxed text-ink-2 prose-measure">
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
