package uz.kometa.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.isShiftPressed
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.AwaitPointerEventScope
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.PointerInputChange
import androidx.compose.ui.input.pointer.PointerType
import androidx.compose.ui.input.pointer.changedToDown
import androidx.compose.ui.input.pointer.isSecondaryPressed
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.round
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties

/** One action of a [KometaContext] menu. [shortcut] is shown in mono on the right; it describes the key, it does not bind it. */
data class KometaContextItem(
    val label: String,
    val value: String = "",
    val shortcut: String = "",
    val danger: Boolean = false,
    val disabled: Boolean = false,
)

/**
 * Where the menu goes for a press at [point] (window px): its top-left corner at the point, moved left
 * when it would cross the right edge and flipped above the point when it would cross the bottom, always [pad] px in.
 */
internal fun placeContext(point: IntOffset, window: IntSize, menu: IntSize, pad: Int): IntOffset {
    val x = if (point.x + menu.width > window.width - pad) maxOf(pad, window.width - pad - menu.width) else point.x
    val y = if (point.y + menu.height > window.height - pad) maxOf(pad, point.y - menu.height) else point.y
    return IntOffset(x, y)
}

/** Waits while a touch [down] stays still for the long-press time: true when it was held that long. */
internal suspend fun AwaitPointerEventScope.heldStill(down: PointerInputChange): Boolean =
    withTimeoutOrNull(viewConfiguration.longPressTimeoutMillis) {
        while (true) {
            val e = awaitPointerEvent(PointerEventPass.Initial)
            val ch = e.changes.firstOrNull { it.id == down.id } ?: return@withTimeoutOrNull
            if (!ch.pressed || (ch.position - down.position).getDistance() > viewConfiguration.touchSlop) return@withTimeoutOrNull
        }
    } == null

/** Consumes the rest of a gesture before the children see it, so a long press does not also click what it is on. */
internal suspend fun AwaitPointerEventScope.swallowUntilUp() {
    do {
        val e = awaitPointerEvent(PointerEventPass.Initial)
        e.changes.forEach { it.consume() }
    } while (e.changes.any { it.pressed })
}

private class ContextPosition(val point: IntOffset, val pad: Int) : PopupPositionProvider {
    override fun calculatePosition(anchorBounds: IntRect, windowSize: IntSize, layoutDirection: LayoutDirection, popupContentSize: IntSize) =
        placeContext(anchorBounds.topLeft + point, windowSize, popupContentSize, pad)
}

/**
 * A context menu for whatever it wraps (`k-context`): a glass card in a popup at the press point, kept
 * inside the window, with each action's [KometaContextItem.shortcut] in mono and danger ones in red;
 * `null` in [items] draws a divider. A secondary (right) click or a long press on touch opens it; the
 * long press does not also click what is under the finger. The Menu key or Shift+F10 opens it under the
 * wrapped content. Arrows move between actions, Enter picks, Escape, Back, Tab or a tap outside close it.
 * Picking closes the menu and calls [onPick] with the item. [label] is the menu's accessible name.
 */
