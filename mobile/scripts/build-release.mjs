import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { spawnSync } from 'node:child_process';
import { validPublicConfig } from '../lib/publicConfig.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(root, '.env');
const publicEnv = fs.existsSync(envFile) ? parseEnv(fs.readFileSync(envFile, 'utf8')) : {};
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || publicEnv.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || publicEnv.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!validPublicConfig(url, key)) throw new Error('Valid public Supabase configuration is required.');
for (const name of ['BETADRIPS_ANDROID_STORE_FILE', 'BETADRIPS_ANDROID_STORE_PASSWORD', 'BETADRIPS_ANDROID_KEY_ALIAS', 'BETADRIPS_ANDROID_KEY_PASSWORD']) {
  if (!process.env[name]) throw new Error('Private signing configuration is incomplete.');
}
if (!fs.existsSync(process.env.BETADRIPS_ANDROID_STORE_FILE)) throw new Error('Private release keystore is missing.');
const env = { ...process.env, EXPO_NO_DOTENV: '1', EXPO_PUBLIC_SUPABASE_URL: url, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
  EXPO_PUBLIC_API_BASE_URL: 'https://betadrips.netlify.app', CMAKE_BUILD_PARALLEL_LEVEL: '1', NODE_ENV: 'production' };
const run = (command, args, cwd = root) => {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit' });
  if (result.error || result.status !== 0) throw new Error('Release command failed: ' + command + '. Inspect the sanitized build output.');
};
run('npx', ['expo', 'prebuild', '--platform', 'android', '--no-install']);
run('./gradlew', ['app:assembleRelease', '--no-daemon', '--max-workers=1', '-Dorg.gradle.parallel=false',
  '-Dorg.gradle.jvmargs=-Xmx1536m -XX:MaxMetaspaceSize=512m', '-Pkotlin.compiler.execution.strategy=in-process',
  '-Pexpo.devlauncher.configureInRelease=false', '-PreactNativeArchitectures=armeabi-v7a,arm64-v8a'], path.join(root, 'android'));
const version = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo.version;
const out = path.join(root, 'releases'); fs.mkdirSync(out, { recursive: true });
const apk = path.join(out, `Beta-Drips-v${version}.apk`);
fs.copyFileSync(path.join(root, 'android/app/build/outputs/apk/release/app-release.apk'), apk);
console.log('Signed standalone APK created at ' + apk + '. Verify its certificate and phone behavior before publishing.');
