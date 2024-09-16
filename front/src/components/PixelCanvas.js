import React, { useRef, useState, useEffect } from 'react';
import './PixelCanvas.css';

const WIDTH = 160;
const HEIGHT = 90;
const PIXEL_SIZE = 20;

const tenMinutesLater = 10 * 60 * 1000;    // 10 minutes
const thirtyMinutesLater = 30 * 60 * 1000; // 30 minutes
const oneHourLater = 1 * 60 * 60 * 1000;   // 1 hour
const twelveHoursLater = 12 * 60 * 60 * 1000; // 12 hours
const twentyFourHoursLater = 24 * 60 * 60 * 1000; // 24 hours

const PixelCanvas = () => {
  const canvasRef = useRef(null);
  const [selectedTimeLock, setSelectedTimeLock] = useState(tenMinutesLater);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [hoveredPixel, setHoveredPixel] = useState({ x: null, y: null });
  const [scale, setScale] = useState(1);
  const [transformOrigin, setTransformOrigin] = useState({ x: '50%', y: '50%' });
  const [dragging, setDragging] = useState(false);
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });

  // Initialize pixel state, each pixel has {color: '#FFFFFF', timestamp: 0}
  const [pixelState, setPixelState] = useState(
    Array.from({ length: HEIGHT }, () =>
      Array.from({ length: WIDTH }, () => ({ color: '#FFFFFF', timestamp: 0 }))
    )
  );

  const handleTimeLockChange = (time) => {
    setSelectedTimeLock(time);
  };

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
    const pixelX = hoveredPixel.x / PIXEL_SIZE;
    const pixelY = hoveredPixel.y / PIXEL_SIZE;
    const currentTime = Date.now();

    // Check if the pixel is locked (current time is before the timestamp)
    if (currentTime > pixelState[pixelY][pixelX].timestamp) {
      ctx.fillStyle = selectedColor;
      ctx.fillRect(hoveredPixel.x, hoveredPixel.y, PIXEL_SIZE, PIXEL_SIZE);

      const updatedPixelState = [...pixelState];
      updatedPixelState[pixelY][pixelX] = {
        color: selectedColor,
        timestamp: currentTime + selectedTimeLock
      };
      setPixelState(updatedPixelState);
    } else {
      alert('This pixel is locked until ' + new Date(pixelState[pixelY][pixelX].timestamp).toLocaleString());
      return;
    }
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
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.5));
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

  // Save the canvas state
  const handleSave = () => {
    const binaryArray = [];

    // Flatten the 2D pixelState array into a binary array
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const { color, timestamp } = pixelState[y][x];

        // Convert color hex to RGB values and push each component to the array
        const colorInt = parseInt(color.slice(1), 16);
        binaryArray.push((colorInt >> 16) & 255); // Red
        binaryArray.push((colorInt >> 8) & 255);  // Green
        binaryArray.push(colorInt & 255);         // Blue

        // Save timestamp as a 32-bit integer (4 bytes)
        const timestampBytes = new Uint8Array(new Uint32Array([timestamp]).buffer);
        binaryArray.push(...timestampBytes);
      }
    }

    const blob = new Blob([new Uint8Array(binaryArray)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'canvas_state.bin';
    a.click();
    URL.revokeObjectURL(url); // Clean up the URL object
  };

  // Load the binary file and update the pixelState
  const handleLoad = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const binaryArray = new Uint8Array(e.target.result);
      const newPixelState = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill({ color: '#FFFFFF', timestamp: 0 }));

      // Iterate through the binary data to restore pixel state and color
      let index = 0;
      for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
          const red = binaryArray[index++];
          const green = binaryArray[index++];
          const blue = binaryArray[index++];
          const color = `#${((1 << 24) | (red << 16) | (green << 8) | blue).toString(16).slice(1).toUpperCase()}`;

          // Restore timestamp from the next 4 bytes
          const timestampBytes = binaryArray.slice(index, index + 4);
          const timestamp = new DataView(timestampBytes.buffer).getUint32(0, true);
          index += 4;

          newPixelState[y][x] = { color, timestamp };
        }
      }

      setPixelState(newPixelState);
      redrawCanvas(newPixelState);
    };
    reader.readAsArrayBuffer(file);
  };

  // Redraw the canvas based on the pixelState
  const redrawCanvas = (newPixelState) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        ctx.fillStyle = newPixelState[y][x].color;
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      }
    }
  };

  return (
    <div className="pixel-canvas-wrapper">
      <div className="zoom-controls">
        <button onClick={handleZoomIn}>Zoom In</button>
        <button onClick={handleZoomOut}>Zoom Out</button>
      </div>
        <div className="color-menu">
          {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#000000', '#FFFFFF'].map((color) => (
            <div
              key={color}
              className="color-swatch"
              style={{
                backgroundColor: color,
                width: selectedColor === color ? '48px' : '40px',
                height: selectedColor === color ? '48px' : '40px',
                border: selectedColor === color ? '2px solid black' : 'none',
              }}
              onClick={() => handleColorChange(color)}
            />
          ))}
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
