#!/bin/bash
# Сборка LevelUp.apk без Gradle. Инструменты: ~/.local/share/android-build (JDK 17 + SDK build-tools 34).
# Ключ подписи там же (levelup.keystore) — НЕ ТЕРЯТЬ: только им можно подписывать обновления.
# Перед новой сборкой увеличь versionCode/versionName в AndroidManifest.xml.
set -e
T=~/.local/share/android-build; BT=$T/sdk/build-tools/34.0.0; AJ=$T/sdk/platforms/android-34/android.jar
export JAVA_HOME=$T/jdk PATH=$T/jdk/bin:$PATH
cd "$(dirname "$0")"; B=build; rm -rf $B; mkdir -p $B/assets $B/gen $B/classes
cp ../index.html ../style.css ../sprites.js ../i18n.js ../app.js ../icon.svg $B/assets/; cp -r ../fonts $B/assets/
if [ ! -f $T/levelup.keystore ]; then
  head -c 24 /dev/urandom | base64 | tr -d '/+=' > $T/levelup.keystore.pass
  keytool -genkeypair -keystore $T/levelup.keystore -alias levelup -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass:file $T/levelup.keystore.pass -keypass:file $T/levelup.keystore.pass -dname "CN=Level Up" >/dev/null 2>&1
fi
$BT/aapt2 compile --dir res -o $B/res.zip
$BT/aapt2 link -o $B/unsigned.apk -I $AJ --manifest AndroidManifest.xml -A $B/assets --java $B/gen $B/res.zip
javac -nowarn -source 8 -target 8 -bootclasspath $AJ -d $B/classes $(find src $B/gen -name '*.java') 2>&1 | grep -v "^warning\|^Note\|^1 warning" || true
$BT/d8 --release --lib $AJ --min-api 26 --output $B $(find $B/classes -name '*.class')
(cd $B && zip -q unsigned.apk classes.dex)
$BT/zipalign -f -p 4 $B/unsigned.apk $B/aligned.apk
$BT/apksigner sign --ks $T/levelup.keystore --ks-pass file:$T/levelup.keystore.pass --out ../LevelUp.apk $B/aligned.apk
rm -f ../LevelUp.apk.idsig
$BT/apksigner verify ../LevelUp.apk && echo "Готово: $(cd .. && pwd)/LevelUp.apk"
