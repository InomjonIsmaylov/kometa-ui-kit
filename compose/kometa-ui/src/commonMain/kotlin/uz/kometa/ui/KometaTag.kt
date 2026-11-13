package uz.kometa.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

/** `now` is amber (a dot, never a fill), `wait` blue, `book` muted, `done` green, `warn` and `error` red. */
enum class KometaTagTone { Now, Wait, Book, Done, Warn, Error }

/** A status mark (`k-tag`): a state-coloured dot and a word, no container. Not a button. */
@Composable
fun KometaTag(text: String, modifier: Modifier = Modifier, tone: KometaTagTone = KometaTagTone.Book, dot: Boolean = true) {
    val c = Kometa.colors
    val (dotColor, ink) = when (tone) {
        KometaTagTone.Now -> c.amber to c.amberInk
        KometaTagTone.Wait -> c.blue to c.blue
        KometaTagTone.Book -> c.muted to c.muted
        KometaTagTone.Done -> c.green to c.green
        KometaTagTone.Warn -> c.red to c.red
        KometaTagTone.Error -> c.error to c.error
    }
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
        if (dot) Box(Modifier.size(6.dp).background(dotColor, CircleShape))
        BasicText(text, style = Kometa.type.small.copy(color = ink, fontWeight = FontWeight.SemiBold))
    }
}
