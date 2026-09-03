import { useEffect } from 'react';

// Sets the browser tab title while the calling component is mounted, then
// restores whatever it was before. This is what lets each page (landing,
// a specific business) show its own title instead of whatever was left
// in index.html or set by the previous page.
export function useDocumentTitle(title) {
  useEffect(() => {
    if (!title) return;
    const previousTitle = document.title;
    document.title = title;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
