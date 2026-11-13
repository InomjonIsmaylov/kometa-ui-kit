package uz.kometa.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.MutableTransitionState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import kotlinx.coroutines.delay

enum class KometaToastKind { Success, Error, Info, Warn }

/** One toast; [life] is its time on screen in milliseconds. */
data class KometaToastItem(val id: Long, val text: String, val kind: KometaToastKind = KometaToastKind.Info, val life: Long = 4000)

/**
 * The short word that confirms a save or reports a failure (`k-toast`): a thread of glass pills
 * stacking up from the bottom (or down from the top). A hairline under each drains with the time
 * it has left, and a toast held under a finger waits. The caller owns the list: it passes [items]
 * and removes an item in [onDismiss], called once the time is up or the pill is tapped, after it
 * has left. Place it over the screen, e.g. `Box { content(); KometaToasts(..., Modifier.align(BottomCenter)) }`.
 */
@Composable
fun KometaToasts(
    items: List<KometaToastItem>,
    onDismiss: (Long) -> Unit,
    modifier: Modifier = Modifier,
    top: Boolean = false,
    closeLabel: String = "Dismiss",
) {
    Column(
        modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp, if (top) Alignment.Top else Alignment.Bottom),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        // Bottom: the oldest sits nearest the edge and newer ones stack above it, as on the web.
        for (it in if (top) items else items.asReversed()) key(it.id) { Toast(it, onDismiss, top, closeLabel) }
    }
}

@Composable
private fun Toast(item: KometaToastItem, onDismiss: (Long) -> Unit, top: Boolean, closeLabel: String) {
    val c = Kometa.colors
    val dismiss by rememberUpdatedState(onDismiss)
    val state = remember { MutableTransitionState(false).apply { targetState = true } }
    val drain = remember { Animatable(1f) }
    val source = remember { MutableInteractionSource() }
    val held by source.collectIsPressedAsState()

    // The drain runs while the toast is not held; a held toast pauses where it is and resumes after.
    LaunchedEffect(held) {
        if (!held) {
            drain.animateTo(0f, tween((drain.value * item.life).toInt(), easing = LinearEasing))
            state.targetState = false
        }
    }
    LaunchedEffect(state.currentState, state.targetState) {
        if (!state.targetState) { delay(300); dismiss(item.id) }
    }

    val bar = when (item.kind) {
        KometaToastKind.Success -> c.green
        KometaToastKind.Error -> c.red
        KometaToastKind.Warn -> c.amber
        KometaToastKind.Info -> c.blue
    }
    val shape = RoundedCornerShape(12.dp)
    AnimatedVisibility(
        state,
        enter = fadeIn(tween(520)) + slideInVertically(tween(520, easing = SpringEase)) { if (top) -it / 3 else it / 3 },
        exit = fadeOut(tween(300)) + slideOutVertically(tween(300)) { it / 8 } + scaleOut(tween(300), .97f),
    ) {
        Row(
            Modifier
                .height(IntrinsicSize.Min)
                .clip(shape)
                .background(c.bg).background(c.glass) // no backdrop blur in Compose, so glass sits on the page colour to stay readable
                .border(1.dp, c.glassLine, shape)
                .clickable(source, indication = null, onClickLabel = closeLabel, role = Role.Button) { state.targetState = false }
                .drawBehind {
                    val h = 2.dp.toPx()
                    drawRect(c.displayInk.copy(alpha = .6f), Offset(0f, size.height - h), Size(size.width * drain.value, h))
                }
                .padding(start = 12.dp, end = 14.dp, top = 10.dp, bottom = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(Modifier.width(3.dp).fillMaxHeight().background(bar, RoundedCornerShape(2.dp)))
            BasicText(
                item.text,
                Modifier.weight(1f, fill = false).semantics {
                    liveRegion = if (item.kind == KometaToastKind.Error) LiveRegionMode.Assertive else LiveRegionMode.Polite
                },
                style = Kometa.type.md.copy(color = c.displayInk, lineHeight = 1.35.em),
            )
            BasicText("×", Modifier.semantics { contentDescription = closeLabel }, style = Kometa.type.md.copy(color = c.displayInk.copy(alpha = .7f)))
        }
    }
}