@Composable
fun KometaContext(
    items: List<KometaContextItem?>,
    onPick: (KometaContextItem) -> Unit,
    modifier: Modifier = Modifier,
    label: String = "Actions",
    content: @Composable () -> Unit,
) {
    val c = Kometa.colors
    var at by remember { mutableStateOf<IntOffset?>(null) }
    var byTouch by remember { mutableStateOf(false) }
    var height by remember { mutableIntStateOf(0) }
    val pad = with(LocalDensity.current) { 8.dp.roundToPx() }
    fun openAt(p: Offset, touch: Boolean) { byTouch = touch; at = p.round() }

    Box(
        modifier
            .onSizeChanged { height = it.height }
            .pointerInput(Unit) {
                awaitEachGesture {
                    val e = awaitPointerEvent(PointerEventPass.Initial)
                    val down = e.changes.firstOrNull { it.changedToDown() } ?: return@awaitEachGesture
                    if (e.buttons.isSecondaryPressed) {
                        down.consume()
                        openAt(down.position, false)
                    } else if (down.type == PointerType.Touch && heldStill(down)) {
                        openAt(down.position, true)
                        swallowUntilUp()
                    }
                }
            }
            .onKeyEvent {
                // shortcut: opens under the wrapper's bottom-left, not the focused child's, upgrade if wrappers get tall
                if (at == null && it.type == KeyEventType.KeyDown && (it.key == Key.Menu || (it.key == Key.F10 && it.isShiftPressed))) {
                    openAt(Offset(0f, height.toFloat()), false); true
                } else false
            },
    ) {
        content()
        val point = at ?: return@Box
        val provider = remember(point, pad) { ContextPosition(point, pad) }
        // shortcut: focus does not go back to where it was on close, upgrade with a FocusRequester on the wrapped control
        Popup(popupPositionProvider = provider, onDismissRequest = { at = null }, properties = PopupProperties(focusable = true)) {
            val focus = LocalFocusManager.current
            val first = remember { FocusRequester() }
            val last = remember { FocusRequester() }
            val enabled = items.withIndex().filter { it.value?.disabled == false }.map { it.index }
            val drop = remember { Animatable(0f) }
            LaunchedEffect(Unit) {
                // A finger needs no focus ring on the first action; a mouse or keyboard opening does.
                if (!byTouch && enabled.isNotEmpty()) first.requestFocus()
                drop.animateTo(1f, tween(300, easing = SpringEase))
            }
            val shape = RoundedCornerShape(14.dp)
            Column(
                Modifier
                    .graphicsLayer {
                        val t = drop.value
                        alpha = t.coerceIn(0f, 1f)
                        translationY = (1f - t) * -6.dp.toPx()
                        scaleX = .96f + .04f * t
                        scaleY = scaleX
                        transformOrigin = TransformOrigin(0f, 0f)
                    }
                    .widthIn(min = 180.dp)
                    .width(IntrinsicSize.Max)
                    .clip(shape)
                    // shortcut: no backdrop blur, the glass is laid on the page colour, upgrade when Compose has a common blur-behind
                    .background(c.bg, shape)
                    .background(c.glass, shape)
                    .border(1.dp, c.glassLine, shape)
                    .semantics { paneTitle = label }
                    .onPreviewKeyEvent {
                        if (it.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false
                        when (it.key) {
                            Key.DirectionDown -> focus.moveFocus(FocusDirection.Next)
                            Key.DirectionUp -> focus.moveFocus(FocusDirection.Previous)
                            Key.MoveHome -> if (enabled.isNotEmpty()) first.requestFocus()
                            Key.MoveEnd -> if (enabled.isNotEmpty()) last.requestFocus()
                            Key.Tab -> at = null
                            else -> return@onPreviewKeyEvent false
                        }
                        true
                    }
                    .padding(6.dp),
            ) {
                items.forEachIndexed { i, it ->
                    if (it == null) {
                        Box(Modifier.padding(horizontal = 2.dp, vertical = 4.dp).fillMaxWidth().height(1.dp).background(c.glassLine))
                    } else {
                        val source = remember { MutableInteractionSource() }
                        val lit = source.collectIsHoveredAsState().value || source.collectIsFocusedAsState().value
                        Row(
                            Modifier
                                .fillMaxWidth()
                                .heightIn(min = 44.dp)
                                .then(if (i == enabled.firstOrNull()) Modifier.focusRequester(first) else Modifier)
                                .then(if (i == enabled.lastOrNull()) Modifier.focusRequester(last) else Modifier)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (lit && !it.disabled) c.displayInk.copy(alpha = .08f) else c.displayInk.copy(alpha = 0f))
                                .hoverable(source)
                                .clickable(source, indication = null, enabled = !it.disabled, role = Role.Button) { at = null; onPick(it) }
                                .alpha(if (it.disabled) .45f else 1f)
                                .padding(horizontal = 9.dp, vertical = 7.dp),
                            horizontalArrangement = Arrangement.spacedBy(18.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            BasicText(
                                it.label,
                                Modifier.weight(1f),
                                style = Kometa.type.body.copy(color = if (it.danger) c.red else c.text, fontWeight = FontWeight.SemiBold),
                            )
                            if (it.shortcut.isNotEmpty()) {
                                BasicText(it.shortcut, style = Kometa.type.mono.copy(color = c.muted, fontSize = 10.sp, fontWeight = FontWeight.Medium))
                            }
                        }
                    }
                }
            }
        }
    }
}
