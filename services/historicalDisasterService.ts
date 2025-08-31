import type { HistoricalDisaster, HazardType } from '../types';

// NOTE: The data is now hardcoded to prevent hitting API rate limits
// during development and for providing stable, reliable demo data.
const MOCK_HISTORICAL_DISASTERS: HistoricalDisaster[] = [
  {
    id: 'dis-1',
    eventName: '2004 Indian Ocean earthquake and tsunami',
    date: 'December 2004',
    type: 'Tsunami' as HazardType,
    location: 'Indian Ocean',
    fatalities: 227898,
    economicImpactUSD: '15 Billion',
    summary: 'One of the deadliest natural disasters in recorded history, caused by a massive undersea earthquake.',
  },
  {
    id: 'dis-2',
    eventName: 'Hurricane Katrina',
    date: 'August 2005',
    type: 'Cyclone' as HazardType,
    location: 'United States (Gulf Coast)',
    fatalities: 1836,
    economicImpactUSD: '125 Billion',
    summary: 'A powerful hurricane that caused catastrophic damage, particularly in the city of New Orleans.',
  },
  {
    id: 'dis-3',
    eventName: '2010 Haiti earthquake',
    date: 'January 2010',
    type: 'Earthquake' as HazardType,
    location: 'Haiti',
    fatalities: 222570,
    economicImpactUSD: '8 Billion',
    summary: 'A catastrophic magnitude 7.0 Mw earthquake with an epicenter near the town of Léogâne.',
  },
  {
    id: 'dis-4',
    eventName: '2011 Tōhoku earthquake and tsunami',
    date: 'March 2011',
    type: 'Tsunami' as HazardType,
    location: 'Japan',
    fatalities: 19747,
    economicImpactUSD: '235 Billion',
    summary: 'A magnitude 9.0–9.1 undersea megathrust earthquake that triggered powerful tsunami waves.',
  },
  {
    id: 'dis-5',
    eventName: '2018 Kerala Floods',
    date: 'August 2018',
    type: 'Flood' as HazardType,
    location: 'Kerala, India',
    fatalities: 483,
    economicImpactUSD: '5.4 Billion',
    summary: 'Severe floods in the Indian state of Kerala due to unusually high rainfall during the monsoon season.',
  },
  {
    id: 'dis-6',
    eventName: '2013 North India Floods',
    date: 'June 2013',
    type: 'Flood' as HazardType,
    location: 'Uttarakhand, India',
    fatalities: 6054,
    economicImpactUSD: '3.8 Billion',
    summary: 'A multi-day cloudburst centered on the state of Uttarakhand caused devastating floods and landslides.',
  },
  {
    id: 'dis-7',
    eventName: '1999 Odisha Cyclone',
    date: 'October 1999',
    type: 'Cyclone' as HazardType,
    location: 'Odisha, India',
    fatalities: 9887,
    economicImpactUSD: '4.4 Billion',
    summary: 'The strongest tropical cyclone ever recorded in the North Indian Ocean, causing immense damage.',
  },
  {
    id: 'dis-8',
    eventName: '2001 Gujarat Earthquake',
    date: 'January 2001',
    type: 'Earthquake' as HazardType,
    location: 'Gujarat, India',
    fatalities: 20023,
    economicImpactUSD: '10 Billion',
    summary: 'A massive earthquake that occurred on India\'s 52nd Republic Day, causing widespread destruction.',
  },
  {
    id: 'dis-9',
    eventName: '2020 Australian Bushfires (Black Summer)',
    date: '2019-2020',
    type: 'Fire' as HazardType,
    location: 'Australia',
    fatalities: 34,
    economicImpactUSD: '70 Billion',
    summary: 'An intense period of bushfires that burned an estimated 18.6 million hectares and destroyed over 5,900 buildings.',
  },
  {
    id: 'dis-10',
    eventName: '2008 Sichuan Earthquake',
    date: 'May 2008',
    type: 'Earthquake' as HazardType,
    location: 'Sichuan, China',
    fatalities: 87587,
    economicImpactUSD: '150 Billion',
    summary: 'A deadly earthquake that measured 8.0 Ms, causing widespread damage and leaving millions homeless.',
  }
];

/**
 * Fetches a list of historical disasters.
 * To prevent hitting API rate limits during development and for stable demo data,
 * this function now returns a static, hardcoded list.
 */
export async function fetchHistoricalDisasters(): Promise<HistoricalDisaster[]> {
  return Promise.resolve(MOCK_HISTORICAL_DISASTERS);
}