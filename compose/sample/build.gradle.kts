plugins {
    kotlin("android")
    kotlin("plugin.compose")
    id("com.android.application")
}

android {
    namespace = "uz.kometa.sample"
    compileSdk = 34
    defaultConfig {
        applicationId = "uz.kometa.sample"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin { compilerOptions { jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17) } }

dependencies {
    implementation(project(":kometa-ui"))
    implementation("androidx.activity:activity-compose:1.9.3")
}
