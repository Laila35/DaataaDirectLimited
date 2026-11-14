export interface OfferedService {
  name: string;
  notes?: string[];
}
export interface ServiceGroup {
  title: string;
  text: string;
  items: OfferedService[];
}
export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    title: 'Operations',
    text: 'The day-to-day work that keeps a company running.',
    items: [
      { name: 'Operations & Production' },
      { name: 'Administration' },
      { name: 'Procurement' },
      { name: 'Shipping & Logistics' },
      { name: 'Human Resources (HR)' },
      { name: 'Accounts & Taxation' },
      { name: 'Legal & Trademark' },
    ],
  },
  {
    title: 'Commerce',
    text: 'How products get designed, listed, sold and supported.',
    items: [
      { name: 'Marketing' },
      { name: 'Sales' },
      { name: 'Customer Service CSR' },
      { name: 'Graphic Designing' },
      { name: 'E-Commerce', notes: ['Amazon Offers', 'Listing', 'New Product'] },
    ],
  },
  {
    title: 'Technology',
    text: 'Systems, backup and the checks behind the work.',
    items: [
      { name: 'Information Technology (IT)' },
      { name: 'IT Backup & Troubleshooting' },
      { name: 'Research and Development (R&D)' },
      { name: 'Quality Assurance (QA)' },
    ],
  },
];
export const OFFERED_SERVICES = [
  'Operations & Production',
  'Administration',
  'Accounts & Taxation',
  'Human Resources (HR)',
  'Research and Development (R&D)',
  'Marketing',
  'Information Technology (IT)',
  'IT Backup & Troubleshooting',
  'Procurement',
  'Sales',
  'Customer Service CSR',
  'Shipping & Logistics',
  'Legal & Trademark',
  'E-Commerce',
  'E-Commerce - Amazon Offers',
  'E-Commerce - Listing',
  'E-Commerce - New Product',
  'Graphic Designing',
  'Quality Assurance (QA)',
] as const;
