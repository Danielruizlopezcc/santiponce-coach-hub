'use client'

import { MouseEvent, useEffect, useRef, useState } from 'react'
import { Baseline, Bold, Eraser, Heading2, Heading3, Palette, Pilcrow, Underline } from 'lucide-react'
import { cn } from '@/lib/utils'

type RichTextEditorProps = {
  id: string
  value: string
  onChange: (value: string) => void
}

const COLORS = [
  { label: 'Azul club', value: '#0b62c4' },
  { label: 'Azul oscuro', value: '#06172f' },
  { label: 'Rojo', value: '#c1121f' },
  { label: 'Verde', value: '#15803d' },
  { label: 'Negro', value: '#111827' },
  { label: 'Blanco', value: '#ffffff' },
]

function runCommand(command: string, value?: string) {
  document.execCommand(command, false, value)
}

export function RichTextEditor({ id, value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const selectionRef = useRef<Range | null>(null)
  const [customColor, setCustomColor] = useState('#0b62c4')

  useEffect(() => {
    const editor = editorRef.current
    if (editor && editor.innerHTML !== value) {
      editor.innerHTML = value
    }
  }, [value])

  function syncContent() {
    onChange(editorRef.current?.innerHTML ?? '')
  }

  function rememberSelection() {
    const selection = window.getSelection()
    const editor = editorRef.current

    if (!selection || selection.rangeCount === 0 || !editor) return

    const range = selection.getRangeAt(0)
    if (editor.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange()
    }
  }

  function restoreSelection() {
    const selection = window.getSelection()
    const range = selectionRef.current

    if (!selection || !range) return

    selection.removeAllRanges()
    selection.addRange(range)
  }

  function keepEditorSelection(event: MouseEvent<HTMLElement>) {
    event.preventDefault()
    rememberSelection()
  }

  function apply(command: string, commandValue?: string) {
    restoreSelection()
    runCommand(command, commandValue)
    rememberSelection()
    syncContent()
  }

  function applyTextStyle(size: 'normal' | 'subtitle' | 'title') {
    const fontSize = size === 'title' ? '6' : size === 'subtitle' ? '5' : '3'

    apply('fontSize', fontSize)
    if (size === 'title' || size === 'subtitle') {
      apply('bold')
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-white shadow-xs">
      <div className="space-y-2 border-b border-border bg-[#f8fafc] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
            <button type="button" title="Texto normal" onMouseDown={keepEditorSelection} onClick={() => applyTextStyle('normal')} className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-bold text-foreground hover:bg-muted">
              <Pilcrow className="size-4" aria-hidden="true" />
              Normal
            </button>
            <button type="button" title="Título grande" onMouseDown={keepEditorSelection} onClick={() => applyTextStyle('title')} className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-bold text-foreground hover:bg-muted">
              <Heading2 className="size-4" aria-hidden="true" />
              Título
            </button>
            <button type="button" title="Subtítulo" onMouseDown={keepEditorSelection} onClick={() => applyTextStyle('subtitle')} className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-bold text-foreground hover:bg-muted">
              <Heading3 className="size-4" aria-hidden="true" />
              Subtítulo
            </button>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
            <button type="button" title="Negrita" onMouseDown={keepEditorSelection} onClick={() => apply('bold')} className="inline-flex size-9 items-center justify-center rounded-md text-foreground hover:bg-muted">
              <Bold className="size-4" aria-hidden="true" />
            </button>
            <button type="button" title="Subrayado" onMouseDown={keepEditorSelection} onClick={() => apply('underline')} className="inline-flex size-9 items-center justify-center rounded-md text-foreground hover:bg-muted">
              <Underline className="size-4" aria-hidden="true" />
            </button>
            <button type="button" title="Limpiar formato" onMouseDown={keepEditorSelection} onClick={() => apply('removeFormat')} className="inline-flex size-9 items-center justify-center rounded-md text-foreground hover:bg-muted">
              <Eraser className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-muted-foreground">
            <Baseline className="size-4" aria-hidden="true" />
            Color de texto
          </span>
          <div className="flex flex-wrap gap-1">
            {COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                title={color.label}
                onMouseDown={keepEditorSelection}
                onClick={() => apply('foreColor', color.value)}
                className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-white px-2.5 text-xs font-bold text-foreground hover:border-primary/50 hover:bg-blue-50"
              >
                <span className="size-4 rounded-full ring-1 ring-black/10" style={{ backgroundColor: color.value }} />
                {color.label}
              </button>
            ))}
          </div>
          <div className="ml-1 flex items-center gap-2 rounded-full border border-border bg-white px-2.5 py-1">
            <Palette className="size-4 text-muted-foreground" aria-hidden="true" />
            <input
              type="color"
              value={customColor}
              onMouseDown={keepEditorSelection}
              onChange={(event) => {
                setCustomColor(event.target.value)
                apply('foreColor', event.target.value)
              }}
              className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
              title="Elegir color personalizado"
            />
            <button
              type="button"
              onMouseDown={keepEditorSelection}
              onClick={() => apply('foreColor', customColor)}
              className="text-xs font-black uppercase text-primary"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
      <div
        id={id}
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        onInput={syncContent}
        onMouseUp={rememberSelection}
        onKeyUp={rememberSelection}
        onBlur={syncContent}
        className={cn(
          'news-editor min-h-[420px] px-5 py-4 text-base leading-8 text-foreground outline-none',
          'empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]',
        )}
        data-placeholder="Escribe aquí toda la información que se verá al abrir la noticia..."
        suppressContentEditableWarning
      />
    </div>
  )
}
