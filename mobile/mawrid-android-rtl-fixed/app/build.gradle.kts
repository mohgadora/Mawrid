plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.mawrid.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.mawrid.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
        vectorDrawables { useSupportLibrary = true }
    }

    buildTypes {
        // The base URL is a build-time constant here, and also overridable at
        // runtime via DataStore (see ApiConfig). Emulator reaches host via 10.0.2.2.
        debug {
            // Debug points at the live VPS (real catalog data) so fresh builds work
            // out of the box. Trailing slash required by Retrofit. If you run the
            // backend locally, switch this to "http://10.0.2.2:3600/" (the emulator's
            // route to the host's localhost).
            buildConfigField("String", "API_BASE_URL", "\"http://213.136.68.39:3600/\"")
            isMinifyEnabled = false
        }
        release {
            buildConfigField("String", "API_BASE_URL", "\"https://mawrid.example.com/\"") // TODO: deployed URL
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)

    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    debugImplementation(libs.androidx.ui.tooling)

    implementation(libs.androidx.navigation.compose)
    implementation(libs.androidx.paging.runtime)
    implementation(libs.androidx.paging.compose)
    implementation(libs.androidx.datastore.preferences)

    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)

    implementation(libs.retrofit)
    implementation(libs.retrofit.kotlinx.serialization)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)
    implementation(libs.kotlinx.serialization.json)

    implementation(libs.coil.compose)

    testImplementation(libs.junit)
}
