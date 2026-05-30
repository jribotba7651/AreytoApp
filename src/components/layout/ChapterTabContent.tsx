import { Group, Panel, Separator } from 'react-resizable-panels';
import type { Layout } from 'react-resizable-panels';
import { ChevronLeft } from 'lucide-react';
import SidebarPanel from '@/components/panels/SidebarPanel';
import EditorPanel from '@/components/panels/EditorPanel';
import TerminalPanel from '@/components/panels/TerminalPanel';
import VersionsPanel from '@/components/panels/VersionsPanel';
import { useLayoutStore } from '@/stores/layoutStore';

const HANDLE_H = 'resize-handle-h';
const HANDLE_V = 'resize-handle-v';

function MiddlePanels() {
  const setSizes = useLayoutStore((s) => s.setSizes);
  const { editor, terminal } = useLayoutStore((s) => s.sizes);

  return (
    <Group
      orientation="vertical"
      defaultLayout={{ editor, terminal }}
      onLayoutChanged={(layout: Layout) => {
        setSizes({
          editor: layout['editor'] ?? editor,
          terminal: layout['terminal'] ?? terminal,
        });
      }}
    >
      <Panel id="editor" minSize="20%">
        <EditorPanel />
      </Panel>
      <Separator className={HANDLE_V} />
      <Panel id="terminal" minSize="15%">
        <TerminalPanel />
      </Panel>
    </Group>
  );
}

function ChapterTabContent() {
  const { sizes, isVersionsCollapsed, setSizes, toggleVersionsPanel } = useLayoutStore();

  if (isVersionsCollapsed) {
    const middleSize = 100 - sizes.sidebar;

    return (
      <div className="relative h-full">
        <Group
          orientation="horizontal"
          defaultLayout={{ 'sidebar-c': sizes.sidebar, 'middle-c': middleSize }}
          onLayoutChanged={(layout: Layout) => {
            setSizes({ sidebar: layout['sidebar-c'] ?? sizes.sidebar });
          }}
        >
          <Panel id="sidebar-c" minSize="10%" maxSize="30%">
            <SidebarPanel />
          </Panel>
          <Separator className={HANDLE_H} />
          <Panel id="middle-c">
            <MiddlePanels />
          </Panel>
        </Group>
        <button
          onClick={toggleVersionsPanel}
          aria-label="Expandir panel de versiones"
          className="absolute right-2 top-2 flex items-center justify-center w-6 h-6 rounded bg-bg-secondary border border-border-default text-text-tertiary hover:text-text-primary transition-colors duration-150"
        >
          <ChevronLeft size={14} />
        </button>
      </div>
    );
  }

  const middleSize = 100 - sizes.sidebar - sizes.versions;

  return (
    <div className="h-full">
      <Group
        orientation="horizontal"
        defaultLayout={{ sidebar: sizes.sidebar, middle: middleSize, versions: sizes.versions }}
        onLayoutChanged={(layout: Layout) => {
          setSizes({
            sidebar: layout['sidebar'] ?? sizes.sidebar,
            versions: layout['versions'] ?? sizes.versions,
          });
        }}
      >
        <Panel id="sidebar" minSize="10%" maxSize="30%">
          <SidebarPanel />
        </Panel>
        <Separator className={HANDLE_H} />
        <Panel id="middle">
          <MiddlePanels />
        </Panel>
        <Separator className={HANDLE_H} />
        <Panel id="versions" minSize="10%" maxSize="40%">
          <VersionsPanel />
        </Panel>
      </Group>
    </div>
  );
}

export default ChapterTabContent;
