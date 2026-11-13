package uz.kometa.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/**
 * One question and its answer (`k-accordion-item`): the question in the display font, a hairline
 * under it that stretches to full width while open, and the [content] below, composed only while
 * open (the web kit draws the answer in `Kometa.type.body`, muted, 14sp). For one open at a time,
 * hold the open index in the caller:
 *
 *     var open by remember { mutableStateOf<Int?>(null) }
 *     faq.forEachIndexed { i, q -> KometaAccordionItem(q.title, open == i, { open = if (it) i else null }) { ... } }
 */
@Composable
fun KometaAccordionItem(
    heading: String,
    open: Boolean,
    onOpenChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    content: @Composable ColumnScope.() -> Unit,
) {
    val c = Kometa.colors
    val stretch by animateFloatAsState(if (open) 1f else .18f, tween(680, easing = CubicBezierEasing(.22f, 1.35f, .32f, 1f)))
    val ink by animateFloatAsState(if (open) 1f else .3f, tween(420))
    Column(
        modifier.drawBehind {
            val y = size.height - .5.dp.toPx()
            drawLine(c.displayInk.copy(alpha = ink), Offset(0f, y), Offset(size.width * stretch, y), 1.dp.toPx())
        },
    ) {
        Box(
            Modifier
                .fillMaxWidth()
                .defaultMinSize(minHeight = 44.dp)
                .alpha(if (enabled) 1f else .5f)
                .clickable(enabled = enabled, role = Role.Button) { onOpenChange(!open) }
                .semantics {
                    heading()
                    if (open) collapse { onOpenChange(false); true } else expand { onOpenChange(true); true }
                }
                .padding(vertical = 14.dp),
        ) {
            BasicText(heading, style = Kometa.type.title.copy(color = c.displayInk, fontSize = 16.sp, letterSpacing = (-.02).em))
        }
        AnimatedVisibility(
            open,
            enter = expandVertically(tween(420, easing = SpringEase)) + fadeIn(tween(420)),
            exit = shrinkVertically(tween(280)) + fadeOut(tween(200)),
        ) {
            Column(Modifier.padding(bottom = 14.dp), content = content)
        }
    }
}
