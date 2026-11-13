export const CHAPTERS = [
  { numeral: '00', title: 'Prologue', start: 0, end: 0.08, target: 0 },
  { numeral: 'I', title: 'The dark', start: 0.08, end: 0.22, target: 0.145 },
  { numeral: 'II', title: 'The light', start: 0.22, end: 0.38, target: 0.29 },
  { numeral: 'III', title: 'What we meet', start: 0.38, end: 0.54, target: 0.397 },
  { numeral: 'IV', title: 'The bend', start: 0.54, end: 0.72, target: 0.625 },
  { numeral: 'V', title: 'The colours', start: 0.72, end: 0.88, target: 0.8 },
  { numeral: 'VI', title: 'Becoming', start: 0.88, end: 1.001, target: 0.965 },
] as const

export function chapterAt(progress: number) {
  for (let i = CHAPTERS.length - 1; i >= 0; i--) if (progress >= CHAPTERS[i].start) return i
  return 0
}

export function surfaceAt(progress: number) {
  if (progress < 0.413) return 0
  if (progress < 0.45) return 1
  if (progress < 0.485) return 2
  return 3
}

export const SURFACES = [
  {
    label: 'Mirror',
    lead: 'Some mirror us.',
    detail: 'We arrive open and leave exactly as we came.',
    material: 'SILVER',
    status: 'REFLECTION · NO CHANGE',
  },
  {
    label: 'Wall',
    lead: 'Some throw us back hard.',
    detail: 'It stings, and it tempts us to dim. That is the nature of the wall.',
    material: 'STONE',
    status: 'COLLISION · ENERGY LOST',
  },
  {
    label: 'Void',
    lead: 'Some absorb us.',
    detail: 'Everything we pour in disappears without a sound.',
    material: 'MATTE BLACK',
    status: 'ABSORPTION · NO RETURN',
  },
  {
    label: 'Glass',
    lead: 'And a few refract.',
    detail: 'Finding the right medium is the play.',
    material: 'OPTICAL GLASS',
    status: 'A DIFFERENT POSSIBILITY',
  },
] as const

export const FULL_TEXT = [
  {
    title: 'The dark',
    paragraphs: [
      'Every real thing begins in the dark.',
      'Just like the universe.',
      'Out of nothing, a sudden ignition. It happened when the right conditions met.',
      'Nobody asked for it.',
    ],
  },
  {
    title: 'The light',
    paragraphs: [
      'There is a light in each of us. It arrives before it has a name. A question. An itch. A what if.',
      'An idea in your head costs nothing and proves nothing.',
      'Like light in empty space, it is invisible until it touches something real.',
      'So we shine.',
    ],
  },
  {
    title: 'What we meet',
    paragraphs: [
      'We shine on people. On places. On problems. What comes back depends on what surrounds us.',
      'Some mirror us. We arrive open and leave exactly as we came.',
      'Some throw us back hard. It stings, and it tempts us to dim. That is the nature of the wall.',
      'Some absorb us. Everything we pour in disappears without a sound.',
      'And a few refract.',
      'Finding the right medium is the play.',
    ],
  },
  {
    title: 'The bend',
    paragraphs: [
      'Light only refracts when it enters a denser medium.',
      'It slows down. Slowing down is what bends it.',
      'The density is the work. The 1 AM rebuild. The fourth draft. The hours beside someone else’s problem, until it becomes yours.',
      'To make anything real, you must surrender the easy, straight line.',
    ],
  },
  {
    title: 'The colours',
    paragraphs: [
      'White light was never only white. The colours were in it all along. The glass didn’t add them. It revealed them.',
      'People are like this. In the wrong room, you remain quiet and unseparated.',
      'But inside the honest medium, you disperse into colour.',
      'Sometimes we don’t need to change ourselves. We need the right medium.',
    ],
  },
  {
    title: 'Becoming',
    paragraphs: [
      'The light that comes out is not the light that went in.',
      'It slowed. It bent. It paid the toll of density.',
      'This place holds what came out the other side.',
      'You were never meant to remain a single beam of light.',
      'For the tech.',
    ],
  },
]
