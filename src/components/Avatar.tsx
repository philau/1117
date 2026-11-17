import React, { useState } from 'react';
import { User } from 'lucide-react';
import { DEFAULT_AVATAR_PATH } from '../types';

interface AvatarProps {
  src?: string | null;
  alt: string;
  sizeClass?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  sizeClass = 'w-10 h-10',
}) => {
  const [imgStage, setImgStage] = useState<'primary' | 'fallback' | 'svg'>(
    src ? 'primary' : 'fallback'
  );

  const currentSrc = imgStage === 'primary' && src ? src : DEFAULT_AVATAR_PATH;

  if (imgStage === 'svg') {
    return (
      <div
        className={`${sizeClass} rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0`}
        aria-label={alt}
      >
        <User className="w-1/2 h-1/2" />
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => {
        if (imgStage === 'primary') {
          setImgStage('fallback');
        } else {
          setImgStage('svg');
        }
      }}
      className={`${sizeClass} rounded-full object-cover border border-slate-200 bg-slate-100 shrink-0`}
    />
  );
};
