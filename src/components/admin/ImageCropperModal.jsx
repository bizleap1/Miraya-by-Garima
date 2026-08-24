import React, { useState, useRef, useEffect } from 'react';
import {
  X, Check, RotateCw, ZoomIn, ZoomOut, Maximize2,
  Crop as CropIcon, Sparkles, RefreshCw
} from 'lucide-react';

/**
 * MIRAYA LUXURY IMAGE CROPPER & STUDIO
 * Interactive Canvas Cropper supporting 3:4 (Couture), 1:1, 4:5, and Freeform aspect ratios
 */
export default function ImageCropperModal({
  imageSrc,
  onCropComplete,
  onCancel,
  initialAspectRatio = 3 / 4 // Default 3:4 Luxury Fashion Aspect Ratio
}) {
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio); // 3/4, 1, 4/5, null (free)
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Crop Box state relative to display canvas coordinates (x, y, width, height)
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(null); // 'tl', 'tr', 'bl', 'br'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialBoxOnDrag, setInitialBoxOnDrag] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load Image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      resetCropBox(img, aspectRatio);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Update Crop Box whenever Aspect Ratio changes
  useEffect(() => {
    if (imageRef.current && imageLoaded) {
      resetCropBox(imageRef.current, aspectRatio);
    }
  }, [aspectRatio]);

  const resetCropBox = (img, ratio) => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || !img) return;

    // Determine display dimensions while preserving aspect ratio inside container
    const maxW = container.clientWidth - 40;
    const maxH = container.clientHeight - 40;
    let dispW = maxW;
    let dispH = (img.naturalHeight / img.naturalWidth) * maxW;

    if (dispH > maxH) {
      dispH = maxH;
      dispW = (img.naturalWidth / img.naturalHeight) * maxH;
    }

    canvas.width = dispW;
    canvas.height = dispH;

    // Draw base image to canvas
    drawCanvas();

    // Calculate centered crop box
    let boxW, boxH;
    if (ratio) {
      if (dispW / dispH > ratio) {
        boxH = dispH * 0.85;
        boxW = boxH * ratio;
      } else {
        boxW = dispW * 0.85;
        boxH = boxW / ratio;
      }
    } else {
      boxW = dispW * 0.8;
      boxH = dispH * 0.8;
    }

    const boxX = (dispW - boxW) / 2;
    const boxY = (dispH - boxH) / 2;

    setCropBox({ x: boxX, y: boxY, width: boxW, height: boxH });
    setZoom(1);
    setRotation(0);
  };

  // Draw image on canvas with current rotation & zoom
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    const isSideways = rotation % 180 !== 0;
    const drawW = isSideways ? canvas.height : canvas.width;
    const drawH = isSideways ? canvas.width : canvas.height;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  };

  useEffect(() => {
    drawCanvas();
  }, [zoom, rotation, imageLoaded]);

  // Handle Dragging Crop Box
  const handleMouseDownBox = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialBoxOnDrag({ ...cropBox });
  };

  const handleMouseDownHandle = (e, handle) => {
    e.stopPropagation();
    setIsResizing(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialBoxOnDrag({ ...cropBox });
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (isDragging) {
      const newX = Math.max(0, Math.min(canvas.width - initialBoxOnDrag.width, initialBoxOnDrag.x + dx));
      const newY = Math.max(0, Math.min(canvas.height - initialBoxOnDrag.height, initialBoxOnDrag.y + dy));
      setCropBox(prev => ({ ...prev, x: newX, y: newY }));
    } else if (isResizing) {
      let newW = initialBoxOnDrag.width;
      let newH = initialBoxOnDrag.height;
      let newX = initialBoxOnDrag.x;
      let newY = initialBoxOnDrag.y;

      if (isResizing === 'br') {
        newW = Math.max(50, Math.min(canvas.width - initialBoxOnDrag.x, initialBoxOnDrag.width + dx));
        newH = aspectRatio ? newW / aspectRatio : Math.max(50, Math.min(canvas.height - initialBoxOnDrag.y, initialBoxOnDrag.height + dy));
      } else if (isResizing === 'bl') {
        newW = Math.max(50, initialBoxOnDrag.width - dx);
        newX = initialBoxOnDrag.x + (initialBoxOnDrag.width - newW);
        newH = aspectRatio ? newW / aspectRatio : Math.max(50, Math.min(canvas.height - initialBoxOnDrag.y, initialBoxOnDrag.height + dy));
      } else if (isResizing === 'tr') {
        newW = Math.max(50, Math.min(canvas.width - initialBoxOnDrag.x, initialBoxOnDrag.width + dx));
        newH = aspectRatio ? newW / aspectRatio : Math.max(50, initialBoxOnDrag.height - dy);
        newY = initialBoxOnDrag.y + (initialBoxOnDrag.height - newH);
      } else if (isResizing === 'tl') {
        newW = Math.max(50, initialBoxOnDrag.width - dx);
        newX = initialBoxOnDrag.x + (initialBoxOnDrag.width - newW);
        newH = aspectRatio ? newW / aspectRatio : Math.max(50, initialBoxOnDrag.height - dy);
        newY = initialBoxOnDrag.y + (initialBoxOnDrag.height - newH);
      }

      if (newX >= 0 && newY >= 0 && newX + newW <= canvas.width && newY + newH <= canvas.height) {
        setCropBox({ x: newX, y: newY, width: newW, height: newH });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
  };

  // Perform Final Crop & Return Blob
  const handleApplyCrop = () => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    // Create high-resolution export canvas
    const exportCanvas = document.createElement('canvas');
    const scaleFactorX = img.naturalWidth / canvas.width;
    const scaleFactorY = img.naturalHeight / canvas.height;

    const sourceX = cropBox.x * scaleFactorX;
    const sourceY = cropBox.y * scaleFactorY;
    const sourceW = cropBox.width * scaleFactorX;
    const sourceH = cropBox.height * scaleFactorY;

    // Standard output resolution (e.g. up to 1200px width for haute couture clarity)
    const outWidth = Math.min(1200, Math.round(sourceW * zoom));
    const outHeight = Math.round(outWidth * (cropBox.height / cropBox.width));

    exportCanvas.width = outWidth;
    exportCanvas.height = outHeight;
    const ctx = exportCanvas.getContext('2d');

    // Fill white background for clean transparency handling
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outWidth, outHeight);

    ctx.save();
    ctx.translate(outWidth / 2, outHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceW,
      sourceH,
      -outWidth / 2,
      -outHeight / 2,
      outWidth,
      outHeight
    );
    ctx.restore();

    // Convert to high quality JPEG Blob
    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `product-crop-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = exportCanvas.toDataURL('image/jpeg', 0.92);

      onCropComplete({
        file,
        blob,
        dataUrl: previewUrl,
        aspectRatio: cropBox.width / cropBox.height,
      });
    }, 'image/jpeg', 0.92);
  };

  return (
    <div
      className="admin-modal-overlay"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ zIndex: 1200 }}
    >
      <div
        className="admin-modal"
        style={{
          maxWidth: '820px',
          width: '95vw',
          height: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#181110',
          border: '1px solid rgba(198, 164, 106, 0.4)',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '14px 20px',
            background: '#221715',
            borderBottom: '1px solid rgba(198, 164, 106, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CropIcon size={18} style={{ color: '#c6a46a' }} />
            <h3 style={{ margin: 0, fontSize: '15px', color: '#ffffff', fontFamily: 'serif', letterSpacing: '0.04em' }}>
              Crop & Align Garment Image
            </h3>
          </div>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', opacity: 0.8 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* CROPPER VIEWPORT AREA */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            position: 'relative',
            background: '#0d0807',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            userSelect: 'none',
          }}
        >
          {/* Main Canvas displaying scaled image */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }} />

            {/* Dark Mask around crop box */}
            {canvasRef.current && (
              <svg
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: canvasRef.current.width,
                  height: canvasRef.current.height,
                  pointerEvents: 'none',
                }}
              >
                <defs>
                  <mask id="cropMask">
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x={cropBox.x}
                      y={cropBox.y}
                      width={cropBox.width}
                      height={cropBox.height}
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.65)" mask="url(#cropMask)" />
              </svg>
            )}

            {/* Draggable & Resizable Golden Crop Box */}
            {canvasRef.current && (
              <div
                onMouseDown={handleMouseDownBox}
                style={{
                  position: 'absolute',
                  left: `${cropBox.x}px`,
                  top: `${cropBox.y}px`,
                  width: `${cropBox.width}px`,
                  height: `${cropBox.height}px`,
                  border: '2px solid #c6a46a',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  boxSizing: 'border-box',
                }}
              >
                {/* 3x3 Grid Guidelines (Rule of Thirds) */}
                <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', pointerEvents: 'none' }}>
                  <div style={{ borderRight: '1px dashed rgba(198, 164, 106, 0.4)', borderBottom: '1px dashed rgba(198, 164, 106, 0.4)' }} />
                  <div style={{ borderRight: '1px dashed rgba(198, 164, 106, 0.4)', borderBottom: '1px dashed rgba(198, 164, 106, 0.4)' }} />
                  <div style={{ borderBottom: '1px dashed rgba(198, 164, 106, 0.4)' }} />
                  <div style={{ borderRight: '1px dashed rgba(198, 164, 106, 0.4)', borderBottom: '1px dashed rgba(198, 164, 106, 0.4)' }} />
                  <div style={{ borderRight: '1px dashed rgba(198, 164, 106, 0.4)', borderBottom: '1px dashed rgba(198, 164, 106, 0.4)' }} />
                  <div style={{ borderBottom: '1px dashed rgba(198, 164, 106, 0.4)' }} />
                  <div style={{ borderRight: '1px dashed rgba(198, 164, 106, 0.4)' }} />
                  <div style={{ borderRight: '1px dashed rgba(198, 164, 106, 0.4)' }} />
                  <div />
                </div>

                {/* 4 Corner Resize Handles */}
                <div
                  onMouseDown={(e) => handleMouseDownHandle(e, 'tl')}
                  style={{ position: 'absolute', top: '-6px', left: '-6px', width: '14px', height: '14px', background: '#c6a46a', border: '2px solid #fff', cursor: 'nwse-resize', borderRadius: '2px' }}
                />
                <div
                  onMouseDown={(e) => handleMouseDownHandle(e, 'tr')}
                  style={{ position: 'absolute', top: '-6px', right: '-6px', width: '14px', height: '14px', background: '#c6a46a', border: '2px solid #fff', cursor: 'nesw-resize', borderRadius: '2px' }}
                />
                <div
                  onMouseDown={(e) => handleMouseDownHandle(e, 'bl')}
                  style={{ position: 'absolute', bottom: '-6px', left: '-6px', width: '14px', height: '14px', background: '#c6a46a', border: '2px solid #fff', cursor: 'nesw-resize', borderRadius: '2px' }}
                />
                <div
                  onMouseDown={(e) => handleMouseDownHandle(e, 'br')}
                  style={{ position: 'absolute', bottom: '-6px', right: '-6px', width: '14px', height: '14px', background: '#c6a46a', border: '2px solid #fff', cursor: 'nwse-resize', borderRadius: '2px' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* TOOLBAR CONTROLS */}
        <div
          style={{
            padding: '14px 20px',
            background: '#221715',
            borderTop: '1px solid rgba(198, 164, 106, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* ASPECT RATIOS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginRight: '4px' }}>
              Aspect Ratio:
            </span>

            <button
              type="button"
              onClick={() => setAspectRatio(3 / 4)}
              style={{
                background: aspectRatio === 3 / 4 ? '#c6a46a' : '#2f201e',
                color: aspectRatio === 3 / 4 ? '#140d0c' : '#ffffff',
                border: '1px solid rgba(198, 164, 106, 0.3)',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              3:4 Couture
            </button>

            <button
              type="button"
              onClick={() => setAspectRatio(1)}
              style={{
                background: aspectRatio === 1 ? '#c6a46a' : '#2f201e',
                color: aspectRatio === 1 ? '#140d0c' : '#ffffff',
                border: '1px solid rgba(198, 164, 106, 0.3)',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              1:1 Square
            </button>

            <button
              type="button"
              onClick={() => setAspectRatio(4 / 5)}
              style={{
                background: aspectRatio === 4 / 5 ? '#c6a46a' : '#2f201e',
                color: aspectRatio === 4 / 5 ? '#140d0c' : '#ffffff',
                border: '1px solid rgba(198, 164, 106, 0.3)',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              4:5 Editorial
            </button>

            <button
              type="button"
              onClick={() => setAspectRatio(null)}
              style={{
                background: aspectRatio === null ? '#c6a46a' : '#2f201e',
                color: aspectRatio === null ? '#140d0c' : '#ffffff',
                border: '1px solid rgba(198, 164, 106, 0.3)',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Freeform
            </button>
          </div>

          {/* ZOOM & ROTATION CONTROLS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2f201e', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(198,164,106,0.3)' }}>
              <ZoomOut size={13} style={{ color: '#c6a46a' }} />
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={{ width: '80px', accentColor: '#c6a46a', cursor: 'pointer' }}
              />
              <ZoomIn size={13} style={{ color: '#c6a46a' }} />
              <span style={{ fontSize: '10px', color: '#ccc', width: '32px', textAlign: 'right' }}>
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <button
              type="button"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              style={{
                background: '#2f201e',
                border: '1px solid rgba(198,164,106,0.3)',
                color: '#ffffff',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
              title="Rotate 90° Clockwise"
            >
              <RotateCw size={13} style={{ color: '#c6a46a' }} /> Rotate
            </button>

            <button
              type="button"
              onClick={() => { if (imageRef.current) resetCropBox(imageRef.current, aspectRatio); }}
              style={{
                background: '#2f201e',
                border: '1px solid rgba(198,164,106,0.3)',
                color: '#ffffff',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
              title="Reset Crop Position & Zoom"
            >
              <RefreshCw size={13} style={{ color: '#c6a46a' }} /> Reset
            </button>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#ffffff',
                padding: '7px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApplyCrop}
              style={{
                background: '#c6a46a',
                border: 'none',
                color: '#140d0c',
                padding: '7px 20px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(198, 164, 106, 0.35)'
              }}
            >
              <Check size={15} /> Apply & Save Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
