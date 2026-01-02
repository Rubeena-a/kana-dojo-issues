'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import type {
  CharacterMasteryItem,
  ContentFilter,
  MasteryLevel
} from '../../types/stats';
import { classifyCharacter } from '../../lib/classifyCharacter';
import { detectContentType } from '../../lib/detectContentType';
import { calculateAccuracy } from '../../lib/calculateAccuracy';

/**
 * Props for the CharacterMasteryPanel component
 */
export interface CharacterMasteryPanelProps {
  /** Raw character mastery data from the stats store */
  characterMastery: Record<string, { correct: number; incorrect: number }>;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Content type filter tabs configuration
 */
const CONTENT_FILTERS: { value: ContentFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'kana', label: 'Kana' },
  { value: 'kanji', label: 'Kanji' },
  { value: 'vocabulary', label: 'Vocabulary' }
];

/**
 * Theme-compliant mastery level configuration
 */
const MASTERY_CONFIG: Record<
  MasteryLevel,
  { label: string; colorClass: string; bgClass: string; opacity: number }
> = {
  mastered: {
    label: 'Mastered',
    colorClass: 'text-[var(--main-color)]',
    bgClass: 'bg-[var(--main-color)]',
    opacity: 1
  },
  learning: {
    label: 'Learning',
    colorClass: 'text-[var(--secondary-color)]',
    bgClass: 'bg-[var(--secondary-color)]',
    opacity: 0.8
  },
  'needs-practice': {
    label: 'Needs Practice',
    colorClass: 'text-[var(--secondary-color)]',
    bgClass: 'bg-[var(--secondary-color)]',
    opacity: 0.5
  }
};

/**
 * Transforms raw character mastery data into CharacterMasteryItem array
 */
function transformCharacterData(
  characterMastery: Record<string, { correct: number; incorrect: number }>
): CharacterMasteryItem[] {
  return Object.entries(characterMastery).map(([character, stats]) => {
    const total = stats.correct + stats.incorrect;
    const accuracy = calculateAccuracy(stats.correct, stats.incorrect);
    const masteryLevel = classifyCharacter(stats.correct, stats.incorrect);
    const contentType = detectContentType(character);

    return {
      character,
      correct: stats.correct,
      incorrect: stats.incorrect,
      total,
      accuracy,
      masteryLevel,
      contentType
    };
  });
}

/**
 * Gets the top N characters by a sorting criteria
 */
export function getTopCharacters(
  characters: CharacterMasteryItem[],
  count: number,
  sortBy: 'difficult' | 'mastered'
): CharacterMasteryItem[] {
  const filtered = characters.filter(char => {
    if (sortBy === 'difficult') {
      return char.total >= 5;
    }
    return char.masteryLevel === 'mastered';
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'difficult') {
      return a.accuracy - b.accuracy;
    }
    return b.accuracy - a.accuracy;
  });

  return sorted.slice(0, count);
}

/**
 * CharacterMasteryPanel Component
 *
 * Premium panel with bold typography, asymmetric layout,
 * and smooth color transitions.
 */
