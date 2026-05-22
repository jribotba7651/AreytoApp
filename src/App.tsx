import TopTabs from '@/components/layout/TopTabs';
import ChapterTabContent from '@/components/layout/ChapterTabContent';
import BookTabContent from '@/components/layout/BookTabContent';
import FinishedTabContent from '@/components/layout/FinishedTabContent';
import WelcomeScreen from '@/components/welcome/WelcomeScreen';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function App() {
  const activeTab = useLayoutStore((s) => s.activeTab);
  const currentProject = useProjectStore((s) => s.currentProject);
  useKeyboardShortcuts();

  if (!currentProject) {
    return <WelcomeScreen />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-primary">
      <TopTabs />
      <main className="flex-1 min-h-0">
        {activeTab === 'capitulo' && <ChapterTabContent />}
        {activeTab === 'libro' && <BookTabContent />}
        {activeTab === 'terminados' && <FinishedTabContent />}
      </main>
    </div>
  );
}

export default App;
