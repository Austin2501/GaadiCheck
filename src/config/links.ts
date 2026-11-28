export const LINKS = {
  /** Always the newest release; the APK must be attached as exactly `GaadiCheck.apk`. */
  androidApk: 'https://github.com/Austin2501/GaadiCheck/releases/latest/download/GaadiCheck.apk',
  caqm: 'https://caqm.nic.in',
  echallan: 'https://echallan.parivahan.gov.in',
  pucStatus: 'https://vahan.parivahan.gov.in/puc',
  mParivahan: 'https://play.google.com/store/search?q=mParivahan&c=apps',
  pucCentresNearby: 'https://www.google.com/maps/search/?api=1&query=PUC%20centre%20near%20me',
  cpcb: 'https://cpcb.nic.in',
  dataGov: 'https://data.gov.in',
  openMeteo: 'https://open-meteo.com',
  openMeteoLicence: 'https://creativecommons.org/licenses/by/4.0/',
} as const;

export type LinkKey = keyof typeof LINKS;
