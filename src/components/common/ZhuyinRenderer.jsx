import React, { memo } from 'react';

const ZhuyinRenderer = ({ 
  text, 
  isActive, 
  className = ""
}) => {
  if (!text) return null;

  const baseClass = isActive ? `font-with-zhuyin ${className}` : className;

  return (
    <span className={baseClass.trim()}>
      {text}
    </span>
  );
};

// 🌟 效能優化核心：由於移除了 TTS 狀態，現在只需要最基本的比對
const areEqual = (prevProps, nextProps) => {
  return prevProps.text === nextProps.text && 
         prevProps.isActive === nextProps.isActive &&
         prevProps.className === nextProps.className;
};

export default memo(ZhuyinRenderer, areEqual);