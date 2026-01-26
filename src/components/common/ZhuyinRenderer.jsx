import React from 'react';

const ZhuyinRenderer = ({ text, isActive, className = "" }) => {
  // 如果沒開注音，回傳原本樣式
  if (!isActive) {
    return <span className={className}>{text}</span>;
  }

  // 如果開了注音，加上我們剛剛在 CSS 定義的 class
  return (
    <span className={`font-with-zhuyin ${className}`}>
      {text}
    </span>
  );
};

export default ZhuyinRenderer;