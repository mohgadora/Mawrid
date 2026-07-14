plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.kotlin.serialization) apply false
    alias(libs.plugins.hilt) apply false
    alias(libs.plugins.ksp) apply false
}

// This project lives under an iCloud-synced Documents folder, which drops
// conflict-copy files ("Foo 2.class") into build/ *during* a build and breaks
// D8 dexing. Redirect all build output to a non-synced location under $HOME so
// the source can stay in place while builds are reliable. Safe to remove if the
// project is ever moved out of iCloud.
val nonSyncedBuildRoot = File(System.getProperty("user.home"), ".mawrid-build")
allprojects {
    layout.buildDirectory.set(File(nonSyncedBuildRoot, "${rootProject.name}/${project.name}"))
}
