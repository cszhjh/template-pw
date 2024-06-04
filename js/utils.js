!(function (win, ls, loc) {
  var cachePrefix = '__hsq_';
  // var promotionId = loc.pathname.split('/')[1];
  var queryParams = getQueryParams();
  var userSourcePlatform = {
    google: 1,
    facebook: 2,
    tiktok: 3,
    bingAds: 4,
    snapchat: 5,
    pinterest: 6,
  };
  var userSources = getUserSources();

  /** dev_test */
  var promotionId = '2c62423';

  function parseQueryString(queryString) {
    var params = {};
    var pairs = queryString.split('&');
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i].split('=');
      var key = decodeURIComponent(pair[0]);
      var value = decodeURIComponent(pair[1] || ''); // 如果没有值，则默认为空字符串
      params[key] = value;
    }
    return params;
  }

  function getQueryParams() {
    var url = loc.href;
    var queryIndex = url.indexOf('?');
    return queryIndex !== -1 ? parseQueryString(url.substring(queryIndex + 1)) : {};
  }

  function getQueryParam(key) {
    return Object.hasOwnProperty.call(queryParams, key)
      ? encodeURIComponent(queryParams[key])
      : void 0;
  }

  function getUserSources() {
    var platformFlags = {
      google: getQueryParam('channel'),
      facebook: getQueryParam('fbclid'),
      tiktok: getQueryParam('ttclid'),
      bingAds: getQueryParam('external_click_id'),
      snapchat: getQueryParam('utm_ssn'),
      pinterest: getQueryParam('p0'),
    };
    for (var key in platformFlags) {
      if (platformFlags[key]) {
        return { id: userSourcePlatform[key], platform: key };
      }
    }
    return null;
  }

  var utils = {
    getCacheKeys: function () {
      return {
        UUID_CACHE_KEY: cachePrefix + promotionId + '_uuid',
        PROMOTION_CACHE_KEY: cachePrefix + promotionId + '_promotion_id',
      };
    },

    getVisitorId: function () {
      const uuid = this.getUUID();
      return uuid && uuid.split('_')[0];
    },

    getPromotionId: function () {
      var PROMOTION_CACHE_KEY = this.getCacheKeys().PROMOTION_CACHE_KEY;
      return ls.getItem(PROMOTION_CACHE_KEY);
    },

    setPromotionId: function (promotionId) {
      var PROMOTION_CACHE_KEY = this.getCacheKeys().PROMOTION_CACHE_KEY;
      ls.setItem(PROMOTION_CACHE_KEY, promotionId);
    },

    getUUID: function () {
      var UUID_CACHE_KEY = this.getCacheKeys().UUID_CACHE_KEY;
      return ls.getItem(UUID_CACHE_KEY);
    },

    setUUID: function (uuid) {
      var UUID_CACHE_KEY = this.getCacheKeys().UUID_CACHE_KEY;
      ls.setItem(UUID_CACHE_KEY, uuid);
    },

    isChromeBrowser: function isChromeBrowser() {
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
    },

    gotoChrome: function () {
      if (this.isChromeBrowser()) return;

      var url = loc.href.replace(/(https|http):\/\//, '');
      loc.href =
        'intent://' +
        url +
        '#Intent;scheme=https;action=android.intent.action.VIEW;component=com.android.chrome;package=com.android.chrome;end';
    },

    getQueryParam: getQueryParams,

    getUserSources: function () {
      return userSources;
    },

    createFullScreenLoading: function () {
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
    },
  };
  Object.freeze && (utils = Object.freeze(utils));

  if (Object.defineProperty) {
    Object.defineProperty(win, '_utils', {
      value: utils,
      writable: false,
    });
  } else {
    win._utils = utils;
  }

  win._utils.setPromotionId(promotionId);
})(window, window.localStorage, window.location);
