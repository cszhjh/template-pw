!(function () {
  let publicVapidKey =
    'BIptfkFCzdvUETcbaW55FYVCRJ6YtBTTmtL5uGpN-XAz8qSc7RnKVfwQln0c2JUJACC1QajKN3heCdf5RKfSuX4';

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
    const register = await navigator.serviceWorker.register('service-worker.js');
    //  详细： https://github.com/web-push-libs/web-push#using-vapid-key-for-applicationserverkey
    // 需要开启 vpn，否则会被墙导致一直处于 pending 状态
    const subscription = await register.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicVapidKey,
    });
    console.log(subscription);
    // await fetch('https://192.168.50.227:7890/subscribe', {
    //   method: 'POST',
    //   body: JSON.stringify(subscription),
    //   // body: JSON.stringify({
    //   //   'subscription': JSON.stringify(subscription),
    //   //   'promotionKey': '',
    //   // }),
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    // });
    await fetch('https://192.168.50.252:20010/push', {
      method: 'POST',
      body: JSON.stringify({
        'subscription': JSON.stringify(subscription),
        'promotionKey': '',
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

  window.unsubscribe = unsubscribePush;
})();
