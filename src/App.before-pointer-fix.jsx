import {
  useEffect,
  useRef,
  useState,
} from 'react'

import WhiteboardCanvas from './components/WhiteboardCanvas'

import {
  MousePointer2,
  Pencil,
  Square,
  Circle,
  Minus,
  MoveRight,
  Type,
  Eraser,
  Hand,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Download,
  Save,
  FolderOpen,
  Layers3,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Users,
  ChevronUp,
  ChevronDown,
  Trash2,
} from 'lucide-react'

const tools = [
  {
    id: 'select',
    label: 'Select',
    icon: MousePointer2,
  },
  {
    id: 'pen',
    label: 'Pen',
    icon: Pencil,
  },
  {
    id: 'rectangle',
    label: 'Rectangle',
    icon: Square,
  },
  {
    id: 'circle',
    label: 'Circle',
    icon: Circle,
  },
  {
    id: 'line',
    label: 'Line',
    icon: Minus,
  },
  {
    id: 'arrow',
    label: 'Arrow',
    icon: MoveRight,
  },
  {
    id: 'text',
    label: 'Text',
    icon: Type,
  },
  {
    id: 'eraser',
    label: 'Eraser',
    icon: Eraser,
  },
  {
    id: 'pan',
    label: 'Pan',
    icon: Hand,
  },
]

const createInitialLayers =
  () => [
    {
      id: 'layer-1',
      name: 'Layer 1',
      visible: true,
      locked: false,
      active: true,
    },
    {
      id: 'background',
      name: 'Background',
      visible: true,
      locked: true,
      active: false,
    },
  ]

function ToolButton({
  tool,
  selectedTool,
  onSelect,
}) {
  const Icon = tool.icon

  return (
    <button
      title={tool.label}
      onClick={() =>
        onSelect(tool.id)
      }
      className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
        selectedTool ===
        tool.id
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon size={20} />
    </button>
  )
}