export default function CharacterMasteryPanel({
  characterMastery,
  className
}: CharacterMasteryPanelProps) {
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');

  const { filteredCharacters, topDifficult, topMastered, groupedByMastery } =
    useMemo(() => {
      const allCharacters = transformCharacterData(characterMastery);

      const filtered =
        contentFilter === 'all'
          ? allCharacters
          : allCharacters.filter(char => char.contentType === contentFilter);

      const difficult = getTopCharacters(filtered, 5, 'difficult');
      const mastered = getTopCharacters(filtered, 5, 'mastered');

      const grouped: Record<MasteryLevel, CharacterMasteryItem[]> = {
        mastered: [],
        learning: [],
        'needs-practice': []
      };

      filtered.forEach(char => {
        grouped[char.masteryLevel].push(char);
      });

      return {
        filteredCharacters: filtered,
        topDifficult: difficult,
        topMastered: mastered,
        groupedByMastery: grouped
      };
    }, [characterMastery, contentFilter]);

  const hasCharacters = filteredCharacters.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn(
        'group relative overflow-hidden rounded-3xl',
        'border border-[var(--border-color)]/50 bg-[var(--card-color)]',
        'p-6',
        className
      )}
    >
      {/* Large decorative circle */}
      <div className='pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full bg-gradient-to-br from-[var(--main-color)]/5 to-transparent' />

      <div className='relative z-10 flex flex-col gap-6'>
        {/* Header with filter tabs */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h3 className='text-2xl font-black text-[var(--main-color)]'>
              Character Mastery
            </h3>
            <p className='text-sm text-[var(--secondary-color)]/70'>
              Your learning progress at a glance
            </p>
          </div>

          {/* Pill-style filter tabs */}
          <div className='flex gap-1 rounded-full bg-[var(--background-color)] p-1'>
            {CONTENT_FILTERS.map(filter => (
              <button
                key={filter.value}
                onClick={() => setContentFilter(filter.value)}
                className={cn(
                  'relative cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300',
                  contentFilter === filter.value
                    ? 'text-[var(--main-color)]'
                    : 'text-[var(--secondary-color)]/70 hover:text-[var(--main-color)]'
                )}
              >
                {contentFilter === filter.value && (
                  <motion.div
                    layoutId='activeFilterTab'
                    className='absolute inset-0 rounded-full bg-[var(--card-color)] shadow-sm'
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <span className='relative z-10'>{filter.label}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode='wait'>
          {!hasCharacters ? (
            <motion.div
              key='empty'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='flex flex-col items-center justify-center py-16 text-center'
            >
              <div className='mb-4 text-6xl opacity-30'>文</div>
              <p className='text-[var(--secondary-color)]'>
                No characters practiced yet
              </p>
              <p className='text-sm text-[var(--secondary-color)]/60'>
                Start training to see your mastery progress!
              </p>
            </motion.div>
          ) : (
            <motion.div
              key='content'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='space-y-6'
            >
              {/* Two-column character display */}
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                {/* Needs Practice column */}
                <div className='space-y-4'>
                  <div className='flex items-center gap-3'>
                    <div className='h-3 w-3 rounded-full bg-[var(--secondary-color)]/50' />
                    <h4 className='text-sm font-bold tracking-wider text-[var(--secondary-color)] uppercase'>
                      Needs Practice
                    </h4>
                  </div>
                  {topDifficult.length > 0 ? (
                    <div className='space-y-2'>
                      {topDifficult.map((char, idx) => (
                        <CharacterRow
                          key={char.character}
                          item={char}
                          index={idx}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className='rounded-2xl bg-[var(--background-color)] p-6 text-center'>
                      <p className='text-sm text-[var(--secondary-color)]/60'>
                        Keep practicing!
                      </p>
                    </div>
                  )}
                </div>

                {/* Top Mastered column */}
                <div className='space-y-4'>
                  <div className='flex items-center gap-3'>
                    <div className='h-3 w-3 rounded-full bg-[var(--main-color)]' />
                    <h4 className='text-sm font-bold tracking-wider text-[var(--main-color)] uppercase'>
                      Top Mastered
                    </h4>
                  </div>
                  {topMastered.length > 0 ? (
                    <div className='space-y-2'>
                      {topMastered.map((char, idx) => (
                        <CharacterRow
                          key={char.character}
                          item={char}
                          index={idx}
                          isMastered
                        />
                      ))}
                    </div>
                  ) : (
                    <div className='rounded-2xl bg-[var(--background-color)] p-6 text-center'>
                      <p className='text-sm text-[var(--secondary-color)]/60'>
                        Master characters to see them here!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mastery level summary - horizontal pills */}
              <div className='flex flex-wrap items-center gap-3 border-t border-[var(--border-color)]/30 pt-6'>
                {(
                  Object.entries(groupedByMastery) as [
                    MasteryLevel,
                    CharacterMasteryItem[]
                  ][]
                ).map(([level, chars]) => {
                  const config = MASTERY_CONFIG[level];
                  return (
                    <motion.div
                      key={level}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        'flex items-center gap-2 rounded-full px-4 py-2',
                        'bg-[var(--background-color)]',
                        'border border-[var(--border-color)]/30'
                      )}
                    >
                      <div
                        className='h-2 w-2 rounded-full'
                        style={{
                          backgroundColor:
                            level === 'mastered'
                              ? 'var(--main-color)'
                              : 'var(--secondary-color)',
                          opacity: config.opacity
                        }}
                      />
                      <span className='text-sm font-bold text-[var(--main-color)]'>
                        {chars.length}
                      </span>
                      <span className='text-sm text-[var(--secondary-color)]'>
                        {config.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/**
 * Individual character row - color transitions only
 */
function CharacterRow({
  item,
  index,
  isMastered = false
}: {
  item: CharacterMasteryItem;
  index: number;
  isMastered?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: isMastered ? 10 : -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        'flex cursor-pointer items-center justify-between rounded-2xl p-4',
        'bg-[var(--background-color)]',
        'border border-transparent',
        'transition-colors duration-300',
        'hover:border-[var(--main-color)]/20 hover:bg-[var(--border-color)]/20'
      )}
    >
      <span className='text-3xl font-bold text-[var(--main-color)]'>
        {item.character}
      </span>
      <div className='text-right'>
        <div
          className={cn(
            'text-lg font-black',
            isMastered
              ? 'text-[var(--main-color)]'
              : 'text-[var(--secondary-color)]'
          )}
        >
          {item.accuracy.toFixed(0)}%
        </div>
        <div className='text-xs text-[var(--secondary-color)]/60'>
          {item.total} tries
        </div>
      </div>
    </motion.div>
  );
}
