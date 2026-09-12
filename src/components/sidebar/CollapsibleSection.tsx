import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = true, children, actions }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1.5 px-3 py-2 text-left group"
      >
        {open ? (
          <ChevronDown size={12} className="text-text-tertiary shrink-0" />
        ) : (
          <ChevronRight size={12} className="text-text-tertiary shrink-0" />
        )}
        <span className="text-[11px] text-text-tertiary uppercase tracking-wider font-sans font-medium flex-1">
          {title}
        </span>
        {actions && (
          <span className="shrink-0" onClick={(e) => e.stopPropagation()}>
            {actions}
          </span>
        )}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

export default CollapsibleSection;
