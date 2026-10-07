import { useRef, useState } from 'react'
import {
  Stage,
  Layer,
  Line,
  Rect,
  Circle,
  Arrow,
} from 'react-konva'

function WhiteboardCanvas({
  tool,
  strokeColor,
  brushSize,
  zoom,
}) {
  const stageRef = useRef(null)
  const [elements, setElements] = useState([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentId, setCurrentId] = useState(null)

  const getPointer = () => {
    const stage = stageRef.current
    const pointer = stage.getPointerPosition()

    return {
      x: pointer.x / (zoom / 100),
      y: pointer.y / (zoom / 100),
    }
  }

  const handleMouseDown = () => {
    if (!['pen', 'rectangle', 'circle', 'line', 'arrow'].includes(tool)) {
      return
    }

    const point = getPointer()
    const id = `${Date.now()}-${Math.random()}`

    setIsDrawing(true)
    setCurrentId(id)

    if (tool === 'pen') {
      setElements((items) => [
        ...items,
        {
          id,
          type: 'pen',
          points: [point.x, point.y],
          color: strokeColor,
          size: brushSize,
        },
      ])
      return
    }

    setElements((items) => [
      ...items,
      {
        id,
        type: tool,
        x: point.x,
        y: point.y,
        endX: point.x,
        endY: point.y,
        color: strokeColor,
        size: brushSize,
      },
    ])
  }

  const handleMouseMove = () => {
    if (!isDrawing || !currentId) return

    const point = getPointer()

    setElements((items) =>
      items.map((item) => {
        if (item.id !== currentId) return item

        if (item.type === 'pen') {
          return {
            ...item,
            points: [...item.points, point.x, point.y],
          }
        }

        return {
          ...item,
          endX: point.x,
          endY: point.y,
        }
      })
    )
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
    setCurrentId(null)
  }

  const renderElement = (item) => {
    if (item.type === 'pen') {
      return (
        <Line
          key={item.id}
          points={item.points}
          stroke={item.color}
          strokeWidth={item.size}
          lineCap="round"
          lineJoin="round"
          tension={0.25}
        />
      )
    }

    if (item.type === 'rectangle') {
      return (
        <Rect
          key={item.id}
          x={Math.min(item.x, item.endX)}
          y={Math.min(item.y, item.endY)}
          width={Math.abs(item.endX - item.x)}
          height={Math.abs(item.endY - item.y)}
          stroke={item.color}
          strokeWidth={item.size}
        />
      )
    }

    if (item.type === 'circle') {
      return (
        <Circle
          key={item.id}
          x={item.x}
          y={item.y}
          radius={Math.max(
            Math.abs(item.endX - item.x),
            Math.abs(item.endY - item.y)
          )}
          stroke={item.color}
          strokeWidth={item.size}
        />
      )
    }

    if (item.type === 'line') {
      return (
        <Line
          key={item.id}
          points={[item.x, item.y, item.endX, item.endY]}
          stroke={item.color}
          strokeWidth={item.size}
          lineCap="round"
        />
      )
    }

    if (item.type === 'arrow') {
      return (
        <Arrow
          key={item.id}
          points={[item.x, item.y, item.endX, item.endY]}
          stroke={item.color}
          fill={item.color}
          strokeWidth={item.size}
          pointerLength={12}
          pointerWidth={12}
        />
      )
    }

    return null
  }

  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth}
      height={window.innerHeight}
      scaleX={zoom / 100}
      scaleY={zoom / 100}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: 'absolute',
        inset: 0,
        cursor:
          tool === 'select'
            ? 'default'
            : tool === 'pan'
              ? 'grab'
              : 'crosshair',
      }}
    >
      <Layer>
        {elements.map(renderElement)}
      </Layer>
    </Stage>
  )
}

export default WhiteboardCanvas
