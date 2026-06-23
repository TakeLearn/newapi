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
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

const MODEL_CHIPS = [
  {
    labelKey: 'home.axiom.modelLabels.reasoning',
    name: 'GLM',
    className: 'axiom-chip-a',
  },
  {
    labelKey: 'home.axiom.modelLabels.native',
    name: 'Xiaomi MiMo',
    className: 'axiom-chip-b',
  },
  {
    labelKey: 'home.axiom.modelLabels.video',
    name: 'Seedance',
    className: 'axiom-chip-c',
  },
  {
    labelKey: 'home.axiom.modelLabels.language',
    name: 'Kimi',
    className: 'axiom-chip-d',
  },
  {
    labelKey: 'home.axiom.modelLabels.fallback',
    name: 'DeepSeek',
    className: 'axiom-chip-e',
  },
  {
    labelKey: 'home.axiom.modelLabels.premium',
    name: 'Claude',
    className: 'axiom-chip-f',
  },
  {
    labelKey: 'home.axiom.modelLabels.general',
    name: 'GPT',
    className: 'axiom-chip-g',
  },
] as const

export function Hero(props: HeroProps) {
  const { t } = useTranslation()

  return (
    <section
      className='axiom-hero relative isolate min-h-[calc(100dvh-4rem)] overflow-hidden px-4 pt-24 pb-20 sm:px-6 lg:px-8 lg:pt-28'
      aria-labelledby='axiom-hero-title'
    >
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_22%,oklch(0.86_0.075_210_/_0.38),transparent_26rem),radial-gradient(circle_at_22%_82%,oklch(0.59_0.18_258_/_0.08),transparent_30rem),linear-gradient(180deg,oklch(0.995_0.002_240)_0%,oklch(0.97_0.012_240)_88%)]'
      />

      <div className='mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-12 lg:min-h-[calc(100dvh-9rem)] lg:grid-cols-[minmax(330px,0.62fr)_minmax(440px,1fr)] lg:gap-18'>
        <div className='relative pb-0 lg:pb-10'>
          <div className='axiom-rise inline-flex items-center gap-2 rounded-full border border-blue-500/15 bg-blue-500/[0.055] px-3 py-1.5 font-mono text-[11px] font-bold tracking-[0.08em] text-blue-600 uppercase'>
            <span className='axiom-pulse-dot size-1.5 rounded-full bg-emerald-500' />
            {t('home.axiom.hero.eyebrow')}
          </div>

          <h1
            id='axiom-hero-title'
            className='axiom-rise mt-7 max-w-[620px] text-5xl leading-[0.98] font-extrabold tracking-normal text-balance [animation-delay:80ms] sm:text-6xl lg:text-7xl'
          >
            {t('home.axiom.hero.titleLine1')}
            <br />
            <span className='text-blue-600'>
              {t('home.axiom.hero.titleLine2')}
            </span>
          </h1>

          <p className='axiom-rise text-muted-foreground mt-7 max-w-[540px] text-lg leading-[1.62] [animation-delay:150ms]'>
            {t('home.axiom.hero.description')}
          </p>

          <div className='axiom-rise mt-7 flex flex-wrap gap-3 [animation-delay:220ms]'>
            <Button
              className='group h-10 rounded-full bg-[linear-gradient(135deg,oklch(0.59_0.18_258),oklch(0.68_0.15_165))] px-5 text-sm font-semibold text-white shadow-[0_18px_34px_-22px_oklch(0.59_0.18_258_/_0.76)] hover:opacity-95'
              render={
                <Link to={props.isAuthenticated ? '/dashboard' : '/sign-up'} />
              }
            >
              {props.isAuthenticated
                ? t('Go to Dashboard')
                : t('home.axiom.actions.getStarted')}
              <ArrowRight className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
            </Button>
            <Button
              variant='outline'
              className='border-foreground/10 bg-background/70 h-10 rounded-full px-5 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl'
              render={<Link to='/pricing' />}
            >
              {t('home.axiom.actions.modelSquare')}
            </Button>
          </div>

          <div className='axiom-rise text-muted-foreground mt-6 grid gap-2 text-sm [animation-delay:290ms]'>
            {[
              t('home.axiom.hero.points.compatibleEndpoint'),
              t('home.axiom.hero.points.routingControls'),
              t('home.axiom.hero.points.dynamicPricing'),
            ].map((item) => (
              <span key={item} className='inline-flex items-center gap-2'>
                <span className='size-1.5 rounded-full bg-emerald-500' />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div
          className='axiom-stage relative grid min-h-[500px] place-items-center pb-24 lg:min-h-[620px]'
          aria-label={t('home.axiom.hero.visualLabel')}
        >
          <div
            aria-hidden
            className='axiom-ambient absolute h-[520px] w-[680px] max-w-[120vw] rounded-[42%_58%_46%_54%] bg-[radial-gradient(circle_at_58%_42%,rgba(255,255,255,0.95),transparent_9rem),radial-gradient(circle_at_68%_28%,oklch(0.86_0.075_210_/_0.6),transparent_15rem),radial-gradient(circle_at_26%_74%,oklch(0.68_0.15_165_/_0.18),transparent_18rem),rgba(255,255,255,0.24)] blur-[1px]'
          />

          <div className='relative grid aspect-[1.08] w-full max-w-[610px] place-items-center'>
            <div className='absolute h-[72%] w-[92%] rotate-[-14deg] rounded-full border border-slate-900/10' />
            <div className='absolute h-[54%] w-[76%] rotate-[21deg] rounded-full border border-slate-900/10' />
            <div className='absolute h-[42%] w-[56%] rotate-[-37deg] rounded-full border border-blue-500/15' />

            <div className='axiom-beam axiom-beam-one' />
            <div className='axiom-beam axiom-beam-two' />
            <div className='axiom-beam axiom-beam-three' />

            <div className='axiom-core-inner relative grid size-[162px] place-items-center'>
              <span
                aria-hidden
                className='pointer-events-none absolute inset-0 rounded-[42px] bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.92),rgba(255,255,255,0.34)_48%,transparent_72%)] blur-sm'
              />
              <span
                aria-hidden
                className='pointer-events-none absolute inset-5 rounded-[34px] bg-[radial-gradient(circle,oklch(0.59_0.18_258_/_0.18),transparent_68%)] blur-xl'
              />
              <img
                src='/axiom-logo.svg'
                alt='AxiomAPI'
                className='relative size-[128px] rounded-[32px] object-contain shadow-[0_28px_54px_-30px_rgba(15,23,42,0.54)]'
                draggable={false}
              />
            </div>

            {MODEL_CHIPS.map((chip) => (
              <div
                key={chip.name}
                className={`axiom-chip ${chip.className} absolute min-h-12 min-w-[116px] rounded-[18px] border border-white/90 bg-white/70 px-3 py-2.5 text-slate-800 shadow-[0_24px_52px_-36px_rgba(15,23,42,0.34),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-xl`}
              >
                <small className='block font-mono text-[10px] tracking-[0.08em] text-slate-500 uppercase'>
                  {t(chip.labelKey)}
                </small>
                <strong className='mt-1 block text-sm font-bold tracking-normal'>
                  {chip.name}
                </strong>
              </div>
            ))}
          </div>

          <div className='absolute bottom-0 left-1/2 grid min-h-[76px] w-[min(520px,calc(100%-20px))] -translate-x-1/2 grid-cols-3 overflow-hidden rounded-3xl border border-white/90 bg-white/70 shadow-[0_26px_56px_-42px_rgba(15,23,42,0.42),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl max-sm:relative max-sm:bottom-auto max-sm:left-auto max-sm:mt-[-42px] max-sm:w-full max-sm:translate-x-0 max-sm:grid-cols-1'>
            {[
              {
                label: t('home.axiom.hero.metrics.latency'),
                value: t('home.axiom.hero.metrics.latencyValue'),
              },
              {
                label: t('home.axiom.hero.metrics.quota'),
                value: t('home.axiom.hero.metrics.quotaValue'),
              },
              {
                label: t('home.axiom.hero.metrics.billing'),
                value: t('home.axiom.hero.metrics.billingValue'),
              },
            ].map((item) => (
              <div
                key={item.label}
                className='border-r border-slate-900/10 px-4 py-3.5 last:border-r-0 max-sm:border-r-0 max-sm:border-b max-sm:last:border-b-0'
              >
                <small className='block font-mono text-[10px] tracking-[0.08em] text-slate-500 uppercase'>
                  {item.label}
                </small>
                <b className='mt-1.5 block text-[17px] font-bold tracking-normal text-slate-900'>
                  {item.value}
                </b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
