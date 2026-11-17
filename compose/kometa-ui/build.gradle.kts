import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    kotlin("multiplatform")
    kotlin("plugin.compose")
    id("org.jetbrains.compose")
    id("com.android.library")
    id("com.vanniktech.maven.publish")
    id("org.jetbrains.dokka") // the javadoc jar Maven Central asks for, and a browsable API reference
    id("org.jetbrains.kotlinx.binary-compatibility-validator")
}

group = "io.github.inomjonismaylov"
version = "0.4.0"

kotlin {
    explicitApi() // nothing becomes public API by accident; kometa-ui.api / .klib.api record what is
    androidTarget {
        publishLibraryVariants("release")
        compilerOptions { jvmTarget.set(JvmTarget.JVM_17) }
    }
    jvm("desktop") { compilerOptions { jvmTarget.set(JvmTarget.JVM_17) } } // 17, so apps on an LTS JDK can load it
    iosArm64()
    iosSimulatorArm64()
    @OptIn(org.jetbrains.kotlin.gradle.ExperimentalWasmDsl::class)
    wasmJs { browser() } // runs the live showcase on the docs site (sample's wasmJs build)

    sourceSets {
        commonMain.dependencies {
            api(compose.runtime)
            api(compose.foundation)
            api(compose.ui)
        }
        // The drawer's Android window needs the saved-state owner, which Compose pulls in only at runtime.
        androidMain.dependencies {
            implementation("androidx.savedstate:savedstate-ktx:1.2.1")
        }
        commonTest.dependencies {
            implementation(kotlin("test"))
        }
        val desktopTest by getting {
            dependencies { implementation(compose.desktop.currentOs) }
        }
    }
}

android {
    namespace = "uz.kometa.ui"
    compileSdk = 36
    defaultConfig { minSdk = 24 }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

// The wasm target has no UI tests; this check would only complain that it has no executable to bundle them with.
tasks.matching { it.name == "checkComposeUiTestConfigurationForWasmJs" }.configureEach { enabled = false }

// The public API, checked by `apiCheck` (part of `check`); after an intended change run `apiDump` and commit api/.
apiValidation {
    @OptIn(kotlinx.validation.ExperimentalBCVApi::class)
    klib { enabled = true }
}

// Maven Central: ./gradlew :kometa-ui:publishToMavenCentral, run by publish-compose.yml on a compose-v* tag.
// CI passes the token and key as ORG_GRADLE_PROJECT_mavenCentralUsername / ...Password / signingInMemoryKey...
mavenPublishing {
    publishToMavenCentral(automaticRelease = true)
    // Only sign when a key is given, so publishToMavenLocal still works on a laptop.
    if (providers.gradleProperty("signingInMemoryKey").isPresent) signAllPublications()
    coordinates(group.toString(), "kometa-ui", version.toString())
    pom {
        name.set("Kometa UI for Compose Multiplatform")
        description.set("The Kometa design tokens and components for Compose Multiplatform (Android, desktop, iOS, Wasm), built on foundation only.")
        url.set("https://github.com/InomjonIsmaylov/kometa-ui-kit/tree/main/compose")
        inceptionYear.set("2026")
        licenses {
            license {
                name.set("MIT License")
                url.set("https://github.com/InomjonIsmaylov/kometa-ui-kit/blob/main/LICENSE")
                distribution.set("repo")
            }
        }
        developers {
            developer {
                id.set("InomjonIsmaylov")
                name.set("Inomjon Ismaylov")
                url.set("https://github.com/InomjonIsmaylov")
            }
        }
        scm {
            url.set("https://github.com/InomjonIsmaylov/kometa-ui-kit")
            connection.set("scm:git:https://github.com/InomjonIsmaylov/kometa-ui-kit.git")
            developerConnection.set("scm:git:ssh://git@github.com/InomjonIsmaylov/kometa-ui-kit.git")
        }
        issueManagement {
            system.set("GitHub")
            url.set("https://github.com/InomjonIsmaylov/kometa-ui-kit/issues")
        }
    }
}
