'use client';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import { removeLocaleFromPath } from '@/shared/lib/pathUtils';

const Banner = () => {
  const pathname = usePathname();
  const pathWithoutLocale = removeLocaleFromPath(pathname);
  const isKanaRoute = pathWithoutLocale === '/kana';
  const isKanjiRoute = pathWithoutLocale.startsWith('/kanji');
  const isVocabRoute = pathWithoutLocale === '/vocabulary';
  const isPreferencesRoute = pathWithoutLocale === '/preferences';

  const subheading =
    isKanaRoute
      ? 'Kana あ'
      : isKanjiRoute
        ? 'Kanji 字'
        : isVocabRoute
          ? 'Vocabulary 語'
          : isPreferencesRoute
            ? 'Preferences 設'
            : '';
  return (
    <h2
      className={clsx(
        'pt-3 text-3xl lg:pt-6',
        'flex items-center gap-2 overflow-hidden',
      )}
    >
      <span className='text-(--secondary-color)'>
        {subheading.split(' ')[1]}
      </span>
      <span>{subheading.split(' ')[0]}</span>
    </h2>
  );
};

export default Banner;
