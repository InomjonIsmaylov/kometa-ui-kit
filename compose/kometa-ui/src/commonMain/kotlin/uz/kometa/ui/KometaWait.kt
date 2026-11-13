package uz.kometa.ui

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.unit.dp

/** Loading state (`k-wait`): the label stays, and a short line travels under it. */
@Composable
fun KometaWait(label: String, modifier: Modifier = Modifier) {
    val c = Kometa.colors
    val x by rememberInfiniteTransition().animateFloat(
        0f, 2.57f, infiniteRepeatable(tween(1200, easing = FastOutSlowInEasing), RepeatMode.Restart),
    )
    Column(modifier.width(IntrinsicSize.Max), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        BasicText(label, style = Kometa.type.body.copy(color = c.muted))
        Box(
            Modifier.fillMaxWidth().height(2.dp).clipToBounds().drawBehind {
                val w = size.width * .28f
                drawRect(c.displayInk, Offset(w * x, 0f), Size(w, size.height))
            },
        )
    }
}
