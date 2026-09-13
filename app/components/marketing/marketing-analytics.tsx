'use client';

import Script from 'next/script';

/** Loads analytics only when the public site has explicitly configured an ID. */
export function MarketingAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}', { anonymize_ip: true });`}
      </Script>
      <Script id="conversion-events" strategy="afterInteractive">
        {`document.addEventListener('click', function(event) {
  var target = event.target.closest('[data-track]');
  if (target && typeof window.gtag === 'function') window.gtag('event', target.dataset.track);
});`}
      </Script>
    </>
  );
}
