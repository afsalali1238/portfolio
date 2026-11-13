import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '../components/PageShell'
import { ScrollyStage } from '../components/scrollytelling/ScrollyStage'
import { DiscussionFooter } from '../components/DiscussionFooter'

export const Route = createFileRoute('/thesis')({
  head: () => ({
    meta: [
      { title: 'The Refraction of Thought — for the tech.' },
      {
        name: 'description',
        content:
          'Curiosity enters. Craft bends it. Reality catches the colour. An interactive manifesto on ideas, the work, and finding the right medium.',
      },
      { property: 'og:title', content: 'The Refraction of Thought' },
      {
        property: 'og:description',
        content: 'An interactive manifesto in six movements. By for the tech.',
      },
      { property: 'og:type', content: 'article' },
    ],
    links: [{ rel: 'canonical', href: 'https://forthe.tech/thesis' }],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'The Refraction of Thought',
          description: 'An interactive manifesto on ideas, craft, and finding the right medium.',
          author: { '@type': 'Organization', name: 'for the tech.', url: 'https://forthe.tech' },
          mainEntityOfPage: 'https://forthe.tech/thesis',
          inLanguage: 'en',
        }),
      },
    ],
  }),
  component: Thesis,
})

function Thesis() {
  return (
    <PageShell>
      <ScrollyStage />
      <DiscussionFooter />
    </PageShell>
  )
}
