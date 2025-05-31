// client/src/components/ResizablePanel.tsx
import React, { useState, useRef, useCallback } from 'react';

interface ResizablePanelProps {
    children: React.ReactNode;
    minWidth?: number;
    maxWidth?: number;
    defaultWidth?: number;
    position?: 'left' | 'right';
    className?: string;
    onWidthChange?: (width: number) => void;
}

const ResizablePanel: React.FC<ResizablePanelProps> = ({
    children,
    minWidth = 200,
    maxWidth = 1200,
    defaultWidth = 384,
    position = 'right',
    className = '',
    onWidthChange
}) => {
    const [width, setWidth] = useState(defaultWidth);
    const [isResizing, setIsResizing] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const startX = useRef(0);
    const startWidth = useRef(0);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        startX.current = e.clientX;
        startWidth.current = width;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = position === 'right'
                ? startX.current - e.clientX
                : e.clientX - startX.current;

            const newWidth = Math.min(
                Math.max(startWidth.current + deltaX, minWidth),
                maxWidth
            );

            setWidth(newWidth);
            onWidthChange?.(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
    }, [width, minWidth, maxWidth, position, onWidthChange]);

    const resizerPosition = position === 'right' ? 'left-0' : 'right-0';

    return (
        <div
            ref={panelRef}
            className={`relative flex flex-col bg-white border-gray-200 ${position === 'right' ? 'border-l' : 'border-r'} ${className}`}
            style={{ width: `${width}px` }}
        >
            {/* Resize Handle */}
            <div
                className={`absolute top-0 ${resizerPosition} w-1 h-full bg-transparent hover:bg-blue-400 cursor-col-resize transition-colors z-10 group`}
                onMouseDown={handleMouseDown}
                title="Drag to resize panel"
            >
                <div className={`w-full h-full bg-gray-300 opacity-0 group-hover:opacity-100 transition-opacity ${isResizing ? 'opacity-100 bg-blue-500' : ''}`} />
                <div className={`absolute top-1/2 transform -translate-y-1/2 ${position === 'right' ? '-left-1' : '-right-1'} w-3 h-8 bg-gray-400 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${isResizing ? 'opacity-100 bg-blue-500' : ''}`}>
                    <div className="w-0.5 h-4 bg-white rounded-full mx-0.5"></div>
                    <div className="w-0.5 h-4 bg-white rounded-full mx-0.5"></div>
                </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {children}
            </div>

            {/* Width indicator */}
            {isResizing && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs z-20">
                    {width}px
                </div>
            )}
        </div>
    );
};

export default ResizablePanel;