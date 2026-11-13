rootProject.name = "kometa-ui-compose"

pluginManagement {
    repositories {
        google()
        gradlePluginPortal()
        mavenCentral()
    }
}

dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
}

include(":kometa-ui")
include(":sample") // an Android app showing every component, to try the kit on a device
