import Link from 'next/link'
import { BrandedPageHero } from '@/components/branded-page-hero'
import { PublicShell } from '@/components/public-shell'

export default function ClubHistoryPage() {
  return (
    <PublicShell>
      <>
        <BrandedPageHero eyebrow="Historia del club" title="La historia continúa" />
        <section
          className="relative min-h-screen bg-[#061a3d] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(6, 23, 47, 0.18), rgba(6, 23, 47, 0.72)), url('/images/la-historia-continua-page.jpg')",
            backgroundAttachment: 'fixed',
          }}
        >
          <div className="absolute inset-0 bg-[#06172f]/22" aria-hidden="true" />
          <article className="relative mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
            <Link
              href="/"
              className="text-sm font-black uppercase tracking-[0.12em] text-white outline-none hover:text-white/78 focus-visible:ring-2 focus-visible:ring-white/80"
            >
              ← Volver al inicio
            </Link>

            <div className="mt-8 overflow-hidden bg-white/88 shadow-[0_24px_70px_rgba(0,0,0,0.35)] ring-1 ring-white/35 backdrop-blur-sm">
              <header className="bg-[#061a3d]/88 px-6 py-10 text-white md:px-10 md:py-12">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-white/70">
                  Por Andrés Moreno Jiménez
                </p>
                <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white/86">
                  Una crónica que une el presente competitivo del CD Santiponce con el origen de
                  una entidad nacida para que varias generaciones soñasen con un balón en los pies.
                </p>
              </header>

              <div className="px-6 py-9 md:px-10 md:py-12">
                <div className="border-l-4 border-primary bg-white/78 px-5 py-4 shadow-sm">
                <p className="text-lg font-black leading-8 text-primary">
                  Domingo 17 de mayo de 2026. Mañana soleada en el municipio sevillano
                  de Coria del Río.
                </p>
              </div>

              <div className="mt-9 space-y-6 text-[1.02rem] font-medium leading-8 text-foreground">
                <p>
                  Los rayos del sol impactaban sobre un terreno de juego regado minutos antes y
                  que presentaba sectores donde la tierra sustituía al césped. Un estado
                  característico de la mayoría de campos de fútbol de la Tercera Federación
                  Andaluza. Aficionados de ambos equipos llenaban la grada de preferencia minutos
                  antes de comenzar el partido.
                </p>
                <p>
                  En la previa del encuentro, Borja Romero, futbolista del CD Santiponce, habló
                  sobre las sensaciones antes del partido: “Creo que el equipo llega preparado
                  para este último partido de Liga. Lo que nos viene es muy bonito y muy
                  importante. Tenemos que seguir compitiendo como hasta ahora, que es lo que nos
                  ha llevado hasta aquí. Es verdad que no se empezó la temporada lo bien que
                  queríamos, pero creo que la segunda vuelta del equipo ha sido perfecta. Hoy
                  vamos a intentar ponerle el broche final y afrontar lo que viene con la máxima
                  ilusión”.
                </p>
                <p>
                  Con los equipos sobre el verde, el árbitro señaló el comienzo de la última
                  jornada de la liga del grupo cinco de la tercera categoría del fútbol andaluz. A
                  la izquierda, vistiendo camiseta roja y pantalón corto negro, el CD Santiponce.
                  El equipo santiponceño llegaba a este último partido con opciones de disputar
                  los playoff de ascenso. Para ello, el club debía ganar para colocarse entre los
                  mejores segundos de todos los grupos.
                </p>
                <p>
                  A la derecha, con camiseta amarilla y pantalón corto blanco, el Coria CF B,
                  noveno clasificado. Los primeros instantes del encuentro fueron de máxima
                  intensidad. Las irregularidades del terreno del juego complicaban las jugadas de
                  asociación en los dos equipos. El marcador señalaba empate a uno al descanso y
                  los protagonistas se marcharon a los vestuarios.
                </p>
                <p>
                  “Vamos a demostrar por qué vamos segundos. Y mi equipo va a salir ahí y se va a
                  traer los tres puntos”. Con esta arenga finalizó su discurso el entrenador del
                  CD Santiponce mientras sus jugadores aplaudían.
                </p>
                <p>
                  Segunda parte. Minuto 21. Recuperación en mitad de campo del número 15 del
                  equipo santiponceño, Antonio. Rápida conducción para deshacerse de su defensor
                  y colocarse mano a mano frente al portero. El arquero sale de su portería para
                  achicar, Antonio va a lanzar y... Sin embargo, esta historia no comienza aquí.
                  Comenzó hace 62 años.
                </p>

                <h2 className="pt-6 text-3xl font-black uppercase leading-tight text-primary">
                  El inicio de todo
                </h2>
                <p>
                  1964. Año destacado en el deporte español, en concreto en el fútbol. La
                  selección española se alzó en el estadio Santiago Bernabéu con su primera
                  Eurocopa ante la Unión Soviética por 2-1. Ese mismo año, en un pueblo de
                  Sevilla de unos 4.417 habitantes, nació una historia.
                </p>
                <p>
                  Santiponce es un municipio con aroma a historia cuando caminas por las calles
                  empedradas e irregulares de Itálica que llevan al anfiteatro romano de época
                  del emperador Adriano. También cuando recorres las cuestas del centro del pueblo
                  para levantar la mirada y ver entre casas el monasterio de San Isidoro del
                  Campo.
                </p>
                <p>
                  En esta localidad se fundó el 22 de junio de 1964 el CD Santiponce de la mano
                  de la familia Algaba. Este equipo de fútbol nace, entre otros fines, “para
                  fomentar la afición deportiva, y más concretamente el fútbol en Santiponce”,
                  según los estatutos del club. Un equipo que se origina para que aquellos más
                  jóvenes y no tan jóvenes disfruten y sueñen con un balón en los pies.
                </p>
                <p>
                  El 30 de junio de 1964 ingresó en la Real Federación Andaluza de Fútbol. Según
                  los periódicos de la época, en 1970 se estrenó en Segunda Regional, finalizando
                  la liga en sexta posición. En las dos próximas temporadas el CD Santiponce quedó
                  segundo, clasificándose para los playoffs de ascenso.
                </p>
                <p>
                  En la campaña 72-73 el club se proclamó subcampeón de la Copa Primavera en la
                  final ante el Real Betis Balompié. En la temporada 73-74 el conjunto
                  santiponceño logró una brillante fase de grupos en la Copa Primavera finalizando
                  invicto los diez partidos.
                </p>
              </div>

              <p className="mt-10 border-t border-border pt-5 text-sm font-bold text-muted-foreground">
                Once inicial del CD Santiponce | Fotografía: CD Santiponce
              </p>
              </div>
            </div>
          </article>
        </section>
      </>
    </PublicShell>
  )
}
