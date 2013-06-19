/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
(function() {
  var twtracking_init = function() {
    var checkbox = document.getElementById("submitTrackingBox");
    checkbox.checked = Application.prefs.getValue("extensions.tpmanager.tracking.enabled", false);
    gAdvancedPane._setupLearnMoreLink("extensions.tpmanager.tracking.infoURL", "trackingLearnMore");
  }
  var _init = gAdvancedPane.init.bind(gAdvancedPane);
  gAdvancedPane.init = (function() {
    _init();
    twtracking_init();
  }).bind(gAdvancedPane);
})();

