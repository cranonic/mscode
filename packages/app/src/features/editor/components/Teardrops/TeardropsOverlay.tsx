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

  const styleFor = (type: 'cursor' | 'start' | 'end'): React.CSSProperties => {
    const isActive = activeDragType === type;
    const isDragging = activeDragType != null;
    return {
      ...BASE_STYLE,
      opacity: isDragging ? (isActive ? 1 : 0.45) : 1,
      transition: isDragging ? 'none' : 'opacity 0.15s',
      zIndex: isActive ? 120 : 100,
      pointerEvents: 'auto',
      // Anchor transform to the selection EDGE, not geometric center of drop:
      // start → right edge of handle = edge; end → left edge; cursor → center
      marginLeft:
        type === 'start' ? -DROP_W : type === 'end' ? 0 : -DROP_W / 2,
    };
  };

  return (
    <>
      <style>{`
        
          50%, 100% { opacity: 0; }
        }
        .ms-teardrop-handle__body {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: ${DROP_W}px;
        }
      `}</style>

      {/* Single cursor handle — caret center 50% */}
      <div
        ref={cursorDOMRef}
        className="ms-teardrop-handle"
        style={styleFor('cursor')}
        onTouchStart={onDragStart}
        onTouchMove={e => onDragMove(e, 'cursor')}
        onTouchEnd={handleTouchEnd}
        onMouseDown={stopMonacoAction}
        onClick={e => handleTap(e, 'cursor')}
        onContextMenu={e => e.preventDefault()}
      >
        <div className="ms-teardrop-handle__body">
          <HandleCaret visible align="center" />
          <CursorDropSVG />
        </div>
      </div>

      {/* Left / start handle — caret at right: 0% */}
      <div
        ref={selectionStartDOMRef}
        className="ms-teardrop-handle"
        style={styleFor('start')}
        onTouchStart={onDragStart}
        onTouchMove={e => onDragMove(e, 'start')}
        onTouchEnd={handleTouchEnd}
        onMouseDown={stopMonacoAction}
        onClick={e => handleTap(e, 'start')}
        onContextMenu={e => e.preventDefault()}
      >
        <div className="ms-teardrop-handle__body">
          <HandleCaret visible={activeDragType === 'start' || activeDragType == null} align="start" />
          <StartDropSVG />
        </div>
      </div>

      {/* Right / end handle — caret at left: 0% */}
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
          <HandleCaret visible={activeDragType === 'end' || activeDragType == null} align="end" />
          <EndDropSVG />
        </div>
      </div>
    </>
  );
};
