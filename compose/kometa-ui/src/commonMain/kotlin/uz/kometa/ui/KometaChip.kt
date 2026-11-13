package uz.kometa.ui

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathOperation
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp

/**
 * A glass pill that is a multi-select toggle (`k-chip`). Chosen: a 2dp inset amber edge, never an
 * amber fill. The caller owns [selected]; [onSelectedChange] gets the value the user asked for.
 * [count] is drawn muted after the words.
 */
@Composable
fun KometaChip(
    text: String,
    selected: Boolean,
    onSelectedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    count: String = "",
    icon: (@Composable () -> Unit)? = null,
) {
    val c = Kometa.colors
    val edge by animateDpAsState(if (selected) 2.dp else 0.dp, tween(420))
    val shape = RoundedCornerShape(50)
    Row(
        modifier
            .defaultMinSize(minHeight = 44.dp)
            .alpha(if (enabled) 1f else .5f)
            .clip(shape)
            .background(c.glass)
            .drawWithContent {
                drawContent()
                // CSS `inset 2px 0 0 amber` on a pill: the pill minus itself shifted right, a crescent on the left curve.
                val r = CornerRadius(size.height / 2)
                val pill = Path().apply { addRoundRect(RoundRect(0f, 0f, size.width, size.height, r)) }
                val moved = Path().apply { addRoundRect(RoundRect(edge.toPx(), 0f, size.width + edge.toPx(), size.height, r)) }
                drawPath(Path.combine(PathOperation.Difference, pill, moved), c.amber)
            }
            .border(1.dp, c.glassLine, shape)
            .toggleable(selected, enabled = enabled, role = Role.Checkbox, onValueChange = onSelectedChange)
            .padding(horizontal = 14.dp, vertical = 9.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        CompositionLocalProvider(LocalKometaContentColor provides c.text) { icon?.invoke() }
        BasicText(text, style = Kometa.type.md.copy(color = c.text))
        if (count.isNotEmpty()) BasicText(count, style = Kometa.type.md.copy(color = c.muted))
    }
}
