import { AboutPage } from '../core/models';

export const ABOUT_DEFAULTS: AboutPage = {
  kicker: 'Daataa Direct Limited',
  title: 'About us',
  intro: 'Daataa Direct Limited is a data and direct marketing company based in Rawalpindi. We help businesses understand their customers and reach them with clear, measurable campaigns. The work is delivered remotely.',
  detail: 'Our hours are 11am to 8pm, Pakistan time. We reply within one working day.',
  work_title: 'How we work',
  steps: [
    { n: '1', title: 'Listen', text: 'We learn your goals, your audience and the data you already hold.' },
    { n: '2', title: 'Build', text: 'We design the campaign or platform and test it on a small group first.' },
    { n: '3', title: 'Launch', text: 'We go live with tracking in place so every result is visible.' },
    { n: '4', title: 'Improve', text: 'We review the numbers with you and refine what works.' },
  ],
};
