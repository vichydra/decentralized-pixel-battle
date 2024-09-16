import React from 'react';
import './ColorSelector.css';

const ColorSelector = ({ selectedColor, onColorChange }) => {
  const colors = [
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#000000', // Black
    '#FFFFFF', // White
    '#4c3228', // Brown
    '#6a4a3a', // Brown 2
    '#FFA500', // Orange
    '#800080', // Purple
    '#808080', // Gray
  ];

  return (
    <div className="color-menu">
      {colors.map((color) => (
        <div
          key={color}
          className="color-swatch"
          style={{
            backgroundColor: color,
            width: selectedColor === color ? '48px' : '40px',
            height: selectedColor === color ? '48px' : '40px',
            border: selectedColor === color ? '2px solid black' : 'none',
          }}
          onClick={() => onColorChange(color)}
        />
      ))}
    </div>
  );
};

export default ColorSelector;
