import { polyfill } from "mobile-drag-drop";
// 引入預設的捲動行為處理 (當拖曳到邊緣時自動捲動)
import { scrollBehaviourDragImageTranslateOverride } from "mobile-drag-drop/scroll-behaviour";

export function initDragPolyfill() {
  // 啟動 Polyfill
  polyfill({
    // 當拖曳元素時，讓它稍微透明一點，方便看清下方
    dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
    // 長按多久觸發拖曳 (毫秒)
    // 建議設為 300~500ms，太長會覺得卡，太短容易誤觸
    holdToDrag: 300, 
  });

  // 修正 iOS Safari 的捲動干擾問題 (避免拖曳時整個畫面跟著動)
  document.addEventListener("touchmove", function(e) {}, { passive: false });
}