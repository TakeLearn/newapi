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
import { ArrowRight, CheckCircle2, Command, RadioTower } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
  const routePoints = [
    t('home.axiom.hero.points.compatibleEndpoint'),
    t('home.axiom.hero.points.routingControls'),
    t('home.axiom.hero.points.dynamicPricing'),
  ]
  const metrics = [
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
  ]

  return (
    <section
      className='axiom-hero bg-background relative isolate min-h-[calc(100dvh-4rem)] overflow-hidden px-4 pt-24 pb-16 sm:px-6 lg:px-8 lg:pt-28'
      aria-labelledby='axiom-hero-title'
    >
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_14%,oklch(0.72_0.16_220_/_0.34),transparent_28rem),radial-gradient(circle_at_18%_78%,oklch(0.72_0.17_150_/_0.16),transparent_30rem),linear-gradient(180deg,color-mix(in_oklch,var(--background)_92%,oklch(0.82_0.12_220))_0%,var(--background)_82%)] dark:bg-[radial-gradient(circle_at_76%_16%,oklch(0.62_0.18_245_/_0.26),transparent_30rem),radial-gradient(circle_at_16%_84%,oklch(0.7_0.16_165_/_0.12),transparent_28rem),linear-gradient(180deg,color-mix(in_oklch,var(--background)_88%,black)_0%,var(--background)_82%)]'
      />
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-10 opacity-[0.32] [background-image:linear-gradient(to_right,color-mix(in_oklch,var(--foreground)_10%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--foreground)_10%,transparent)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)] dark:opacity-[0.18]'
      />

      <div className='mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-12 lg:min-h-[calc(100dvh-9rem)] lg:grid-cols-[minmax(330px,0.58fr)_minmax(500px,1fr)] lg:gap-16'>
        <div className='relative pb-0 lg:pb-10'>
          <div className='axiom-rise border-primary/10 bg-primary/5 text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] font-bold tracking-[0.08em] uppercase shadow-[inset_0_1px_0_color-mix(in_oklch,var(--background)_70%,white)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:text-white'>
            <span className='axiom-pulse-dot size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-300' />
            {t('home.axiom.hero.eyebrow')}
          </div>

          <h1
            id='axiom-hero-title'
            className='axiom-rise text-foreground mt-7 max-w-[660px] text-5xl leading-[0.96] font-extrabold tracking-normal text-balance [animation-delay:80ms] sm:text-6xl lg:text-7xl'
          >
            {t('home.axiom.hero.titleLine1')}
            <br />
            <span className='bg-[linear-gradient(135deg,oklch(0.58_0.18_248),oklch(0.67_0.16_165),oklch(0.72_0.18_78))] bg-clip-text text-transparent dark:from-sky-300 dark:via-emerald-200 dark:to-amber-200'>
              {t('home.axiom.hero.titleLine2')}
            </span>
          </h1>

          <p className='axiom-rise text-muted-foreground mt-7 max-w-[540px] text-lg leading-[1.62] [animation-delay:150ms]'>
            {t('home.axiom.hero.description')}
          </p>

          <div className='axiom-rise mt-7 flex flex-wrap gap-3 [animation-delay:220ms]'>
            <Button
              className='group h-11 rounded-full bg-[linear-gradient(135deg,oklch(0.55_0.2_250),oklch(0.67_0.16_165))] px-5 text-sm font-semibold text-white shadow-[0_20px_44px_-24px_oklch(0.58_0.18_238_/_0.82)] hover:opacity-95 dark:shadow-[0_22px_52px_-22px_oklch(0.62_0.18_220_/_0.42)]'
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
              className='border-border/70 bg-background/[0.68] hover:bg-accent/70 h-11 rounded-full px-5 text-sm font-semibold shadow-[inset_0_1px_0_color-mix(in_oklch,var(--background)_72%,white)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
              render={<Link to='/pricing' />}
            >
              {t('home.axiom.actions.modelSquare')}
            </Button>
          </div>

          <div className='axiom-rise mt-7 grid max-w-[560px] gap-2.5 text-sm [animation-delay:290ms] sm:grid-cols-3'>
            {routePoints.map((item) => (
              <span
                key={item}
                className='border-border/60 bg-background/[0.58] text-muted-foreground inline-flex min-h-12 items-center gap-2 rounded-2xl border px-3 py-2 shadow-[0_16px_34px_-30px_rgba(15,23,42,0.36)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035]'
              >
                <CheckCircle2 className='size-4 shrink-0 text-emerald-500 dark:text-emerald-300' />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div
          className='axiom-stage relative grid min-h-[580px] place-items-center lg:min-h-[660px]'
          aria-label={t('home.axiom.hero.visualLabel')}
        >
          <div
            aria-hidden
            className='axiom-ambient absolute h-[540px] w-[700px] max-w-[125vw] rounded-[42%_58%_46%_54%] bg-[radial-gradient(circle_at_58%_42%,color-mix(in_oklch,var(--background)_82%,white),transparent_9rem),radial-gradient(circle_at_70%_28%,oklch(0.78_0.13_210_/_0.44),transparent_15rem),radial-gradient(circle_at_26%_74%,oklch(0.7_0.16_156_/_0.18),transparent_18rem),color-mix(in_oklch,var(--background)_72%,transparent)] blur-[1px] dark:bg-[radial-gradient(circle_at_54%_40%,rgba(255,255,255,0.12),transparent_8rem),radial-gradient(circle_at_70%_28%,oklch(0.62_0.18_238_/_0.26),transparent_16rem),radial-gradient(circle_at_26%_74%,oklch(0.68_0.15_165_/_0.16),transparent_18rem),rgba(255,255,255,0.02)]'
          />

          <div className='relative grid aspect-[1.08] w-full max-w-[640px] place-items-center'>
            <div className='border-border/70 absolute h-[74%] w-[94%] rotate-[-14deg] rounded-full border dark:border-white/10' />
            <div className='border-border/60 absolute h-[56%] w-[76%] rotate-[21deg] rounded-full border dark:border-white/10' />
            <div className='absolute h-[42%] w-[56%] rotate-[-37deg] rounded-full border border-sky-500/20 dark:border-sky-300/20' />

            <div className='axiom-beam axiom-beam-one' />
            <div className='axiom-beam axiom-beam-two' />
            <div className='axiom-beam axiom-beam-three' />

            <div className='axiom-core-inner bg-background/[0.72] border-border/70 relative grid size-[180px] place-items-center rounded-[44px] border shadow-[0_34px_80px_-42px_rgba(15,23,42,0.64),inset_0_1px_0_color-mix(in_oklch,var(--background)_70%,white)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[0_34px_80px_-46px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]'>
              <span
                aria-hidden
                className='pointer-events-none absolute inset-0 rounded-[42px] bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.5),transparent_64%)] blur-sm dark:bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.18),transparent_68%)]'
              />
              <span
                aria-hidden
                className='pointer-events-none absolute inset-4 rounded-[34px] bg-[radial-gradient(circle,oklch(0.59_0.18_258_/_0.2),transparent_68%)] blur-xl'
              />
              <img
                src='/axiom-logo.svg'
                alt='AxiomAPI'
                className='relative size-[132px] rounded-[32px] object-contain shadow-[0_28px_54px_-30px_rgba(15,23,42,0.54)]'
                draggable={false}
              />
            </div>

            {MODEL_CHIPS.map((chip) => (
              <div
                key={chip.name}
                className={`axiom-chip ${chip.className} bg-background/[0.72] border-border/70 text-foreground absolute min-h-12 min-w-[116px] rounded-[18px] border px-3 py-2.5 shadow-[0_24px_52px_-36px_rgba(15,23,42,0.42),inset_0_1px_0_color-mix(in_oklch,var(--background)_76%,white)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.065] dark:shadow-[0_24px_56px_-34px_rgba(0,0,0,0.76),inset_0_1px_0_rgba(255,255,255,0.08)]`}
              >
                <small className='text-muted-foreground block font-mono text-[10px] tracking-[0.08em] uppercase'>
                  {t(chip.labelKey)}
                </small>
                <strong className='mt-1 block text-sm font-bold tracking-normal'>
                  {chip.name}
                </strong>
              </div>
            ))}

            <div className='border-border/70 bg-background/[0.78] absolute top-[7%] right-[8%] hidden w-[172px] rounded-3xl border p-3 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.48),inset_0_1px_0_color-mix(in_oklch,var(--background)_72%,white)] backdrop-blur-2xl sm:block dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_30px_70px_-44px_rgba(0,0,0,0.82)]'>
              <div className='text-muted-foreground mb-3 flex items-center justify-between font-mono text-[10px] font-bold uppercase'>
                <span>gateway</span>
                <RadioTower className='size-3.5 text-emerald-500 dark:text-emerald-300' />
              </div>
              <div className='space-y-2'>
                {['/v1/chat', '/v1/images', '/v1/video'].map((route, index) => (
                  <div key={route} className='flex items-center gap-2'>
                    <span className='bg-primary/70 size-1.5 rounded-full dark:bg-white/80' />
                    <span className='text-muted-foreground font-mono text-[11px]'>
                      {route}
                    </span>
                    <span
                      className={cn(
                        'ml-auto h-1.5 rounded-full bg-[linear-gradient(90deg,oklch(0.58_0.18_248),oklch(0.67_0.16_165))]',
                        index === 0 && 'w-10',
                        index === 1 && 'w-7',
                        index === 2 && 'w-12'
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className='border-border/70 bg-background/[0.76] absolute bottom-4 left-1/2 grid min-h-[84px] w-[min(560px,calc(100%-18px))] -translate-x-1/2 grid-cols-3 overflow-hidden rounded-3xl border shadow-[0_28px_70px_-48px_rgba(15,23,42,0.54),inset_0_1px_0_color-mix(in_oklch,var(--background)_74%,white)] backdrop-blur-2xl max-sm:relative max-sm:bottom-auto max-sm:left-auto max-sm:mt-[-34px] max-sm:w-full max-sm:translate-x-0 max-sm:grid-cols-1 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_30px_74px_-48px_rgba(0,0,0,0.86)]'>
            {metrics.map((item, index) => (
              <div
                key={item.label}
                className='border-border/60 relative px-4 py-4 last:border-r-0 max-sm:border-r-0 max-sm:border-b max-sm:last:border-b-0 sm:border-r dark:border-white/10'
              >
                <small className='text-muted-foreground block font-mono text-[10px] tracking-[0.08em] uppercase'>
                  {item.label}
                </small>
                <b className='text-foreground mt-1.5 block text-[17px] font-bold tracking-normal'>
                  {item.value}
                </b>
                <Command
                  aria-hidden
                  className={cn(
                    'text-muted-foreground/20 absolute right-4 bottom-4 size-4',
                    index === 1 && 'rotate-45',
                    index === 2 && 'rotate-90'
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
