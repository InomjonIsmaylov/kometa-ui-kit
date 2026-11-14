package uz.kometa.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch

/** One word in the [KometaFab] menu. */
data class KometaFabAction(val label: String, val value: String = "", val disabled: Boolean = false)

/** How long the word at [index] of [count] waits before rising: the bottom one (nearest the button) first, 40ms apart. */
internal fun fabRiseDelay(index: Int, count: Int): Int = (count - 1 - index).coerceAtLeast(0) * 40

/** Lays the popup exactly over the box the fab fills. */
private object OverAnchor : PopupPositionProvider {
    override fun calculatePosition(anchorBounds: IntRect, windowSize: IntSize, layoutDirection: LayoutDirection, popupContentSize: IntSize) =
        anchorBounds.topLeft
}

/**
 * The page's main action, as a round ink button in the bottom-end corner (`k-fab`). Pressing it
 * dims the box and raises [actions] above it as big display words, no icons; the `+` turns into a
 * `×`. Picking one closes the menu and calls [onPick]. It fills its parent like the web's
 * `inset: 0` layer, so put it last in a full-screen Box for the fixed fab or in a card's Box for
 * the inline one. [open] is owned by the caller; a tap on the dimmed area, Back and Escape call
 * [onOpenChange] with false. [icon] is the glyph slot (turned 45° when open); [label] names the
 * button and its menu.
 */
@Composable
fun KometaFab(
    actions: List<KometaFabAction>,
    open: Boolean,
    onOpenChange: (Boolean) -> Unit,
    onPick: (KometaFabAction) -> Unit,
    modifier: Modifier = Modifier,
    label: String = "Actions",
    icon: @Composable () -> Unit = { BasicText("+", style = Kometa.type.md.copy(color = LocalKometaContentColor.current, fontSize = 26.sp, fontWeight = FontWeight.SemiBold)) },
) {
    val c = Kometa.colors
    val turn by animateFloatAsState(if (open) 45f else 0f, tween(450, easing = SpringEase))
    val dim = remember { Animatable(0f) }
    LaunchedEffect(open) { dim.animateTo(if (open) 1f else 0f, tween(300)) }
    val shown by remember { derivedStateOf { dim.value > 0f } }
    var size by remember { mutableStateOf(IntSize.Zero) }
    val density = LocalDensity.current

    Box(modifier.fillMaxSize().onSizeChanged { size = it }) {
        FabButton(turn, open, label, icon) { onOpenChange(!open) }
        if (open || shown) {
            // A focusable popup over the box: Back, Escape and a tap outside it close the menu.
            // shortcut: focus does not move to the last word on open nor back to the button, add with FocusRequesters when keyboard use matters.
            Popup(popupPositionProvider = OverAnchor, onDismissRequest = { onOpenChange(false) }, properties = PopupProperties(focusable = true)) {
                Box(with(density) { Modifier.size(size.width.toDp(), size.height.toDp()) }) {
                    Box(
                        Modifier.fillMaxSize()
                            .graphicsLayer { alpha = dim.value }
                            .background(c.bg.copy(alpha = .72f))
                            .clickable(interactionSource = null, indication = null, enabled = open) { onOpenChange(false) },
                    )
                    Column(
                        Modifier.align(Alignment.BottomEnd).padding(end = 20.dp, bottom = 20.dp + 52.dp + 14.dp)
                            .semantics { contentDescription = label },
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                        horizontalAlignment = Alignment.End,
                    ) {
                        actions.forEachIndexed { i, a ->
                            FabWord(a, open, fabRiseDelay(i, actions.size)) { onOpenChange(false); onPick(a) }
                        }
                    }
                    FabButton(turn, open, label, icon) { onOpenChange(!open) }
                }
            }
        }
    }
}

@Composable
private fun BoxScope.FabButton(turn: Float, open: Boolean, label: String, icon: @Composable () -> Unit, onClick: () -> Unit) {
    val c = Kometa.colors
    Box(
        Modifier.align(Alignment.BottomEnd).padding(20.dp).size(52.dp)
            .shadow(14.dp, CircleShape)
            .clip(CircleShape)
            .background(c.displayInk, CircleShape)
            .clickable(role = Role.Button, onClick = onClick)
            .semantics { contentDescription = label; stateDescription = if (open) "expanded" else "collapsed" }
            .graphicsLayer { rotationZ = turn },
        contentAlignment = Alignment.Center,
    ) {
        CompositionLocalProvider(LocalKometaContentColor provides c.bg) { icon() }
    }
}

@Composable
private fun FabWord(action: KometaFabAction, open: Boolean, delay: Int, onClick: () -> Unit) {
    val c = Kometa.colors
    val rise = remember { Animatable(0f) }
    val fade = remember { Animatable(0f) }
    LaunchedEffect(open) {
        if (open) {
            coroutineScope {
                launch { rise.animateTo(1f, tween(500, delay, SpringEase)) }
                fade.animateTo(1f, tween(250, delay))
            }
        } else {
            coroutineScope {
                launch { rise.animateTo(0f, tween(500, easing = SpringEase)) }
                fade.animateTo(0f, tween(250))
            }
        }
    }
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val travel = with(LocalDensity.current) { 14.dp.toPx() }
    BasicText(
        action.label,
        Modifier
            .defaultMinSize(minHeight = 44.dp)
            .graphicsLayer {
                translationY = travel * (1f - rise.value)
                alpha = fade.value * if (action.disabled) .4f else 1f
            }
            .clickable(source, indication = null, enabled = open && !action.disabled, role = Role.Button, onClick = onClick)
            .padding(horizontal = 2.dp, vertical = 4.dp),
        style = Kometa.type.title.copy(
            color = if (pressed) c.amberInk else c.displayInk,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = (-.02).em,
            textAlign = TextAlign.End,
        ),
    )
}
