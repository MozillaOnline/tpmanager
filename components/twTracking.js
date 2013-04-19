/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const _CID = Components.ID('{FC3083D5-9710-E28F-DCB2-90D258A93F9B}');
const _CONTRACTID = "@mozilla.com.cn/twtracking;1";
const USAGE_URI = 'http://adu.myfirefox.com.tw/addons/tk.gif';

const ACTIVE_TIME_PREF = "extensions.tpmanager@mozillaonline.com.active_time";
const PK_PREF = "extensions.tpmanager@mozillaonline.com.uuid";
const LOCALE_PREF = "general.useragent.locale";
const CHANNEL_PREF = "app.taiwanedition.channel";
const DISTRIBUTION_PREF = "distribution.version";


//Cu.import("resource://gre/modules/Services.jsm");
let Services = {};

XPCOMUtils.defineLazyGetter(Services, "prefs", function () {
  return Cc["@mozilla.org/preferences-service;1"]
           .getService(Ci.nsIPrefService)
           .QueryInterface(Ci.nsIPrefBranch2);
});

XPCOMUtils.defineLazyGetter(Services, "dirsvc", function () {
  return Cc["@mozilla.org/file/directory_service;1"]
           .getService(Ci.nsIDirectoryService)
           .QueryInterface(Ci.nsIProperties);
});

XPCOMUtils.defineLazyServiceGetter(Services, "obs",
                                   "@mozilla.org/observer-service;1",
                                   "nsIObserverService");

function LOG(txt) {
  var consoleService = Cc["@mozilla.org/consoleservice;1"]
                         .getService(Ci.nsIConsoleService);
  consoleService.logStringMessage("tracking" + txt);
}

function generateUUID() {
  return Cc["@mozilla.org/uuid-generator;1"]
           .getService(Ci.nsIUUIDGenerator)
           .generateUUID()
           .number;
}

function isUUID(str) {
  return str.length == 38;
}

//user key
function getUK() {
  function getUKFile() {
    let file = null;
    try {
      file = Services.dirsvc.get("DefProfRt", Ci.nsIFile)
      file.append("profiles.log");
    } catch (e) {
      return null;
    }

    return file;
  }

  function readUK() {
    let uuid = "";
    try {
      let file = getUKFile();
      if (!file || !file.exists()) {
        throw "Could not read file ";
      }

      let fstream = Cc["@mozilla.org/network/file-input-stream;1"].
          createInstance(Ci.nsIFileInputStream);
      fstream.init(file, -1, 0, 0);

      let cstream = Cc["@mozilla.org/intl/converter-input-stream;1"].
          createInstance(Ci.nsIConverterInputStream);
      cstream.init(fstream, "UTF-8", 0, 0);

      let str = "";
      let (data = {}) {
        // read the whole file
        while (cstream.readString(-1, data))
          str += data.value;
      }
      cstream.close(); // this also closes fstream

      let obj = JSON.parse(str)
      if (!isUUID(obj.uuid)) {
        throw "invalid uuid [" + obj.uuid + "]";
      }

      uuid = obj.uuid;
    } catch (e) {
      return "";
    }

    return uuid;
  }

  function writeUK(uuid) {
    try {
      let file = getUKFile();
      if (!file) {
        return false;
      }
      let str = JSON.stringify({uuid:uuid});
      let foStream = Cc["@mozilla.org/network/file-output-stream;1"].
          createInstance(Ci.nsIFileOutputStream);
      // flags are write, create, truncate
      foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0);

      let converter = Cc["@mozilla.org/intl/converter-output-stream;1"].
          createInstance(Ci.nsIConverterOutputStream);
      converter.init(foStream, "UTF-8", 0, 0);
      converter.writeString(str);
      converter.close(); // this also closes foStream
    } catch (e) {
      return false;
    }

    return true;
  }

  var uuid = readUK();
  if (!uuid) {
    uuid = generateUUID();
    if (!writeUK(uuid)) {
      return "-" + getPK(); //"-" : user key error
    }
  }

  return encodeURIComponent(uuid);
}

//profile key
function getPK() {
  let uuid = "";
  try {
    uuid = Services.prefs.getCharPref(PK_PREF);
    if (!isUUID(uuid)) {
      throw "invalid uuid [" + uuid + "]";
    }
  } catch (e) {
    uuid = generateUUID();
    Services.prefs.setCharPref(PK_PREF, uuid);
  }

  return encodeURIComponent(uuid);
}

const ONEDAY = 24 * 60 * 60 * 1000;

function getActive() {
  try {
    var now = (new Date()).getTime();
    var act = parseInt(Services.prefs.getCharPref(ACTIVE_TIME_PREF));
    if ((now - act) / ONEDAY >= 15) {
      return "&days=15";
    } else {
      return "";
    }
  } catch(e) {
    Services.prefs.setCharPref(ACTIVE_TIME_PREF, now);//activate,pref no find
    return "&activate=true";
  }
}

var activeStr = getActive();

