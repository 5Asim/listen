const { withEntitlementsPlist } = require('expo/config-plugins');

// expo-widgets adds aps-environment even with enablePushNotifications off. Listen doesn't use push,
// and the unused entitlement would force a Push Notifications capability onto the App ID.
// Must be listed BEFORE expo-widgets in app.json: entitlement mods run in reverse order, so this runs after it.
module.exports = (config) =>
  withEntitlementsPlist(config, (mod) => {
    delete mod.modResults['aps-environment'];
    return mod;
  });
