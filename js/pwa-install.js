var supportedBrowser = ['Chrome'];
var _installBtnEl = document.getElementById('install-btn');
var _installPopEl = document.getElementById('install-pop');
var fullScreenLoading = createFullScreenLoading();
var installing = false;

function isChromeBrowser() {
  if (navigator.userAgentData) {
    return navigator.userAgentData.brands.some(function (data) {
      return data.brand === 'Google Chrome';
    });
  }

  var userAgent = navigator.userAgent.toLowerCase();
  // 匹配Chrome版本号
  var match = /chrom(e|ium)\/([\d.]+)/.exec(userAgent);
  var chromeVersion = match && match[2];

  if (!chromeVersion || +chromeVersion.split('.')[0] >= 90) return false;

  var isEdge = /Edg[a-zA-Z]*\/\d+/.test(userAgent);
  var isChrome = /Chrome\/\d+/.test(userAgent) && !isEdge;
  return isChrome && !isEdge;
}

function getAppIsInstalled() {
  if (
    !!(
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.navigator.fullscreen
    )
  ) {
    return true;
  }

  if (window.deferedPrompt) {
    return false;
  }
  return localStorage.getItem('installed') === 'true';
}

function gotoChrome() {
  if (isChromeBrowser()) return;

  var url = window.location.href.replace(/(https|http):\/\//, '');
  window.location.href =
    'intent://' +
    url +
    '#Intent;scheme=https;action=android.intent.action.VIEW;component=com.android.chrome;package=com.android.chrome;end';
}

function createFullScreenLoading() {
  var wrapper = document.createElement('div');
  var svgWrapper = document.createElement('div');
  var text = document.createElement('div');

  wrapper.style.visibility = 'hidden';
  text.innerHTML = 'Loading';
  svgWrapper.innerHTML =
    '<svg viewBox="25 25 50 50"><circle cx="50" cy="50" fill="none" r="20"></circle></svg>';

  svgWrapper.classList.add('loading-animate-wrapper');
  text.classList.add('loading-text');
  wrapper.classList.add('full-screen-loading');
  wrapper.append(svgWrapper, text);
  document.body.appendChild(wrapper);

  return {
    on: function () {
      wrapper.style.visibility = 'visible';
    },
    off: function () {
      wrapper.style.visibility = 'hidden';
    },
  };
}

window.addEventListener('DOMContentLoaded', function () {
  fullScreenLoading.on();

  try {
    gotoChrome();
  } catch (error) {
    console.error(error);
  }

  var popInstallBtn = document.getElementById('pop-install-btn');

  if (!_installBtnEl) {
    _installBtnEl = document.getElementById('install-btn');
  }

  // 注册安装按钮点击事件
  _installBtnEl && _installBtnEl.addEventListener('click', handleButtonClick);
  popInstallBtn && popInstallBtn.addEventListener('click', handleButtonClick);

  // 如果已经安装，修改按钮样式
  if (getAppIsInstalled()) {
    _installBtnEl && _installBtnEl.classList.add('installed');
  }

  function handleButtonClick() {
    if (installing) return;

    // 如果已经安装，则打开应用
    if (getAppIsInstalled()) {
      window.open('./index.html');
      return;
    }

    gotoChrome();

    _installPopEl && (_installPopEl.style.display = 'none');
    // 触发 pwa 安装
    var promptEvent = window.deferedPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      promptEvent.userChoice.then(function (choiceResult) {
        if (choiceResult.outcome === 'accepted') {
          install();
          window.deferedPrompt = null;
          localStorage.setItem('installed', 'true');
        }
      });
    }
  }

  function install() {
    var headerIconEl = document.getElementById('header-countdown');
    var progressEl = document.getElementById('install-progress');
    var countdownNumEl = document.getElementById('countdown-num');
    headerIconEl && headerIconEl.classList.add('countdown-in');
    if (!_installBtnEl) {
      _installBtnEl = document.getElementById('install-btn');
    }
    countdown(0);

    function countdown(percent) {
      if (percent > 100) {
        installing = true;
        try {
          _installBtnEl && _installBtnEl.classList.add('installed');
          headerIconEl && headerIconEl.classList.remove('countdown-in');
        } catch (error) {
          //
        }
        return;
      }

      try {
        progressEl.innerHTML = percent + '%';
        countdownNumEl.innerHTML = 10 - Math.floor(percent / 10);
      } catch (error) {
        //
      }

      setTimeout(function () {
        countdown(percent + 1);
      }, 100);
    }
  }
});

window.addEventListener('beforeinstallprompt', function (event) {
  fullScreenLoading.off();
  event.preventDefault();
  // 支持 pwa 且未安装
  window.deferedPrompt = event;
  localStorage.setItem('installed', 'false');
  if (!_installBtnEl) {
    _installBtnEl = document.getElementById('install-btn');
  }
  _installBtnEl && _installBtnEl.classList.remove('installed');
});

window.addEventListener('load', function () {
  fullScreenLoading.off();
});

// 页面可见切换时显示安装弹窗
document.addEventListener('visibilitychange', function () {
  if (getAppIsInstalled() || !window.deferedPrompt) {
    return;
  }

  if (!_installPopEl) {
    _installPopEl = document.getElementById('install-pop');
  }
  if (document.visibilityState === 'visible') {
    _installPopEl && (_installPopEl.style.display = 'block');
  }
});

document.addEventListener('DOMContentLoaded', function () {
  if (!_installPopEl) {
    _installPopEl = document.getElementById('install-pop');
  }
  try {
    var popMaskEl = _installPopEl.getElementsByClassName('pop-mask')[0];
    popMaskEl.addEventListener('click', function () {
      _installPopEl.style.display = 'none';
    });
  } catch (error) {
    console.error(error);
  }
});
