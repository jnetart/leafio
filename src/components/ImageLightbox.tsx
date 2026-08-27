import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { attachLightboxDismiss } from '../lib/image-lightbox';
import { IconClose } from './icons';

interface ImageLightboxProps {
  src: string;
  alt: string;
  closeLabel: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, closeLabel, onClose }: ImageLightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    return attachLightboxDismiss(window, onClose);
  }, [onClose]);

  return createPortal(
    <div
      className="leafio-image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={alt || closeLabel}
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <button
        ref={closeRef}
        type="button"
        className="leafio-image-lightbox-close"
        aria-label={closeLabel}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }}
      >
        <IconClose className="h-4 w-4" />
      </button>
      <img src={src} alt={alt} draggable={false} />
    </div>,
    document.body,
  );
}
