const { withAppBuildGradle } = require('expo/config-plugins');

// Credentials are supplied by the local build process, never serialized into config.
module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, config => {
    let source = config.modResults.contents;
    source = source.replace(/\n\s*\/\/ @begin beta-drips-release-signing[\s\S]*?\/\/ @end beta-drips-release-signing[ \t]*\n+/g, '\n');
    const anchor = 'signingConfigs {';
    if (!source.includes(anchor)) throw new Error('Android signing template changed; review before building.');
    const signing = `
        // @begin beta-drips-release-signing
        betaDripsRelease {
            def names = ['BETADRIPS_ANDROID_STORE_FILE', 'BETADRIPS_ANDROID_STORE_PASSWORD', 'BETADRIPS_ANDROID_KEY_ALIAS', 'BETADRIPS_ANDROID_KEY_PASSWORD']
            def values = names.collect { System.getenv(it) }
            def releaseRequested = gradle.startParameter.taskNames.any { it.toLowerCase().contains('release') }
            if (releaseRequested) {
                if (values.any { !it }) throw new GradleException('Private Beta Drips release signing variables are required.')
                if (values[2].toLowerCase().contains('debug') || new File(values[0]).name == 'debug.keystore') throw new GradleException('A debug signing key is not allowed for release.')
                if (System.getenv('EXPO_PUBLIC_API_BASE_URL') != 'https://betadrips.netlify.app') throw new GradleException('Release must use the live HTTPS API.')
                if (findProperty('expo.devlauncher.configureInRelease') == 'true') throw new GradleException('The development launcher is not allowed in release.')
            }
            if (values.every { it }) {
                storeFile file(values[0])
                storePassword values[1]
                keyAlias values[2]
                keyPassword values[3]
            }
        }
        // @end beta-drips-release-signing
`;
    source = source.replace(anchor, anchor + signing);
    const buildTypes = source.indexOf('buildTypes {');
    if (buildTypes < 0) throw new Error('Android build-type template changed; review before building.');
    const prefix = source.slice(0, buildTypes);
    const tail = source.slice(buildTypes);
    const target = /(release\s*\{[\s\S]*?)signingConfig signingConfigs\.(debug|betaDripsRelease)/;
    if (!target.test(tail)) throw new Error('Release signing template changed; refusing a debug fallback.');
    source = prefix + tail.replace(target, '$1signingConfig signingConfigs.betaDripsRelease');
    // Keep Metro bundling to one worker as well as the separate Gradle worker limit.
    source = source.replace(/\n\s*extraPackagerArgs = \['--max-workers', '1'\][ \t]*\n+/g, '\n');
    const bundle = 'bundleCommand = "export:embed"';
    if (!source.includes(bundle)) throw new Error('Expo bundle template changed; review before building.');
    source = source.replace(bundle, bundle + "\n    extraPackagerArgs = ['--max-workers', '1']\n");
    config.modResults.contents = source;
    return config;
  });
};
