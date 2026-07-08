'use client'

import { ChangeEvent, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import { BadgeCheck, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { AdminErrorDialog } from '@/components/admin-error-dialog'
import { AdminFormDialog } from '@/components/admin-form-dialog'
import { SafeImage } from '@/components/safe-image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageContainer } from '@/components/page-container'
import { cn } from '@/lib/utils'
import type { AdminSponsorRow } from '@/lib/admin-app'
import { getSponsorTierOption, SPONSOR_TIER_OPTIONS, type SponsorTier } from '@/lib/sponsors'
import { createSponsor, deleteSponsor, updateSponsor } from './actions'

type SheetMode = 'create' | 'edit'

function SponsorFormSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-foreground">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

export function PatrocinadoresClient({ sponsors }: { sponsors: AdminSponsorRow[] }) {
  const [isPending, startTransition] = useTransition()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [mode, setMode] = useState<SheetMode>('create')
  const [editing, setEditing] = useState<AdminSponsorRow | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [tier, setTier] = useState<SponsorTier>('partner')
  const [isActive, setIsActive] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [inputKey, setInputKey] = useState('initial')
  const activeSponsors = sponsors.filter((sponsor) => sponsor.isActive)
  const principalSponsors = sponsors.filter((sponsor) => sponsor.tier === 'principal')
  const partnerSponsors = sponsors.filter((sponsor) => sponsor.tier === 'partner')

  function openCreate() {
    setMode('create')
    setEditing(null)
    setTitle('')
    setTier('partner')
    setIsActive(true)
    setImageFile(null)
    setFormError(null)
    setInputKey(String(Date.now()))
    setSheetOpen(true)
  }

  function openEdit(sponsor: AdminSponsorRow) {
    setMode('edit')
    setEditing(sponsor)
    setTitle(sponsor.title)
    setTier(sponsor.tier)
    setIsActive(sponsor.isActive)
    setImageFile(null)
    setFormError(null)
    setInputKey(String(Date.now()))
    setSheetOpen(true)
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setImageFile(file)
  }

  function handleSubmit() {
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setFormError('El título es obligatorio.')
      return
    }

    if (mode === 'create' && !imageFile) {
      setFormError('Selecciona una imagen para el patrocinador.')
      return
    }

    setFormError(null)

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('title', trimmedTitle)
        formData.set('tier', tier)
        formData.set('isActive', String(isActive))

        if (mode === 'create') {
          if (!imageFile) return
          formData.set('image', imageFile)
          await createSponsor(formData)
        } else if (editing) {
          formData.set('id', editing.id)
          if (imageFile) {
            formData.set('image', imageFile)
          }
          await updateSponsor(formData)
        }

        setSheetOpen(false)
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Error al guardar el patrocinador.')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteSponsor(id)
        setConfirmDeleteId(null)
      } catch {
        // Silencioso por ahora
      }
    })
  }

  return (
    <PageContainer
      title="Patrocinadores"
      description="Gestiona los patrocinadores visibles para las familias del club."
      className="max-w-7xl"
    >
      <div className="mb-6 rounded-xl border border-border bg-white/84 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Imagen del club</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">Patrocinadores visibles</h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground">
              Gestiona los logos que aparecen en la parte pública y diferencia patrocinadores principales y colaboradores.
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Nuevo patrocinador
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-primary/5 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary/70">Total</p>
            <p className="mt-2 text-3xl font-black text-primary">{sponsors.length}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Patrocinadores guardados</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700/70">Activos</p>
            <p className="mt-2 text-3xl font-black text-emerald-700">{activeSponsors.length}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Visibles para usuarios</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700/70">Principales</p>
            <p className="mt-2 text-3xl font-black text-blue-700">{principalSponsors.length}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Mayor presencia visual</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-700/70">Colaboradores</p>
            <p className="mt-2 text-3xl font-black text-slate-700">{partnerSponsors.length}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Apoyo al club</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white/78 p-4 shadow-sm ring-1 ring-foreground/10 backdrop-blur">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">Galería de patrocinadores</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">{sponsors.length} tarjetas configuradas</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sponsors.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white/70 p-8 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
              No hay patrocinadores todavía. Crea uno para que aparezca en el menú.
            </div>
          ) : null}
          {sponsors.map((sponsor) => {
            const tierOption = getSponsorTierOption(sponsor.tier)
            const isDeleting = confirmDeleteId === sponsor.id

            return (
              <article
                key={sponsor.id}
                className={cn(
                  'overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-colors hover:border-primary/25',
                  isDeleting && 'border-destructive/30 bg-destructive/5',
                )}
              >
                <div className="relative flex h-36 items-center justify-center bg-slate-50">
                  <SafeImage
                    src={sponsor.imageUrl}
                    alt={sponsor.title}
                    fallbackSrc="/images/Escudo_Santiponce_Fondo.jpg"
                    fill
                    className="object-contain p-5"
                  />
                </div>
                <div className="space-y-4 p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                        {sponsor.tier === 'principal' ? (
                          <Sparkles className="size-3.5" aria-hidden="true" />
                        ) : (
                          <BadgeCheck className="size-3.5" aria-hidden="true" />
                        )}
                        {tierOption.label}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-black',
                          sponsor.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {sponsor.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <p className="mt-3 text-lg font-black text-foreground">{sponsor.title}</p>
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">Orden visual: {sponsor.sortOrder}</p>
                  </div>

                  {isDeleting ? (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-rose-50 p-2">
                      <span className="text-xs font-semibold text-rose-700">¿Eliminar patrocinador?</span>
                      <Button size="sm" variant="destructive" disabled={isPending} onClick={() => handleDelete(sponsor.id)}>
                        Sí, eliminar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-1 border-t border-border pt-3">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(sponsor)}>
                        <Pencil className="size-3.5" aria-hidden="true" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setConfirmDeleteId(sponsor.id)}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        Eliminar
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <AdminFormDialog
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={mode === 'create' ? 'Nuevo patrocinador' : 'Editar patrocinador'}
        description={mode === 'create'
          ? 'Añade un título y una imagen para que se muestre a los usuarios.'
          : 'Actualiza los datos del patrocinador. Deja la imagen vacía para conservarla.'}
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending
                ? 'Guardando...'
                : mode === 'create'
                  ? 'Crear patrocinador'
                  : 'Guardar cambios'}
            </Button>
          </>
        }
      >
          <div className="grid gap-5 md:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <SponsorFormSection
                title="Datos del patrocinador"
                description="Nombre público y nivel de presencia en la web del club."
              >
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="sponsor-title">Título</Label>
                    <Input
                      id="sponsor-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Ej. Clínica Santiponce"
                      autoFocus
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="sponsor-tier">Tipo de patrocinio</Label>
                    <select
                      id="sponsor-tier"
                      value={tier}
                      onChange={(event) => setTier(event.target.value as SponsorTier)}
                      className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      {SPONSOR_TIER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </SponsorFormSection>

              <SponsorFormSection
                title="Visibilidad"
                description="Activa o pausa el patrocinador sin eliminar su ficha."
              >
                <label className="flex items-start gap-3 rounded-lg border border-border bg-white px-3 py-3 text-sm font-semibold">
                  <input
                    id="sponsor-active"
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) => setIsActive(event.target.checked)}
                    className="mt-0.5 size-4 rounded border-border accent-primary"
                  />
                  <span>
                    <span className="block font-black text-foreground">Visible para usuarios</span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-muted-foreground">
                      Si está activo, el logo podrá aparecer en las zonas públicas del club.
                    </span>
                  </span>
                </label>
              </SponsorFormSection>
            </div>

            <SponsorFormSection
              title="Logo"
              description={mode === 'create' ? 'La imagen es obligatoria al crear.' : 'Deja el campo vacío para conservar el logo actual.'}
            >
              <div className="space-y-4">
                {mode === 'edit' && editing ? (
                  <div className="grid gap-2 rounded-xl border border-border bg-white p-3">
                    <span className="text-sm font-medium text-foreground">Imagen actual</span>
                    <div className="relative h-40 overflow-hidden rounded-xl bg-muted">
                      <SafeImage
                        src={editing.imageUrl}
                        alt={editing.title}
                        fallbackSrc="/images/Escudo_Santiponce_Fondo.jpg"
                        fill
                        className="object-contain p-3"
                      />
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="sponsor-image">Imagen</Label>
                  <input
                    key={inputKey}
                    id="sponsor-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:text-primary-foreground"
                  />
                </div>
              </div>
            </SponsorFormSection>
          </div>

      </AdminFormDialog>
      <AdminErrorDialog message={formError} onClose={() => setFormError(null)} />
    </PageContainer>
  )
}
