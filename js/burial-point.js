/**
 * 事件类型 type:
 *    1. 浏览事件
 *    2. 安装事件
 */

(async function () {
  const apiUrl = 'https://192.168.168.222:20010'.replace(/\/$/, '') + '/metrics/h5';
  const PAGE_VIEW = 1;
  const INSTALLED = 2;

  async function emitEvent(type) {
    const uuid = window._utils.getUUID();
    if (!uuid) return;

    await fetch(apiUrl, {
      method: 'POST',
      body: JSON.stringify({
        uuid: window._utils.getUUID(),
        type,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async function pageView() {
    await emitEvent(PAGE_VIEW);
  }

  async function installed() {
    await emitEvent(INSTALLED);
  }

  Object.defineProperty(window, '_events', {
    value: {
      pageView,
      installed,
    },
    writable: false,
  });
})();
