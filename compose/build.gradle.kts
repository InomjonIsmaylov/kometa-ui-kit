plugins {
    kotlin("multiplatform") version "2.3.21" apply false
    kotlin("plugin.compose") version "2.3.21" apply false
    id("org.jetbrains.compose") version "1.11.1" apply false
    kotlin("android") version "2.3.21" apply false
    id("com.android.library") version "8.13.2" apply false
    id("com.android.application") version "8.13.2" apply false
    id("com.vanniktech.maven.publish") version "0.37.0" apply false
    id("org.jetbrains.dokka") version "2.3.0" apply false
    id("org.jetbrains.kotlinx.binary-compatibility-validator") version "0.18.2" apply false
}
