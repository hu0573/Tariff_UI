import React from "react";

interface ScreenshotDividerProps {
  id?: string;
  className?: string;
  isVisible?: boolean;
  label?: string;
}

export const ScreenshotDivider: React.FC<ScreenshotDividerProps> = ({
  id = "divider",
  className = "",
  isVisible = true,
  label,
}) => {
  // 只在指定模式下显示分割线
  if (!isVisible) {
    return null;
  }

  return (
    <div
      id={`screenshot-divider-${id}`}
      className={`screenshot-divider ${className}`}
      style={{
        width: "100%",
        height: "8px",             // 严格的8px高度
        backgroundColor: "#FF0000", // 鲜红色 (RGB: 255, 0, 0)
        border: "none",            // 无边框
        margin: "0",               // 无外边距，紧贴内容
        padding: "0",              // 无内边距
        position: "relative",
        zIndex: 9999,              // 确保在最上层
        clear: "both",
        // 确保在打印和截图中都清晰
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* 标签仅用于调试或人工验证，设为不可见以免影响像素检测 */}
      {label && (
        <span
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            fontSize: "0",
            color: "transparent",
            height: "0",
            overflow: "hidden",
            display: "none" // 完全隐藏，不需要显示
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};
