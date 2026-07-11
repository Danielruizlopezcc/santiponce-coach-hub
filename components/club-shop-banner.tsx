'use client'

import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { CLUB } from '@/lib/club'
import { useShopAccessModal } from '@/components/shop-access-modal'

export function ClubShopBanner() {
  const { openShopModal } = useShopAccessModal()

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600">
      {/* Background pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 18%, rgba(255,255,255,0.12) 0 1px, transparent 2px), linear-gradient(135deg, rgba(255,255,255,0.06) 0 14%, transparent 14% 28%, rgba(0,0,0,0.12) 28% 42%, transparent 42%)',
          backgroundSize: '30px 30px, 180px 180px',
        }}
      />

      {/* Decorative blur elements */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-white/5 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1fr_2fr]">
          {/* Left side - Club info and CTA */}
          <div className="flex flex-col justify-between text-white">
            {/* Club branding */}
            <div>
              <div className="flex items-center gap-5 mb-8">
                <div className="relative h-20 w-20 flex-shrink-0">
                  <Image
                    src="/images/Escudo_Santiponce_transparente.png"
                    alt={`Escudo ${CLUB.shortName}`}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex h-20 flex-col justify-center">
                  <h2 className="font-serif text-[2.45rem] font-black uppercase leading-[0.82] tracking-tight text-white md:text-[2.9rem]">
                    TIENDA
                    <br />
                    OFICIAL
                  </h2>
                </div>
              </div>

              {/* Main heading */}
              <div className="mb-8">
                <h3 className="text-4xl font-black leading-tight md:text-5xl">
                  Apoya a tu pueblo
                </h3>
              </div>

              {/* Description */}
              <p className="max-w-md text-base leading-7 text-white/85">
                Viste los colores del CD Santiponce. Descubre nuestra colección oficial de equipaciones y merchandising.
              </p>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={openShopModal}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-black uppercase text-blue-700 transition-transform hover:scale-105 hover:text-blue-800"
            >
              Accede a nuestra tienda
              <ArrowRight className="size-5" aria-hidden="true" />
            </button>
          </div>

          {/* Right side - Product showcase */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Primera Equipación */}
            <div className="group">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-1 w-6 bg-white/60" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/80">Primera Equipación</p>
              </div>
              <div className="relative overflow-hidden rounded-xl shadow-2xl">
                <div className="aspect-square overflow-hidden bg-white">
                  <Image
                    src="/images/Primera_Equipacion.jpg"
                    alt="Primera Equipación CD Santiponce"
                    width={400}
                    height={400}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </div>

            {/* Segunda Equipación */}
            <div className="group">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-1 w-6 bg-white/60" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/80">Segunda Equipación</p>
              </div>
              <div className="relative overflow-hidden rounded-xl shadow-2xl">
                <div className="aspect-square overflow-hidden bg-white">
                  <Image
                    src="/images/Segunda_Equipacion.jpg"
                    alt="Segunda Equipación CD Santiponce"
                    width={400}
                    height={400}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
