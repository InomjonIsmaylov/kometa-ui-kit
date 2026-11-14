package uz.kometa.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * A framed picture (`k-frame`): glass with a lit top edge and 16dp corners, [content] clipped to it.
 * A non-empty [caption] sits under the frame in muted 13sp.
 */
@Composable
fun KometaFrame(modifier: Modifier = Modifier, caption: String = "", content: @Composable () -> Unit) {
    val c = Kometa.colors
    val shape = RoundedCornerShape(16.dp)
    Column(modifier) {
        Box(
            Modifier
                .clip(shape)
                .background(c.glass)
                .background(Brush.verticalGradient(0f to c.glassLine, .32f to Color.Transparent))
                .drawWithContent {
                    drawContent()
                    drawLine(c.glassLine, Offset(0f, .5f), Offset(size.width, .5f), 1.dp.toPx())
                },
        ) { content() }
        if (caption.isNotEmpty()) BasicText(caption, Modifier.padding(top = 8.dp), style = Kometa.type.body.copy(color = c.muted, fontSize = 13.sp))
    }
}
