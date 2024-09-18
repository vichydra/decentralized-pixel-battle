import React, { useRef, useState, useEffect } from 'react';
import './PixelCanvas.css';
import ColorSelector from './ColorSelector';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const WIDTH = 160;
const HEIGHT = 90;
const PIXEL_SIZE = 20;
const windowH = window.innerHeight;
const oneMinuteLater = 1 * 60 * 1000;

const PixelCanvas = () => {
  const canvasRef = useRef(null);
  const [selectedTimeLock, setSelectedTimeLock] = useState(oneMinuteLater);
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [hoveredPixel, setHoveredPixel] = useState({ x: null, y: null });
  const [hasMoved, setHasMoved] = useState(false);
  const [scale, setScale] = useState(0.3);
  const [transformOrigin, setTransformOrigin] = useState({ x: '50%', y: '25%' });
  const [dragging, setDragging] = useState(false);
  const [canvasPosition, setCanvasPosition] = useState({ x: -10, y: -0.61 * windowH });
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });

  const [pixelState, setPixelState] = useState(
    Array.from({ length: HEIGHT }, () =>
      Array.from({ length: WIDTH }, () => ({ color: '#b6b6b6', timestamp: 0 }))
    )
  );

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
  
      setHasMoved(true);
    }
  };
  

  const handleMouseClick = async () => {
    if (dragging || hasMoved) return;
  
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
  
      // Salvar o pixel atualizado
      await setDoc(doc(db, "pixelState", `${pixelX}-${pixelY}`), {
        x: pixelX,
        y: pixelY,
        color: selectedColor,
        timestamp: currentTime + selectedTimeLock
      });
    } else {
      alert('Este pixel está bloqueado até ' + new Date(pixelState[pixelY][pixelX].timestamp).toLocaleString());
    }
  };

  const handleZoomChange = (e) => {
    const newScale = parseFloat(e.target.value);
    setScale(newScale);
    setTransformOrigin({ x: '50%', y: '50%' });
  };

  const handleWheel = (e) => {
    if (e.deltaY < 0) {
      setScale((prevScale) => Math.min(prevScale + 0.1, 2));
    } else {
      setScale((prevScale) => Math.max(prevScale - 0.1, 0.3));
    }
  };

  const handleMouseDown = (e) => {
    setDragging(true);
    setStartDrag({ x: e.clientX, y: e.clientY });
    setHasMoved(false);  
  };
  

  const handleMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    // Set up a real-time listener for pixel state changes
    const unsubscribe = onSnapshot(collection(db, "pixelState"), (snapshot) => {
      const newPixelState = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill({ color: '#000000', timestamp: 0 }));
  
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
        <input 
          type="range" 
          min="0.3" 
          max="2" 
          step="0.1" 
          value={scale} 
          onChange={handleZoomChange} 
          className="zoom-slider" 
        />
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
