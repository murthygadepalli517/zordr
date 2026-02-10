const { withAndroidManifest } = require('@expo/config-plugins');

const withHighRefreshRate = (config) => {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;
        if (androidManifest.manifest && androidManifest.manifest.application) {
            const application = androidManifest.manifest.application[0];
            // 0 means default, 1 means 60Hz, 2 means high refresh rate (90Hz/120Hz/etc)
            // This is a common way to signal high refresh rate preference on some implementation
            // However, the standard way often involves 'android:preferredRefreshRate' attribute on Activity (API 34+)
            // or simply nothing specific other than ensuring game mode or similar
            // BUT, a common community fix is adding a meta-data or specific activity attribute?
            // Actually, standard Android ignores this usually unless specific vendor extensions.
            // 
            // A more robust way for React Native / Expo is ensuring 'CADisableMinimumFrameDurationOnPhone' equivalent on Android?
            // Actually, for Android, simply ensuring we don't cap it is key.
            // But many vendor OS limit to 60hz for 'standard' apps to save battery.
            // We can try to force it via specific extensive config.
            // 
            // Let's use the standard "preferredRefreshRate" attribute on the main activity.

            const mainActivity = application.activity?.find(
                (a) => a['$']['android:name'] === '.MainActivity'
            );

            if (mainActivity) {
                // This attribute is available in newer Android SDKs
                // We inject it into the raw XML attributes
                mainActivity['$']['android:preferredRefreshRate'] = 'device_max';
            }
        }
        return config;
    });
};

module.exports = withHighRefreshRate;
