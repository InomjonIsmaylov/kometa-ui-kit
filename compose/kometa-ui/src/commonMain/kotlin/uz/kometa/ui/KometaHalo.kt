package uz.kometa.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class KometaHaloSize { Sm, Md, Lg }

private val LocalHaloGlyphSize = compositionLocalOf<TextUnit> { 18.sp }

/**
 * An icon-only button with no drawn box (`button[k-halo]`): 44dp (Sm 32, Lg 56), a muted glyph and a
 * disc of light while pressed, hovered or focused. [description] is required, since the glyph is the
 * only content. [icon] draws in [LocalKometaContentColor]; [KometaHaloGlyph] is a text glyph sized to it.
 */
@Composable
fun KometaHalo(
    onClick: () -> Unit,
    description: String,
    modifier: Modifier = Modifier,
    size: KometaHaloSize = KometaHaloSize.Md,
    enabled: Boolean = true,
    icon: @Composable () -> Unit,
) {
    val c = Kometa.colors
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val hovered by source.collectIsHoveredAsState()
    val focused by source.collectIsFocusedAsState()
    val lit = enabled && (pressed || hovered || focused)
    val disc by animateColorAsState(Color(128, 128, 128).copy(alpha = if (lit && pressed) .28f else if (lit) .18f else 0f), tween(200))
    val ink by animateColorAsState(if (lit) c.displayInk else c.muted, tween(200))
    val (box, glyph) = when (size) {
        KometaHaloSize.Sm -> 32.dp to 15.sp
        KometaHaloSize.Md -> 44.dp to 18.sp
        KometaHaloSize.Lg -> 56.dp to 22.sp
    }
    Box(
        modifier
            .size(box)
            .alpha(if (enabled) 1f else .4f)
            .clip(CircleShape)
            .background(disc)
            .clickable(source, indication = null, enabled = enabled, role = Role.Button, onClick = onClick)
            .semantics { contentDescription = description },
        contentAlignment = Alignment.Center,
    ) {
        CompositionLocalProvider(LocalKometaContentColor provides ink, LocalHaloGlyphSize provides glyph) { icon() }
    }
}

/** A text glyph ("✕", "‹") for [KometaHalo]'s icon, in the halo's ink and size. */
@Composable
fun KometaHaloGlyph(glyph: String) =
    BasicText(glyph, style = Kometa.type.md.copy(color = LocalKometaContentColor.current, fontSize = LocalHaloGlyphSize.current))
