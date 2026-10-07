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

  const [selectedId, setSelectedId] = useState(null)

  const drawingRef = useRef(false)
  const drawingIdRef = useRef(null)

  const [stagePosition, setStagePosition] = useState({
    x: 0,
    y: 0,
  })

  const stagePositionRef = useRef({
    x: 0,
    y: 0,
  })

  const panRef = useRef(false)
  const lastPanRef = useRef(null)

  const scale = zoom / 100

  useEffect(() => {
    elementsRef.current = elements
  }, [elements])

  useEffect(() => {
    stagePositionRef.current = stagePosition
  }, [stagePosition])

  const cloneElements = (items) =>
    items.map((item) => ({
      ...item,
      points: item.points ? [...item.points] : undefined,
    }))

  const pushHistory = (nextElements) => {
    const snapshot = cloneElements(nextElements)

    setHistory((current) => {
      let next = current.slice(0, historyIndex + 1)

      next.push(snapshot)

      if (next.length > 21) {
        next = next.slice(-21)
      }

      setHistoryIndex(next.length - 1)

      return next
    })
  }

  const undo = () => {
    if (historyIndex <= 0) return

    const nextIndex = historyIndex - 1
    const snapshot = cloneElements(history[nextIndex] || [])

    setHistoryIndex(nextIndex)
    setElements(snapshot)
    elementsRef.current = snapshot
    setSelectedId(null)
  }

  const redo = () => {
    if (historyIndex >= history.length - 1) return

    const nextIndex = historyIndex + 1
    const snapshot = cloneElements(history[nextIndex] || [])

    setHistoryIndex(nextIndex)
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
      const ctrl = event.ctrlKey || event.metaKey

      if (!ctrl) return

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

    return () =>
      window.removeEventListener('keydown', handleKeyDown)
  }, [history, historyIndex])

  const nativePointerToCanvas = (event) => {
    const stage = stageRef.current

    if (!stage) {
      return { x: 0, y: 0 }
    }

    const rect = stage.container().getBoundingClientRect()

    const localX = event.clientX - rect.left
    const localY = event.clientY - rect.top

    return {
      x:
        (localX - stagePositionRef.current.x) /
        scale,

      y:
        (localY - stagePositionRef.current.y) /
        scale,
    }
  }

  const stopDrawing = () => {
    if (!drawingRef.current) return

    drawingRef.current = false
    drawingIdRef.current = null

    pushHistory(elementsRef.current)
  }

  useEffect(() => {
    const handleWindowPointerMove = (event) => {
      if (panRef.current && lastPanRef.current) {
        const dx =
          event.clientX - lastPanRef.current.x

        const dy =
          event.clientY - lastPanRef.current.y

        setStagePosition((current) => ({
          x: current.x + dx,
          y: current.y + dy,
        }))

        lastPanRef.current = {
          x: event.clientX,
          y: event.clientY,
        }

        return
      }

      if (
        !drawingRef.current ||
        !drawingIdRef.current
      ) {
        return
      }

      const point = nativePointerToCanvas(event)

      const nextElements =
        elementsRef.current.map((item) => {
          if (item.id !== drawingIdRef.current) {
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

      elementsRef.current = nextElements
      setElements(nextElements)
    }

    const handleWindowPointerUp = () => {
      if (panRef.current) {
        panRef.current = false
        lastPanRef.current = null
      }

      stopDrawing()
    }

    window.addEventListener(
      'pointermove',
      handleWindowPointerMove
    )

    window.addEventListener(
      'pointerup',
      handleWindowPointerUp
    )

    window.addEventListener(
      'pointercancel',
      handleWindowPointerUp
    )

    return () => {
      window.removeEventListener(
        'pointermove',
        handleWindowPointerMove
      )

      window.removeEventListener(
        'pointerup',
        handleWindowPointerUp
      )

      window.removeEventListener(
        'pointercancel',
        handleWindowPointerUp
      )
    }
  }, [scale, historyIndex, history])

  const handlePointerDown = (event) => {
    const stage = stageRef.current

    if (!stage) return

    const nativeEvent = event.evt

    if (tool === 'pan') {
      panRef.current = true

      lastPanRef.current = {
        x: nativeEvent.clientX,
        y: nativeEvent.clientY,
      }

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

    const point = nativePointerToCanvas(nativeEvent)

    if (tool === 'text') {
      const value = window.prompt('Enter text')

      if (!value?.trim()) return

      const newElement = {
        id: `${Date.now()}-${Math.random()}`,
        type: 'text',
        x: point.x,
        y: point.y,
        text: value,
        color: strokeColor,
        fontSize,
      }

      const next = [
        ...elementsRef.current,
        newElement,
      ]

      elementsRef.current = next
      setElements(next)
      pushHistory(next)

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

    let newElement

    if (tool === 'pen') {
      newElement = {
        id,
        type: 'pen',
        points: [
          point.x,
          point.y,
          point.x + 0.01,
          point.y + 0.01,
        ],
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

    const next = [
      ...elementsRef.current,
      newElement,
    ]

    elementsRef.current = next
    setElements(next)

    drawingRef.current = true
    drawingIdRef.current = id
  }

  const handleElementClick = (id) => {
    if (tool === 'eraser') {
      const next =
        elementsRef.current.filter(
          (item) => item.id !== id
        )

      elementsRef.current = next
      setElements(next)
      pushHistory(next)

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

    const next =
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
            points: item.points.map(
              (value, index) =>
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

    elementsRef.current = next
    setElements(next)
    pushHistory(next)
  }

  const commonProps = (item) => ({
    id: item.id,

    draggable:
      tool === 'select',

    hitStrokeWidth:
      Math.max(item.size || 4, 20),

    onPointerDown: (event) => {
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
      onPointerDown={handlePointerDown}
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

        const clamped =
          Math.min(
            300,
            Math.max(
              25,
              nextZoom
            )
          )

        onZoomChange?.(clamped)
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
              ? 'grab'
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
