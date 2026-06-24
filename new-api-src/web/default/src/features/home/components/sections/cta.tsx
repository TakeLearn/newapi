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

import { AnimateInView } from '@/components/animate-in-view'
import { Button } from '@/components/ui/button'

interface CTAProps {
  className?: string
  isAuthenticated?: boolean
}

export function CTA(props: CTAProps) {
  const { t } = useTranslation()

  if (props.isAuthenticated) {
    return null
  }

  return (
    <section className='relative z-10 px-4 py-20 sm:px-6 md:py-28 lg:px-8'>
      <AnimateInView
        className='border-border/70 bg-card/[0.72] relative mx-auto grid max-w-[1320px] gap-10 overflow-hidden rounded-[38px] border p-7 shadow-[0_32px_90px_-62px_rgba(15,23,42,0.46),inset_0_1px_0_color-mix(in_oklch,var(--background)_72%,white)] backdrop-blur-xl md:grid-cols-[0.7fr_0.3fr] md:p-10 lg:p-12 dark:border-white/10 dark:bg-white/[0.045] dark:shadow-[0_34px_100px_-64px_rgba(0,0,0,0.88),inset_0_1px_0_rgba(255,255,255,0.08)]'
        animation='scale-in'
      >
        <div
          aria-hidden
          className='absolute right-[-10rem] bottom-[-14rem] size-[32rem] rounded-full bg-sky-500/10 blur-3xl dark:bg-sky-300/10'
        />
        <div
          aria-hidden
          className='absolute top-[-12rem] left-[-10rem] size-[28rem] rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-300/10'
        />
        <div className='relative'>
          <p className='mb-4 font-mono text-xs font-bold tracking-[0.14em] text-sky-600 uppercase dark:text-sky-300'>
            {t('home.axiom.cta.eyebrow')}
          </p>
          <h2 className='text-foreground max-w-[760px] text-4xl leading-[1.04] font-extrabold tracking-normal text-balance md:text-5xl'>
            {t('home.axiom.cta.title')}
          </h2>
          <p className='text-muted-foreground mt-6 max-w-[600px] text-base leading-relaxed text-pretty'>
            {t('home.axiom.cta.description')}
          </p>
        </div>

        <div className='relative flex flex-col justify-end gap-3 md:items-end'>
          <Button
            className='group h-11 w-full rounded-full bg-[linear-gradient(135deg,oklch(0.55_0.2_250),oklch(0.67_0.16_165))] px-5 text-sm font-semibold text-white shadow-[0_18px_42px_-24px_oklch(0.58_0.18_238_/_0.78)] hover:opacity-95 md:w-auto'
            render={<Link to='/sign-up' />}
          >
            {t('home.axiom.actions.getStarted')}
            <ArrowRight className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
          </Button>
          <Button
            variant='outline'
            className='border-border/70 bg-background/[0.68] hover:bg-accent/70 h-11 w-full rounded-full px-5 text-sm font-semibold backdrop-blur-xl md:w-auto dark:border-white/10 dark:bg-white/[0.045]'
            render={<Link to='/pricing' />}
          >
            {t('home.axiom.actions.modelSquare')}
          </Button>
        </div>
      </AnimateInView>
    </section>
  )
}
