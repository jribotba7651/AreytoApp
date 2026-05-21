import { useState } from 'react';
import ChapterEditor from '@/components/editor/ChapterEditor';
import { DEMO_CONTENT } from '@/components/editor/demo-content';

function EditorPanel() {
  const [, setContent] = useState(DEMO_CONTENT);

  return (
    <div className="h-full bg-bg-editor">
      <ChapterEditor initialContent={DEMO_CONTENT} onChange={setContent} />
    </div>
  );
}

export default EditorPanel;
