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
import { KeyRound, LineChart, PlugZap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'

export function HowItWorks() {
  const { t } = useTranslation()

  const steps = [
    {
      num: '01',
      title: t('home.axiom.workflow.keys.title'),
      desc: t('home.axiom.workflow.keys.description'),
      icon: KeyRound,
      detail: t('home.axiom.workflow.keys.detail'),
    },
    {
      num: '02',
      title: t('home.axiom.workflow.route.title'),
      desc: t('home.axiom.workflow.route.description'),
      icon: PlugZap,
      detail: t('home.axiom.workflow.route.detail'),
    },
    {
      num: '03',
      title: t('home.axiom.workflow.observe.title'),
      desc: t('home.axiom.workflow.observe.description'),
      icon: LineChart,
      detail: t('home.axiom.workflow.observe.detail'),
    },
  ]

  return (
    <section className='relative z-10 px-4 py-20 sm:px-6 md:py-28 lg:px-8'>
      <div className='mx-auto max-w-[1320px]'>
        <AnimateInView className='mb-12 grid gap-6 md:grid-cols-[0.58fr_0.42fr] md:items-end'>
          <div>
            <p className='mb-4 font-mono text-xs font-bold tracking-[0.14em] text-sky-600 uppercase dark:text-sky-300'>
              {t('home.axiom.workflow.eyebrow')}
            </p>
            <h2 className='text-foreground max-w-[720px] text-4xl leading-[1.04] font-extrabold tracking-normal text-balance md:text-5xl'>
              {t('home.axiom.workflow.title')}
            </h2>
          </div>
          <p className='text-muted-foreground max-w-[430px] text-base leading-relaxed text-pretty md:justify-self-end'>
            {t('home.axiom.workflow.description')}
          </p>
        </AnimateInView>

        <div className='relative grid gap-4 lg:grid-cols-3'>
          <div
            aria-hidden
            className='absolute top-16 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block'
          />
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <AnimateInView
                key={step.num}
                delay={index * 110}
                className='border-border/70 bg-card/[0.66] group relative overflow-hidden rounded-[30px] border p-6 shadow-[0_24px_64px_-52px_rgba(15,23,42,0.42),inset_0_1px_0_color-mix(in_oklch,var(--background)_74%,white)] backdrop-blur-xl md:p-7 dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_26px_74px_-56px_rgba(0,0,0,0.84),inset_0_1px_0_rgba(255,255,255,0.08)]'
              >
                <div
                  aria-hidden
                  className='absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100'
                />
                <div className='mb-8 flex items-center justify-between'>
                  <span className='text-muted-foreground/70 font-mono text-xs font-bold tabular-nums'>
                    {step.num}
                  </span>
                  <div className='bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-2xl shadow-[0_18px_40px_-26px_rgba(15,23,42,0.8)] dark:bg-white dark:text-black'>
                    <Icon className='size-5' strokeWidth={1.8} />
                  </div>
                </div>
                <h3 className='text-foreground text-xl font-bold tracking-normal'>
                  {step.title}
                </h3>
                <p className='text-muted-foreground mt-3 min-h-[68px] text-sm leading-relaxed text-pretty'>
                  {step.desc}
                </p>
                <div className='border-border/60 bg-muted/50 text-muted-foreground mt-7 rounded-2xl border px-4 py-3 font-mono text-xs dark:border-white/10 dark:bg-white/[0.04]'>
                  {step.detail}
                </div>
              </AnimateInView>
            )
          })}
        </div>
      </div>
    </section>
  )
}
