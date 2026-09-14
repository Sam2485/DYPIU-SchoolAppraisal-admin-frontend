import React, { useState, useRef, useEffect } from 'react';

const VIEWPORT_WIDTH = 300;
const VIEWPORT_HEIGHT = 160;
const OUTPUT_WIDTH = 600;
const OUTPUT_HEIGHT = 320;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function LogoCropModal({
  isOpen,
  title = 'Adjust Logo',
  imageSrc,
  onConfirm,
  onClose,
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [baseSize, setBaseSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(false);
  const dragRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setNaturalSize({ width: 0, height: 0 });
      setBaseSize({ width: 0, height: 0 });
      setLoading(false);
    }
  }, [isOpen, imageSrc]);

  if (!isOpen || !imageSrc) return null;

  const handleImageLoad = (e) => {
    const nw = e.currentTarget.naturalWidth || 200;
    const nh = e.currentTarget.naturalHeight || 100;
    setNaturalSize({ width: nw, height: nh });

    // Containment: scale down so entire logo fits comfortably within viewport
    const fitScale = Math.min(
      (VIEWPORT_WIDTH * 0.92) / nw,
      (VIEWPORT_HEIGHT * 0.92) / nh
    );
    const bw = Math.max(10, Math.round(nw * fitScale));
    const bh = Math.max(10, Math.round(nh * fitScale));

    setBaseSize({ width: bw, height: bh });
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: pan.x,
      initialPanY: pan.y,
    };
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current || dragRef.current.pointerId !== e.pointerId) return;
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    setPan({
      x: dragRef.current.initialPanX + deltaX,
      y: dragRef.current.initialPanY + deltaY,
    });
  };

  const handlePointerUp = (e) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    dragRef.current = null;
  };

  const handleZoomChange = (newZoom) => {
    const clamped = clamp(Number(newZoom) || 1, 0.2, 3.0);
    setZoom(Number(clamped.toFixed(2)));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleApply = async () => {
    setLoading(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageSrc;
      });

      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;
      const ctx = canvas.getContext('2d');

      // Clear transparent
      ctx.clearRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

      const ratio = OUTPUT_WIDTH / VIEWPORT_WIDTH;
      const currentBaseW = baseSize.width || (VIEWPORT_WIDTH * 0.92);
      const currentBaseH = baseSize.height || (VIEWPORT_HEIGHT * 0.92);

      const scaledWidth = currentBaseW * zoom * ratio;
      const scaledHeight = currentBaseH * zoom * ratio;
      const drawX = (OUTPUT_WIDTH - scaledWidth) / 2 + pan.x * ratio;
      const drawY = (OUTPUT_HEIGHT - scaledHeight) / 2 + pan.y * ratio;

      ctx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight);

      const dataUrl = canvas.toDataURL('image/png');
      canvas.toBlob((blob) => {
        const file = blob
          ? new File([blob], 'cropped-logo.png', { type: 'image/png' })
          : null;
        onConfirm({ dataUrl, file });
        setLoading(false);
      }, 'image/png');
    } catch (err) {
      console.error('Error generating cropped logo:', err);
      // Fallback directly with source if canvas fails
      onConfirm({ dataUrl: imageSrc, file: null });
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
        <div className="modal-content shadow border-0 rounded-3">
          <div className="modal-header py-2 px-3 bg-light border-bottom">
            <h6 className="modal-title fw-bold text-dark mb-0">{title}</h6>
            <button
              type="button"
              className="btn-close btn-sm"
              aria-label="Close"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <div className="modal-body p-3 text-center">
            <p className="text-muted small mb-2">
              Drag image to position. By default the entire logo fits inside the frame.
            </p>

            {/* Viewport container with Grid Overlay */}
            <div
              style={{
                width: VIEWPORT_WIDTH,
                height: VIEWPORT_HEIGHT,
                margin: '0 auto',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '8px',
                border: '2px dashed #94a3b8',
                backgroundColor: '#ffffff',
                cursor: 'grab',
                touchAction: 'none',
                userSelect: 'none',
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <img
                src={imageSrc}
                alt="Crop preview"
                onLoad={handleImageLoad}
                draggable="false"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: baseSize.width ? `${baseSize.width}px` : 'auto',
                  height: baseSize.height ? `${baseSize.height}px` : 'auto',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                }}
              />

              {/* Minimal Grid Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  backgroundImage: `
                    linear-gradient(to right, transparent 33%, rgba(99, 102, 241, 0.25) 33.5%, transparent 34%, transparent 66%, rgba(99, 102, 241, 0.25) 66.5%, transparent 67%),
                    linear-gradient(to bottom, transparent 33%, rgba(99, 102, 241, 0.25) 33.5%, transparent 34%, transparent 66%, rgba(99, 102, 241, 0.25) 66.5%, transparent 67%)
                  `,
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              />
            </div>

            {/* Zoom Controls */}
            <div className="mt-3 px-2">
              <div className="d-flex align-items-center gap-2 justify-content-center">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm px-2 py-0 fw-bold"
                  onClick={() => handleZoomChange(zoom - 0.1)}
                  title="Zoom Out"
                >
                  −
                </button>
                <input
                  type="range"
                  className="form-range flex-grow-1"
                  min="0.2"
                  max="3.0"
                  step="0.02"
                  value={zoom}
                  onChange={(e) => handleZoomChange(e.target.value)}
                  style={{ maxWidth: '220px' }}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm px-2 py-0 fw-bold"
                  onClick={() => handleZoomChange(zoom + 0.1)}
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm py-0 px-2 fw-semibold"
                  onClick={handleReset}
                  title="Fit Entire Logo to Center"
                >
                  Fit / Reset
                </button>
              </div>
              <small className="text-muted d-block mt-1">Zoom: {Math.round(zoom * 100)}% (100% = Full Logo Fit)</small>
            </div>
          </div>

          <div className="modal-footer py-2 px-3 bg-light border-top d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm px-3"
              onClick={handleApply}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Apply & Save Logo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
