# Mawrid Android — carry-over bundle

This bundle contains everything produced so far so a new (repo-connected) Claude
Code session can continue with zero re-work.

Contents:
- `Mawrid_Android_API_Auth_Architecture.md` — the reference: doc-vs-code
  reconciliation, API + auth map, data models (from the real Drizzle schema),
  design-system tokens, proposed architecture, phased plan, and open questions.
- Phase 0 scaffold (Kotlin + Compose + Hilt + Retrofit, minSdk 26), structured
  data/domain/ui so it ports to KMP later for iOS:
    settings.gradle.kts, build.gradle.kts, gradle/libs.versions.toml,
    app/build.gradle.kts, AndroidManifest, MawridApp (Hilt), MainActivity,
    core/designsystem (Color/Theme placeholders for OKLCH tokens),
    core/network (ApiConfig, PersistentCookieJar for better-auth session cookie,
      NetworkModule),
    data/remote (MawridApi + DTOs), data/repository (CatalogRepository),
    domain/model (Product), ui/home (HomeViewModel/UiState + HomeScreen grid).

To continue in a repo-connected session:
1. Read this README + the reference .md.
2. Open `lib/api-client.ts` and `app/globals.css` in the repo and:
   - replace the inferred endpoint paths/params in `MawridApi.kt` with the real ones,
   - transcribe the real OKLCH light/dark values into `core/designsystem/Color.kt`.
3. Confirm the better-auth mobile flow (cookie vs bearer plugin) and wire sign-in.
4. Continue the phased plan (Phase 1: product list on real data).
