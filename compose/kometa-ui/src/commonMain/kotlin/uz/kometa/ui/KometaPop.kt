package uz.kometa.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.isSpecified
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties

enum class KometaPopAlign { Start, End }

/**
 * Where the panel goes: below the [anchor] when it fits, else above (see [placeBelowOrAbove]), its left
 * edge on the anchor's left, or its right edge on the anchor's right for [end]; kept [pad] px inside the window.
 */
internal fun placePop(anchor: IntRect, window: IntSize, panel: IntSize, gap: Int, pad: Int, end: Boolean): IntOffset =
    placeBelowOrAbove(if (end) anchor.translate(anchor.width - panel.width, 0) else anchor, window, panel, gap, pad)

private class PopPosition(val gap: Int, val pad: Int, val end: Boolean) : PopupPositionProvider {
    override fun calculatePosition(anchorBounds: IntRect, windowSize: IntSize, layoutDirection: LayoutDirection, popupContentSize: IntSize) =
        placePop(anchorBounds, windowSize, popupContentSize, gap, pad, end)
}

/**
 * A small panel hung off a button (`k-pop`): a glass card in a popup, so no clipping parent cuts it, that
 * drops in under its anchor, flips above when there is no room below and stays inside the window. Put it in
 * the same `Box` as the button that toggles [open]: the popup anchors to that parent. The panel is whatever
 * [content] draws. A tap outside, Escape or Back calls [onOpenChange] with false. It is at most 70% of the
 * window tall and scrolls inside itself; [width] fixes its width, [offset] is the gap to the anchor and
 * [align] the anchor edge it lines up with. [label] names the panel for screen readers.
 */
@Composable
fun KometaPop(
    open: Boolean,
    onOpenChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    label: String = "",
    width: Dp = Dp.Unspecified,
    offset: Dp = 8.dp,
    align: KometaPopAlign = KometaPopAlign.Start,
    content: @Composable ColumnScope.() -> Unit,
) {
    if (!open) return
    val c = Kometa.colors
    val density = LocalDensity.current
    val provider = remember(offset, align, density) {
        with(density) { PopPosition(offset.roundToPx(), 8.dp.roundToPx(), align == KometaPopAlign.End) }
    }
    // shortcut: focus is not moved into the panel on open nor back to the button on close, Tab enters it; upgrade with FocusRequesters when keyboard use matters
    Popup(popupPositionProvider = provider, onDismissRequest = { onOpenChange(false) }, properties = PopupProperties(focusable = true)) {
        val drop = remember { Animatable(0f) }
        LaunchedEffect(Unit) { drop.animateTo(1f, tween(320, easing = SpringEase)) }
        val shape = RoundedCornerShape(18.dp)
        Column(
            modifier
                .graphicsLayer {
                    val t = drop.value
                    alpha = t.coerceIn(0f, 1f)
                    translationY = (1f - t) * -8.dp.toPx()
                    scaleX = .96f + .04f * t
                    scaleY = scaleX
                }
                .then(if (width.isSpecified) Modifier.width(width) else Modifier)
                .layout { m, k ->
                    val cap = if (k.hasBoundedHeight) k.copy(maxHeight = (k.maxHeight * .7f).toInt()) else k
                    val p = m.measure(cap)
                    layout(p.width, p.height) { p.place(0, 0) }
                }
                .clip(shape)
                // shortcut: no backdrop blur, the glass is laid on the page colour, upgrade when Compose has a common blur-behind
                .background(c.bg, shape)
                .background(c.glass, shape)
                .border(1.dp, c.glassLine, shape)
                .semantics { if (label.isNotEmpty()) paneTitle = label }
                .verticalScroll(rememberScrollState())
                .padding(6.dp),
            content = content,
        )
    }
}
