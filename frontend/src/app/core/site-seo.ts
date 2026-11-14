import { PageSeo } from './page-meta.service';

const organization = {
  '@type': 'Organization',
  name: 'Daataa Direct Limited',
  email: 'humanresources.daataadirect@gmail.com',
  telephone: '+923275087125',
  description: 'Data intelligence, direct marketing and digital platforms, delivered remotely from Rawalpindi.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'House 106-A, Railway Scheme 1, Near Airport, Chaklala Cantt',
    addressLocality: 'Rawalpindi',
    postalCode: '46000',
    addressRegion: 'Punjab',
    addressCountry: 'PK',
  },
};

export const HOME_SEO: PageSeo = {
  title: 'Daataa Direct Limited | Data and direct marketing',
  description: 'Daataa Direct Limited helps businesses understand their customers and reach them directly. Data, campaigns and digital platforms, delivered remotely from Rawalpindi.',
  path: '/',
  jsonLd: {
    '@context': 'https://schema.org',
    ...organization,
  },
};

export const SERVICES_SEO: PageSeo = {
  title: 'Services | Daataa Direct Limited',
  description: 'Operations, commerce and technology services from Daataa Direct Limited, including marketing, e-commerce, IT, HR, logistics and graphic design. Delivered remotely from Rawalpindi.',
  path: '/services',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Services from Daataa Direct Limited',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Operations' },
      { '@type': 'ListItem', position: 2, name: 'Commerce' },
      { '@type': 'ListItem', position: 3, name: 'Technology' },
    ],
  },
};

export const SIGN_IN_SEO: PageSeo = {
  title: 'Sign in | Daataa Direct Limited',
  description: 'Staff sign-in for Daataa Direct Limited. Admin accounts use the admin login.',
  path: '/sign-in',
};

export const ADMIN_LOGIN_SEO: PageSeo = {
  title: 'Admin sign in | Daataa Direct Limited',
  description: 'Private sign-in for the Daataa Direct Limited admin desk.',
  path: '/admin/login',
  robots: 'noindex, nofollow',
};
