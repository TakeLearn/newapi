/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'

interface StatsProps {
  className?: string
}

export function Stats(_props: StatsProps) {
  const { t } = useTranslation()

  const items = [
    {
      label: t('home.axiom.stats.providers.label'),
      value: t('home.axiom.stats.providers.value'),
      description: t('home.axiom.stats.providers.description'),
    },
    {
      label: t('home.axiom.stats.pricing.label'),
      value: t('home.axiom.stats.pricing.value'),
      description: t('home.axiom.stats.pricing.description'),
    },
    {
      label: t('home.axiom.stats.routing.label'),
      value: t('home.axiom.stats.routing.value'),
      description: t('home.axiom.stats.routing.description'),
    },
    {
      label: t('home.axiom.stats.observability.label'),
      value: t('home.axiom.stats.observability.value'),
      description: t('home.axiom.stats.observability.description'),
    },
  ]

  return (
    <section className='relative z-10 px-4 py-14 sm:px-6 md:py-20 lg:px-8'>
      <div className='mx-auto max-w-[1320px]'>
        <AnimateInView className='border-border/70 bg-card/[0.62] grid overflow-hidden rounded-[32px] border shadow-[0_26px_70px_-54px_rgba(15,23,42,0.42),inset_0_1px_0_color-mix(in_oklch,var(--background)_72%,white)] backdrop-blur-xl md:grid-cols-4 dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_26px_80px_-58px_rgba(0,0,0,0.82),inset_0_1px_0_rgba(255,255,255,0.08)]'>
          {items.map((item, index) => (
            <div
              key={item.label}
              className='border-border/60 group relative min-h-[158px] overflow-hidden border-b p-6 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0 lg:p-7 dark:border-white/10'
            >
              <span
                aria-hidden
                className='absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100'
              />
              <span className='text-muted-foreground font-mono text-[11px] font-bold tracking-[0.08em] uppercase'>
                {item.label}
              </span>
              <strong className='text-foreground mt-5 block text-2xl leading-none font-extrabold tracking-normal tabular-nums md:text-3xl'>
                {item.value}
              </strong>
              <p className='text-muted-foreground mt-4 max-w-[16rem] text-sm leading-relaxed text-pretty'>
                {item.description}
              </p>
              <span
                aria-hidden
                className='text-muted-foreground/[0.24] absolute right-5 bottom-5 font-mono text-[11px] tabular-nums'
              >
                0{index + 1}
              </span>
            </div>
          ))}
        </AnimateInView>
      </div>
    </section>
  )
}
