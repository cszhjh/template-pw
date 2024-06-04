!(function () {
  let vapidPublicKey = 'BKYZymBADeV_ItcbBdi4XmkeKC1SACgr4AGBmN2qK3e_PJT9QfwaWRfBjgHvT4x7kNthYT3RqleWT6G6pC2SdaU';

  window.addEventListener('load', () => {
    if ('serviceWorker' in navigator) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          registerServiceWorker();
        }
      });
    }
  });

  async function registerServiceWorker() {
    const [register] = await Promise.all([
      navigator.serviceWorker.register('/service-worker.js'),
      navigator.serviceWorker.ready,
    ]);

    //  详细： https://github.com/web-push-libs/web-push#using-vapid-key-for-applicationserverkey
    // 需要开启 vpn，否则会被墙导致一直处于 pending 状态
    const subscription = await register.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey,
    });
    const visitorId = window._utils.getVisitorId();
    const promotionKey = window._utils.getPromotionId();
    await fetch('https://192.168.168.222:20010'.replace(/\/$/, '') + '/push', {
      method: 'POST',
      body: JSON.stringify({
        'subscription': JSON.stringify(subscription),
        visitorId,
        promotionKey,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async function unsubscribePush() {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
    }
  }

  // 为了测试用, 线上将这里删掉
  window.unsubscribe = unsubscribePush;
})();
