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
    }
  };

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

  const handleZoomIn = () => {
    setTransformOrigin({ x: '50%', y: '50%' });
    setScale((prevScale) => Math.max(prevScale + 0.1, 0.3));
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

  const handleSave = () => {
    const binaryArray = [];

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const { color, timestamp } = pixelState[y][x];

        const colorInt = parseInt(color.slice(1), 16);
        binaryArray.push((colorInt >> 16) & 255); // Red
        binaryArray.push((colorInt >> 8) & 255);  // Green
        binaryArray.push(colorInt & 255);         // Blue

        const timestampBytes = new Uint8Array(new Uint32Array([timestamp]).buffer);
        binaryArray.push(...timestampBytes);
      }
    }

    const blob = new Blob([new Uint8Array(binaryArray)], { type: 'application/octet-stream' });
    uploadBlob(blob);
  };

  const uploadBlob = async (blob) => {
    const publisherUrl = 'https://publisher-devnet.walrus.space';
    const aggregatorUrl = 'https://aggregator-devnet.walrus.space';
    const numEpochs = 1;

    try {
      const response = await fetch(`${publisherUrl}/v1/store?epochs=${numEpochs}`, {
        method: 'PUT',
        body: blob,
      });

      if (response.status === 200) {
        const storageInfo = await response.json();
        displayUpload(storageInfo, blob.type, aggregatorUrl);
      } else {
        throw new Error('Something went wrong when storing the blob!');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('An error occurred while uploading the file. Please check the console for details.');
    }
  };

  const displayUpload = (storageInfo, mediaType, aggregatorUrl) => {
    let info = {};
    const SUI_NETWORK = "testnet";
    const SUI_VIEW_TX_URL = `https://suiscan.xyz/${SUI_NETWORK}/tx`;
    const SUI_VIEW_OBJECT_URL = `https://suiscan.xyz/${SUI_NETWORK}/object`;

    if ('alreadyCertified' in storageInfo) {
      info = {
        status: 'Already certified',
        blobId: storageInfo.alreadyCertified.blobId,
        endEpoch: storageInfo.alreadyCertified.endEpoch,
        suiRefType: 'Previous Sui Certified Event',
        suiRef: storageInfo.alreadyCertified.event.txDigest,
        suiBaseUrl: SUI_VIEW_TX_URL,
      };
    } else if ('newlyCreated' in storageInfo) {
      info = {
        status: 'Newly created',
        blobId: storageInfo.newlyCreated.blobObject.blobId,
        endEpoch: storageInfo.newlyCreated.blobObject.storage.endEpoch,
        suiRefType: 'Associated Sui Object',
        suiRef: storageInfo.newlyCreated.blobObject.id,
        suiBaseUrl: SUI_VIEW_OBJECT_URL,
      };
    } else {
      throw new Error('Unhandled successful response!');
    }

    const blobUrl = `${aggregatorUrl}/v1/${info.blobId}`;
    const suiUrl = `${info.suiBaseUrl}/${info.suiRef}`;

    console.log(`Blob successfully uploaded: ${blobUrl}`);
    console.log(`Sui Object URL: ${suiUrl}`);
    alert(`Blob uploaded successfully! Blob ID: ${info.blobId}`);
  };

  return (
    <div className="pixel-canvas-wrapper">
      <div className="zoom-controls">
        <button onClick={handleZoomIn} className="zoom-in-button">
          <img alt="zoom-in" className="zoom-in-img" src="https://www.svgrepo.com/show/2087/plus.svg" />
        </button>
        <button onClick={handleZoomOut} className="zoom-out-button">
          <img alt="zoom-out" className="zoom-out-img" src="https://www.svgrepo.com/show/45046/minus.svg" />
        </button>
      </div>
      <div className="selectors">
        <ColorSelector selectedColor={selectedColor} onColorChange={handleColorChange} />
      </div>
      <div className="save-walrus-container">
        <button onClick={handleSave} className="btn btn-primary">Save on Walrus</button>
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
