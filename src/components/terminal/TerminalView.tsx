import { useCallback, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useTerminal } from '@/hooks/useTerminal';

function TerminalView() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  // Callback ref: triggers re-render when div is assigned, so useTerminal sees the node
  const containerCallback = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, []);

  useTerminal(container, currentProject?.rootPath ?? null);

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-terminal">
        <p className="font-mono text-sm text-text-tertiary">Sin proyecto abierto</p>
      </div>
    );
  }

  return (
    <div
      ref={containerCallback}
      className="h-full w-full"
      style={{ backgroundColor: 'var(--bg-terminal)' }}
    />
  );
}

export default TerminalView;
