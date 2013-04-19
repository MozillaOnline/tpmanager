/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var ceTracking = {
  twTracking: Cc["@mozilla.com.cn/twtracking;1"].getService().wrappedJSObject,

  track: function(key) {
    this.twTracking.track(key);
  },

  // 检查prefs
  hookPrefs: function(prefs, key) {
    var value = Application.prefs.getValue(prefs, "");
    this.twTracking.trackPrefs(key, value.toString());
  },

  // 监视 node 的 event
  hookEvent: function(id, event, key) {
    var ele = document.getElementById(id)
    var myFunc = function() {ceTracking.track(key || (id + "-" + event))};
    ele && ele.addEventListener(event, myFunc, false);
  },

  // 监视obs 制定的topic\data
  observers: [],

  hookObs: function(topic, data, key) {
    var tracking = ceTracking;
    var obj = {
      observe: function(s, t, d) {
        if (t == topic && (!data || d == data))
          tracking.track(key || (topic + "-" + data));
      }
    };
    tracking.observers.push({ obj: obj, topic: topic });
    Services.obs.addObserver(obj, topic, false);
  },

  unHookObs: function() {
    var arr = ceTracking.observers;
    for(var i = 0 ; i < arr.length; i++) {
      try {
        Services.obs.removeObserver(arr[i].obj, arr[i].topic);
      } catch(e) {}
    }
  },

  // 替换函数部分源码
  hookCode: function (orgFunc, key) {
    var orgCode = /{/;
    var myCode = "$& ceTracking.track('" + key + "');"
    try {
      eval(orgFunc).toString() == eval(orgFunc + "=" + eval(orgFunc).toString().replace(orgCode, myCode));
    } catch (e) { }
  },
};

(function() {
  var tracking = ceTracking;
var trackList = [{"type":"event","data":["searchbar","focus"],"key":"searchbarfocus"}
                ,{"type":"obs","data":["browser-search-engine-modified","engine-current"],"key":"changesearchengine"}
                ,{"type":"event","data":["star-button","click"],"key":"starclick"}
                ,{"type":"method","data":["PlacesCommandHook.bookmarkCurrentPage"],"key":"bookmarkthis"}
                ,{"type":"event","data":["favpart-button","click"],"key":"favpart"}
                ,{"type":"event","data":["quickluanch-addonbar","click"],"key":"quickluanch"}
                ,{"type":"event","data":["tcfontsetter","click"],"key":"fontsetter"}
                ,{"type":"event","data":["tczoompanel","click"],"key":"zoompanel"}
                ,{"type":"event","data":["tczoompanel_zoom_in","click"],"key":"tczoompanel_zoom_in"}
                ,{"type":"event","data":["tczoompanel_zoom_out","click"],"key":"tczoompanel_zoom_out"}
                ,{"type":"event","data":["tczoompanel_zoom_50","click"],"key":"tczoompanel_zoom_50"}
                ,{"type":"event","data":["tczoompanel_zoom_75","click"],"key":"tczoompanel_zoom_75"}
                ,{"type":"event","data":["tczoompanel_zoom_100","click"],"key":"tczoompanel_zoom_100"}
                ,{"type":"event","data":["tczoompanel_zoom_125","click"],"key":"tczoompanel_zoom_125"}
                ,{"type":"event","data":["tczoompanel_zoom_150","click"],"key":"tczoompanel_zoom_150"}
                ,{"type":"event","data":["tczoompanel_zoom_200","click"],"key":"tczoompanel_zoom_200"}
                ,{"type":"event","data":["tczoompanel_zoom_300","click"],"key":"tczoompanel_zoom_300"}
                ,{"type":"event","data":["tczoompanel_global","click"],"key":"tczoompanel_global"}
                ,{"type":"event","data":["tczoompanel","click"],"key":"zoompanel"}
                ,{"type":"event","data":["personas-toolbar-button","click"],"key":"personas-tb"}
                ,{"type":"event","data":["ce-undo-close-toolbar-button","click"],"key":"undoclosetab"}
                ,{"type":"event","data":["ce_privateBrowser","click"],"key":"privateBrowser-tb"}
                ,{"type":"event","data":["ntabimprove","click"],"key":"ntabimprove"}
                ,{"type":"event","data":["ntabimprove_closetab_dblclick","click"],"key":"ntabimprove_closetab_dblclick"}
                ,{"type":"event","data":["ntabimprove_closetab_mclick","click"],"key":"ntabimprove_closetab_mclick"}
                ,{"type":"event","data":["ntabimprove_closetab_rclick","click"],"key":"ntabimprove_closetab_rclick"}
                ,{"type":"event","data":["ntabimprove_loadInBackground_disable","click"],"key":"ntabimprove_loadInBackground_disable"}
                ,{"type":"event","data":["ntabimprove_loadInBackground_enable","click"],"key":"ntabimprove_loadInBackground_enable"}
                ,{"type":"event","data":["ntabimprove_setting","click"],"key":"ntabimprove_setting"}
                ,{"type":"event","data":["ce_sanitizeHistory","click"],"key":"ce_sanitizeHistory"}
                ,{"type":"event","data":["ce_sanitizeHistory_none","click"],"key":"ce_sanitizeHistory_none"}
                ,{"type":"event","data":["ce_sanitizeHistory_onclose","click"],"key":"ce_sanitizeHistory_onclose"}
                ,{"type":"event","data":["ce_sanitizeHistory_dialog","click"],"key":"ce_sanitizeHistory_dialog"}
                ];
  var init_once = false;
  function startTracking() {
    if (init_once)
      return;

    init_once = true;
    var arr = trackList;
    for(var i = 0; i < arr.length; i++) {
      try {
        var obj = arr[i];
        switch(obj.type) {
          case "event":
            tracking.hookEvent(obj.data[0], obj.data[1], obj.key);
            break;
          case "obs":
            tracking.hookObs(obj.data[0], obj.data[1], obj.key);
            break;
          case "method":
            tracking.hookCode(obj.data[0], obj.key);
            break;
          case "prefs":
            tracking.hookPrefs(obj.data[0], obj.key);
            break;
        }
      } catch(e) {}
    }
  }

  function stopTracking() {
    ceTracking.unHookObs();
  }

  window.addEventListener("load", function() {setTimeout(startTracking, 10);}, false)
  window.addEventListener("close", stopTracking, false)
})();

