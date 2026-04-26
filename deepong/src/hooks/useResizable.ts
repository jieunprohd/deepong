import { useState, useCallback, useEffect, useRef } from "react";

interface UseResizableProps {
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  storageKey?: string;
}

export function useResizable({
  initialWidth,
  minWidth,
  maxWidth,
  storageKey,
}: UseResizableProps) {
  // useState 지연 초기화를 사용하여 첫 렌더링 전에 localStorage 값을 읽어옴
  const [width, setWidth] = useState(() => {
    if (typeof window !== "undefined" && storageKey) {
      const savedWidth = localStorage.getItem(storageKey);
      if (savedWidth) {
        return parseInt(savedWidth, 10);
      }
    }
    return initialWidth;
  });

  const [isResizing, setIsResizing] = useState(false);
  const isFirstRender = useRef(true);

  // 너비가 변경될 때마다 localStorage에 저장 (초기 로드는 useState에서 이미 처리됨)
  useEffect(() => {
    if (storageKey) {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      localStorage.setItem(storageKey, width.toString());
    }
  }, [width, storageKey]);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX - 72; // Sidebar width (72px)
        if (newWidth >= minWidth && newWidth <= maxWidth) {
          setWidth(newWidth);
        }
      }
    },
    [isResizing, minWidth, maxWidth],
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return {
    width,
    isResizing,
    startResizing,
  };
}
