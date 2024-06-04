var fpPromise = import('https://openfpcdn.io/fingerprintjs/v3').then(FingerprintJS =>
  FingerprintJS.load(),
);

fpPromise
  .then(fp => fp.get())
  .then(result => {
    const visitorId = result.visitorId;
    window._utils.setUUID(visitorId + '_' + window._utils.getPromotionId());
    window._events && window._events.pageView();
  });