var MOExtensions = "";
function getMOExts() {
  try {
    if (!MOExtensions) {
      var extstr = "";
      try {
        extstr = Services.prefs.getCharPref("extensions.enabledItems");
      } catch(e) {}

      try {
        extstr = Services.prefs.getCharPref("extensions.enabledAddons");
      } catch (e) {}

      var extensions = extstr.split(",");
      extensions = extensions.map(function(ext) ext.replace('%40', '@'));

      var bootstrapped = {};
      try {
        var bsstr = Services.prefs.getCharPref("extensions.bootstrappedAddons");
        bootstrapped = JSON.parse(bsstr);
      } catch(e) {
        bootstrapped = {};
      }

      for (var id in bootstrapped) {
        extensions.push(id);
      }

      MOExtensions = extensions.filter(function(ext) /(@mozillaonline\.com|@mozilla\.com\.cn|personas@christopher\.beard)/.test(ext));
      MOExtensions = MOExtensions.map(function(ext) ext.substring(0, ext.indexOf("@")));
      MOExtensions = MOExtensions.join(",");
    }

    return MOExtensions ? "&moexts=" + MOExtensions : "";
  } catch(e) {
    return "";
  }

  return "";
}

function getADUData() {
  function getPrefStr(name, defValue) {
    try {
      return Services.prefs.getCharPref(name);
    } catch (e) {
      Components.utils.reportError(e);
      return defValue;
    }
  }
  let pk = getPK();
  let uk = getUK();
  let channelid = getPrefStr(CHANNEL_PREF, "www.myfirefox.com.tw");
  let ver = getPrefStr("extensions.lastAppVersion", "");
  let cev = getPrefStr(DISTRIBUTION_PREF, "");

  return "?channelid=" + channelid
       + "&fxversion=" + ver                       //cpmanager_paramCEVersion
       + "&ceversion=" + cev                       //cpmanager_paramCEVersion
       + "&ver=1_0&pk=" + pk + "&uk=" + uk         //cpmanager_paramActCode()
       + activeStr                                 //cpmanager_paramActive()
       + "&locale=" + getPrefStr(LOCALE_PREF, "")  //cpmanager_paramLocale()
       + getMOExts();                              //cpmanager_paramMOExts()
}

function httpGet (url) {
    let xmlHttpRequest = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
    xmlHttpRequest.QueryInterface(Ci.nsIJSXMLHttpRequest);
    xmlHttpRequest.open('GET', url, true);
    xmlHttpRequest.send(null);
    xmlHttpRequest.onreadystatechange = function() { };
};

const RETRY_DELAY = 20 * 1000;
let ADU_Task = [
  {
    task: "5s",
    delay: 5 * 1000,
    url: 'http://adu.myfirefox.com.tw/adu/adu.gif',
  },
  {
    task: "5m",
    delay: 5 * 60 * 1000,
    url: 'http://adu.myfirefox.com.tw/adu/adu-1.gif',
  },
];
let ADUIndex = 0;
let ADUTimer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);

function sendADU(index) {
  if (index >= ADU_Task.length) {
    return;
  }
  _ADU(ADU_Task[index].delay);
}

function _ADU(delay) {
  ADUTimer.initWithCallback({
    notify: function() {
      let str =  ADU_Task[ADUIndex].url + getADUData() + '&now=' + (new Date()).getTime();
      let xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
                  .createInstance(Ci.nsIXMLHttpRequest);
      xhr.QueryInterface(Ci.nsIJSXMLHttpRequest);
      xhr.open('GET', str, true);
      xhr.addEventListener("error", function(event) { _ADU(RETRY_DELAY);}, false);
      xhr.addEventListener("load", function(event) { sendADU(++ADUIndex);}, false);
      xhr.send(null);
    }
  }, delay, Ci.nsITimer.TYPE_ONE_SHOT);
}

let trackingFactoryClass = function() {
  this.wrappedJSObject = this;
}

trackingFactoryClass.prototype = {
  classDescription: "Tracking for Imporve Firefox",
  contractID: _CONTRACTID,
  classID: _CID,
  _xpcom_categories: [{ category: "profile-after-change" }],
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver,
                                         Ci.nsISupportsWeakReference]),

  data: {},

  trackPrefs: function(key, value) {
    this.data[key] = value;
  },

  track: function(key) {
    if (typeof this.data[key] == 'number') {
      this.data[key] ++;
    } else {
      this.data[key] = 1;
    }
  },

  sendUsageData: function() {
    let str = '';
    data = this.data
    for(let i in data) {
      str += '&' + i + '=' + data[i];
    }
    if (str == '') {
      return;
    }
    let tracking_random = Math.random();
    str =  USAGE_URI + '?when=quit?r='+tracking_random + str;
    httpGet(str);
  },

  observe: function (aSubject, aTopic, aData) {
    switch (aTopic) {
      case "profile-after-change":
        Services.obs.addObserver(this, "quit-application", true);
        Services.obs.addObserver(this, "final-ui-startup", true);
        let tracking_random = Math.random();
        let str = USAGE_URI + '?when=run';
        httpGet(str);
        break;

      case "final-ui-startup":
        sendADU(0);
        break;
      case "quit-application":
        this.sendUsageData();
        break;
    };
  },
}

if (XPCOMUtils.generateNSGetFactory) {
  const NSGetFactory = XPCOMUtils.generateNSGetFactory([trackingFactoryClass]);
} else {
  const NSGetModule = function (aCompMgr, aFileSpec) {
    return XPCOMUtils.generateModule([trackingFactoryClass]);
  }
}

