package uz.kometa.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/**
 * The tokens of `projects/kometa-ui/styles/tokens.scss`, one field per CSS custom property.
 * Amber is spent on exactly one control per screen: the action the user should take next.
 */
@Immutable
data class KometaColors(
    val bg: Color,
    val card: Color,
    val input: Color,
    val border: Color,
    val border2: Color,
    val text: Color,
    val text2: Color,
    val muted: Color,
    /** A fill in both schemes; as text or an icon use [amberInk]. */
    val amber: Color,
    val amberInk: Color,
    val onAmber: Color,
    val green: Color,
    val red: Color,
    val error: Color,
    val blue: Color,
    val violet: Color,
    val greenBg: Color,
    val redBg: Color,
    val blueBg: Color,
    val violetBg: Color,
    val skel: Color,
    val bar: Color,
    val founder: Color,
    val founderBg: Color,
    val glass: Color,
    val glassLine: Color,
    val displayInk: Color,
    val isDark: Boolean,
)

val KometaDarkColors = KometaColors(
    bg = Color(0xFF12110E), card = Color(0xFF1A1C1C), input = Color(0xFF1E2020),
    border = Color(0xFF282A2B), border2 = Color(0xFF333535),
    text = Color(0xFFE2E2E2), text2 = Color(0xFFC4C7C7), muted = Color(0xFF8E9192),
    amber = Color(0xFFFFBF00), amberInk = Color(0xFFFFBF00), onAmber = Color(0xFF121414),
    green = Color(0xFF3ECF8E), red = Color(0xFFF2543D), error = Color(0xFFFF5555),
    blue = Color(0xFF54A9EB), violet = Color(0xFFA78BFA),
    greenBg = Color(62, 207, 142).copy(alpha = .15f), redBg = Color(242, 84, 61).copy(alpha = .14f),
    blueBg = Color(84, 169, 235).copy(alpha = .15f), violetBg = Color(167, 139, 250).copy(alpha = .16f),
    skel = Color(0xFF242727), bar = Color(0xFF141617),
    founder = Color(0xFFF472B6), founderBg = Color(244, 114, 182).copy(alpha = .16f),
    glass = Color(28, 26, 22).copy(alpha = .82f), glassLine = Color(244, 239, 230).copy(alpha = .14f),
    displayInk = Color(0xFFF4EFE6),
    isDark = true,
)

val KometaLightColors = KometaColors(
    bg = Color(0xFFFAF8F4), card = Color(0xFFFFFFFF), input = Color(0xFFF2EFE9),
    border = Color(0xFFE4DFD6), border2 = Color(0xFFD6D0C5),
    text = Color(0xFF1A1C1C), text2 = Color(0xFF45484A), muted = Color(0xFF5F6364),
    amber = Color(0xFFFFBF00), amberInk = Color(0xFF8A5A00), onAmber = Color(0xFF121414),
    green = Color(0xFF137347), red = Color(0xFFC2361F), error = Color(0xFFC62828),
    blue = Color(0xFF1A6DAF), violet = Color(0xFF6D4FC7),
    greenBg = Color(19, 115, 71).copy(alpha = .12f), redBg = Color(194, 54, 31).copy(alpha = .1f),
    blueBg = Color(26, 109, 175).copy(alpha = .12f), violetBg = Color(109, 79, 199).copy(alpha = .12f),
    skel = Color(0xFFECE8E1), bar = Color(0xFFFFFFFF),
    founder = Color(0xFFBE185D), founderBg = Color(190, 24, 93).copy(alpha = .12f),
    glass = Color(255, 252, 246).copy(alpha = .72f), glassLine = Color(60, 40, 10).copy(alpha = .1f),
    displayInk = Color(0xFF1A1C1C),
    isDark = false,
)

/**
 * The three families. The web kit ships Manrope (sans) and Syne 700 (display) as woff2, which
 * Compose cannot load: pass your own `FontFamily(Font(R.font.manrope...))` here to match it.
 */
@Immutable
data class KometaFonts(
    val sans: FontFamily = FontFamily.SansSerif,
    val display: FontFamily = FontFamily.SansSerif,
    val mono: FontFamily = FontFamily.Monospace,
)

/** The type scale: dense, 500..800 weights only, mono for every time and price. */
@Immutable
class KometaTypography(fonts: KometaFonts) {
    val body = TextStyle(fontFamily = fonts.sans, fontSize = 13.sp, fontWeight = FontWeight.Medium, lineHeight = 1.35.em)
    val md = body.copy(fontSize = 14.sp)
    val small = body.copy(fontSize = 12.sp)
    /** Tracked uppercase eyebrow; uppercase the string yourself. */
    val eyebrow = small.copy(fontWeight = FontWeight.Bold, letterSpacing = .08.em)
    val title = TextStyle(fontFamily = fonts.display, fontSize = 22.sp, fontWeight = FontWeight.Bold, letterSpacing = (-.005).em)
    val mono = body.copy(fontFamily = fonts.mono)
}

val LocalKometaColors = staticCompositionLocalOf { KometaDarkColors }
val LocalKometaFonts = staticCompositionLocalOf { KometaFonts() }
val LocalKometaTypography = staticCompositionLocalOf { KometaTypography(KometaFonts()) }

/** Wrap the app (or a screen) in this; the components read their colours and fonts from it. */
@Composable
fun KometaTheme(
    dark: Boolean = isSystemInDarkTheme(),
    fonts: KometaFonts = KometaFonts(),
    colors: KometaColors = if (dark) KometaDarkColors else KometaLightColors,
    content: @Composable () -> Unit,
) {
    CompositionLocalProvider(
        LocalKometaColors provides colors,
        LocalKometaFonts provides fonts,
        LocalKometaTypography provides remember(fonts) { KometaTypography(fonts) },
        content = content,
    )
}

/** `Kometa.colors.amber`, `Kometa.type.title`... */
object Kometa {
    val colors: KometaColors @Composable @ReadOnlyComposable get() = LocalKometaColors.current
    val fonts: KometaFonts @Composable @ReadOnlyComposable get() = LocalKometaFonts.current
    val type: KometaTypography @Composable @ReadOnlyComposable get() = LocalKometaTypography.current
}

/** Mixes [this] toward black, like CSS `color-mix(in srgb, c p%, black)`. */
internal fun Color.shade(keep: Float) = Color(red * keep, green * keep, blue * keep, alpha)
