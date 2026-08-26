import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="leafio-image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'image'}
      onClick={onClose}
    >
      <img src={src} alt={alt} onClick={(event) => event.stopPropagation()} />
    </div>,
    document.body,
  );
}
