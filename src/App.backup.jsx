import { useState } from 'react'
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
  Lock,
  Plus,
  Users,
} from 'lucide-react'

const tools = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'pen', label: 'Pen', icon: Pencil },
  { id: 'rectangle', label: 'Rectangle', icon: Square },
  { id: 'circle', label: 'Circle', icon: Circle },
  { id: 'line', label: 'Line', icon: Minus },
  { id: 'arrow', label: 'Arrow', icon: MoveRight },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'eraser', label: 'Eraser', icon: Eraser },
  { id: 'pan', label: 'Pan', icon: Hand },
]

const initialLayers = [
  { id: 1, name: 'Layer 3', visible: true, locked: false, active: true },
  { id: 2, name: 'Layer 2', visible: true, locked: false, active: false },
  { id: 3, name: 'Background', visible: true, locked: true, active: false },
]

function ToolButton({ tool, selectedTool, onSelect }) {
  const Icon = tool.icon

  return (
    <button
      title={tool.label}
      onClick={() => onSelect(tool.id)}
      className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
        selectedTool === tool.id
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon size={20} />
    </button>
  )
}

function App() {
  const [selectedTool, setSelectedTool] = useState('select')
  const [zoom, setZoom] = useState(100)
  const [gridVisible, setGridVisible] = useState(true)
  const [strokeColor, setStrokeColor] = useState('#2563eb')
  const [brushSize, setBrushSize] = useState(4)
  const [fontSize, setFontSize] = useState(24)
  const [layers, setLayers] = useState(initialLayers)

  const changeZoom = (amount) => {
    setZoom((current) =>
      Math.min(300, Math.max(25, current + amount))
    )
  }

  const toggleLayerVisibility = (id) => {
    setLayers((current) =>
      current.map((layer) =>
        layer.id === id
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    )
  }

  const toggleLayerLock = (id) => {
    setLayers((current) =>
      current.map((layer) =>
        layer.id === id
          ? { ...layer, locked: !layer.locked }
          : layer
      )
    )
  }

  const setActiveLayer = (id) => {
    setLayers((current) =>
      current.map((layer) => ({
        ...layer,
        active: layer.id === id,
      }))
    )
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900">

      {/* TOP BAR */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-5">
          <div>
            <h1 className="text-lg font-bold">Nexora Whiteboard</h1>
            <p className="text-xs text-slate-500">Untitled project</p>
          </div>

          <div className="hidden h-8 w-px bg-slate-200 md:block" />

          <div className="hidden items-center gap-1 md:flex">
            <button
              title="Undo"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <Undo2 size={19} />
            </button>

            <button
              title="Redo"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <Redo2 size={19} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            title="Open project"
            className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 sm:block"
          >
            <FolderOpen size={19} />
          </button>

          <button
            title="Save project"
            className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 sm:block"
          >
            <Save size={19} />
          </button>

          <button
            title="Export"
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
            <span className="hidden sm:inline">3 online</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">

        {/* LEFT TOOLBAR */}
        <aside className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-slate-200 bg-white py-3">
          {tools.map((tool) => (
            <ToolButton
              key={tool.id}
              tool={tool}
              selectedTool={selectedTool}
              onSelect={setSelectedTool}
            />
          ))}
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
                    backgroundSize: '24px 24px',
                  }
                : undefined
            }
          />

          <div className="absolute left-6 top-6 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm">
            Active tool:
            <span className="ml-2 capitalize text-blue-600">
              {selectedTool}
            </span>
          </div>

          <WhiteboardCanvas
            tool={selectedTool}
            strokeColor={strokeColor}
            brushSize={brushSize}
            zoom={zoom}
          />

{/* FLOATING COLOR PALETTE */}
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
            {[
              '#111827',
              '#2563eb',
              '#7c3aed',
              '#ef4444',
              '#f59e0b',
              '#10b981',
            ].map((color) => (
              <button
                key={color}
                onClick={() => setStrokeColor(color)}
                className={`h-7 w-7 rounded-full border-2 ${
                  strokeColor === color
                    ? 'border-slate-900'
                    : 'border-white'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* ZOOM */}
          <div className="absolute bottom-6 right-6 flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
            <button
              onClick={() => changeZoom(-10)}
              className="rounded-lg p-2 hover:bg-slate-100"
            >
              <ZoomOut size={17} />
            </button>

            <span className="w-16 text-center text-sm font-semibold">
              {zoom}%
            </span>

            <button
              onClick={() => changeZoom(10)}
              className="rounded-lg p-2 hover:bg-slate-100"
            >
              <ZoomIn size={17} />
            </button>

            <button
              onClick={() => setGridVisible((value) => !value)}
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
          <div className="absolute bottom-6 left-6 hidden h-28 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg md:block">
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
            <h2 className="font-bold">Properties</h2>
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
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border-0"
                />

                <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-mono">
                  {strokeColor}
                </span>
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm font-semibold">
                <span>Brush size</span>
                <span>{brushSize}px</span>
              </div>

              <input
                type="range"
                min="1"
                max="30"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm font-semibold">
                <span>Font size</span>
                <span>{fontSize}px</span>
              </div>

              <input
                type="range"
                min="12"
                max="72"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="border-y border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers3 size={18} />
                <h2 className="font-bold">Layers</h2>
              </div>

              <button className="rounded-lg p-2 text-blue-600 hover:bg-blue-50">
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-2 p-4">
            {layers.map((layer) => (
              <button
                key={layer.id}
                onClick={() => setActiveLayer(layer.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
                  layer.active
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {layer.name}
                  </p>

                  {layer.active && (
                    <p className="mt-0.5 text-xs text-blue-600">
                      Active layer
                    </p>
                  )}
                </div>

                <span
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleLayerVisibility(layer.id)
                  }}
                  className="rounded-md p-1 text-slate-500 hover:bg-white"
                >
                  <Eye
                    size={16}
                    className={
                      layer.visible ? '' : 'opacity-30'
                    }
                  />
                </span>

                <span
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleLayerLock(layer.id)
                  }}
                  className="rounded-md p-1 text-slate-500 hover:bg-white"
                >
                  <Lock
                    size={16}
                    className={
                      layer.locked
                        ? 'text-amber-500'
                        : 'opacity-30'
                    }
                  />
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default App

