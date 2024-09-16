import React from 'react';
import './ColorSelector.css';

const ColorSelector = ({ selectedColor, onColorChange }) => {
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#000000', '#FFFFFF'];

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
