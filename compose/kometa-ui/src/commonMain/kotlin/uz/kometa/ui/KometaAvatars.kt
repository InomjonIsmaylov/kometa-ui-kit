package uz.kometa.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** One face in [KometaAvatars]; [image] draws a photo in place of the initials. */
data class KometaAvatar(val name: String, val image: (@Composable () -> Unit)? = null)

/**
 * A few people as overlapping discs (`k-avatars`), then a "+N" disc for the rest. Each disc is parted
 * from the one beneath by a ring of the page colour and names its person to a screen reader.
 * [moreLabel] is what "+N" says aloud; `{n}` is the count.
 */
@Composable
fun KometaAvatars(
    people: List<KometaAvatar>,
    modifier: Modifier = Modifier,
    max: Int = 4,
    size: KometaPersonSize = KometaPersonSize.Md,
    moreLabel: String = "{n} more",
) {
    val c = Kometa.colors
    val rest = (people.size - max).coerceAtLeast(0)
    val disc = when (size) {
        KometaPersonSize.Sm -> 28.dp
        KometaPersonSize.Md -> 36.dp
        KometaPersonSize.Lg -> 64.dp
    }
    // A ring of the page colour, then a hairline, so a disc reads on any card.
    val ring = Modifier.background(c.bg, CircleShape).padding(2.dp).border(1.dp, c.glassLine, CircleShape)
    Row(modifier, horizontalArrangement = Arrangement.spacedBy((-10).dp), verticalAlignment = Alignment.CenterVertically) {
        people.take(max).forEach { p ->
            Box(ring.clearAndSetSemantics { contentDescription = p.name }) {
                KometaPerson(p.name, size = size, bare = true, image = p.image)
            }
        }
        if (rest > 0) {
            Box(ring.clearAndSetSemantics { contentDescription = moreLabel.replace("{n}", "$rest") }) {
                Box(Modifier.size(disc).background(c.glass, CircleShape), contentAlignment = Alignment.Center) {
                    BasicText("+$rest", style = Kometa.type.title.copy(color = c.muted, fontSize = 12.sp))
                }
            }
        }
    }
}
