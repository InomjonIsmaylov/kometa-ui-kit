package uz.kometa.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

enum class KometaPersonSize { Sm, Md, Lg }

/** The first letter of the first two words that start with a letter: "Ali Valiyev" → "AV". */
internal fun initialsOf(name: String): String =
    name.trim().split(Regex("\\s+")).filter { it.firstOrNull()?.isLetter() == true }.take(2)
        .joinToString("") { it.first().uppercase() }

/**
 * A person row (`k-person`), and the one avatar: a glass disc of initials (28/36/64dp), then the
 * name and an optional [meta] line; [trailing] sits at the end. [square] is a tile for a shop,
 * [image] draws a photo in place of the initials (load it with your image library), [bare] hides the
 * name beside it.
 */
@Composable
fun KometaPerson(
    name: String,
    modifier: Modifier = Modifier,
    meta: String = "",
    size: KometaPersonSize = KometaPersonSize.Md,
    square: Boolean = false,
    bare: Boolean = false,
    initials: String = initialsOf(name),
    image: (@Composable () -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null,
) {
    val c = Kometa.colors
    val (disc, font) = when (size) {
        KometaPersonSize.Sm -> 28.dp to 12.sp
        KometaPersonSize.Md -> 36.dp to 13.sp
        KometaPersonSize.Lg -> 64.dp to 22.sp
    }
    val shape = if (square) RoundedCornerShape(12.dp) else CircleShape
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(
            Modifier.size(disc).clip(shape).background(c.glass)
                .then(if (square) Modifier.border(1.dp, c.glassLine, shape) else Modifier),
            contentAlignment = Alignment.Center,
        ) {
            if (image != null) image()
            else BasicText(
                initials,
                Modifier.clearAndSetSemantics {},
                style = Kometa.type.title.copy(color = c.displayInk, fontSize = font, letterSpacing = .02.em),
            )
        }
        if (!bare) {
            Column(Modifier.weight(1f)) {
                BasicText(name, style = Kometa.type.md.copy(color = c.text, fontWeight = FontWeight.SemiBold), maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (meta.isNotEmpty()) BasicText(meta, style = Kometa.type.body.copy(color = c.muted), maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
        trailing?.invoke()
    }
}
