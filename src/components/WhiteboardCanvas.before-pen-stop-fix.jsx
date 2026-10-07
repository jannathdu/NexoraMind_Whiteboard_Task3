import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import {
  Stage,
  Layer,
  Line,
  Rect,
  Circle,
  Arrow,
  Text,
  Transformer,
} from 'react-konva'

const WhiteboardCanvas = forwardRef(function WhiteboardCanvas(
  {
    tool,
    strokeColor,
    brushSize,
    zoom,
    fontSize = 24,
    onZoomChange,
  },
  ref
) {
  const stageRef = useRef(null)
  const transformerRef = useRef(null)

  const [elements, setElements] = useState([])
  const elementsRef = useRef([])

  const [history, setHistory] = useState([[]])
  const [historyIndex, setHistoryIndex] = useState(0)

  const [isDrawing, setIsDrawing] = useState(false)
  const [currentId, setCurrentId] = useState(null)

  const isDrawingRef = useRef(false)
  const currentIdRef = useRef(null)
  const [selectedId, setSelectedId] = useState(null)

  const [stagePosition, setStagePosition] = useState({
    x: 0,
    y: 0,
  })

  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState(null)

  const scale = zoom / 100

  useEffect(() => {
    elementsRef.current = elements
  }, [elements])

  const cloneElements = (items) =>
    items.map((item) => ({
      ...item,
      points: item.points ? [...item.points] : undefined,
    }))

  const pushHistory = (nextElements) => {
    const snapshot = cloneElements(nextElements)

    setHistory((currentHistory) => {
      let nextHistory = currentHistory.slice(0, historyIndex + 1)

      nextHistory.push(snapshot)

      if (nextHistory.length > 21) {
        nextHistory = nextHistory.slice(-21)
      }

      setHistoryIndex(nextHistory.length - 1)

      return nextHistory
    })
  }

  const undo = () => {
    if (historyIndex <= 0) return

    const newIndex = historyIndex - 1
    const snapshot = cloneElements(history[newIndex] || [])

    setHistoryIndex(newIndex)
    setElements(snapshot)
    elementsRef.current = snapshot
    setSelectedId(null)
  }

  const redo = () => {
    if (historyIndex >= history.length - 1) return

    const newIndex = historyIndex + 1
    const snapshot = cloneElements(history[newIndex] || [])

    setHistoryIndex(newIndex)
    setElements(snapshot)
    elementsRef.current = snapshot
    setSelectedId(null)
  }

  const loadElements = (savedElements) => {
    const loaded = Array.isArray(savedElements)
      ? cloneElements(savedElements)
      : []

    setElements(loaded)
    elementsRef.current = loaded

    setHistory([cloneElements(loaded)])
    setHistoryIndex(0)
    setSelectedId(null)
  }

  useImperativeHandle(ref, () => ({
    undo,
    redo,

    canUndo: () => historyIndex > 0,

    canRedo: () =>
      historyIndex < history.length - 1,

    getElements: () =>
      cloneElements(elementsRef.current),

    loadElements,

    getStage: () => stageRef.current,
  }))

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isCtrl =
        event.ctrlKey || event.metaKey

      if (!isCtrl) return

      if (
        event.key.toLowerCase() === 'z' &&
        !event.shiftKey
      ) {
        event.preventDefault()
        undo()
      }

      if (
        event.key.toLowerCase() === 'y' ||
        (
          event.key.toLowerCase() === 'z' &&
          event.shiftKey
        )
      ) {
        event.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [history, historyIndex])

  const getPointer = () => {
    const stage = stageRef.current
    const pointer = stage?.getPointerPosition()

    if (!pointer) {
      return {
        x: 0,
        y: 0,
      }
    }

    return {
      x: (pointer.x - stagePosition.x) / scale,
      y: (pointer.y - stagePosition.y) / scale,
    }
  }

  const handleMouseDown = (event) => {
    const stage = stageRef.current

    if (tool === 'pan') {
      const pointer = stage?.getPointerPosition()

      if (!pointer) return

      setIsPanning(true)
      setLastPanPoint(pointer)
      return
    }

    if (tool === 'select') {
      if (event.target === stage) {
        setSelectedId(null)
      }

      return
    }

    if (tool === 'eraser') {
      return
    }

    const point = getPointer()

    if (tool === 'text') {
      const textValue = window.prompt('Enter text')

      if (!textValue?.trim()) return

      const newElement = {
        id: `${Date.now()}-${Math.random()}`,
        type: 'text',
        x: point.x,
        y: point.y,
        text: textValue,
        color: strokeColor,
        fontSize,
      }

      const nextElements = [
        ...elementsRef.current,
        newElement,
      ]

      setElements(nextElements)
      elementsRef.current = nextElements
      pushHistory(nextElements)

      return
    }

    if (
      ![
        'pen',
        'rectangle',
        'circle',
        'line',
        'arrow',
      ].includes(tool)
    ) {
      return
    }

    const id = `${Date.now()}-${Math.random()}`

    setIsDrawing(true)
    setCurrentId(id)

    isDrawingRef.current = true
    currentIdRef.current = id

    let newElement

    if (tool === 'pen') {
      newElement = {
        id,
        type: 'pen',
        points: [point.x, point.y],
        color: strokeColor,
        size: brushSize,
      }
    } else {
      newElement = {
        id,
        type: tool,
        x: point.x,
        y: point.y,
        endX: point.x,
        endY: point.y,
        color: strokeColor,
        size: brushSize,
      }
    }

    const nextElements = [
      ...elementsRef.current,
      newElement,
    ]

    setElements(nextElements)
    elementsRef.current = nextElements
  }

  const handleMouseMove = () => {
    if (
      tool === 'pan' &&
      isPanning &&
      lastPanPoint
    ) {
      const stage = stageRef.current
      const pointer = stage?.getPointerPosition()

      if (!pointer) return

      const dx = pointer.x - lastPanPoint.x
      const dy = pointer.y - lastPanPoint.y

      setStagePosition((current) => ({
        x: current.x + dx,
        y: current.y + dy,
      }))

      setLastPanPoint(pointer)

      return
    }

    if (!isDrawingRef.current || !currentIdRef.current) return

    const point = getPointer()

    const nextElements = elementsRef.current.map((item) => {
      if (item.id !== currentIdRef.current) {
        return item
      }

      if (item.type === 'pen') {
        return {
          ...item,
          points: [
            ...item.points,
            point.x,
            point.y,
          ],
        }
      }

      return {
        ...item,
        endX: point.x,
        endY: point.y,
      }
    })

    setElements(nextElements)
    elementsRef.current = nextElements
  }

  const handleMouseUp = () => {
    if (isDrawingRef.current) {
      pushHistory(elementsRef.current)
    }

    setIsDrawing(false)
    setCurrentId(null)

    isDrawingRef.current = false
    currentIdRef.current = null

    setIsPanning(false)
    setLastPanPoint(null)
  }

  const handleElementClick = (id) => {
    if (tool === 'eraser') {
      const nextElements =
        elementsRef.current.filter(
          (item) => item.id !== id
        )

      setElements(nextElements)
      elementsRef.current = nextElements
      pushHistory(nextElements)

      if (selectedId === id) {
        setSelectedId(null)
      }

      return
    }

    if (tool === 'select') {
      setSelectedId(id)
    }
  }

  const handleDragEnd = (id, event) => {
    const node = event.target

    const nextElements =
      elementsRef.current.map((item) => {
        if (item.id !== id) {
          return item
        }

        if (item.type === 'pen') {
          const dx = node.x()
          const dy = node.y()

          node.position({
            x: 0,
            y: 0,
          })

          return {
            ...item,
            points: item.points.map((value, index) =>
              index % 2 === 0
                ? value + dx
                : value + dy
            ),
          }
        }

        if (
          item.type === 'line' ||
          item.type === 'arrow'
        ) {
          const dx = node.x()
          const dy = node.y()

          node.position({
            x: 0,
            y: 0,
          })

          return {
            ...item,
            x: item.x + dx,
            y: item.y + dy,
            endX: item.endX + dx,
            endY: item.endY + dy,
          }
        }

        return {
          ...item,
          x: node.x(),
          y: node.y(),
        }
      })

    setElements(nextElements)
    elementsRef.current = nextElements
    pushHistory(nextElements)
  }

  const commonProps = (item) => ({
    id: item.id,

    draggable:
      tool === 'select',

    hitStrokeWidth:
      Math.max(
        item.size || 4,
        20
      ),

    onMouseDown: (event) => {
      if (tool === 'eraser') {
        event.cancelBubble = true
        handleElementClick(item.id)
      }
    },

    onTouchStart: (event) => {
      if (tool === 'eraser') {
        event.cancelBubble = true
        handleElementClick(item.id)
      }
    },

    onClick: () => {
      if (tool === 'select') {
        handleElementClick(item.id)
      }
    },

    onTap: () => {
      if (tool === 'select') {
        handleElementClick(item.id)
      }
    },

    onDragEnd: (event) =>
      handleDragEnd(item.id, event),
  })

  const renderElement = (item) => {
    if (item.type === 'pen') {
      return (
        <Line
          key={item.id}
          {...commonProps(item)}
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
          {...commonProps(item)}
          x={Math.min(item.x, item.endX)}
          y={Math.min(item.y, item.endY)}
          width={Math.abs(item.endX - item.x)}
          height={Math.abs(item.endY - item.y)}
          stroke={item.color}
          fill="rgba(0,0,0,0.001)"
          strokeWidth={item.size}
        />
      )
    }

    if (item.type === 'circle') {
      return (
        <Circle
          key={item.id}
          {...commonProps(item)}
          x={item.x}
          y={item.y}
          radius={Math.max(
            Math.abs(item.endX - item.x),
            Math.abs(item.endY - item.y)
          )}
          stroke={item.color}
          fill="rgba(0,0,0,0.001)"
          strokeWidth={item.size}
        />
      )
    }

    if (item.type === 'line') {
      return (
        <Line
          key={item.id}
          {...commonProps(item)}
          points={[
            item.x,
            item.y,
            item.endX,
            item.endY,
          ]}
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
          {...commonProps(item)}
          points={[
            item.x,
            item.y,
            item.endX,
            item.endY,
          ]}
          stroke={item.color}
          fill={item.color}
          strokeWidth={item.size}
          pointerLength={12}
          pointerWidth={12}
        />
      )
    }

    if (item.type === 'text') {
      return (
        <Text
          key={item.id}
          {...commonProps(item)}
          x={item.x}
          y={item.y}
          text={item.text}
          fill={item.color}
          fontSize={item.fontSize}
        />
      )
    }

    return null
  }

  const selectedElement =
    elements.find(
      (item) =>
        item.id === selectedId
    )

  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth}
      height={window.innerHeight}
      scaleX={scale}
      scaleY={scale}
      x={stagePosition.x}
      y={stagePosition.y}
      onPointerDown={handleMouseDown}
      onPointerMove={handleMouseMove}
      onPointerUp={handleMouseUp}
      onPointerLeave={handleMouseUp}
      onPointerCancel={handleMouseUp}
      onWheel={(event) => {
        event.evt.preventDefault()

        const direction =
          event.evt.deltaY > 0
            ? -1
            : 1

        const nextZoom =
          direction > 0
            ? zoom + 10
            : zoom - 10

        const clampedZoom =
          Math.min(
            300,
            Math.max(
              25,
              nextZoom
            )
          )

        onZoomChange?.(
          clampedZoom
        )
      }}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        touchAction: 'none',
        userSelect: 'none',

        cursor:
          tool === 'select'
            ? 'default'
            : tool === 'pan'
              ? isPanning
                ? 'grabbing'
                : 'grab'
              : tool === 'eraser'
                ? 'not-allowed'
                : 'crosshair',
      }}
    >
      <Layer>

        {elements.map(renderElement)}

        {selectedElement &&
          tool === 'select' && (
            <Transformer
              ref={transformerRef}
              nodes={[
                stageRef.current?.findOne(
                  `#${selectedElement.id}`
                ),
              ].filter(Boolean)}
              rotateEnabled={false}
              resizeEnabled={false}
            />
          )}

      </Layer>
    </Stage>
  )
})

export default WhiteboardCanvas



