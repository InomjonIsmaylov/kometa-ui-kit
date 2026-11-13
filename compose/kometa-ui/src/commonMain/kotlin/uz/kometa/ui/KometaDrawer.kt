package uz.kometa.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.MutableTransitionState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.min
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties

enum class KometaDrawerPosition { Bottom, Right, Left }

private val DrawerIn = CubicBezierEasing(.22f, 1.35f, .32f, 1f)
private val DrawerOut = CubicBezierEasing(.32f, 0f, .22f, 1f)

/** Puts the popup at the window's top-left, so a fillMaxSize child covers the whole window. */
private object FullWindow : PopupPositionProvider {
    override fun calculatePosition(anchorBounds: IntRect, windowSize: IntSize, layoutDirection: LayoutDirection, popupContentSize: IntSize) = IntOffset.Zero
}

/**
 * A panel that slides up from the bottom (a sheet) or in from a side over a dimmed screen
 * (`k-drawer`). [visible] is owned by the caller; [onDismiss] is called for Back, and for a tap on
 * the dimmed area while [dismissible]. The panel stays composed until its leave slide has finished.
 * [label] names the sheet for a screen reader.
 */
@Composable
fun KometaDrawer(
    visible: Boolean,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
    position: KometaDrawerPosition = KometaDrawerPosition.Bottom,
    dismissible: Boolean = true,
    label: String = "",
    content: @Composable ColumnScope.() -> Unit,
) {
    val state = remember { MutableTransitionState(false) }
    state.targetState = visible
    if (!state.currentState && !state.targetState && state.isIdle) return

    val c = Kometa.colors
    Popup(popupPositionProvider = FullWindow, onDismissRequest = onDismiss, properties = PopupProperties(focusable = true)) {
        BoxWithConstraints(Modifier.fillMaxSize()) {
            AnimatedVisibility(state, enter = fadeIn(tween(300)), exit = fadeOut(tween(300))) {
                Box(
                    Modifier.fillMaxSize()
                        .background(if (c.isDark) Color.Black.copy(alpha = .55f) else Color(0xFF1A1C1C).copy(alpha = .32f))
                        .clickable(interactionSource = null, indication = null, enabled = dismissible, onClick = onDismiss),
                )
            }
            val bottom = position == KometaDrawerPosition.Bottom
            val left = position == KometaDrawerPosition.Left
            AnimatedVisibility(
                state,
                modifier = Modifier.align(if (bottom) Alignment.BottomCenter else if (left) Alignment.CenterStart else Alignment.CenterEnd),
                enter = if (bottom) slideInVertically(tween(680, easing = DrawerIn)) { it } else slideInHorizontally(tween(680, easing = DrawerIn)) { if (left) -it else it },
                exit = if (bottom) slideOutVertically(tween(480, easing = DrawerOut)) { it } else slideOutHorizontally(tween(480, easing = DrawerOut)) { if (left) -it else it },
            ) {
                val shape = when (position) {
                    KometaDrawerPosition.Bottom -> RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)
                    KometaDrawerPosition.Right -> RoundedCornerShape(topStart = 20.dp, bottomStart = 20.dp)
                    KometaDrawerPosition.Left -> RoundedCornerShape(topEnd = 20.dp, bottomEnd = 20.dp)
                }
                Column(
                    modifier
                        .then(
                            if (bottom) Modifier.fillMaxWidth().heightIn(max = maxHeight * .9f)
                            else Modifier.fillMaxHeight().width(min(460.dp, maxWidth - 24.dp)),
                        )
                        .clip(shape)
                        // The web sheet is glass over a blurred page; Compose cannot blur behind a window, so it is solid card.
                        .background(c.card)
                        .semantics { paneTitle = label; if (label.isNotEmpty()) contentDescription = label },
                    content = content,
                )
            }
        }
    }
}
