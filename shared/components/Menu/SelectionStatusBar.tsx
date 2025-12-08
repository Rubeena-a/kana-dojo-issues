'use client';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import useKanjiStore from '@/features/Kanji/store/useKanjiStore';
import useVocabStore from '@/features/Vocabulary/store/useVocabStore';
import { usePathname } from 'next/navigation';
import { removeLocaleFromPath } from '@/shared/lib/pathUtils';
import { useClick } from '@/shared/hooks/useAudio';
import { CircleCheck, Trash } from 'lucide-react';
import { ActionButton } from '@/shared/components/ui/ActionButton';
import { AnimatePresence, motion } from 'framer-motion';

type ContentType = 'kanji' | 'vocabulary';

const SelectionStatusBar = () => {
  const { playClick } = useClick();
  const pathname = usePathname();
  const pathWithoutLocale = removeLocaleFromPath(pathname);
  const contentType = pathWithoutLocale.slice(1) as ContentType;

  const isKanji = contentType === 'kanji';

  // Kanji store
  const { selectedKanjiSets, clearKanjiObjs, clearKanjiSets } = useKanjiStore();

  // Vocab store
  const { selectedVocabSets, clearVocabObjs, clearVocabSets } = useVocabStore();

  const selectedSets = isKanji ? selectedKanjiSets : selectedVocabSets;

  const hasSelection = selectedSets.length > 0;

  const handleClear = () => {
    playClick();
    if (isKanji) {
      clearKanjiSets();
      clearKanjiObjs();
    } else {
      clearVocabSets();
      clearVocabObjs();
    }
  };

  const [layout, setLayout] = useState<{
    top: number;
    left: number | string;
    width: number | string;
  }>({
    top: 0,
    left: 0,
    width: '100%'
  });

  useEffect(() => {
    const updateLayout = () => {
      const sidebar = document.getElementById('main-sidebar');
      const width = window.innerWidth;

      let top = 0;
      let left: number | string = 0;
      let barWidth: number | string = '100%';

      // Calculate Horizontal Layout
      if (width >= 1024) {
        // Desktop: Stretch from sidebar's right edge to viewport right edge
        if (sidebar) {
          const sidebarRect = sidebar.getBoundingClientRect();
          left = sidebarRect.right;
          barWidth = width - sidebarRect.right;
        }
      } else {
        // Mobile: Full width
        left = 0;
        barWidth = '100%';
      }

      setLayout({ top, left, width: barWidth });
    };

    updateLayout();

    let observer: ResizeObserver | null = null;
    const sidebar = document.getElementById('main-sidebar');

    if (sidebar) {
      observer = new ResizeObserver(() => {
        updateLayout();
      });
      observer.observe(sidebar);
    }

    window.addEventListener('resize', updateLayout);

    return () => {
      window.removeEventListener('resize', updateLayout);
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  const formattedSelection =
    selectedSets.length > 0
      ? selectedSets
          .sort((a, b) => {
            const numA = parseInt(a.replace('Set ', ''));
            const numB = parseInt(b.replace('Set ', ''));
            return numA - numB;
          })
          .join(', ')
          .replace(/Set /g, 'Level ')
      : 'None';

  return (
    <AnimatePresence>
      {hasSelection && (
        <motion.div
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            top: `${layout.top}px`,
            left:
              typeof layout.left === 'number'
                ? `${layout.left}px`
                : layout.left,
            width:
              typeof layout.width === 'number'
                ? `${layout.width}px`
                : layout.width
          }}
          className={clsx(
            'fixed z-40',
            'bg-[var(--card-color)]',
            'border-b-2 border-[var(--border-color)] w-full '
          )}
        >
          <div
            className={clsx(
              'flex flex-row items-center justify-center gap-2 md:gap-4',
              'w-full w-full ',
              'py-3 px-4'
            )}
          >
            {/* Selected Levels Info */}
            <div className='flex flex-row items-start gap-2 flex-1 min-w-0'>
              <CircleCheck
                className='text-[var(--secondary-color)] shrink-0 mt-0.5'
                size={20}
              />
              <span className='text-sm md:text-base whitespace-nowrap'>
                Selected:
              </span>
              <span className='text-[var(--secondary-color)] text-sm md:text-base break-words'>
                {formattedSelection}
              </span>
            </div>

            {/* Clear Button */}
            <ActionButton
              // colorScheme='main'
              borderColorScheme='main'
              borderRadius='2xl'
              borderBottomThickness={6}
              className='py-2 px-4 bg-[var(--main-color)]/80 w-1/5'
              onClick={handleClear}
              aria-label='Clear selected levels'
            >
              <Trash size={20} />
            </ActionButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SelectionStatusBar;
