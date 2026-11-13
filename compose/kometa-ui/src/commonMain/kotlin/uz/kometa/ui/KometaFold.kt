package uz.kometa.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

/** The plus that loses its vertical bar when open (`k-fold-mark`). */
@Composable
fun KometaFoldMark(open: Boolean, modifier: Modifier = Modifier) {
    val c = Kometa.colors
    val ink by animateColorAsState(if (open) c.displayInk else c.muted, tween(280))
    val bar by animateFloatAsState(if (open) 0f else 1f, tween(280, easing = SpringEase))
    Canvas(modifier.size(12.dp)) {
        val w = 1.5.dp.toPx()
        drawLine(ink, Offset(0f, size.height / 2), Offset(size.width, size.height / 2), w)
        val half = size.height / 2 * bar
        drawLine(ink, Offset(size.width / 2, size.height / 2 - half), Offset(size.width / 2, size.height / 2 + half), w)
    }
}

/**
 * A disclosure (`k-fold`): a header row that opens and closes the [content] below it, which is
 * composed only while open. [aside] sits between the title and the mark.
 */
@Composable
fun KometaFold(
    title: String,
    open: Boolean,
    onOpenChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    aside: (@Composable () -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val c = Kometa.colors
    Column(modifier) {
        Row(
            Modifier
                .fillMaxWidth()
                .defaultMinSize(minHeight = 44.dp)
                .clickable(role = Role.Button, onClickLabel = null) { onOpenChange(!open) }
                .semantics { if (open) collapse { onOpenChange(false); true } else expand { onOpenChange(true); true } }
                .padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BasicText(title, Modifier.weight(1f), style = Kometa.type.md.copy(color = c.text, fontWeight = FontWeight.SemiBold))
            aside?.invoke()
            KometaFoldMark(open)
        }
        AnimatedVisibility(
            open,
            enter = expandVertically(tween(420, easing = SpringEase)) + fadeIn(tween(420)),
            exit = shrinkVertically(tween(280)) + fadeOut(tween(200)),
        ) { Column(content = content) }
    }
}
