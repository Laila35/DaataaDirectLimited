export interface ChannelLink {
  label: string;
  href: string;
}
export interface CompanyChannel {
  name: string;
  mark: string;
  line: string;
  links: ChannelLink[];
}
export const COMPANY_CHANNELS: CompanyChannel[] = [
  {
    name: 'Plain Wholesale',
    mark: 'PW',
    line: 'Plain garments, sold wholesale.',
    links: [{ label: 'gofashiondirect.com', href: 'https://www.gofashiondirect.com' }],
  },
  {
    name: 'Funny designs',
    mark: 'FD',
    line: 'Humour-led prints, ready to wear.',
    links: [{ label: 'daataadirect.co.uk', href: 'https://www.daataadirect.co.uk' }],
  },
  {
    name: 'Print on demand',
    mark: 'PV',
    line: 'Printed when the order comes in.',
    links: [
      { label: 'printvolt.co.uk', href: 'https://www.printvolt.co.uk' },
      { label: 'printvolt.com', href: 'https://www.printvolt.com' },
    ],
  },
  {
    name: 'Printing Materials',
    mark: 'DT',
    line: 'Materials for the print floor.',
    links: [{ label: 'dtfocean.co.uk', href: 'https://www.dtfocean.co.uk' }],
  },
];
