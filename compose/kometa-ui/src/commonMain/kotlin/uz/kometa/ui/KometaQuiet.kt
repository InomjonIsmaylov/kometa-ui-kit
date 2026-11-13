package uz.kometa.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/**
 * An empty state (`k-quiet`): a display-font [title] and one muted [hint] sentence, centred. No
 * picture. [content] goes under them (a [KometaWord] that fixes the emptiness, say).
 */
@Composable
fun KometaQuiet(
    title: String,
    modifier: Modifier = Modifier,
    hint: String = "",
    content: @Composable ColumnScope.() -> Unit = {},
) {
    val c = Kometa.colors
    Column(
        modifier.fillMaxWidth().padding(vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        BasicText(
            title,
            Modifier.semantics { heading() },
            style = Kometa.type.title.copy(color = c.text, letterSpacing = (-.03).em, textAlign = TextAlign.Center),
        )
        if (hint.isNotEmpty()) {
            BasicText(hint, Modifier.widthIn(max = 448.dp), style = Kometa.type.body.copy(color = c.muted, fontSize = 13.sp, textAlign = TextAlign.Center))
        }
        content()
    }
}
