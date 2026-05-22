import TerminalView from '@/components/terminal/TerminalView';

function TerminalPanel() {
  return (
    <div className="h-full bg-bg-terminal border-t border-border-subtle overflow-hidden">
      <TerminalView />
    </div>
  );
}

export default TerminalPanel;
