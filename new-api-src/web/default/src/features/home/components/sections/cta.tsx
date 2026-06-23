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
        className='relative mx-auto grid max-w-[1320px] gap-10 overflow-hidden rounded-[38px] border border-slate-900/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(241,248,255,0.76))] p-7 shadow-[0_32px_90px_-62px_rgba(15,23,42,0.46),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl md:grid-cols-[0.7fr_0.3fr] md:p-10 lg:p-12'
        animation='scale-in'
      >
        <div
          aria-hidden
          className='absolute right-[-10rem] bottom-[-14rem] size-[32rem] rounded-full bg-blue-500/10 blur-3xl'
        />
        <div className='relative'>
          <p className='mb-4 font-mono text-xs font-bold tracking-[0.14em] text-blue-600 uppercase'>
            {t('home.axiom.cta.eyebrow')}
          </p>
          <h2 className='max-w-[760px] text-4xl leading-[1.04] font-extrabold tracking-normal text-balance text-slate-950 md:text-5xl'>
            {t('home.axiom.cta.title')}
          </h2>
          <p className='mt-6 max-w-[600px] text-base leading-relaxed text-pretty text-slate-600'>
            {t('home.axiom.cta.description')}
          </p>
        </div>

        <div className='relative flex flex-col justify-end gap-3 md:items-end'>
          <Button
            className='group h-11 w-full rounded-full bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 md:w-auto'
            render={<Link to='/sign-up' />}
          >
            {t('home.axiom.actions.getStarted')}
            <ArrowRight className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
          </Button>
          <Button
            variant='outline'
            className='h-11 w-full rounded-full border-slate-900/10 bg-white/70 px-5 text-sm font-semibold md:w-auto'
            render={<Link to='/pricing' />}
          >
            {t('home.axiom.actions.modelSquare')}
          </Button>
        </div>
      </AnimateInView>
    </section>
  )
}
