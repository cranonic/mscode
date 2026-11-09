// src/features/editor/components/Teardrops/TeardropsOverlay.tsx
import React, { useRef } from 'react';
import {
  CursorDropSVG,
  StartDropSVG,
  EndDropSVG,
  HandleCaret,
  DROP_W,
} from './components/TeardropsShapes';

interface TeardropsOverlayProps {
  cursorDOMRef: React.RefObject<HTMLDivElement | null>;
  selectionStartDOMRef: React.RefObject<HTMLDivElement | null>;
  selectionEndDOMRef: React.RefObject<HTMLDivElement | null>;

  activeDragType: 'cursor' | 'start' | 'end' | null;
  onDragStart: (e: React.TouchEvent) => void;
  onDragMove: (e: React.TouchEvent, type: 'cursor' | 'start' | 'end') => void;
  onDragEnd: () => void;

  onHandleClick: (type: 'cursor' | 'start' | 'end') => void;
  onHandleDoubleClick: (type: 'cursor' | 'start' | 'end') => void;
}

const BASE_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  willChange: 'transform',
  zIndex: 100,
  touchAction: 'none',
  display: 'none',
};

export const TeardropsOverlay: React.FC<TeardropsOverlayProps> = ({
  cursorDOMRef,
  selectionStartDOMRef,
  selectionEndDOMRef,
  activeDragType,
  onDragStart,
  onDragMove,
  onDragEnd,
  onHandleClick,
  onHandleDoubleClick,
}) => {
  const lastTapRef = useRef<number>(0);

  const stopMonacoAction = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    onDragEnd();
  };

  const handleTap = (e: React.MouseEvent | React.TouchEvent, type: 'cursor' | 'start' | 'end') => {
    e.stopPropagation();
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;
    if (timeDiff > 0 && timeDiff < 400) {
      onHandleDoubleClick(type);
      lastTapRef.current = 0;
    } else {
      onHandleClick(type);
      lastTapRef.current = now;
    }
  };

  // Active handle stays fully visible; idle handles slightly soft while dragging
  const styleFor = (type: 'cursor' | 'start' | 'end'): React.CSSProperties => {
    const isActive = activeDragType === type;
    const isDragging = activeDragType != null;
    return {
      ...BASE_STYLE,
      opacity: isDragging ? (isActive ? 1 : 0.45) : 1,
      transition: isDragging ? 'none' : 'opacity 0.15s',
      zIndex: isActive ? 120 : 100,
      pointerEvents: 'auto',
    };
  };

  return (
    <>
      <style>{`
        @keyframes ms-caret-blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .ms-teardrop-caret--blink {
          animation: ms-caret-blink 1s step-end infinite;
        }
        .ms-teardrop-handle {
          position: absolute;
        }
        .ms-teardrop-handle__body {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
      `}</style>

      {/* Cursor Drop — caret always on tip when shown / active */}
      <div
        ref={cursorDOMRef}
        className="ms-teardrop-handle"
        style={{ ...styleFor('cursor'), marginLeft: -DROP_W / 2 }}
        onTouchStart={onDragStart}
        onTouchMove={e => onDragMove(e, 'cursor')}
        onTouchEnd={handleTouchEnd}
        onMouseDown={stopMonacoAction}
        onClick={e => handleTap(e, 'cursor')}
        onContextMenu={e => e.preventDefault()}
      >
        <div className="ms-teardrop-handle__body">
          <HandleCaret visible blinking={activeDragType === 'cursor' || activeDragType == null} />
          <CursorDropSVG />
        </div>
      </div>

      {/* Start Drop */}
      <div
        ref={selectionStartDOMRef}
        className="ms-teardrop-handle"
        style={{ ...styleFor('start'), marginLeft: -DROP_W }}
        onTouchStart={onDragStart}
        onTouchMove={e => onDragMove(e, 'start')}
        onTouchEnd={handleTouchEnd}
        onMouseDown={stopMonacoAction}
        onClick={e => handleTap(e, 'start')}
        onContextMenu={e => e.preventDefault()}
      >
        <div className="ms-teardrop-handle__body">
          <HandleCaret visible={activeDragType === 'start'} blinking />
          <StartDropSVG />
        </div>
      </div>

      {/* End Drop */}
      <div
        ref={selectionEndDOMRef}
        className="ms-teardrop-handle"
        style={styleFor('end')}
        onTouchStart={onDragStart}
        onTouchMove={e => onDragMove(e, 'end')}
        onTouchEnd={handleTouchEnd}
        onMouseDown={stopMonacoAction}
        onClick={e => handleTap(e, 'end')}
        onContextMenu={e => e.preventDefault()}
      >
        <div className="ms-teardrop-handle__body">
          <HandleCaret visible={activeDragType === 'end'} blinking />
          <EndDropSVG />
        </div>
      </div>
    </>
  );
};
