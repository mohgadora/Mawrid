# Mawrid — Visual Parity Spec (Website → Compose)

Goal: make the Android home screen visually match the website (`http://213.136.68.39:3600`,
dark theme, orange brand). This spec is derived directly from the website's own source
components so the app can be a faithful port, not an approximation.

## Read the real source (ground truth — port these, don't guess)

The website source is on this Mac at:
`~/Downloads/Mawrid-claude-mawrid-store-settings-06uk64/`
- `components/site-header.tsx`, `header-search.tsx` — header
- `components/hero-carousel.tsx` — hero + trust badges
- `components/product-card.tsx` — product card
- `components/ai-recommendations.tsx` — AI section
- `components/deals-section.tsx` — flash/wholesale deals
- `components/category-grid.tsx` — categories
- `app/globals.css` — exact color tokens (OKLCH)
- `lib/i18n.tsx` — exact Arabic strings

Open each, match structure/spacing/rounding/colors/text. The Tailwind classes map 1:1 to
Compose (rounded-2xl≈16dp, rounded-xl≈12dp, px-4≈16dp, gap-3≈12dp, p-3≈12dp, text-lg≈18sp,
size-8≈32dp, size-9≈36dp).

## Dark theme tokens (already in Color.kt — confirm these exact values)

background `#100C0B`, card `#1D1715`, foreground `#F8F4F2`, primary `#FF5636` (dark) /
`#F04827` (light accents), primary-foreground `#FFFAF5`, muted/secondary `#2B2523`,
muted-foreground `#91827D`, border `#322C2A`, accent surface `#2B2523`, success (verified)
`#16A34A`, star/rating (chart-3) amber `#F59E0B`, destructive `#E7000B`.

## Exact Arabic strings (use verbatim)

- Tagline pill: **منصة تجارة الجملة رقم 1**
- Hero title: **اشترِ بالجملة، وفّر أكثر**
- Hero subtitle: **قارن أسعار الجملة بمتوسط السوق واشترِ من موردين موثوقين بأفضل الأسعار**
- Hero CTAs: filled **تسوّق الآن** (+ arrow) · outlined **اكتشف العروض**
- Trust badges: **توصيل سريع** (truck) · **حماية الطلب** (shield) · **دفع آمن** (wallet) · **مورد موثّق** (shield-check)
- Deals header: **عروض الجملة** · **ينتهي خلال** + countdown · **عرض الكل**
- AI section: **مختار لك بالذكاء الاصطناعي** / subtitle **الأكثر مبيعاً في المنصة** / refresh chip **تحديث**
- Search button: **بحث**
- Card: price label consumer = **سعر التجزئة · للكرتون**; **أقل كمية: {moq} كرتون**; verified badge **مورد موثّق**

## Section-by-section layout

**Header** (currently a plain orange bar — rebuild): (a) thin **orange** top utility strip
(tagline / country / language). (b) dark header row: logo badge = **orange rounded-square (~10dp)
with the glyph "م"** + wordmark **مورِد**; a large **rounded search field** with a filled orange
**بحث** button on the trailing side; trailing action icons (cart w/ badge, account, wishlist).

**Hero** (`hero-carousel.tsx`): full-width `rounded-2xl` image (~224dp tall), left-to-transparent
dark gradient overlay (`foreground/80 → transparent`); stacked on top: tagline **pill** (bg-primary,
tiny bold), **h1** hero title (≈24sp, font-black, on light/background color), subtitle (85% opacity),
then the two CTA buttons. Carousel dots at bottom (active dot = wider, primary). Auto-advances 5s.

**Trust badges** (below hero): grid, 2 columns on phone. Each cell = `rounded-xl` border, bg-card,
p-3, with a `size-9` **accent square** holding the icon + a bold label.

**Flash/Wholesale deals** (`deals-section.tsx`, id=deals): a `rounded-2xl` bordered card; header
strip `bg-accent/50` with a **Zap** icon in a primary square, **عروض الجملة** (primary, font-black),
**ينتهي خلال** + a live **countdown** (h/m/s each in a small `bg-foreground text-background` box,
LTR), and a **عرض الكل** link; body = product grid (deals = products with an oldPrice).

**AI section** (`ai-recommendations.tsx`): header row = **Sparkles** icon in a `primary/10` rounded
square, title **مختار لك بالذكاء الاصطناعي** + subtitle **الأكثر مبيعاً في المنصة**, and a right-aligned
pill **تحديث** (RefreshCw, spins while loading). Then a 2-column product grid.

**Product card** (`product-card.tsx`): `rounded-xl` border, bg-card. Square image on `bg-muted`;
**wishlist heart top-trailing** (in a circle); optional discount badge top-leading (orange `-{n}%`);
optional green **مورد موثّق** verified badge. Body (p-3): market-price badge, product name
(2-line clamp, ~14sp), supplier (muted, ~12sp), then price = **font-black, ~18sp, primary** with the
label **سعر التجزئة · للكرتون** under it, and a bottom row: star (amber) + rating on one side,
**أقل كمية: {moq} كرتون** on the other. Consumer price = wholesale × 1.15.

## Notes

- A phone can't mirror the desktop mega-menu — keep the mobile bottom nav; match the visual
  *identity* (dark + orange + Cairo + these components), not the desktop layout.
- Wire card hearts to the existing favorites toggle (`AccountRepository.toggleFavorite`).
- Screenshot each section on the emulator and compare against the live site side by side.
