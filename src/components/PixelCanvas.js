import React, { useRef, useEffect, useState } from 'react';
import './PixelCanvas.css';

const WIDTH = 160;
const HEIGHT = 90;

const PixelCanvas = () => {
  const canvasRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    // Initial rendering of black pixels
    for (let x = 0; x < WIDTH; x++) {
      for (let y = 0; y < HEIGHT; y++) {
        context.fillStyle = 'black';
        context.fillRect(x, y, 1, 1);
      }
    }

    // Handle hover effect
    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor((event.clientX - rect.left) * scaleX);
      const y = Math.floor((event.clientY - rect.top) * scaleY);

      // Clear canvas and redraw
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Redraw all pixels
      for (let i = 0; i < WIDTH; i++) {
        for (let j = 0; j < HEIGHT; j++) {
          context.fillStyle = 'black';
          context.fillRect(i, j, 1, 1);
        }
      }

      // Highlight hovered pixel
      context.strokeStyle = 'white';
      context.strokeRect(x, y, 1, 1);
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [zoomLevel]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 1));
  };

  return (
    <div>
      <div className="controls">
        <button onClick={handleZoomIn}>Zoom In</button>
        <button onClick={handleZoomOut}>Zoom Out</button>
      </div>
      <div
        style={{
          width: `${WIDTH * zoomLevel}px`,
          height: `${HEIGHT * zoomLevel}px`,
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: '0 0',
            border: '1px solid black',
          }}
        />
      </div>
    </div>
  );
};

export default PixelCanvas;
