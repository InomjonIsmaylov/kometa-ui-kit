package uz.kometa.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.zIndex

/**
 * A row that crossfades to the caller's question while [asking] is true (`k-confirm`). Both panes are
 * the caller's: [row] is the normal face, [question] holds the question with its own No / Yes buttons
 * (this draws none). The box keeps the taller pane's height, so nothing below jumps; the hidden pane
 * takes no taps and is not read out.
 */
@Composable
fun KometaConfirm(asking: Boolean, modifier: Modifier = Modifier, row: @Composable () -> Unit, question: @Composable () -> Unit) {
    // shortcut: focus is not moved into the pane now shown (the web kit does); add a FocusRequester if a keyboard flow needs it.
    Box(modifier) {
        Pane(!asking, row)
        Pane(asking, question)
    }
}

@Composable
private fun Pane(shown: Boolean, content: @Composable () -> Unit) {
    val a by animateFloatAsState(if (shown) 1f else 0f, tween(200))
    Box(
        Modifier
            .zIndex(if (shown) 1f else 0f) // the shown pane sits on top, so it takes the touch
            .alpha(a)
            .then(
                if (shown) Modifier
                else Modifier.clearAndSetSemantics {}.pointerInput(Unit) {
                    // Eat every touch before the hidden pane's buttons see it.
                    awaitPointerEventScope { while (true) awaitPointerEvent(PointerEventPass.Initial).changes.forEach { it.consume() } }
                },
            ),
    ) { content() }
}
