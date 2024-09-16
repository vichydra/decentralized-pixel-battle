import React, { useRef, useState, useEffect } from 'react';
import './PixelCanvas.css';
import ColorSelector from './ColorSelector';

const WIDTH = 160;
const HEIGHT = 90;
const PIXEL_SIZE = 20;

const PixelCanvas = () => {
  const canvasRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [hoveredPixel, setHoveredPixel] = useState({ x: null, y: null });
  const [scale, setScale] = useState(1);
  const [transformOrigin, setTransformOrigin] = useState({ x: '50%', y: '50%' });
  const [dragging, setDragging] = useState(false);
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });

  const handleColorChange = (color) => {
    setSelectedColor(color);
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (PIXEL_SIZE * scale)) * PIXEL_SIZE;
    const y = Math.floor((e.clientY - rect.top) / (PIXEL_SIZE * scale)) * PIXEL_SIZE;
    setHoveredPixel({ x, y });

    if (dragging) {
      const dx = e.clientX - startDrag.x;
      const dy = e.clientY - startDrag.y;
      setCanvasPosition({ x: canvasPosition.x + dx, y: canvasPosition.y + dy });
      setStartDrag({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseClick = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = selectedColor;
    ctx.fillRect(hoveredPixel.x, hoveredPixel.y, PIXEL_SIZE, PIXEL_SIZE);
  };

  const handleZoomIn = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;

    setTransformOrigin({ x: `${mouseX * 100}%`, y: `${mouseY * 100}%` });
    setScale((prevScale) => Math.min(prevScale + 0.1, 3));
  };

  const handleZoomOut = () => {
    setTransformOrigin({ x: '50%', y: '50%' });
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.3));
  };

  const handleWheel = (e) => {
    if (e.deltaY < 0) {
      handleZoomIn(e);
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDown = (e) => {
    setDragging(true);
    setStartDrag({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, WIDTH * PIXEL_SIZE, HEIGHT * PIXEL_SIZE);
  }, []);

  return (
    <div className="pixel-canvas-wrapper">
      <div className="zoom-controls">
        <button onClick={handleZoomIn} className="zoom-in-button"><img alt="zoom-in" className="zoom-in-img" src="https://www.svgrepo.com/show/2087/plus.svg"></img></button>
        <button onClick={handleZoomOut} className="zoom-out-button"><img alt="zoom-out" className="zoom-out-img" src="https://www.svgrepo.com/show/45046/minus.svg"></img></button>
        {/* mais um botao para centralizar */}
      </div>
      <div className="selectors">
        <ColorSelector selectedColor={selectedColor} onColorChange={handleColorChange} />
      </div>
      <div
        className="canva-container"
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{
          transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px)`
        }}
      >
        <canvas
          ref={canvasRef}
          className="canvas"
          width={WIDTH * PIXEL_SIZE}
          height={HEIGHT * PIXEL_SIZE}
          onClick={handleMouseClick}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: `${transformOrigin.x} ${transformOrigin.y}`,
          }}
        />
        <div
          className="hover-square"
          style={{
            width: PIXEL_SIZE * scale,
            height: PIXEL_SIZE * scale,
            left: hoveredPixel.x * scale,
            top: hoveredPixel.y * scale,
            border: '1px solid black',
          }}
        />
      </div>
    </div>
  );
};

export default PixelCanvas;
