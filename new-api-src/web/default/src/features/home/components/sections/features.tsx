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
import {
  Activity,
  Braces,
  CircleDollarSign,
  Route,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'

interface FeaturesProps {
  className?: string
}

export function Features(_props: FeaturesProps) {
  const { t } = useTranslation()

  const signalRows = [
    ['GLM-4.5', t('home.axiom.features.visual.reasoning')],
    ['Seedance', t('home.axiom.features.visual.media')],
    ['Claude', t('home.axiom.features.visual.premium')],
    ['Xiaomi MiMo', t('home.axiom.features.visual.native')],
  ]

  const featureBlocks = [
    {
      title: t('home.axiom.features.routing.title'),
      description: t('home.axiom.features.routing.description'),
      icon: Route,
    },
    {
      title: t('home.axiom.features.guardrails.title'),
      description: t('home.axiom.features.guardrails.description'),
      icon: ShieldCheck,
    },
    {
      title: t('home.axiom.features.billing.title'),
      description: t('home.axiom.features.billing.description'),
      icon: CircleDollarSign,
    },
  ]

  return (
    <section className='relative z-10 px-4 py-20 sm:px-6 md:py-28 lg:px-8'>
      <div className='mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[0.46fr_0.54fr] lg:gap-16'>
        <AnimateInView className='lg:pt-10'>
          <p className='mb-4 font-mono text-xs font-bold tracking-[0.14em] text-blue-600 uppercase'>
            {t('home.axiom.features.eyebrow')}
          </p>
          <h2 className='max-w-[540px] text-4xl leading-[1.04] font-extrabold tracking-normal text-balance text-slate-950 md:text-5xl'>
            {t('home.axiom.features.title')}
          </h2>
          <p className='mt-6 max-w-[520px] text-base leading-relaxed text-pretty text-slate-600'>
            {t('home.axiom.features.description')}
          </p>
        </AnimateInView>

        <AnimateInView
          animation='scale-in'
          className='relative overflow-hidden rounded-[34px] border border-slate-900/8 bg-slate-950 p-5 text-white shadow-[0_40px_96px_-58px_rgba(15,23,42,0.68)] md:p-7'
        >
          <div
            aria-hidden
            className='absolute inset-0 bg-[radial-gradient(circle_at_68%_24%,oklch(0.68_0.15_165_/_0.34),transparent_18rem),radial-gradient(circle_at_12%_92%,oklch(0.59_0.18_258_/_0.28),transparent_20rem)]'
          />
          <div className='relative grid gap-4 md:grid-cols-[1fr_0.78fr]'>
            <div className='rounded-[28px] border border-white/10 bg-white/[0.055] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'>
              <div className='mb-6 flex items-center justify-between'>
                <span className='font-mono text-[11px] font-bold tracking-[0.12em] text-white/48 uppercase'>
                  {t('home.axiom.features.visual.title')}
                </span>
                <span className='inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200'>
                  <span className='axiom-pulse-dot size-1.5 rounded-full bg-emerald-400' />
                  {t('home.axiom.features.visual.live')}
                </span>
              </div>

              <div className='space-y-3'>
                {signalRows.map(([name, label], index) => (
                  <div
                    key={name}
                    className='grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.045] px-4 py-3'
                  >
                    <div>
                      <strong className='block text-sm font-semibold'>
                        {name}
                      </strong>
                      <span className='mt-1 block text-xs text-white/48'>
                        {label}
                      </span>
                    </div>
                    <div className='h-1.5 w-24 overflow-hidden rounded-full bg-white/10'>
                      <div
                        className='axiom-meter h-full rounded-full bg-cyan-300'
                        style={{ animationDelay: `${index * -0.7}s` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='grid gap-4'>
              <div className='rounded-[28px] border border-white/10 bg-white/[0.055] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'>
                <Braces className='mb-5 size-5 text-cyan-200' />
                <code className='block font-mono text-xs leading-relaxed whitespace-pre-wrap text-white/70'>
                  {`base_url: /v1\nroute: weighted\npricing: live\nfallback: enabled`}
                </code>
              </div>
              <div className='rounded-[28px] border border-white/10 bg-white/[0.055] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'>
                <Activity className='mb-5 size-5 text-emerald-200' />
                <p className='text-sm leading-relaxed text-white/66'>
                  {t('home.axiom.features.visual.note')}
                </p>
              </div>
            </div>
          </div>
        </AnimateInView>

        <div className='grid gap-4 md:grid-cols-3 lg:col-span-2'>
          {featureBlocks.map((feature, index) => {
            const Icon = feature.icon
            return (
              <AnimateInView
                key={feature.title}
                delay={index * 90}
                className='rounded-[28px] border border-slate-900/8 bg-white/70 p-6 shadow-[0_24px_64px_-52px_rgba(15,23,42,0.42),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl'
              >
                <div className='mb-8 flex size-11 items-center justify-center rounded-2xl bg-blue-600 text-white'>
                  <Icon className='size-5' strokeWidth={1.8} />
                </div>
                <h3 className='text-lg font-bold tracking-normal text-slate-950'>
                  {feature.title}
                </h3>
                <p className='mt-3 text-sm leading-relaxed text-pretty text-slate-600'>
                  {feature.description}
                </p>
              </AnimateInView>
            )
          })}
        </div>
      </div>
    </section>
  )
}
