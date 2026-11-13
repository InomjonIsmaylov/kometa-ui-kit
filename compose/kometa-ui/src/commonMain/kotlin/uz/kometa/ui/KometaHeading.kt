package uz.kometa.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em

/**
 * A display title and a hairline that runs out to the [action] (`k-heading`); with no action
 * the hairline runs to the edge.
 */
@Composable
fun KometaHeading(title: String, modifier: Modifier = Modifier, action: (@Composable () -> Unit)? = null) {
    val c = Kometa.colors
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
        BasicText(
            title,
            Modifier.semantics { heading() },
            style = Kometa.type.title.copy(color = c.text, letterSpacing = (-.03).em, lineHeight = 1.2.em),
        )
        Box(Modifier.weight(1f).widthIn(min = 12.dp).height(1.dp).background(c.glassLine))
        action?.invoke()
    }
}