function App() {
  const whiteboardRef =
    useRef(null)

  const [selectedTool, setSelectedTool] =
    useState('select')

  const [zoom, setZoom] =
    useState(100)

  const [
    gridVisible,
    setGridVisible,
  ] = useState(true)

  const [
    strokeColor,
    setStrokeColor,
  ] = useState('#2563eb')

  const [
    brushSize,
    setBrushSize,
  ] = useState(4)

  const [
    fontSize,
    setFontSize,
  ] = useState(24)

  const [layers, setLayers] =
    useState(
      createInitialLayers
    )

  const [
    projectName,
    setProjectName,
  ] = useState(
    'Untitled project'
  )

  const activeLayer =
    layers.find(
      (layer) =>
        layer.active
    ) || layers[0]

  const activeLayerId =
    activeLayer?.id

  // -----------------------------------------
  // AUTO SAVE / RESTORE
  // -----------------------------------------

  useEffect(() => {
    const restoreTimer =
      setTimeout(() => {
        const saved =
          localStorage.getItem(
            'nexora-autosave'
          )

        if (
          !saved ||
          !whiteboardRef.current
        ) {
          return
        }

        try {
          const parsed =
            JSON.parse(saved)

          if (
            Array.isArray(
              parsed
            )
          ) {
            whiteboardRef.current.loadElements(
              parsed
            )

            return
          }

          if (
            Array.isArray(
              parsed.elements
            )
          ) {
            whiteboardRef.current.loadElements(
              parsed.elements
            )
          }

          if (
            Array.isArray(
              parsed.layers
            ) &&
            parsed.layers.length
          ) {
            setLayers(
              parsed.layers
            )
          }

          if (
            typeof parsed.zoom ===
            'number'
          ) {
            setZoom(
              parsed.zoom
            )
          }

          if (
            typeof parsed.gridVisible ===
            'boolean'
          ) {
            setGridVisible(
              parsed.gridVisible
            )
          }

          if (
            parsed.projectName
          ) {
            setProjectName(
              parsed.projectName
            )
          }
        } catch (error) {
          console.error(
            'Failed to restore autosave:',
            error
          )
        }
      }, 300)

    const autoSaveTimer =
      setInterval(() => {
        const elements =
          whiteboardRef.current?.getElements()

        if (!elements) {
          return
        }

        const data = {
          elements,
          layers,
          zoom,
          gridVisible,
          projectName,
          savedAt:
            new Date().toISOString(),
        }

        localStorage.setItem(
          'nexora-autosave',
          JSON.stringify(data)
        )

        console.log(
          'Whiteboard auto-saved'
        )
      }, 30000)

    return () => {
      clearTimeout(
        restoreTimer
      )

      clearInterval(
        autoSaveTimer
      )
    }
  }, [
    layers,
    zoom,
    gridVisible,
    projectName,
  ])

  // -----------------------------------------
  // ZOOM
  // -----------------------------------------

  const changeZoom = (
    amount
  ) => {
    setZoom((current) =>
      Math.min(
        300,
        Math.max(
          25,
          current + amount
        )
      )
    )
  }

  // -----------------------------------------
  // SAVE PROJECT
  // -----------------------------------------

  const saveProject = () => {
    const elements =
      whiteboardRef.current?.getElements()

    if (!elements) {
      alert(
        'Canvas is not ready yet.'
      )

      return
    }

    const name =
      window.prompt(
        'Enter project name',
        projectName ===
          'Untitled project'
          ? ''
          : projectName
      )

    if (!name?.trim()) {
      return
    }

    const cleanName =
      name.trim()

    const projectData = {
      name: cleanName,
      elements,
      layers,
      zoom,
      gridVisible,
      savedAt:
        new Date().toISOString(),
    }

    localStorage.setItem(
      `nexora-project-${cleanName}`,
      JSON.stringify(
        projectData
      )
    )

    setProjectName(
      cleanName
    )

    alert(
      `Project "${cleanName}" saved successfully.`
    )
  }

  // -----------------------------------------
  // LOAD PROJECT
  // -----------------------------------------

  const loadProject = () => {
    const keys =
      Object.keys(
        localStorage
      ).filter((key) =>
        key.startsWith(
          'nexora-project-'
        )
      )

    if (!keys.length) {
      alert(
        'No saved projects found.'
      )

      return
    }

    const available =
      keys
        .map((key) =>
          key.replace(
            'nexora-project-',
            ''
          )
        )
        .join('\n')

    const name =
      window.prompt(
        `Enter project name to load:\n\nAvailable projects:\n${available}`
      )

    if (!name?.trim()) {
      return
    }

    const cleanName =
      name.trim()

    const saved =
      localStorage.getItem(
        `nexora-project-${cleanName}`
      )

    if (!saved) {
      alert(
        `Project "${cleanName}" not found.`
      )

      return
    }

    try {
      const parsed =
        JSON.parse(saved)

      const elements =
        Array.isArray(
          parsed
        )
          ? parsed
          : parsed.elements || []

      whiteboardRef.current?.loadElements(
        elements
      )

      if (
        Array.isArray(
          parsed.layers
        ) &&
        parsed.layers.length
      ) {
        setLayers(
          parsed.layers
        )
      }

      if (
        typeof parsed.zoom ===
        'number'
      ) {
        setZoom(
          parsed.zoom
        )
      }

      if (
        typeof parsed.gridVisible ===
        'boolean'
      ) {
        setGridVisible(
          parsed.gridVisible
        )
      }

      setProjectName(
        cleanName
      )

      alert(
        `Project "${cleanName}" loaded successfully.`
      )
    } catch (error) {
      console.error(
        'Failed to load project:',
        error
      )

      alert(
        'Could not load project.'
      )
    }
  }

  // -----------------------------------------
  // PNG EXPORT
  // -----------------------------------------

  const exportPNG = () => {
    const stage =
      whiteboardRef.current?.getStage()

    if (!stage) {
      alert(
        'Canvas is not ready yet.'
      )

      return
    }

    try {
      const dataURL =
        stage.toDataURL({
          pixelRatio: 2,
        })

      const link =
        document.createElement(
          'a'
        )

      link.download = `${
        projectName ===
        'Untitled project'
          ? 'nexora-whiteboard'
          : projectName
      }.png`

      link.href =
        dataURL

      document.body.appendChild(
        link
      )

      link.click()

      document.body.removeChild(
        link
      )
    } catch (error) {
      console.error(
        'PNG export failed:',
        error
      )

      alert(
        'PNG export failed.'
      )
    }
  }

  // -----------------------------------------
  // SVG EXPORT
  // -----------------------------------------

  const exportSVG = () => {
    const allElements =
      whiteboardRef.current?.getElements()

    if (!allElements) {
      alert(
        'Canvas is not ready yet.'
      )

      return
    }

    const visibleLayerIds =
      new Set(
        layers
          .filter(
            (layer) =>
              layer.visible
          )
          .map(
            (layer) =>
              layer.id
          )
      )

    const elements =
      allElements.filter(
        (item) =>
          visibleLayerIds.has(
            item.layerId
          ) ||
          item.layerId == null
      )

    const escapeText = (
      value = ''
    ) =>
      String(value)
        .replace(
          /&/g,
          '&amp;'
        )
        .replace(
          /</g,
          '&lt;'
        )
        .replace(
          />/g,
          '&gt;'
        )
        .replace(
          /"/g,
          '&quot;'
        )

    const svgElements =
      elements
        .map((item) => {
          if (
            item.type ===
            'pen'
          ) {
            const points =
              []

            for (
              let i = 0;
              i <
              item.points.length;
              i += 2
            ) {
              points.push(
                `${item.points[i]},${item.points[i + 1]}`
              )
            }

            return `<polyline points="${points.join(' ')}" fill="none" stroke="${item.color}" stroke-width="${item.size}" stroke-linecap="round" stroke-linejoin="round" />`
          }

          if (
            item.type ===
            'rectangle'
          ) {
            const x =
              Math.min(
                item.x,
                item.endX
              )

            const y =
              Math.min(
                item.y,
                item.endY
              )

            const width =
              Math.abs(
                item.endX -
                  item.x
              )

            const height =
              Math.abs(
                item.endY -
                  item.y
              )

            return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="${item.color}" stroke-width="${item.size}" />`
          }

          if (
            item.type ===
            'circle'
          ) {
            const radius =
              Math.max(
                Math.abs(
                  item.endX -
                    item.x
                ),
                Math.abs(
                  item.endY -
                    item.y
                )
              )

            return `<circle cx="${item.x}" cy="${item.y}" r="${radius}" fill="none" stroke="${item.color}" stroke-width="${item.size}" />`
          }

          if (
            item.type ===
            'line'
          ) {
            return `<line x1="${item.x}" y1="${item.y}" x2="${item.endX}" y2="${item.endY}" stroke="${item.color}" stroke-width="${item.size}" stroke-linecap="round" />`
          }

          if (
            item.type ===
            'arrow'
          ) {
            return `
<line
  x1="${item.x}"
  y1="${item.y}"
  x2="${item.endX}"
  y2="${item.endY}"
  stroke="${item.color}"
  stroke-width="${item.size}"
  marker-end="url(#arrowhead)"
/>`
          }

          if (
            item.type ===
            'text'
          ) {
            return `<text x="${item.x}" y="${item.y}" fill="${item.color}" font-size="${item.fontSize}" font-family="Arial, sans-serif">${escapeText(item.text)}</text>`
          }

          return ''
        })
        .join('\n')

    const svg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="1920"
  height="1080"
  viewBox="0 0 1920 1080"
>
  <defs>
    <marker
      id="arrowhead"
      markerWidth="10"
      markerHeight="7"
      refX="9"
      refY="3.5"
      orient="auto"
    >
      <polygon
        points="0 0, 10 3.5, 0 7"
        fill="black"
      />
    </marker>
  </defs>

  <rect
    width="100%"
    height="100%"
    fill="white"
  />

  ${svgElements}
</svg>
`

    const blob =
      new Blob(
        [svg],
        {
          type:
            'image/svg+xml',
        }
      )

    const url =
      URL.createObjectURL(
        blob
      )

    const link =
      document.createElement(
        'a'
      )

    link.href = url

    link.download = `${
      projectName ===
      'Untitled project'
        ? 'nexora-whiteboard'
        : projectName
    }.svg`

    document.body.appendChild(
      link
    )

    link.click()

    document.body.removeChild(
      link
    )

    URL.revokeObjectURL(
      url
    )
  }

  const exportCanvas =
    () => {
      const format =
        window.prompt(
          'Export format: type PNG or SVG',
          'PNG'
        )

      if (!format) {
        return
      }

      if (
        format
          .trim()
          .toLowerCase() ===
        'svg'
      ) {
        exportSVG()

        return
      }

      exportPNG()
    }

  // -----------------------------------------
  // LAYERS
  // -----------------------------------------

  const setActiveLayer = (
    id
  ) => {
    setLayers((current) =>
      current.map(
        (layer) => ({
          ...layer,
          active:
            layer.id === id,
        })
      )
    )
  }

  const addLayer = () => {
    const id =
      `layer-${Date.now()}`

    setLayers(
      (current) => [
        {
          id,
          name:
            `Layer ${current.length + 1}`,
          visible: true,
          locked: false,
          active: true,
        },

        ...current.map(
          (layer) => ({
            ...layer,
            active: false,
          })
        ),
      ]
    )
  }

  const removeLayer = (
    id
  ) => {
    if (
      layers.length <= 1
    ) {
      alert(
        'At least one layer is required.'
      )

      return
    }

    const layer =
      layers.find(
        (item) =>
          item.id === id
      )

    const confirmed =
      window.confirm(
        `Delete "${layer?.name || 'layer'}" and all objects on it?`
      )

    if (!confirmed) {
      return
    }

    whiteboardRef.current?.deleteLayerElements(
      id
    )

    setLayers((current) => {
      const remaining =
        current.filter(
          (layer) =>
            layer.id !== id
        )

      if (
        !remaining.some(
          (layer) =>
            layer.active
        )
      ) {
        remaining[0] = {
          ...remaining[0],
          active: true,
        }
      }

      return remaining
    })
  }

  const toggleLayerVisibility =
    (id) => {
      setLayers((current) =>
        current.map(
          (layer) =>
            layer.id === id
              ? {
                  ...layer,
                  visible:
                    !layer.visible,
                }
              : layer
        )
      )
    }

  const toggleLayerLock = (
    id
  ) => {
    setLayers((current) =>
      current.map(
        (layer) =>
          layer.id === id
            ? {
                ...layer,
                locked:
                  !layer.locked,
              }
            : layer
      )
    )
  }

  const moveLayerUp = (
    id
  ) => {
    setLayers((current) => {
      const index =
        current.findIndex(
          (layer) =>
            layer.id === id
        )

      if (index <= 0) {
        return current
      }

      const next =
        [...current]

      ;[
        next[index - 1],
        next[index],
      ] = [
        next[index],
        next[index - 1],
      ]

      return next
    })
  }

  const moveLayerDown = (
    id
  ) => {
    setLayers((current) => {
      const index =
        current.findIndex(
          (layer) =>
            layer.id === id
        )

      if (
        index < 0 ||
        index >=
          current.length - 1
      ) {
        return current
      }

      const next =
        [...current]

      ;[
        next[index],
        next[index + 1],
      ] = [
        next[index + 1],
        next[index],
      ]

      return next
    })
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900">

      {/* TOP BAR */}

      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">

        <div className="flex items-center gap-5">

          <div>
            <h1 className="text-lg font-bold">
              Nexora Whiteboard
            </h1>

            <p className="text-xs text-slate-500">
              {projectName}
            </p>
          </div>

          <div className="hidden h-8 w-px bg-slate-200 md:block" />

          <div className="hidden items-center gap-1 md:flex">

            <button
              title="Undo"
              onClick={() =>
                whiteboardRef.current?.undo()
              }
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <Undo2 size={19} />
            </button>

            <button
              title="Redo"
              onClick={() =>
                whiteboardRef.current?.redo()
              }
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <Redo2 size={19} />
            </button>

          </div>
        </div>

        <div className="flex items-center gap-2">

          <button
            title="Open project"
            onClick={
              loadProject
            }
            className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 sm:block"
          >
            <FolderOpen size={19} />
          </button>

          <button
            title="Save project"
            onClick={
              saveProject
            }
            className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 sm:block"
          >
            <Save size={19} />
          </button>

          <button
            title="Export PNG / SVG"
            onClick={
              exportCanvas
            }
            className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 sm:block"
          >
            <Download size={19} />
          </button>

          <div className="hidden items-center -space-x-2 lg:flex">

            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-xs font-bold text-white">
              M
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-violet-600 text-xs font-bold text-white">
              A
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-xs font-bold text-white">
              S
            </div>

          </div>

          <button className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
            <Users size={17} />

            <span className="hidden sm:inline">
              3 online
            </span>
          </button>

        </div>
      </header>

      <div className="flex min-h-0 flex-1">

        {/* LEFT TOOLBAR */}

        <aside className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-slate-200 bg-white py-3">

          {tools.map(
            (tool) => (
              <ToolButton
                key={tool.id}
                tool={tool}
                selectedTool={
                  selectedTool
                }
                onSelect={
                  setSelectedTool
                }
              />
            )
          )}

        </aside>

        {/* CANVAS */}

        <main className="relative min-w-0 flex-1 overflow-hidden bg-slate-200">

          <div
            className="absolute inset-0"
            style={
              gridVisible
                ? {
                    backgroundImage:
                      'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',

                    backgroundSize:
                      '24px 24px',
                  }
                : undefined
            }
          />

          <div className="absolute left-6 top-6 z-10 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm">

            Active tool:

            <span className="ml-2 capitalize text-blue-600">
              {selectedTool}
            </span>

            <span className="ml-4 text-slate-400">
              |
            </span>

            <span className="ml-4 text-slate-600">
              Layer:
            </span>

            <span className="ml-1 font-semibold text-violet-600">
              {activeLayer?.name}
            </span>

            {activeLayer?.locked && (
              <span className="ml-2 text-xs font-semibold text-amber-600">
                LOCKED
              </span>
            )}

          </div>

          <WhiteboardCanvas
            ref={
              whiteboardRef
            }
            tool={
              selectedTool
            }
            strokeColor={
              strokeColor
            }
            brushSize={
              brushSize
            }
            zoom={zoom}
            fontSize={
              fontSize
            }
            onZoomChange={
              setZoom
            }
            layers={
              layers
            }
            activeLayerId={
              activeLayerId
            }
          />

          {/* COLOR PALETTE */}

          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">

            {[
              '#111827',
              '#2563eb',
              '#7c3aed',
              '#ef4444',
              '#f59e0b',
              '#10b981',
            ].map(
              (color) => (
                <button
                  key={
                    color
                  }
                  onClick={() =>
                    setStrokeColor(
                      color
                    )
                  }
                  className={`h-7 w-7 rounded-full border-2 ${
                    strokeColor ===
                    color
                      ? 'border-slate-900'
                      : 'border-white'
                  }`}
                  style={{
                    backgroundColor:
                      color,
                  }}
                />
              )
            )}

          </div>

          {/* ZOOM */}

          <div className="absolute bottom-6 right-6 z-20 flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-lg">

            <button
              onClick={() =>
                changeZoom(-10)
              }
              className="rounded-lg p-2 hover:bg-slate-100"
            >
              <ZoomOut size={17} />
            </button>

            <span className="w-16 text-center text-sm font-semibold">
              {zoom}%
            </span>

            <button
              onClick={() =>
                changeZoom(10)
              }
              className="rounded-lg p-2 hover:bg-slate-100"
            >
              <ZoomIn size={17} />
            </button>

            <button
              onClick={() =>
                setGridVisible(
                  (value) =>
                    !value
                )
              }
              title="Toggle grid"
              className={`ml-1 rounded-lg p-2 ${
                gridVisible
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Grid3X3 size={17} />
            </button>

          </div>

          {/* MINIMAP */}

          <div className="absolute bottom-6 left-6 z-20 hidden h-28 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg md:block">

            <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
              Minimap
            </div>

            <div className="relative h-full bg-slate-50">

              <div className="absolute left-8 top-5 h-10 w-20 rounded border-2 border-blue-500 bg-blue-50/60" />

            </div>

          </div>

        </main>

        {/* RIGHT PANEL */}

        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white xl:block">

          <div className="border-b border-slate-200 p-5">

            <h2 className="font-bold">
              Properties
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Configure the active drawing tool
            </p>

          </div>

          <div className="space-y-6 p-5">

            <div>

              <label className="mb-2 block text-sm font-semibold">
                Stroke color
              </label>

              <div className="flex items-center gap-3">

                <input
                  type="color"
                  value={
                    strokeColor
                  }
                  onChange={(e) =>
                    setStrokeColor(
                      e.target.value
                    )
                  }
                  className="h-10 w-12 cursor-pointer rounded border-0"
                />

                <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-mono">
                  {strokeColor}
                </span>

              </div>
            </div>

            <div>

              <div className="mb-2 flex justify-between text-sm font-semibold">
                <span>
                  Brush size
                </span>

                <span>
                  {brushSize}px
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="30"
                value={
                  brushSize
                }
                onChange={(e) =>
                  setBrushSize(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="w-full"
              />

            </div>

            <div>

              <div className="mb-2 flex justify-between text-sm font-semibold">
                <span>
                  Font size
                </span>

                <span>
                  {fontSize}px
                </span>
              </div>

              <input
                type="range"
                min="12"
                max="72"
                value={
                  fontSize
                }
                onChange={(e) =>
                  setFontSize(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="w-full"
              />

            </div>

          </div>

          {/* LAYERS HEADER */}

          <div className="border-y border-slate-200 p-5">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                <Layers3 size={18} />

                <h2 className="font-bold">
                  Layers
                </h2>

              </div>

              <button
                onClick={
                  addLayer
                }
                title="Add layer"
                className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
              >
                <Plus size={18} />
              </button>

            </div>
          </div>

          {/* LAYER LIST */}

          <div className="space-y-2 p-4">

            {layers.map(
              (
                layer,
                index
              ) => (
                <div
                  key={
                    layer.id
                  }
                  onClick={() =>
                    setActiveLayer(
                      layer.id
                    )
                  }
                  className={`cursor-pointer rounded-xl border p-3 ${
                    layer.active
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >

                  <div className="flex items-center gap-2">

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-semibold">
                        {layer.name}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {layer.active
                          ? 'Active layer'
                          : layer.locked
                            ? 'Locked'
                            : 'Editable'}
                      </p>

                    </div>

                    <button
                      title="Visibility"
                      onClick={(e) => {
                        e.stopPropagation()

                        toggleLayerVisibility(
                          layer.id
                        )
                      }}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-white"
                    >
                      {layer.visible ? (
                        <Eye size={16} />
                      ) : (
                        <EyeOff size={16} />
                      )}
                    </button>

                    <button
                      title={
                        layer.locked
                          ? 'Unlock'
                          : 'Lock'
                      }
                      onClick={(e) => {
                        e.stopPropagation()

                        toggleLayerLock(
                          layer.id
                        )
                      }}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-white"
                    >
                      {layer.locked ? (
                        <Lock
                          size={16}
                          className="text-amber-500"
                        />
                      ) : (
                        <Unlock size={16} />
                      )}
                    </button>

                  </div>

                  <div className="mt-2 flex items-center justify-end gap-1 border-t border-slate-200 pt-2">

                    <button
                      title="Move layer up"
                      disabled={
                        index === 0
                      }
                      onClick={(e) => {
                        e.stopPropagation()

                        moveLayerUp(
                          layer.id
                        )
                      }}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-white disabled:cursor-not-allowed disabled:opacity-25"
                    >
                      <ChevronUp size={16} />
                    </button>

                    <button
                      title="Move layer down"
                      disabled={
                        index ===
                        layers.length -
                          1
                      }
                      onClick={(e) => {
                        e.stopPropagation()

                        moveLayerDown(
                          layer.id
                        )
                      }}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-white disabled:cursor-not-allowed disabled:opacity-25"
                    >
                      <ChevronDown size={16} />
                    </button>

                    <button
                      title="Delete layer"
                      onClick={(e) => {
                        e.stopPropagation()

                        removeLayer(
                          layer.id
                        )
                      }}
                      className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>

                </div>
              )
            )}

          </div>

        </aside>

      </div>
    </div>
  )
}

export default App
