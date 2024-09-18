import React, { useState, useRef, useEffect } from 'react';
import './ColorSelector.css';

const ColorSelector = ({ selectedColor, onColorChange }) => {
  const [slots, setSlots] = useState([
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'
  ]);
  const [activeSlot, setActiveSlot] = useState(0); // First slot selected by default
  const colorInputRef = useRef(null); // Reference for hidden color input

  useEffect(() => {
    onColorChange(slots[activeSlot]); // Initialize the selected color from the first slot
  }, [onColorChange, slots]);

  // Handle slot selection
  const handleSlotClick = (index) => {
    setActiveSlot(index); // Set the clicked slot as active
    onColorChange(slots[index]); // Update the color in PixelCanvas
  };

  // Handle color change from hidden color picker
  const handleColorChange = (e) => {
    const newColor = e.target.value;
    if (activeSlot !== null) {
      const updatedSlots = [...slots];
      updatedSlots[activeSlot] = newColor; // Update the color of the active slot
      setSlots(updatedSlots);
      onColorChange(newColor); // Set the selected color globally
    }
  };

  // Trigger color picker input when the selected slot is clicked
  const handleSelectedSlotClick = () => {
    if (activeSlot !== null) {
      colorInputRef.current.click(); // Open the hidden color picker
    }
  };

  return (
    <div className="color-selector">
      {activeSlot !== null && (
        <div
          className="selected-slot"
          style={{ backgroundColor: slots[activeSlot] }}
          onClick={handleSelectedSlotClick}
        />
      )}

      <input
        type="color"
        ref={colorInputRef}
        style={{ display: 'none' }}
        onChange={handleColorChange}
      />

      <div className="custom-slots">
        {slots.map((slotColor, index) => (
          <div
            key={index}
            className={`color-slot ${activeSlot === index ? 'active' : ''}`}
            style={{
              backgroundColor: slotColor,
            }}
            onClick={() => handleSlotClick(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorSelector;