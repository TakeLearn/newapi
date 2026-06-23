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
    <section className='relative z-10 px-4 py-16 sm:px-6 md:py-20 lg:px-8'>
      <div className='mx-auto max-w-[1320px]'>
        <AnimateInView className='grid overflow-hidden rounded-[32px] border border-slate-900/8 bg-white/62 shadow-[0_26px_70px_-54px_rgba(15,23,42,0.42),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-xl md:grid-cols-4'>
          {items.map((item, index) => (
            <div
              key={item.label}
              className='relative min-h-[150px] border-b border-slate-900/8 p-6 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0 lg:p-7'
            >
              <span className='font-mono text-[11px] font-bold tracking-[0.08em] text-slate-500 uppercase'>
                {item.label}
              </span>
              <strong className='mt-5 block text-2xl leading-none font-extrabold tracking-normal text-slate-950 tabular-nums md:text-3xl'>
                {item.value}
              </strong>
              <p className='mt-4 max-w-[16rem] text-sm leading-relaxed text-pretty text-slate-600'>
                {item.description}
              </p>
              <span
                aria-hidden
                className='absolute right-5 bottom-5 font-mono text-[11px] text-slate-300 tabular-nums'
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
