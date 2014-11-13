/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const {classes: Cc, interfaces: Ci, utils: Cu, results: Cr} = Components;

Cu.import('resource://gre/modules/XPCOMUtils.jsm');
Cu.import('resource://gre/modules/AddonManager.jsm');

let terminator = function() {
  this.wrappedJSObject = this;
};

terminator.prototype = {
  classDescription: 'Uninstall self in the last update',
  contractID: '@mozilla.com.cn/twterminator;1',
  classID: Components.ID('{03E4933D-0044-4C94-9BFA-E3337BC46893}'),
  _xpcom_categories: [{category: 'profile-after-change'}],
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver,
                                         Ci.nsISupportsWeakReference]),

  observe: function (aSubject, aTopic, aData) {
    switch (aTopic) {
      case 'profile-after-change': {
        // Uninstall self
        AddonManager.getAddonByID('tpmanager@mozillaonline.com', function(addon) {
          addon.uninstall();
        });
        break;
      }
    }
  }
};

if (XPCOMUtils.generateNSGetFactory) {
  const NSGetFactory = XPCOMUtils.generateNSGetFactory([terminator]);
} else {
  const NSGetModule = function (aCompMgr, aFileSpec) {
    return XPCOMUtils.generateModule([terminator]);
  }
}
