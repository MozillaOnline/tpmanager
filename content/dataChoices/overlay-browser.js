/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function() {
  let gTrackingNotificationInfoBar = {

    handleEvent: function Improve_CE__handleEvent(aEvent) {
      switch (aEvent.type) {
        case "load":
          setTimeout(this.init.bind(this), 1000);
          break;
      }
    },

    _DATA_CHOICES_NOTIFICATION: "data-tracking",

    get _notificationBox() {
      delete this._notificationBox;
      return this._notificationBox = document.getElementById("global-notificationbox");
    },

    init: function() {
      if(Application.prefs.getValue("extensions.tpmanager.tracking.notification.shown",false)) {
        return;
      }
      this._displayInfoBar();
      Application.prefs.setValue("extensions.tpmanager.tracking.notification.shown",true);
    },

    _getDataChoicesNotification: function (name=this._DATA_CHOICES_NOTIFICATION) {
      return this._notificationBox.getNotificationWithValue(name);
    },

    _displayInfoBar: function () {
      if (this._getDataChoicesNotification()) {
        return;
      }

      let brandBundle = document.getElementById("bundle_brand");
      let appName = brandBundle.getString("brandShortName");

      let _bundles = document.getElementById("twtracking_bundle_browser");

      let message = _bundles.getFormattedString(
        "dataChoicesNotification.message",
        [appName]);


      let buttons = [{
        label: _bundles.getString("dataChoicesNotification.button.label"),
        accessKey: _bundles.getString("dataChoicesNotification.button.accessKey"),
        popup: null,
        callback: function () {
          window.openAdvancedPreferences("dataChoicesTab");
        },
      }];

      let notification = this._notificationBox.appendNotification(
        message,
        this._DATA_CHOICES_NOTIFICATION,
        null,
        this._notificationBox.PRIORITY_INFO_HIGH,
        buttons,
        function onEvent(event) {
          if (event == "removed") {
            this._clearNotification();
          }
        }.bind(this)
      );
    },

    _clearNotification: function () {
      let notification = this._getDataChoicesNotification();
      if (notification) {
        notification.close();
      }
    },

  };
  window.addEventListener("load", gTrackingNotificationInfoBar, false)
})();

