package uz.kometa.ui

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.StartOffset
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.keyframes
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

enum class KometaSkeletonShape { Rows, Card, Line }

private val OutEase = CubicBezierEasing(.22f, 1f, .36f, 1f)

/**
 * Loading placeholder with no blocks (`k-skeleton`): a hairline disc and hairlines that draw
 * themselves, row by row. [KometaSkeletonShape.Line] is one hairline with a bright stretch sliding
 * along it, for a table cell; it says nothing to a screen reader. [label] is the caller's word
 * for "loading".
 */
@Composable
fun KometaSkeleton(
    modifier: Modifier = Modifier,
    shape: KometaSkeletonShape = KometaSkeletonShape.Rows,
    rows: Int = 3,
    avatar: Boolean = true,
    lines: Int = 2,
    delayMillis: Int = 0,
    label: String = "",
) {
    val c = Kometa.colors
    if (shape == KometaSkeletonShape.Line) {
        val x by rememberInfiniteTransition().animateFloat(
            -1f, 3.8f,
            infiniteRepeatable(tween(1500, easing = SpringEase), RepeatMode.Restart, StartOffset(delayMillis)),
        )
        Box(
            modifier.fillMaxWidth().padding(vertical = 5.dp).height(1.dp).clipToBounds().drawBehind {
                drawRect(c.glassLine)
                val w = size.width * .28f
                drawRect(c.displayInk.copy(alpha = .7f), Offset(w * x, 0f), Size(w, size.height))
            },
        )
        return
    }

    val t = rememberInfiniteTransition()
    @Composable
    fun ColumnScope.Hairs(n: Int, row: Int) {
        val widths = floatArrayOf(.84f, .62f, .40f)
        repeat(n.coerceIn(1, 3)) { i ->
            val grow by t.animateFloat(
                0f, 1f,
                infiniteRepeatable(
                    keyframes { durationMillis = 1800; 0f at 0 using OutEase; 1f at 1080 using LinearEasing },
                    RepeatMode.Restart,
                    StartOffset(delayMillis + row * 120 + i * 60),
                ),
            )
            Box(
                Modifier.fillMaxWidth(widths[i]).padding(vertical = 4.dp).height(1.dp).alpha(.55f).drawBehind {
                    drawRect(c.displayInk, size = Size(size.width * grow, size.height))
                },
            )
        }
    }

    val announce = Modifier.semantics { if (label.isNotEmpty()) contentDescription = label }
    if (shape == KometaSkeletonShape.Card) {
        Column(
            modifier.then(announce).fillMaxWidth().heightIn(min = 160.dp)
                .border(1.dp, c.glassLine, RoundedCornerShape(16.dp)).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp, Alignment.Bottom),
        ) { Hairs(3, 0) }
        return
    }
    Column(modifier.then(announce), verticalArrangement = Arrangement.spacedBy(18.dp)) {
        repeat(rows) { r ->
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (avatar) {
                    Box(Modifier.size(40.dp).alpha(.25f).border(1.dp, c.displayInk, CircleShape))
                    Box(Modifier.size(12.dp))
                }
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) { Hairs(lines, r) }
            }
        }
    }
}
