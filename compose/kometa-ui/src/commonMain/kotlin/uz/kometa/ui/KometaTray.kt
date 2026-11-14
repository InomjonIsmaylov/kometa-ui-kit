package uz.kometa.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.MutableTransitionState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBars
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.min
import androidx.compose.ui.unit.sp

/** One question for [KometaTray]. A [danger] accept is drawn red. */
data class KometaConfirmation(
    val acceptLabel: String,
    val rejectLabel: String,
    val header: String = "",
    val message: String = "",
    val danger: Boolean = false,
)

/** Below 640dp the tray is a sheet at the bottom of the screen; wider, a centred card. */
internal fun trayIsSheet(width: Dp): Boolean = width < 640.dp

/**
 * The page's one confirm question (`k-tray`): two wide answers rise from the bottom of the screen
 * on a phone and sit as a centred card on a wider window, over a dimmed screen. It is driven by
 * [request]: a [KometaConfirmation] shows it, null hides it; the words stay through the leave
 * animation. The accept answer goes first and calls [onAccept]; the quiet answer under it, Back,
 * Escape and a tap on the dark area (while [dismissible]) call [onReject]. Both callbacks should
 * set the request back to null. The heading is [KometaConfirmation.header], else the message.
 */
@Composable
fun KometaTray(
    request: KometaConfirmation?,
    onAccept: () -> Unit,
    onReject: () -> Unit,
    modifier: Modifier = Modifier,
    dismissible: Boolean = true,
) {
    val state = remember { MutableTransitionState(false) }
    state.targetState = request != null
    // The last question, so the leave animation still has its words.
    val last = remember { arrayOfNulls<KometaConfirmation>(1) }
    if (request != null) last[0] = request
    val ask = last[0]
    if (ask == null || (!state.currentState && !state.targetState && state.isIdle)) return

    val c = Kometa.colors
    val live = request != null
    // shortcut: focus is not moved to the heading on open (the window takes focus; paneTitle announces it), add a FocusRequester if a screen reader test asks.
    DrawerWindow(onDismiss = { if (live) onReject() }) {
        BoxWithConstraints(Modifier.fillMaxSize()) {
            val sheet = trayIsSheet(maxWidth)
            val rise = with(LocalDensity.current) { 24.dp.roundToPx() }
            AnimatedVisibility(state, enter = fadeIn(tween(280)), exit = fadeOut(tween(280))) {
                Box(
                    Modifier.fillMaxSize()
                        .background(if (c.isDark) Color.Black.copy(alpha = .55f) else Color(0xFF1A1C1C).copy(alpha = .32f))
                        .clickable(interactionSource = null, indication = null, enabled = dismissible && live, onClick = onReject),
                )
            }
            AnimatedVisibility(
                state,
                modifier = Modifier.align(if (sheet) Alignment.BottomCenter else Alignment.Center),
                enter = slideInVertically(tween(420, easing = SpringEase)) { if (sheet) it * 11 / 10 else rise } + fadeIn(tween(200)),
                exit = slideOutVertically(tween(420, easing = SpringEase)) { if (sheet) it * 11 / 10 else rise } + fadeOut(tween(200)),
            ) {
                val shape = RoundedCornerShape(22.dp)
                Column(
                    modifier
                        .windowInsetsPadding(WindowInsets.systemBars.only(WindowInsetsSides.Bottom + WindowInsetsSides.Horizontal))
                        .then(
                            if (sheet) Modifier.padding(10.dp).widthIn(max = 560.dp).fillMaxWidth()
                            else Modifier.width(min(380.dp, maxWidth - 20.dp)),
                        )
                        .shadow(22.dp, shape)
                        .clip(shape)
                        // Glass with a blur on the web; Compose cannot blur behind a window, so solid card as in KometaDrawer.
                        .background(c.card, shape)
                        .border(1.dp, c.glassLine, shape)
                        .semantics { paneTitle = ask.header.ifEmpty { ask.message } }
                        .padding(start = 20.dp, top = 22.dp, end = 20.dp, bottom = 18.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    BasicText(
                        ask.header.ifEmpty { ask.message },
                        Modifier.fillMaxWidth().semantics { heading() },
                        style = Kometa.type.title.copy(color = c.displayInk, fontSize = 20.sp, lineHeight = 1.25.em, letterSpacing = (-.02).em, textAlign = TextAlign.Center),
                    )
                    if (ask.header.isNotEmpty() && ask.message.isNotEmpty()) {
                        BasicText(
                            ask.message,
                            Modifier.fillMaxWidth(),
                            style = Kometa.type.md.copy(color = c.muted, lineHeight = 1.45.em, textAlign = TextAlign.Center),
                        )
                    }
                    Column(Modifier.padding(top = 6.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        TrayAnswer(
                            ask.acceptLabel,
                            fill = if (ask.danger) Color.Transparent else c.displayInk,
                            ink = if (ask.danger) c.error else c.bg,
                            line = if (ask.danger) c.error else Color.Transparent,
                            enabled = live,
                            onClick = onAccept,
                        )
                        TrayAnswer(ask.rejectLabel, Color.Transparent, c.text, c.glassLine, live, onReject)
                    }
                }
            }
        }
    }
}

@Composable
private fun TrayAnswer(text: String, fill: Color, ink: Color, line: Color, enabled: Boolean, onClick: () -> Unit) {
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val press by animateFloatAsState(if (pressed) .98f else 1f, tween(160, easing = SpringEase))
    val shape = RoundedCornerShape(16.dp)
    Box(
        Modifier.fillMaxWidth().defaultMinSize(minHeight = 50.dp)
            .graphicsLayer { scaleX = press; scaleY = press }
            .clip(shape)
            .background(fill, shape)
            .border(BorderStroke(1.dp, line), shape)
            .clickable(source, indication = null, enabled = enabled, role = Role.Button, onClick = onClick)
            .padding(horizontal = 20.dp),
        contentAlignment = Alignment.Center,
    ) {
        BasicText(text, style = Kometa.type.md.copy(color = ink, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center))
    }
}
