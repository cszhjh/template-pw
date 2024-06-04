!(function (win, doc, ls) {
  var utils = win._utils;
  var installBtnEl = doc.getElementById('install-btn');
  var installPopEl = doc.getElementById('install-pop');
  var fullScreenLoading = utils.createFullScreenLoading();
  var installing = false;

  function getAppIsInstalled() {
    if (
      !!(
        win.matchMedia('(display-mode: standalone)').matches ||
        win.navigator.standalone ||
        win.matchMedia('(display-mode: fullscreen)').matches ||
        win.navigator.fullscreen
      )
    ) {
      return true;
    }

    if (win.deferedPrompt) {
      return false;
    }
    return ls.getItem('installed') === 'true';
  }

  function install() {
    var headerIconEl = doc.getElementById('header-countdown');
    var progressEl = doc.getElementById('install-progress');
    var countdownNumEl = doc.getElementById('countdown-num');
    headerIconEl && headerIconEl.classList.add('countdown-in');
    if (!installBtnEl) {
      installBtnEl = doc.getElementById('install-btn');
    }
    countdown(0);

    function countdown(percent) {
      if (percent > 100) {
        installing = true;
        try {
          installBtnEl && installBtnEl.classList.add('installed');
          headerIconEl && headerIconEl.classList.remove('countdown-in');
        } catch (error) {}
        return;
      }

      try {
        progressEl.innerHTML = percent + '%';
        countdownNumEl.innerHTML = 10 - Math.floor(percent / 10);
      } catch (error) {}

      setTimeout(function () {
        countdown(percent + 1);
      }, 100);
    }
  }

  win.addEventListener('DOMContentLoaded', function () {
    fullScreenLoading.on();

    try {
      utils.gotoChrome();
    } catch (error) {
      console.error(error);
    }

    var popInstallBtn = doc.getElementById('pop-install-btn');

    if (!installBtnEl) {
      installBtnEl = doc.getElementById('install-btn');
    }

    // 注册安装按钮点击事件
    installBtnEl && installBtnEl.addEventListener('click', handleButtonClick);
    popInstallBtn && popInstallBtn.addEventListener('click', handleButtonClick);

    // 如果已经安装，修改按钮样式
    if (getAppIsInstalled()) {
      installBtnEl && installBtnEl.classList.add('installed');
    }

    function handleButtonClick() {
      if (installing) return;

      // 如果已经安装，则打开应用
      if (getAppIsInstalled()) {
        win.open('./game/index.html');
        return;
      }

      utils.gotoChrome();

      installPopEl && (installPopEl.style.display = 'none');
      // 触发 pwa 安装
      var promptEvent = win.deferedPrompt;
      if (promptEvent) {
        promptEvent.prompt();
        promptEvent.userChoice.then(function (choiceResult) {
          if (choiceResult.outcome === 'accepted') {
            // 发送安装事件
            window._events && window._events.installed();

            install();
            win.deferedPrompt = null;
            ls.setItem('installed', 'true');
          }
        });
      }
    }

    win.handleButtonClick = handleButtonClick;
  });

  win.addEventListener('beforeinstallprompt', function (event) {
    fullScreenLoading.off();
    event.preventDefault();
    // 支持 pwa 且未安装
    win.deferedPrompt = event;
    ls.setItem('installed', 'false');
    if (!installBtnEl) {
      installBtnEl = doc.getElementById('install-btn');
    }
    installBtnEl && installBtnEl.classList.remove('installed');
  });

  win.addEventListener('load', function () {
    fullScreenLoading.off();
  });

  // 页面可见切换时显示安装弹窗
  doc.addEventListener('visibilitychange', function () {
    if (getAppIsInstalled() || !win.deferedPrompt) {
      return;
    }

    if (!installPopEl) {
      installPopEl = doc.getElementById('install-pop');
    }
    if (doc.visibilityState === 'visible') {
      installPopEl && (installPopEl.style.display = 'block');
    }
  });

  doc.addEventListener('DOMContentLoaded', function () {
    if (!installPopEl) {
      installPopEl = doc.getElementById('install-pop');
    }
    try {
      var popMaskEl = installPopEl.getElementsByClassName('pop-mask')[0];
      popMaskEl.addEventListener('click', function () {
        installPopEl.style.display = 'none';
      });
    } catch (error) {
      console.error(error);
    }
  });
})(window, document, window.localStorage);
