package uz.kometa.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathMeasure
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

/**
 * A checkbox with no label of its own (`k-tick`): a hairline ring that fills with ink while the
 * tick draws itself in. Name it with [label]. For a row whose words are the control, see [KometaCheck].
 */
@Composable
fun KometaTick(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    readOnly: Boolean = false,
    invalid: Boolean = false,
) {
    val c = Kometa.colors
    val fill by animateColorAsState(if (checked) c.displayInk else c.displayInk.copy(alpha = 0f), tween(240))
    val ring by animateColorAsState(if (checked) c.displayInk else if (invalid) c.error else c.muted, tween(240))
    val draw by animateFloatAsState(if (checked) 1f else 0f, tween(320, 60, SpringEase))
    Canvas(
        modifier
            .size(44.dp)
            .alpha(if (enabled) 1f else .5f)
            .semantics { contentDescription = label }
            .toggleable(checked, enabled = enabled && !readOnly, role = Role.Checkbox, onValueChange = onCheckedChange),
    ) {
        val r = 10.dp.toPx()
        drawCircle(fill, r)
        drawCircle(ring, r - .5.dp.toPx(), style = Stroke(1.dp.toPx()))
        if (draw > 0f) {
            // The web's 16px `M4 8.5l2.5 2.5L12 5.5` polyline, drawn up to `draw` of its length.
            val u = 1.dp.toPx()
            val o = Offset(center.x - 8 * u, center.y - 8 * u)
            val tick = Path().apply { moveTo(o.x + 4 * u, o.y + 8.5f * u); lineTo(o.x + 6.5f * u, o.y + 11 * u); lineTo(o.x + 12 * u, o.y + 5.5f * u) }
            val measure = PathMeasure().apply { setPath(tick, false) }
            val part = Path().also { measure.getSegment(0f, measure.length * draw, it, true) }
            drawPath(part, c.bg, style = Stroke(2 * u, cap = StrokeCap.Round, join = StrokeJoin.Round))
        }
    }
}
