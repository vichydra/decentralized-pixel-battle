import React, { useRef, useState, useEffect } from 'react';
import './PixelCanvas.css';
import ColorSelector from './ColorSelector';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';  // Assuming you have firebase.js in the same folder

const WIDTH = 160;
const HEIGHT = 90;
const PIXEL_SIZE = 20;
const windowH = window.innerHeight;

const oneMinuteLater = 1 * 60 * 1000; 

const PixelCanvas = () => {
  const canvasRef = useRef(null);
  const [selectedTimeLock, setSelectedTimeLock] = useState(oneMinuteLater);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [hoveredPixel, setHoveredPixel] = useState({ x: null, y: null });
  const [scale, setScale] = useState(0.3);
  const [transformOrigin, setTransformOrigin] = useState({ x: '50%', y: '25%' });
  const [dragging, setDragging] = useState(false);
  const [canvasPosition, setCanvasPosition] = useState({ x: -10, y: -0.6 * windowH });
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });

  const [pixelState, setPixelState] = useState(
    Array.from({ length: HEIGHT }, () =>
      Array.from({ length: WIDTH }, () => ({ color: '#b6b6b6', timestamp: 0 }))
    )
  );

  const handleMouseClick = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pixelX = hoveredPixel.x / PIXEL_SIZE;
    const pixelY = hoveredPixel.y / PIXEL_SIZE;
    const currentTime = Date.now();
  
    if (currentTime > pixelState[pixelY][pixelX].timestamp) {
      ctx.fillStyle = selectedColor;
      ctx.fillRect(hoveredPixel.x, hoveredPixel.y, PIXEL_SIZE, PIXEL_SIZE);
  
      const updatedPixelState = [...pixelState];
      updatedPixelState[pixelY][pixelX] = {
        color: selectedColor,
        timestamp: currentTime + selectedTimeLock
      };
      setPixelState(updatedPixelState);
  
      // Save the updated pixel
      await setDoc(doc(db, "pixelState", `${pixelX}-${pixelY}`), {
        x: pixelX,
        y: pixelY,
        color: selectedColor,
        timestamp: currentTime + selectedTimeLock
      });
    } else {
      alert('This pixel is locked until ' + new Date(pixelState[pixelY][pixelX].timestamp).toLocaleString());
    }
  };
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "pixelState"), (snapshot) => {
      const newPixelState = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill({ color: '#FFFFFF', timestamp: 0 }));
  
      snapshot.forEach((doc) => {
        const { x, y, color, timestamp } = doc.data();
        newPixelState[y][x] = { color, timestamp };
      });
  
      setPixelState(newPixelState);
      redrawCanvas(newPixelState);
    });

    return () => unsubscribe(); // Clean up the listener when the component unmounts
  }, []);  

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
        <button onClick={handleZoomIn} className="zoom-in-button"><img alt="zoom-in" className="zoom-in-img" src="https://www.svgrepo.com/show/2087/plus.svg"></img></button>
        <button onClick={handleZoomOut} className="zoom-out-button"><img alt="zoom-out" className="zoom-out-img" src="https://www.svgrepo.com/show/45046/minus.svg"></img></button>
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
      </div>
    </div>
  );
};

export default PixelCanvas;